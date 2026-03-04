import type { RedactionConfig } from './types';

const REDACTED = '[REDACTED]';

/**
 * Default field name patterns to redact
 */
const DEFAULT_FIELD_PATTERNS = [
  /password/i,
  /token/i,
  /apiKey/i,
  /api_key/i,
  /secret/i,
  /authorization/i,
  /credential/i,
  /key$/i,
];

/**
 * Default value patterns to redact
 */
const DEFAULT_VALUE_PATTERNS = [
  /^Bearer\s+.+$/,
  /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, // JWTs
];

/**
 * Check if a field name should be redacted
 */
function shouldRedactField(
  fieldName: string,
  additionalFields: string[] = [],
  disableDefaults = false,
): boolean {
  const patterns = disableDefaults ? [] : DEFAULT_FIELD_PATTERNS;

  for (const pattern of patterns) {
    if (pattern.test(fieldName)) {
      return true;
    }
  }

  for (const field of additionalFields) {
    if (fieldName.toLowerCase() === field.toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a string value should be redacted based on its content
 */
function shouldRedactValue(
  value: string,
  additionalPatterns: RegExp[] = [],
  disableDefaults = false,
): boolean {
  const patterns = disableDefaults
    ? additionalPatterns
    : [...DEFAULT_VALUE_PATTERNS, ...additionalPatterns];

  for (const pattern of patterns) {
    if (pattern.test(value)) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively redact sensitive data from an object
 */
export function redact<T>(data: T, config: RedactionConfig = {}): T {
  const { additionalFields = [], additionalValues = [], disableDefaults = false } = config;

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    if (shouldRedactValue(data, additionalValues, disableDefaults)) {
      return REDACTED as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redact(item, config)) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (shouldRedactField(key, additionalFields, disableDefaults)) {
        result[key] = REDACTED;
      } else if (typeof value === 'string') {
        result[key] = shouldRedactValue(value, additionalValues, disableDefaults)
          ? REDACTED
          : value;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redact(value, config);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  return data;
}
