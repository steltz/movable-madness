import type { Breadcrumb, BreadcrumbType } from '../shared';

/**
 * Circular buffer for storing breadcrumbs
 */
export class BreadcrumbBuffer {
  private buffer: Breadcrumb[] = [];
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  /**
   * Add a breadcrumb to the buffer
   */
  add(breadcrumb: Breadcrumb): void {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(breadcrumb);
  }

  /**
   * Get all breadcrumbs (oldest first)
   */
  getAll(): Breadcrumb[] {
    return [...this.buffer];
  }

  /**
   * Clear all breadcrumbs
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Get the number of breadcrumbs
   */
  get length(): number {
    return this.buffer.length;
  }
}

// Global breadcrumb buffer instance
let breadcrumbBuffer: BreadcrumbBuffer | null = null;

/**
 * Initialize the breadcrumb buffer
 */
export function initBreadcrumbs(maxSize = 50): void {
  breadcrumbBuffer = new BreadcrumbBuffer(maxSize);
}

/**
 * Get the breadcrumb buffer instance
 */
export function getBreadcrumbBuffer(): BreadcrumbBuffer | null {
  return breadcrumbBuffer;
}

/**
 * Create a breadcrumb object
 */
function createBreadcrumb(
  type: BreadcrumbType,
  message: string,
  category?: string,
  data?: Record<string, unknown>,
): Breadcrumb {
  return {
    type,
    timestamp: new Date().toISOString(),
    message,
    category,
    data,
  };
}

/**
 * Add a generic breadcrumb
 */
export function addBreadcrumb(
  type: BreadcrumbType,
  message: string,
  category?: string,
  data?: Record<string, unknown>,
): void {
  breadcrumbBuffer?.add(createBreadcrumb(type, message, category, data));
}

/**
 * Add a click breadcrumb
 */
export function addClickBreadcrumb(message: string, element: string, text?: string): void {
  addBreadcrumb('click', message, 'ui', { element, text });
}

/**
 * Add a navigation breadcrumb
 */
export function addNavigationBreadcrumb(from: string, to: string): void {
  addBreadcrumb('navigation', `Navigated from ${from} to ${to}`, 'navigation', {
    from,
    to,
  });
}

/**
 * Add an input breadcrumb (never logs actual values, only field name and length)
 */
export function addInputBreadcrumb(field: string, length: number): void {
  addBreadcrumb('input', `Input changed: ${field}`, 'form', { field, length });
}

/**
 * Add an API request breadcrumb
 */
export function addApiRequestBreadcrumb(method: string, url: string): void {
  addBreadcrumb('api_request', `${method} ${url}`, 'api', { method, url });
}

/**
 * Add an API response breadcrumb
 */
export function addApiResponseBreadcrumb(
  method: string,
  url: string,
  status: number,
  duration: number,
): void {
  addBreadcrumb('api_response', `${method} ${url} -> ${status}`, 'api', {
    method,
    url,
    status,
    duration,
  });
}

/**
 * Add an error breadcrumb
 */
export function addErrorBreadcrumb(message: string, stack?: string): void {
  addBreadcrumb('error', message, 'error', { message, stack });
}

/**
 * Add a custom breadcrumb
 */
export function addCustomBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  addBreadcrumb('custom', message, category, data);
}
