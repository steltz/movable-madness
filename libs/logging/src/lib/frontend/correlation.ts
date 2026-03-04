import { generateCorrelationId, isValidCorrelationId } from '../shared';

const CORRELATION_ID_KEY = 'logging_correlation_id';

/**
 * Get the current correlation ID from sessionStorage
 * Generates a new one if not present or invalid
 */
export function getCorrelationId(): string {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return generateCorrelationId();
  }

  let correlationId = sessionStorage.getItem(CORRELATION_ID_KEY);

  if (!correlationId || !isValidCorrelationId(correlationId)) {
    correlationId = generateCorrelationId();
    sessionStorage.setItem(CORRELATION_ID_KEY, correlationId);
  }

  return correlationId;
}

/**
 * Set a specific correlation ID
 */
export function setCorrelationId(id: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  if (isValidCorrelationId(id)) {
    sessionStorage.setItem(CORRELATION_ID_KEY, id);
  }
}

/**
 * Clear the correlation ID (generates a new one on next access)
 */
export function clearCorrelationId(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  sessionStorage.removeItem(CORRELATION_ID_KEY);
}

/**
 * Generate a new correlation ID and set it
 */
export function rotateCorrelationId(): string {
  const newId = generateCorrelationId();
  setCorrelationId(newId);
  return newId;
}
