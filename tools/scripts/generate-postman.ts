import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Converter from 'openapi-to-postmanv2';

// Paths relative to repository root
const OUTPUT_DIR = join(process.cwd(), 'apps/api/postman');
const ENVIRONMENTS_DIR = join(OUTPUT_DIR, 'environments');
const COLLECTION_PATH = join(OUTPUT_DIR, 'collection.json');
const OPENAPI_PATH = join(OUTPUT_DIR, 'openapi.json');

interface ConversionResult {
  result: boolean;
  reason?: string;
  output?: Array<{ type: string; data: unknown }>;
}

interface PostmanVariable {
  key: string;
  value: string;
  enabled: boolean;
  type?: 'default' | 'secret';
}

interface PostmanEnvironment {
  id: string;
  name: string;
  values: PostmanVariable[];
}

interface EnvironmentConfig {
  name: string;
  filename: string;
  baseUrl: string;
}

const ENVIRONMENTS: EnvironmentConfig[] = [
  {
    name: 'Local Development',
    filename: 'local.json',
    baseUrl: 'http://localhost:3000',
  },
  {
    name: 'Staging',
    filename: 'staging.json',
    baseUrl: 'https://api-staging.example.com',
  },
  {
    name: 'Production',
    filename: 'production.json',
    baseUrl: 'https://api.example.com',
  },
];

/**
 * Ensures a directory exists, creating it if necessary
 */
function ensureDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Fetches OpenAPI specification from running NestJS server
 */
async function fetchOpenApiSpec(serverUrl: string, maxRetries = 30): Promise<object> {
  const specUrl = `${serverUrl}/api-docs-json`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(specUrl);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Server not ready yet
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Failed to fetch OpenAPI spec from ${specUrl} after ${maxRetries} attempts`);
}

/**
 * Starts the NestJS server and fetches the OpenAPI spec
 */
async function generateOpenApiSpec(): Promise<object> {
  console.log('Starting NestJS server to generate OpenAPI specification...');

  return new Promise((resolve, reject) => {
    // Build and start the server using nx
    const serverProcess = spawn('pnpm', ['exec', 'nx', 'serve', 'api'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    let serverOutput = '';
    let resolved = false;

    const cleanup = () => {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGTERM');
      }
    };

    serverProcess.stdout?.on('data', async (data) => {
      serverOutput += data.toString();

      // Look for server ready message
      if (
        !resolved &&
        (serverOutput.includes('API is running') || serverOutput.includes('Swagger UI available'))
      ) {
        resolved = true;
        console.log('Server started, fetching OpenAPI specification...');

        try {
          const spec = await fetchOpenApiSpec('http://localhost:3000');
          console.log('OpenAPI specification fetched successfully');
          cleanup();
          resolve(spec);
        } catch (error) {
          cleanup();
          reject(error);
        }
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      // Ignore webpack warnings, only log errors
      const msg = data.toString();
      if (msg.includes('ERROR') && !msg.includes('webpack')) {
        console.error('Server error:', msg);
      }
    });

    serverProcess.on('error', (error) => {
      cleanup();
      reject(new Error(`Failed to start server: ${error.message}`));
    });

    serverProcess.on('close', (code) => {
      if (!resolved) {
        reject(new Error(`Server process exited with code ${code} before ready`));
      }
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!resolved) {
        cleanup();
        reject(new Error('Timeout waiting for server to start'));
      }
    }, 60000);
  });
}

/**
 * Converts OpenAPI specification to Postman collection
 */
async function convertToPostman(openApiSpec: object): Promise<ConversionResult> {
  return new Promise((resolve) => {
    const options = {
      folderStrategy: 'Tags',
      requestNameSource: 'Fallback',
      schemaFaker: true,
      parametersResolution: 'Example',
    };

    Converter.convert(
      { type: 'json', data: openApiSpec },
      options,
      (error: Error | null, result: ConversionResult) => {
        if (error) {
          resolve({ result: false, reason: error.message });
        } else {
          resolve(result);
        }
      },
    );
  });
}

/**
 * Adds collection-level Bearer authentication
 */
function addCollectionAuth(collection: Record<string, unknown>): void {
  collection.auth = {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: '{{accessToken}}',
        type: 'string',
      },
    ],
  };

  // Add collection-level variables
  collection.variable = [
    {
      key: 'baseUrl',
      value: '{{baseUrl}}',
      type: 'string',
    },
  ];
}

/**
 * Generates environment files for Postman
 */
function generateEnvironments(): void {
  console.log('Generating Postman environment files...');

  ensureDirectory(ENVIRONMENTS_DIR);

  for (const env of ENVIRONMENTS) {
    const environment: PostmanEnvironment = {
      id: randomUUID(),
      name: env.name,
      values: [
        {
          key: 'baseUrl',
          value: env.baseUrl,
          enabled: true,
          type: 'default',
        },
        {
          key: 'accessToken',
          value: '',
          enabled: true,
          type: 'secret',
        },
      ],
    };

    const envPath = join(ENVIRONMENTS_DIR, env.filename);
    writeFileSync(envPath, JSON.stringify(environment, null, 2));
    console.log(`  Created: ${envPath}`);
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('\n=== Postman Collection Generator ===\n');

  try {
    // Ensure output directory exists
    ensureDirectory(OUTPUT_DIR);

    // Step 1: Generate OpenAPI spec
    const openApiSpec = await generateOpenApiSpec();

    // Write OpenAPI spec for reference
    writeFileSync(OPENAPI_PATH, JSON.stringify(openApiSpec, null, 2));
    console.log(`OpenAPI spec written to: ${OPENAPI_PATH}`);

    // Step 2: Convert to Postman collection
    console.log('\nConverting OpenAPI spec to Postman collection...');
    const conversionResult = await convertToPostman(openApiSpec);

    if (!conversionResult.result) {
      console.error(`Conversion failed: ${conversionResult.reason || 'Unknown error'}`);
      process.exit(1);
    }

    if (!conversionResult.output || conversionResult.output.length === 0) {
      console.error('Conversion produced no output');
      process.exit(1);
    }

    // Get the collection data
    const collection = conversionResult.output[0].data as Record<string, unknown>;

    // Add authentication configuration
    addCollectionAuth(collection);

    // Write collection
    writeFileSync(COLLECTION_PATH, JSON.stringify(collection, null, 2));
    console.log(`Postman collection written to: ${COLLECTION_PATH}`);

    // Step 3: Generate environment files
    generateEnvironments();

    console.log('\n=== Generation Complete ===');
    console.log(`\nOutput files:`);
    console.log(`  - Collection: ${COLLECTION_PATH}`);
    console.log(`  - OpenAPI Spec: ${OPENAPI_PATH}`);
    console.log(`  - Environments: ${ENVIRONMENTS_DIR}/`);
    console.log(`\nNext steps:`);
    console.log(`  1. Open Postman and click "Import"`);
    console.log(`  2. Import ${COLLECTION_PATH}`);
    console.log(`  3. Import environment files from ${ENVIRONMENTS_DIR}/`);
    console.log(`  4. Select an environment and start testing!\n`);
  } catch (error) {
    console.error('\nGeneration failed:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (error.stack) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
    } else {
      console.error(`  ${String(error)}`);
    }
    process.exit(1);
  }
}

main();
