/**
 * Log severity levels matching Google Cloud Logging
 */
export type LogSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

/**
 * Breadcrumb types for frontend user action tracking
 */
export type BreadcrumbType =
  | 'click'
  | 'navigation'
  | 'input'
  | 'api_request'
  | 'api_response'
  | 'error'
  | 'custom';

/**
 * User action record for debugging frontend issues
 */
export interface Breadcrumb {
  type: BreadcrumbType;
  timestamp: string;
  message: string;
  category?: string;
  data?: Record<string, unknown>;
}

/**
 * Structured error information for logs
 */
export interface ErrorInfo {
  name: string;
  message: string;
  stack?: string;
  code?: string;
}

/**
 * HTTP request/response details for logging
 */
export interface HttpRequestInfo {
  method: string;
  url: string;
  userAgent?: string;
  referer?: string;
  statusCode?: number;
  latencyMs?: number;
  remoteIp?: string;
}

/**
 * Request-scoped context stored in AsyncLocalStorage
 */
export interface CorrelationContext {
  correlationId: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  operation?: string;
  startTime: number;
}

/**
 * The primary structure for all log messages (GCP-compatible)
 */
export interface LogEntry {
  severity: LogSeverity;
  message: string;
  timestamp: string;
  correlationId?: string;
  service: string;
  component?: string;
  context?: Record<string, unknown>;
  error?: ErrorInfo;
  httpRequest?: HttpRequestInfo;
  userId?: string;
  breadcrumbs?: Breadcrumb[];
  'logging.googleapis.com/trace'?: string;
  'logging.googleapis.com/spanId'?: string;
}

/**
 * Configuration for sensitive data redaction
 */
export interface RedactionConfig {
  additionalFields?: string[];
  additionalValues?: RegExp[];
  disableDefaults?: boolean;
}

/**
 * Backend logger configuration
 */
export interface BackendLoggerConfig {
  service: string;
  level?: LogSeverity;
  format?: 'json' | 'pretty';
  defaultContext?: Record<string, unknown>;
  redaction?: RedactionConfig;
}

/**
 * Frontend logger configuration
 */
export interface FrontendLoggerConfig {
  service: string;
  level?: LogSeverity;
  maxBreadcrumbs?: number;
  errorReportingEndpoint?: string;
  defaultContext?: Record<string, unknown>;
}

/**
 * NestJS Logging Module options
 */
export interface LoggingModuleOptions {
  service: string;
  enableRequestLogging?: boolean;
  level?: LogSeverity;
  format?: 'json' | 'pretty';
  redaction?: RedactionConfig;
}
