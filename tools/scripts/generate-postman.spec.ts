import Converter from 'openapi-to-postmanv2';
import { describe, expect, it } from 'vitest';

interface ConversionResult {
  result: boolean;
  reason?: string;
  output?: Array<{ type: string; data: unknown }>;
}

/**
 * Helper to convert OpenAPI spec to Postman collection
 */
function convertToPostman(spec: object): Promise<ConversionResult> {
  return new Promise((resolve) => {
    const options = {
      folderStrategy: 'Tags',
      requestNameSource: 'Fallback',
      schemaFaker: true,
      parametersResolution: 'Example',
    };

    Converter.convert(
      { type: 'json', data: spec },
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

describe('generate-postman', () => {
  describe('OpenAPI to Postman conversion', () => {
    it('should convert valid OpenAPI spec to Postman collection', async () => {
      const validSpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/health': {
            get: {
              tags: ['Health'],
              summary: 'Health check',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      };

      const result = await convertToPostman(validSpec);

      expect(result.result).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output?.length).toBeGreaterThan(0);

      const collection = result.output?.[0].data as Record<string, unknown>;
      expect(collection.info).toBeDefined();
      expect(collection.item).toBeDefined();
    });

    it('should organize endpoints by tags', async () => {
      const specWithTags = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              tags: ['Users'],
              summary: 'List users',
              responses: { '200': { description: 'OK' } },
            },
          },
          '/products': {
            get: {
              tags: ['Products'],
              summary: 'List products',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      };

      const result = await convertToPostman(specWithTags);

      expect(result.result).toBe(true);
      const collection = result.output?.[0].data as Record<string, unknown>;
      const items = collection.item as Array<{ name: string }>;

      // Should have two folders
      expect(items.length).toBe(2);
      const folderNames = items.map((i) => i.name);
      expect(folderNames).toContain('Users');
      expect(folderNames).toContain('Products');
    });
  });

  describe('error handling', () => {
    it('should handle malformed OpenAPI spec gracefully', async () => {
      const malformedSpec = {
        // Missing required fields
        notOpenapi: 'invalid',
      };

      const result = await convertToPostman(malformedSpec);

      // The converter may still produce output but with warnings
      // or it may fail - either way it should not throw
      expect(result).toBeDefined();
    });

    it('should handle spec without paths', async () => {
      const specWithoutPaths = {
        openapi: '3.0.0',
        info: {
          title: 'Empty API',
          version: '1.0.0',
        },
        paths: {},
      };

      const result = await convertToPostman(specWithoutPaths);

      expect(result.result).toBe(true);
      const collection = result.output?.[0].data as Record<string, unknown>;
      const items = collection.item as unknown[];
      expect(items.length).toBe(0);
    });
  });
});
