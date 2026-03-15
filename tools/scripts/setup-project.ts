import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import prompts from 'prompts';

interface SetupConfig {
  projectName: string;
  gcpProjectId: string;
  gcpRegion: string;
  cloudRunServiceName: string;
  artifactRegistryRepo: string;
}

const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

// Track what was set up successfully for printNextSteps
interface SetupResult {
  wifConfigured: boolean;
  artifactRegistryCreated: boolean;
  firebaseWebAppConfigured: boolean;
  githubSecretsConfigured: boolean;
  projectNumber: string | null;
  gitHubRepo: { org: string; repo: string } | null;
}

// Firebase web app SDK config
interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Valid GCP regions for Cloud Run
const GCP_REGIONS = [
  { title: 'us-central1 (Iowa)', value: 'us-central1' },
  { title: 'us-east1 (South Carolina)', value: 'us-east1' },
  { title: 'us-east4 (Northern Virginia)', value: 'us-east4' },
  { title: 'us-west1 (Oregon)', value: 'us-west1' },
  { title: 'us-west2 (Los Angeles)', value: 'us-west2' },
  { title: 'europe-west1 (Belgium)', value: 'europe-west1' },
  { title: 'europe-west2 (London)', value: 'europe-west2' },
  { title: 'europe-west3 (Frankfurt)', value: 'europe-west3' },
  { title: 'asia-east1 (Taiwan)', value: 'asia-east1' },
  { title: 'asia-northeast1 (Tokyo)', value: 'asia-northeast1' },
  { title: 'asia-southeast1 (Singapore)', value: 'asia-southeast1' },
  { title: 'australia-southeast1 (Sydney)', value: 'australia-southeast1' },
];

/**
 * Detect GitHub org/repo from git remote origin
 */
function getGitHubRepo(): { org: string; repo: string } | null {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    // Parse: git@github.com:org/repo.git or https://github.com/org/repo.git
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      return { org: match[1], repo: match[2].replace(/\.git$/, '') };
    }
  } catch {
    // Not a git repo or no origin remote
  }
  return null;
}

/**
 * Get GCP project number from project ID
 */
function getProjectNumber(projectId: string): string | null {
  try {
    return execSync(`gcloud projects describe ${projectId} --format="value(projectNumber)"`, {
      encoding: 'utf-8',
    }).trim();
  } catch {
    // gcloud not available or not authenticated
  }
  return null;
}

/**
 * Check if Application Default Credentials are configured
 */
function isAdcConfigured(): boolean {
  const adcPath = path.join(
    os.homedir(),
    '.config',
    'gcloud',
    'application_default_credentials.json',
  );
  return fs.existsSync(adcPath);
}

/**
 * Check if gcloud CLI is available
 */
function isGcloudAvailable(): boolean {
  try {
    execSync('gcloud --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

interface GcloudResult {
  success: boolean;
  alreadyExists: boolean;
  output: string;
}

/**
 * Run a gcloud command with error handling
 * Treats ALREADY_EXISTS as success for idempotency
 */
function runGcloudCommand(command: string, description: string): GcloudResult {
  console.log(`  ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (output.trim()) console.log(output);
    return { success: true, alreadyExists: false, output };
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    const stdout = (error as { stdout?: string }).stdout || '';
    const combinedOutput = stderr + stdout;

    // Check if the error is because resource already exists
    // Different gcloud commands use different phrasing for this error
    const alreadyExistsPatterns = [
      'ALREADY_EXISTS',
      'already exists within project',
      'already exists',
      'is the subject of a conflict',
    ];
    const isAlreadyExists = alreadyExistsPatterns.some((pattern) =>
      combinedOutput.toLowerCase().includes(pattern.toLowerCase()),
    );

    if (isAlreadyExists) {
      console.log(`  ✓ ${description} (already exists)`);
      return { success: true, alreadyExists: true, output: combinedOutput };
    }

    // Print the actual error for debugging
    if (stderr) console.error(stderr);
    if (stdout) console.log(stdout);
    console.log(`  ✗ Failed: ${description}`);
    return { success: false, alreadyExists: false, output: combinedOutput };
  }
}

function waitForServiceAccount(
  serviceAccountEmail: string,
  projectId: string,
  maxWaitSeconds = 60,
  intervalSeconds = 5,
): boolean {
  console.log(`  Waiting for service account ${serviceAccountEmail} to be provisioned...`);
  const maxAttempts = Math.ceil(maxWaitSeconds / intervalSeconds);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execSync(
        `gcloud iam service-accounts describe "${serviceAccountEmail}" --project="${projectId}"`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
      console.log(`  ✓ Service account is ready`);
      return true;
    } catch {
      if (attempt < maxAttempts) {
        console.log(
          `    Attempt ${attempt}/${maxAttempts} - not yet available, retrying in ${intervalSeconds}s...`,
        );
        execSync(`sleep ${intervalSeconds}`);
      }
    }
  }
  console.log(`  ✗ Service account did not become available within ${maxWaitSeconds}s`);
  return false;
}

async function main(): Promise<void> {
  console.log('\n🚀 Project Setup Script\n');
  console.log('This script will configure your new project from the template.\n');

  const config = await gatherConfig();

  console.log('\n📝 Configuration Summary:');
  console.log(`  Project Name: ${config.projectName}`);
  console.log(`  GCP Project ID: ${config.gcpProjectId}`);
  console.log(`  GCP Region: ${config.gcpRegion}`);
  console.log(`  Cloud Run Service: ${config.cloudRunServiceName}`);
  console.log(`  Artifact Registry: ${config.artifactRegistryRepo}\n`);

  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: 'Proceed with setup?',
    initial: true,
  });

  if (!confirmed) {
    console.log('\n❌ Setup cancelled.\n');
    process.exit(0);
  }

  console.log('\n⚙️  Applying configuration...\n');

  // Track setup results for printNextSteps
  const setupResult: SetupResult = {
    wifConfigured: false,
    artifactRegistryCreated: false,
    firebaseWebAppConfigured: false,
    githubSecretsConfigured: false,
    projectNumber: null,
    gitHubRepo: getGitHubRepo(),
  };

  await renameProject(config);
  await updateFirebaseConfig(config);
  await copyValidateWorkflow();
  await generateDeployWorkflow(config);
  await generateDeployWebWorkflow(config);

  // Automated GCP setup
  setupResult.wifConfigured = await setupWorkloadIdentityFederation(config, setupResult);
  setupResult.artifactRegistryCreated = await createArtifactRegistry(config);
  setupResult.firebaseWebAppConfigured = await setupFirebaseWebApp(config, setupResult);
  setupResult.githubSecretsConfigured = await setupGitHubSecrets(config, setupResult);

  await setupCloudRunIam(config);
  await setupLocalFirebaseAuth(config);
  await replaceReadme();

  console.log('\n✅ Setup complete!\n');
  printNextSteps(config, setupResult);
}

async function gatherConfig(): Promise<SetupConfig> {
  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name (lowercase, hyphens allowed):',
      initial: 'my-project',
      validate: (value: string) =>
        /^[a-z][a-z0-9-]*$/.test(value)
          ? true
          : 'Project name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens',
    },
    {
      type: 'text',
      name: 'gcpProjectId',
      message: 'GCP Project ID:',
      validate: (value: string) => {
        if (value.length === 0) return 'GCP Project ID is required';
        // GCP project IDs: 6-30 chars, lowercase letters, digits, hyphens
        // Must start with letter, cannot end with hyphen
        if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value)) {
          return 'Invalid GCP Project ID format (6-30 chars, lowercase, start with letter, no trailing hyphen)';
        }
        return true;
      },
    },
    {
      type: 'select',
      name: 'gcpRegion',
      message: 'GCP Region:',
      choices: GCP_REGIONS,
      initial: 0,
    },
    {
      type: 'text',
      name: 'cloudRunServiceName',
      message: 'Cloud Run service name:',
      initial: 'api',
      validate: (value: string) => {
        if (value.length === 0) return 'Service name is required';
        // Cloud Run service names: lowercase, hyphens, max 63 chars, start with letter
        if (!/^[a-z][a-z0-9-]{0,61}[a-z0-9]?$/.test(value)) {
          return 'Service name must be lowercase, start with letter, hyphens allowed, max 63 chars';
        }
        if (value.length > 63) {
          return 'Service name must be 63 characters or less';
        }
        return true;
      },
    },
    {
      type: 'text',
      name: 'artifactRegistryRepo',
      message: 'Artifact Registry repository name:',
      initial: 'cloud-run-images',
      validate: (value: string) => {
        if (value.length === 0) return 'Repository name is required';
        // Artifact Registry repo names: lowercase, hyphens, underscores
        if (!/^[a-z][a-z0-9_-]*$/.test(value)) {
          return 'Repository name must be lowercase, start with letter, hyphens/underscores allowed';
        }
        return true;
      },
    },
  ]);

  return response as SetupConfig;
}

async function renameProject(config: SetupConfig): Promise<void> {
  console.log('  Renaming project files...');

  // Update root package.json
  updateJsonFile(path.join(WORKSPACE_ROOT, 'package.json'), (pkg) => {
    pkg.name = `@${config.projectName}/source`;
    return pkg;
  });

  // Update nx.json npmScope if it exists
  updateJsonFile(path.join(WORKSPACE_ROOT, 'nx.json'), (nx) => {
    if (nx.npmScope) {
      nx.npmScope = config.projectName;
    }
    return nx;
  });

  // Update tsconfig.base.json path mappings
  updateJsonFile(path.join(WORKSPACE_ROOT, 'tsconfig.base.json'), (tsconfig) => {
    if (tsconfig.compilerOptions?.paths) {
      const newPaths: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(tsconfig.compilerOptions.paths)) {
        const newKey = key.replace('@workspace/', `@${config.projectName}/`);
        newPaths[newKey] = value as string[];
      }
      tsconfig.compilerOptions.paths = newPaths;
    }
    return tsconfig;
  });

  // Update app package.json files
  const appDirs = ['apps/web', 'apps/api', 'apps/functions', 'libs/shared-types'];
  for (const appDir of appDirs) {
    const pkgPath = path.join(WORKSPACE_ROOT, appDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      updateJsonFile(pkgPath, (pkg) => {
        const appName = path.basename(appDir);
        pkg.name = `@${config.projectName}/${appName}`;
        return pkg;
      });
    }
  }

  // Update imports in source files
  replaceInFiles(path.join(WORKSPACE_ROOT, 'apps'), '@workspace/', `@${config.projectName}/`);
  replaceInFiles(path.join(WORKSPACE_ROOT, 'libs'), '@workspace/', `@${config.projectName}/`);
}

async function updateFirebaseConfig(config: SetupConfig): Promise<void> {
  console.log('  Updating firebase.json...');

  updateJsonFile(path.join(WORKSPACE_ROOT, 'firebase.json'), (firebase) => {
    // Add project ID at root level for use by other scripts
    firebase.projectId = config.gcpProjectId;

    // Ensure hosting section exists
    if (!firebase.hosting) {
      firebase.hosting = {};
    }

    const hosting = firebase.hosting as Record<string, unknown>;

    // Ensure hosting.public is set to dist/apps/web
    hosting.public = 'dist/apps/web';

    // Update rewrites if they exist
    if (hosting.rewrites && Array.isArray(hosting.rewrites)) {
      for (const rewrite of hosting.rewrites) {
        if (rewrite.run) {
          rewrite.run.serviceId = config.cloudRunServiceName;
          rewrite.run.region = config.gcpRegion;
        }
      }
    }
    return firebase;
  });
}

async function setupWorkloadIdentityFederation(
  config: SetupConfig,
  setupResult: SetupResult,
): Promise<boolean> {
  const gitHubRepo = setupResult.gitHubRepo;

  if (!gitHubRepo) {
    console.log('  ⚠️  Could not detect GitHub repository from git remote.');
    console.log('  Skipping Workload Identity Federation setup.\n');
    return false;
  }

  console.log(`  Detected GitHub repository: ${gitHubRepo.org}/${gitHubRepo.repo}`);

  const { setupWif } = await prompts({
    type: 'confirm',
    name: 'setupWif',
    message: 'Configure Workload Identity Federation for GitHub Actions? (requires gcloud CLI)',
    initial: true,
  });

  if (!setupWif) {
    console.log('  Skipping Workload Identity Federation setup.\n');
    return false;
  }

  // Get project number
  console.log('  Fetching GCP project number...');
  const projectNumber = getProjectNumber(config.gcpProjectId);
  if (!projectNumber) {
    console.log('  ⚠️  Could not fetch project number. Is gcloud authenticated?');
    console.log('  Skipping Workload Identity Federation setup.\n');
    return false;
  }
  setupResult.projectNumber = projectNumber;
  console.log(`  Project number: ${projectNumber}\n`);

  const serviceAccount = `github-actions-deploy@${config.gcpProjectId}.iam.gserviceaccount.com`;

  // Step 0: Enable required APIs
  runGcloudCommand(
    `gcloud services enable iamcredentials.googleapis.com --project="${config.gcpProjectId}"`,
    'Enabling IAM Service Account Credentials API',
  );

  runGcloudCommand(
    `gcloud services enable compute.googleapis.com --project="${config.gcpProjectId}"`,
    'Enabling Compute Engine API',
  );

  runGcloudCommand(
    `gcloud services enable artifactregistry.googleapis.com --project="${config.gcpProjectId}"`,
    'Enabling Artifact Registry API',
  );

  runGcloudCommand(
    `gcloud services enable run.googleapis.com --project="${config.gcpProjectId}"`,
    'Enabling Cloud Run API',
  );

  // Step 1: Create Workload Identity Pool
  const poolResult = runGcloudCommand(
    `gcloud iam workload-identity-pools create "github-actions" ` +
      `--project="${config.gcpProjectId}" ` +
      `--location="global" ` +
      `--display-name="GitHub Actions Pool"`,
    'Creating Workload Identity Pool',
  );

  // Step 2: Create Workload Identity Provider
  const providerResult = runGcloudCommand(
    `gcloud iam workload-identity-pools providers create-oidc "github-provider" ` +
      `--project="${config.gcpProjectId}" ` +
      `--location="global" ` +
      `--workload-identity-pool="github-actions" ` +
      `--display-name="GitHub Provider" ` +
      `--attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" ` +
      `--attribute-condition="assertion.repository=='${gitHubRepo.org}/${gitHubRepo.repo}'" ` +
      `--issuer-uri="https://token.actions.githubusercontent.com"`,
    'Creating Workload Identity Provider',
  );

  // Step 3: Create Service Account
  const saResult = runGcloudCommand(
    `gcloud iam service-accounts create "github-actions-deploy" ` +
      `--project="${config.gcpProjectId}" ` +
      `--display-name="GitHub Actions Deploy"`,
    'Creating Service Account',
  );

  // Step 4: Grant Cloud Run Admin role (idempotent - doesn't fail if already granted)
  // Note: Admin role is required (not Developer) because we need run.services.setIamPolicy
  // permission to allow unauthenticated access to the Cloud Run service
  runGcloudCommand(
    `gcloud projects add-iam-policy-binding "${config.gcpProjectId}" ` +
      `--member="serviceAccount:${serviceAccount}" ` +
      `--role="roles/run.admin"`,
    'Granting Cloud Run Admin role',
  );

  // Step 5: Grant Artifact Registry Writer role (idempotent - doesn't fail if already granted)
  runGcloudCommand(
    `gcloud projects add-iam-policy-binding "${config.gcpProjectId}" ` +
      `--member="serviceAccount:${serviceAccount}" ` +
      `--role="roles/artifactregistry.writer"`,
    'Granting Artifact Registry Writer role',
  );

  // Step 6: Grant Service Account User role on compute service account
  // This allows the GitHub Actions SA to deploy Cloud Run services that run as the default compute SA
  const computeServiceAccount = `${projectNumber}-compute@developer.gserviceaccount.com`;
  const saReady = waitForServiceAccount(computeServiceAccount, config.gcpProjectId);
  if (saReady) {
    runGcloudCommand(
      `gcloud iam service-accounts add-iam-policy-binding "${computeServiceAccount}" ` +
        `--project="${config.gcpProjectId}" ` +
        `--role="roles/iam.serviceAccountUser" ` +
        `--member="serviceAccount:${serviceAccount}"`,
      'Granting Service Account User role on compute service account',
    );
  } else {
    console.log('  ⓘ Skipping Service Account User role binding - compute SA not yet available.');
    console.log('    Run this command manually after Compute Engine API has fully provisioned:');
    console.log(
      `    gcloud iam service-accounts add-iam-policy-binding "${computeServiceAccount}" \\`,
    );
    console.log(`      --project="${config.gcpProjectId}" \\`);
    console.log(`      --role="roles/iam.serviceAccountUser" \\`);
    console.log(`      --member="serviceAccount:${serviceAccount}"\n`);
  }

  // Step 7: Allow GitHub to impersonate Service Account (idempotent)
  const wifBindingResult = runGcloudCommand(
    `gcloud iam service-accounts add-iam-policy-binding "${serviceAccount}" ` +
      `--project="${config.gcpProjectId}" ` +
      `--role="roles/iam.workloadIdentityUser" ` +
      `--member="principalSet://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/github-actions/attribute.repository/${gitHubRepo.org}/${gitHubRepo.repo}"`,
    'Configuring GitHub Actions impersonation',
  );

  const success =
    poolResult.success && providerResult.success && saResult.success && wifBindingResult.success;
  if (success) {
    console.log('  ✓ Workload Identity Federation configured successfully\n');

    // Step 8: Enable Firebase APIs
    await enableFirebaseApis(config.gcpProjectId);

    // Step 9: Grant Firebase Hosting roles
    await grantFirebaseHostingRoles(config.gcpProjectId);
  } else {
    console.log('  ✗ Workload Identity Federation setup failed\n');
    return false;
  }

  return true;
}

async function enableFirebaseApis(gcpProjectId: string): Promise<void> {
  runGcloudCommand(
    `gcloud services enable firebase.googleapis.com --project="${gcpProjectId}"`,
    'Enabling Firebase API',
  );

  runGcloudCommand(
    `gcloud services enable firebasehosting.googleapis.com --project="${gcpProjectId}"`,
    'Enabling Firebase Hosting API',
  );
}

async function grantFirebaseHostingRoles(gcpProjectId: string): Promise<void> {
  const serviceAccount = `github-actions-deploy@${gcpProjectId}.iam.gserviceaccount.com`;

  runGcloudCommand(
    `gcloud projects add-iam-policy-binding "${gcpProjectId}" ` +
      `--member="serviceAccount:${serviceAccount}" ` +
      `--role="roles/firebasehosting.admin"`,
    'Granting Firebase Hosting Admin role',
  );

  runGcloudCommand(
    `gcloud projects add-iam-policy-binding "${gcpProjectId}" ` +
      `--member="serviceAccount:${serviceAccount}" ` +
      `--role="roles/serviceusage.apiKeysViewer"`,
    'Granting API Keys Viewer role',
  );

  runGcloudCommand(
    `gcloud projects add-iam-policy-binding "${gcpProjectId}" ` +
      `--member="serviceAccount:${serviceAccount}" ` +
      `--role="roles/serviceusage.serviceUsageConsumer"`,
    'Granting Service Usage Consumer role',
  );
}

async function createArtifactRegistry(config: SetupConfig): Promise<boolean> {
  const { createRepo } = await prompts({
    type: 'confirm',
    name: 'createRepo',
    message: 'Create Artifact Registry repository? (requires gcloud CLI)',
    initial: true,
  });

  if (!createRepo) {
    console.log('  Skipping Artifact Registry setup.\n');
    return false;
  }

  const result = runGcloudCommand(
    `gcloud artifacts repositories create "${config.artifactRegistryRepo}" ` +
      `--repository-format=docker ` +
      `--location="${config.gcpRegion}" ` +
      `--project="${config.gcpProjectId}" ` +
      `--description="Docker images for Cloud Run services"`,
    'Creating Artifact Registry repository',
  );

  if (result.success) {
    if (result.alreadyExists) {
      console.log('  ✓ Artifact Registry repository already exists\n');
    } else {
      console.log('  ✓ Artifact Registry repository created\n');
    }
    return true;
  } else {
    console.log('  ✗ Failed to create Artifact Registry repository\n');
    return false;
  }
}

async function setupFirebaseWebApp(
  config: SetupConfig,
  setupResult: SetupResult,
): Promise<boolean> {
  const { setupFirebase } = await prompts({
    type: 'confirm',
    name: 'setupFirebase',
    message: 'Configure Firebase web app for frontend? (requires Firebase CLI)',
    initial: true,
  });

  if (!setupFirebase) {
    console.log('  Skipping Firebase web app setup.\n');
    return false;
  }

  // Check if Firebase CLI is available
  try {
    execSync('firebase --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    console.log('  ⚠️  Firebase CLI not found. Install with: npm install -g firebase-tools');
    console.log('  Skipping Firebase web app setup.\n');
    return false;
  }

  console.log('  Checking for existing Firebase web apps...');

  // Get list of existing web apps
  let webAppId: string | null = null;
  try {
    const appsOutput = execSync(`firebase apps:list --project="${config.gcpProjectId}" --json`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const appsData = JSON.parse(appsOutput);
    const webApps =
      appsData.result?.filter((app: { platform: string }) => app.platform === 'WEB') || [];

    if (webApps.length > 0) {
      webAppId = webApps[0].appId;
      console.log(`  ✓ Found existing web app: ${webApps[0].displayName || webAppId}`);
    }
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    console.log('  ⚠️  Could not list Firebase apps:', stderr);
  }

  // Create web app if none exists
  if (!webAppId) {
    console.log('  Creating Firebase web app...');
    try {
      const createOutput = execSync(
        `firebase apps:create web "${config.projectName}-web" --project="${config.gcpProjectId}" --json`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
      const createData = JSON.parse(createOutput);
      webAppId = createData.result?.appId;
      if (webAppId) {
        console.log(`  ✓ Created web app: ${config.projectName}-web`);
      }
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr || '';
      console.log('  ✗ Failed to create web app:', stderr);
      return false;
    }
  }

  if (!webAppId) {
    console.log('  ✗ No web app ID available');
    return false;
  }

  // Fetch SDK config
  console.log('  Fetching Firebase SDK config...');
  let firebaseConfig: FirebaseWebConfig | null = null;
  try {
    const sdkOutput = execSync(
      `firebase apps:sdkconfig web "${webAppId}" --project="${config.gcpProjectId}" --json`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
    const sdkData = JSON.parse(sdkOutput);
    const sdkConfig = sdkData.result?.sdkConfig;

    if (sdkConfig) {
      firebaseConfig = {
        apiKey: sdkConfig.apiKey,
        authDomain: sdkConfig.authDomain,
        projectId: sdkConfig.projectId,
        storageBucket: sdkConfig.storageBucket,
        messagingSenderId: sdkConfig.messagingSenderId,
        appId: sdkConfig.appId,
      };
      console.log('  ✓ Retrieved Firebase SDK config');
    }
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    console.log('  ✗ Failed to fetch SDK config:', stderr);
    return false;
  }

  if (!firebaseConfig) {
    console.log('  ✗ No Firebase config available');
    return false;
  }

  // Write .env.local file for local development
  const envLocalPath = path.join(WORKSPACE_ROOT, 'apps', 'web', '.env.local');
  const envContent = `# Firebase configuration (auto-generated by setup script)
VITE_FIREBASE_API_KEY=${firebaseConfig.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
VITE_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
VITE_FIREBASE_APP_ID=${firebaseConfig.appId}
`;

  try {
    fs.writeFileSync(envLocalPath, envContent);
    console.log('  ✓ Created apps/web/.env.local for local development');
  } catch (error) {
    console.log('  ⚠️  Could not write .env.local:', (error as Error).message);
  }

  // Set GitHub repository variables
  if (setupResult.gitHubRepo) {
    console.log('  Setting GitHub repository variables...');

    const variables = [
      { name: 'VITE_FIREBASE_API_KEY', value: firebaseConfig.apiKey },
      { name: 'VITE_FIREBASE_AUTH_DOMAIN', value: firebaseConfig.authDomain },
      { name: 'VITE_FIREBASE_PROJECT_ID', value: firebaseConfig.projectId },
      { name: 'VITE_FIREBASE_STORAGE_BUCKET', value: firebaseConfig.storageBucket },
      { name: 'VITE_FIREBASE_MESSAGING_SENDER_ID', value: firebaseConfig.messagingSenderId },
      { name: 'VITE_FIREBASE_APP_ID', value: firebaseConfig.appId },
    ];

    let allSet = true;
    for (const { name, value } of variables) {
      try {
        execSync(`gh variable set ${name} --body "${value}"`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (error) {
        const stderr = (error as { stderr?: string }).stderr || '';
        if (stderr.includes('gh: command not found') || stderr.includes('not logged in')) {
          console.log('  ⚠️  GitHub CLI not available or not authenticated.');
          console.log('  You will need to set GitHub variables manually.\n');
          allSet = false;
          break;
        }
        console.log(`  ⚠️  Could not set ${name}:`, stderr);
        allSet = false;
      }
    }

    if (allSet) {
      console.log('  ✓ Set GitHub repository variables for CI/CD');
    }
  } else {
    console.log(
      '  ⚠️  No GitHub repository detected. You will need to set GitHub variables manually.',
    );
  }

  console.log('  ✓ Firebase web app configuration complete\n');
  return true;
}

async function setupGitHubSecrets(config: SetupConfig, setupResult: SetupResult): Promise<boolean> {
  // Only proceed if WIF was configured and we have project number
  if (!setupResult.wifConfigured || !setupResult.projectNumber || !setupResult.gitHubRepo) {
    return false;
  }

  const { setupSecrets } = await prompts({
    type: 'confirm',
    name: 'setupSecrets',
    message: 'Configure GitHub repository secrets automatically? (requires gh CLI)',
    initial: true,
  });

  if (!setupSecrets) {
    return false;
  }

  const secrets = [
    {
      name: 'GCP_WORKLOAD_IDENTITY_PROVIDER',
      value: `projects/${setupResult.projectNumber}/locations/global/workloadIdentityPools/github-actions/providers/github-provider`,
    },
    {
      name: 'GCP_SERVICE_ACCOUNT',
      value: `github-actions-deploy@${config.gcpProjectId}.iam.gserviceaccount.com`,
    },
  ];

  console.log('  Setting GitHub repository secrets...');
  let allSet = true;
  for (const { name, value } of secrets) {
    try {
      execSync(`gh secret set ${name} --body "${value}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr || '';
      if (stderr.includes('gh: command not found') || stderr.includes('not logged in')) {
        console.log('  ⚠️  GitHub CLI not available or not authenticated.');
        console.log('  You will need to set GitHub secrets manually.\n');
        allSet = false;
        break;
      }
      console.log(`  ⚠️  Could not set ${name}:`, stderr);
      allSet = false;
    }
  }

  if (allSet) {
    console.log('  ✓ Set GitHub repository secrets for CI/CD\n');
  }
  return allSet;
}

async function setupCloudRunIam(config: SetupConfig): Promise<void> {
  const { setupIam } = await prompts({
    type: 'confirm',
    name: 'setupIam',
    message: 'Configure Cloud Run IAM for public access? (requires gcloud CLI)',
    initial: true,
  });

  const iamCommand =
    `gcloud run services add-iam-policy-binding ${config.cloudRunServiceName} ` +
    `--region=${config.gcpRegion} ` +
    `--member="allUsers" ` +
    `--role="roles/run.invoker" ` +
    `--project=${config.gcpProjectId}`;

  if (!setupIam) {
    console.log('  Skipping IAM setup. Run this command manually when ready:');
    console.log(`  ${iamCommand.replace(/ --/g, ' \\\n    --')}\n`);
    return;
  }

  console.log('  Configuring Cloud Run IAM policy...');
  try {
    execSync(iamCommand, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log('  ✓ Cloud Run IAM policy configured');
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    if (stderr.includes('NOT_FOUND')) {
      console.log('  ⓘ Cloud Run IAM skipped - service not yet deployed');
      console.log('    Run this command after first deployment:');
      console.log(`    ${iamCommand.replace(/ --/g, ' \\\n      --')}\n`);
    } else if (stderr.includes('PERMISSION_DENIED') || stderr.includes('has not been used')) {
      console.log('  ⓘ Cloud Run IAM skipped - Cloud Run API may still be propagating');
      console.log('    Run this command manually when ready:');
      console.log(`    ${iamCommand.replace(/ --/g, ' \\\n      --')}\n`);
    } else {
      console.log('  ✗ Cloud Run IAM setup failed');
      if (stderr) console.error(stderr);
    }
  }
}

async function setupLocalFirebaseAuth(config: SetupConfig): Promise<void> {
  // Check if gcloud is available
  if (!isGcloudAvailable()) {
    console.log(
      '  ⚠️  gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install',
    );
    console.log('  Skipping local Firebase auth setup.\n');
    console.log('  After installing gcloud, run:');
    console.log(`    gcloud auth application-default login --project=${config.gcpProjectId}\n`);
    return;
  }

  // Check if ADC is already configured
  if (isAdcConfigured()) {
    console.log('  ✓ Application Default Credentials already configured\n');
    return;
  }

  const { setupAdc } = await prompts({
    type: 'confirm',
    name: 'setupAdc',
    message: 'Configure Application Default Credentials for local Firebase development?',
    initial: true,
  });

  if (!setupAdc) {
    console.log('  Skipping local Firebase auth setup.');
    console.log('  Run this command manually when ready:');
    console.log(`    gcloud auth application-default login --project=${config.gcpProjectId}\n`);
    return;
  }

  console.log('  Configuring Application Default Credentials...');
  console.log('  This will open a browser window for Google authentication.\n');

  try {
    // Use inherit stdio so the user can see the browser prompt and interact
    execSync(`gcloud auth application-default login --project=${config.gcpProjectId}`, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
    console.log('\n  ✓ Application Default Credentials configured');
    console.log('  Firebase Admin SDK will now work for local development.\n');
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    console.log('  ✗ Failed to configure Application Default Credentials');
    if (stderr) console.error(stderr);
    console.log('  Run this command manually:');
    console.log(`    gcloud auth application-default login --project=${config.gcpProjectId}\n`);
  }
}

async function replaceReadme(): Promise<void> {
  const templatePath = path.join(WORKSPACE_ROOT, 'README.template.md');
  const readmePath = path.join(WORKSPACE_ROOT, 'README.md');

  if (fs.existsSync(templatePath)) {
    console.log('  Replacing README.md with template...');
    fs.copyFileSync(templatePath, readmePath);
    fs.unlinkSync(templatePath);
  } else {
    console.log('  Warning: README.template.md not found, skipping README replacement.');
  }
}

async function copyValidateWorkflow(): Promise<void> {
  console.log('  Generating validate.yml workflow...');

  const workflowDir = path.join(WORKSPACE_ROOT, '.github', 'workflows');
  fs.mkdirSync(workflowDir, { recursive: true });

  const validateWorkflowContent = `name: Validate

on:
  workflow_call:
    inputs:
      affected-base:
        description: 'Base ref for Nx affected calculation'
        required: false
        type: string
        default: 'origin/main'
    outputs:
      api-affected:
        description: 'Whether the API project is affected by changes'
        value: \${{ jobs.validate.outputs.api-affected }}
      web-affected:
        description: 'Whether the web project is affected by changes'
        value: \${{ jobs.validate.outputs.web-affected }}

jobs:
  validate:
    name: Validate
    runs-on: ubuntu-latest

    outputs:
      api-affected: \${{ steps.check-affected.outputs.api }}
      web-affected: \${{ steps.check-affected.outputs.web }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Determine base ref
        id: base-ref
        run: |
          if [ "\${{ github.event_name }}" = "pull_request" ]; then
            echo "base=origin/main" >> $GITHUB_OUTPUT
          else
            echo "base=\${{ inputs.affected-base }}" >> $GITHUB_OUTPUT
          fi

      - name: Lint affected projects
        run: pnpm nx affected -t lint --base=\${{ steps.base-ref.outputs.base }}

      - name: Test affected projects
        run: pnpm nx affected -t test --base=\${{ steps.base-ref.outputs.base }}

      - name: Build affected projects
        run: pnpm nx affected -t build --base=\${{ steps.base-ref.outputs.base }}

      - name: Check affected projects
        id: check-affected
        run: |
          AFFECTED=$(pnpm nx show projects --affected --base=\${{ steps.base-ref.outputs.base }})

          if echo "$AFFECTED" | grep -q "^api$"; then
            echo "api=true" >> $GITHUB_OUTPUT
            echo "API is affected by this change"
          else
            echo "api=false" >> $GITHUB_OUTPUT
            echo "API is not affected by this change"
          fi

          if echo "$AFFECTED" | grep -q "^web$"; then
            echo "web=true" >> $GITHUB_OUTPUT
            echo "Web is affected by this change"
          else
            echo "web=false" >> $GITHUB_OUTPUT
            echo "Web is not affected by this change"
          fi
`;

  const validatePath = path.join(workflowDir, 'validate.yml');
  fs.writeFileSync(validatePath, validateWorkflowContent);
  console.log('  Generated .github/workflows/validate.yml');
}

async function generateDeployWorkflow(config: SetupConfig): Promise<void> {
  console.log('  Generating API deployment workflow...');

  const workflowDir = path.join(WORKSPACE_ROOT, '.github', 'workflows');
  const workflowPath = path.join(workflowDir, 'deploy.yml');

  // Ensure .github/workflows directory exists
  fs.mkdirSync(workflowDir, { recursive: true });

  const workflowContent = `name: Deploy API

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-api-\${{ github.ref }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }}

jobs:
  validate:
    name: Validate
    uses: ./.github/workflows/validate.yml
    with:
      affected-base: origin/main~1
    secrets: inherit

  deploy:
    name: Deploy API
    runs-on: ubuntu-latest
    needs: validate
    if: github.event_name == 'workflow_dispatch' || (github.event_name == 'push' && github.ref == 'refs/heads/main' && needs.validate.outputs.api-affected == 'true')

    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: \${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: \${{ secrets.GCP_SERVICE_ACCOUNT }}
          token_format: access_token

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${config.gcpRegion}-docker.pkg.dev --quiet

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Artifact Registry
        uses: docker/login-action@v3
        with:
          registry: ${config.gcpRegion}-docker.pkg.dev
          username: oauth2accesstoken
          password: \${{ steps.auth.outputs.access_token }}

      - name: Set image tag
        id: image-tag
        run: |
          IMAGE_TAG="${config.gcpRegion}-docker.pkg.dev/\${GCP_PROJECT_ID}/${config.artifactRegistryRepo}/${config.cloudRunServiceName}:\${{ github.sha }}"
          echo "tag=\${IMAGE_TAG}" >> $GITHUB_OUTPUT
        env:
          GCP_PROJECT_ID: \${{ vars.GCP_PROJECT_ID || '${config.gcpProjectId}' }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: \${{ steps.image-tag.outputs.tag }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to Cloud Run
        id: deploy
        run: |
          gcloud run deploy ${config.cloudRunServiceName} \\
            --image=\${{ steps.image-tag.outputs.tag }} \\
            --region=${config.gcpRegion} \\
            --project=\${GCP_PROJECT_ID} \\
            --allow-unauthenticated \\
            --min-instances=0 \\
            --max-instances=10 \\
            --port=8080 \\
            --quiet
        env:
          GCP_PROJECT_ID: \${{ vars.GCP_PROJECT_ID || '${config.gcpProjectId}' }}

      - name: Allow unauthenticated access
        run: |
          gcloud run services add-iam-policy-binding ${config.cloudRunServiceName} \\
            --region=${config.gcpRegion} \\
            --member="allUsers" \\
            --role="roles/run.invoker" \\
            --project=\${GCP_PROJECT_ID} \\
            --quiet
        env:
          GCP_PROJECT_ID: \${{ vars.GCP_PROJECT_ID || '${config.gcpProjectId}' }}

      - name: Get Cloud Run URL
        id: service-url
        run: |
          URL=$(gcloud run services describe ${config.cloudRunServiceName} \\
            --region=${config.gcpRegion} \\
            --project=\${GCP_PROJECT_ID} \\
            --format='value(status.url)')
          echo "url=\${URL}" >> $GITHUB_OUTPUT
          echo "Service deployed to: \${URL}"
        env:
          GCP_PROJECT_ID: \${{ vars.GCP_PROJECT_ID || '${config.gcpProjectId}' }}

      - name: Deployment Summary
        run: |
          echo "## Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Property | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|----------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Service | ${config.cloudRunServiceName} |" >> $GITHUB_STEP_SUMMARY
          echo "| Region | ${config.gcpRegion} |" >> $GITHUB_STEP_SUMMARY
          echo "| Image | \\\`\${{ steps.image-tag.outputs.tag }}\\\` |" >> $GITHUB_STEP_SUMMARY
          echo "| URL | \${{ steps.service-url.outputs.url }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Commit | \\\`\${{ github.sha }}\\\` |" >> $GITHUB_STEP_SUMMARY
`;

  fs.writeFileSync(workflowPath, workflowContent);
  console.log('  Generated .github/workflows/deploy.yml');
}

async function generateDeployWebWorkflow(config: SetupConfig): Promise<void> {
  console.log('  Generating Firebase Hosting deployment workflow...');

  const workflowDir = path.join(WORKSPACE_ROOT, '.github', 'workflows');
  fs.mkdirSync(workflowDir, { recursive: true });

  const workflowContent = `name: Deploy Web App

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-web-\${{ github.ref }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }}

jobs:
  validate:
    name: Validate
    uses: ./.github/workflows/validate.yml
    with:
      affected-base: origin/main~1
    secrets: inherit

  deploy:
    name: Deploy Web App
    runs-on: ubuntu-latest
    needs: validate
    if: github.event_name == 'workflow_dispatch' || (github.event_name == 'push' && github.ref == 'refs/heads/main' && needs.validate.outputs.web-affected == 'true')

    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web app
        run: pnpm nx build web
        env:
          VITE_FIREBASE_API_KEY: \${{ vars.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: \${{ vars.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: \${{ vars.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: \${{ vars.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: \${{ vars.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: \${{ vars.VITE_FIREBASE_APP_ID }}

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: \${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: \${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Deploy to Firebase Hosting
        run: npx firebase-tools deploy --only hosting --project=\${GCP_PROJECT_ID}
        env:
          GCP_PROJECT_ID: \${{ vars.GCP_PROJECT_ID || '${config.gcpProjectId}' }}

      - name: Deployment Summary
        run: |
          echo "## Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Property | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|----------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| App | web |" >> $GITHUB_STEP_SUMMARY
          echo "| Platform | Firebase Hosting |" >> $GITHUB_STEP_SUMMARY
          echo "| URL | https://\${GCP_PROJECT_ID}.web.app |" >> $GITHUB_STEP_SUMMARY
          echo "| Commit | \\\`\${{ github.sha }}\\\` |" >> $GITHUB_STEP_SUMMARY
        env:
          GCP_PROJECT_ID: \${{ vars.GCP_PROJECT_ID || '${config.gcpProjectId}' }}
`;

  const workflowPath = path.join(workflowDir, 'deploy-web.yml');
  fs.writeFileSync(workflowPath, workflowContent);
  console.log('  Generated .github/workflows/deploy-web.yml');
}

function printNextSteps(config: SetupConfig, setupResult: SetupResult): void {
  console.log('Next steps:\n');

  let stepNum = 1;

  // Step: Configure GitHub Secrets (only if not already auto-configured)
  if (!setupResult.githubSecretsConfigured) {
    console.log(`${stepNum}. Configure GitHub Secrets (Settings → Secrets → Actions):\n`);

    if (setupResult.wifConfigured && setupResult.projectNumber) {
      // WIF was configured, show the exact values to copy
      console.log('   Copy these values to your GitHub repository secrets:\n');
      console.log('   GCP_WORKLOAD_IDENTITY_PROVIDER:');
      console.log(
        `     projects/${setupResult.projectNumber}/locations/global/workloadIdentityPools/github-actions/providers/github-provider\n`,
      );
      console.log('   GCP_SERVICE_ACCOUNT:');
      console.log(`     github-actions-deploy@${config.gcpProjectId}.iam.gserviceaccount.com\n`);
    } else {
      // WIF not configured, show how to get values
      console.log('   GCP_WORKLOAD_IDENTITY_PROVIDER:');
      console.log(
        '     Format: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/github-provider',
      );
      console.log(
        '     Get PROJECT_NUMBER: gcloud projects describe ' +
          config.gcpProjectId +
          ' --format="value(projectNumber)"',
      );
      console.log('     Or: GCP Console → Dashboard → Project number\n');
      console.log('   GCP_SERVICE_ACCOUNT:');
      console.log(`     github-actions-deploy@${config.gcpProjectId}.iam.gserviceaccount.com\n`);
    }
    stepNum++;
  }

  // Step: WIF setup (only if not already configured)
  if (!setupResult.wifConfigured) {
    console.log(`${stepNum}. Set up GCP Workload Identity Federation:`);
    console.log('   Run these commands in your terminal:\n');

    const gitHubRepo = setupResult.gitHubRepo;
    const repoPlaceholder = gitHubRepo
      ? `${gitHubRepo.org}/${gitHubRepo.repo}`
      : 'GITHUB_ORG/GITHUB_REPO';

    console.log(`   # Enable required APIs
   gcloud services enable iamcredentials.googleapis.com --project="${config.gcpProjectId}"
   gcloud services enable compute.googleapis.com --project="${config.gcpProjectId}"
   gcloud services enable artifactregistry.googleapis.com --project="${config.gcpProjectId}"
   gcloud services enable run.googleapis.com --project="${config.gcpProjectId}"

   # Create Workload Identity Pool
   gcloud iam workload-identity-pools create "github-actions" \\
     --project="${config.gcpProjectId}" \\
     --location="global" \\
     --display-name="GitHub Actions Pool"

   # Create Workload Identity Provider
   gcloud iam workload-identity-pools providers create-oidc "github-provider" \\
     --project="${config.gcpProjectId}" \\
     --location="global" \\
     --workload-identity-pool="github-actions" \\
     --display-name="GitHub Provider" \\
     --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \\
     --attribute-condition="assertion.repository=='${repoPlaceholder}'" \\
     --issuer-uri="https://token.actions.githubusercontent.com"

   # Create Service Account
   gcloud iam service-accounts create "github-actions-deploy" \\
     --project="${config.gcpProjectId}" \\
     --display-name="GitHub Actions Deploy"

   # Grant Cloud Run Admin role (Admin required for setIamPolicy permission)
   gcloud projects add-iam-policy-binding "${config.gcpProjectId}" \\
     --member="serviceAccount:github-actions-deploy@${config.gcpProjectId}.iam.gserviceaccount.com" \\
     --role="roles/run.admin"

   # Grant Artifact Registry Writer role
   gcloud projects add-iam-policy-binding "${config.gcpProjectId}" \\
     --member="serviceAccount:github-actions-deploy@${config.gcpProjectId}.iam.gserviceaccount.com" \\
     --role="roles/artifactregistry.writer"

   # Grant Service Account User role on compute service account
   # This allows deploying Cloud Run services that use the default compute SA
   gcloud iam service-accounts add-iam-policy-binding \\
     "PROJECT_NUMBER-compute@developer.gserviceaccount.com" \\
     --project="${config.gcpProjectId}" \\
     --role="roles/iam.serviceAccountUser" \\
     --member="serviceAccount:github-actions-deploy@${config.gcpProjectId}.iam.gserviceaccount.com"

   # Allow GitHub to impersonate Service Account
   gcloud iam service-accounts add-iam-policy-binding \\
     "github-actions-deploy@${config.gcpProjectId}.iam.gserviceaccount.com" \\
     --project="${config.gcpProjectId}" \\
     --role="roles/iam.workloadIdentityUser" \\
     --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/${repoPlaceholder}"
`);
    stepNum++;
  }

  // Step: Create Artifact Registry (only if not already created)
  if (!setupResult.artifactRegistryCreated) {
    console.log(`${stepNum}. Create Artifact Registry repository:`);
    console.log(`   gcloud artifacts repositories create ${config.artifactRegistryRepo} \\
     --repository-format=docker \\
     --location="${config.gcpRegion}" \\
     --project="${config.gcpProjectId}" \\
     --description="Docker images for Cloud Run services"
`);
    stepNum++;
  }

  // Step: Configure Firebase web app (only if not already configured)
  if (!setupResult.firebaseWebAppConfigured) {
    console.log(`${stepNum}. Configure Firebase web app for frontend:\n`);
    console.log('   a) Get your Firebase web app config from Firebase Console:');
    console.log(
      '      Firebase Console → Project settings → Your apps → Web app → SDK setup and configuration\n',
    );
    console.log('   b) Create apps/web/.env.local with:');
    console.log(`      VITE_FIREBASE_API_KEY=<your-api-key>
      VITE_FIREBASE_AUTH_DOMAIN=${config.gcpProjectId}.firebaseapp.com
      VITE_FIREBASE_PROJECT_ID=${config.gcpProjectId}
      VITE_FIREBASE_STORAGE_BUCKET=${config.gcpProjectId}.firebasestorage.app
      VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
      VITE_FIREBASE_APP_ID=<your-app-id>\n`);
    console.log(
      '   c) Set GitHub repository variables (Settings → Secrets and variables → Variables):',
    );
    console.log(
      '      VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,',
    );
    console.log(
      '      VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID\n',
    );
    stepNum++;
  }

  // Step: Push to main
  console.log(`${stepNum}. Push to main branch to trigger deployment:`);
  console.log('   git add .');
  console.log('   git commit -m "feat: configure CI/CD for Cloud Run and Firebase Hosting"');
  console.log('   git push origin main\n');

  // Summary of what was configured
  if (
    setupResult.wifConfigured ||
    setupResult.artifactRegistryCreated ||
    setupResult.firebaseWebAppConfigured ||
    setupResult.githubSecretsConfigured
  ) {
    console.log('✓ Automatically configured:');
    if (setupResult.wifConfigured) {
      console.log('  - Workload Identity Federation');
      console.log('  - Firebase APIs enabled');
      console.log('  - Firebase Hosting IAM roles');
    }
    if (setupResult.artifactRegistryCreated) {
      console.log('  - Artifact Registry repository');
    }
    if (setupResult.firebaseWebAppConfigured) {
      console.log('  - Firebase web app SDK config');
      console.log('  - apps/web/.env.local for local development');
      console.log('  - GitHub repository variables for CI/CD');
    }
    if (setupResult.githubSecretsConfigured) {
      console.log('  - GitHub repository secrets for GCP authentication');
    }
    console.log('');
  }

  // Generated workflows
  console.log('✓ Generated workflows:');
  console.log('  - .github/workflows/validate.yml (reusable validation)');
  console.log('  - .github/workflows/deploy.yml (API → Cloud Run)');
  console.log('  - .github/workflows/deploy-web.yml (Web → Firebase Hosting)\n');

  // Deployment URLs
  console.log('📍 Deployment URLs (after first deployment):');
  console.log(`  - API: https://${config.cloudRunServiceName}-<hash>.${config.gcpRegion}.run.app`);
  console.log(`  - Web: https://${config.gcpProjectId}.web.app\n`);
}

function updateJsonFile(
  filePath: string,
  updater: (json: Record<string, unknown>) => Record<string, unknown>,
): void {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content);
  const updated = updater(json);
  fs.writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`);
}

function replaceInFiles(dir: string, search: string, replace: string): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  const files = getAllFiles(dir);
  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json')) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes(search)) {
        const updated = content.replaceAll(search, replace);
        fs.writeFileSync(file, updated);
      }
    }
  }
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      files.push(...getAllFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

main().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
