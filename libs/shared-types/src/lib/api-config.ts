/**
 * Environment configuration for Postman collection generation
 */
export interface EnvironmentConfig {
  name: string;
  baseUrl: string;
}

/**
 * Postman environment file structure
 */
export interface PostmanEnvironment {
  id: string;
  name: string;
  values: PostmanVariable[];
}

/**
 * Postman variable definition
 */
export interface PostmanVariable {
  key: string;
  value: string;
  enabled: boolean;
  type?: 'default' | 'secret';
}

/**
 * Default environments for the API
 */
export const DEFAULT_ENVIRONMENTS: EnvironmentConfig[] = [
  { name: 'Local Development', baseUrl: 'http://localhost:3000' },
  { name: 'Staging', baseUrl: 'https://api-staging.example.com' },
  { name: 'Production', baseUrl: 'https://api.example.com' },
];
