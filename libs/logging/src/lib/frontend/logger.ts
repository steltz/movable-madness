import type { Breadcrumb, FrontendLoggerConfig, LogSeverity } from '../shared';
import { addErrorBreadcrumb, getBreadcrumbBuffer, initBreadcrumbs } from './breadcrumb';
import { getCorrelationId } from './correlation';

/**
 * Severity level priorities for filtering
 */
const SEVERITY_PRIORITY: Record<LogSeverity, number> = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4,
};

/**
 * Frontend logger configuration
 */
let loggerConfig: FrontendLoggerConfig | null = null;

/**
 * Get the current log level from localStorage or config
 */
function getLogLevel(): LogSeverity {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedLevel = localStorage.getItem('LOG_LEVEL') as LogSeverity | null;
    if (storedLevel && SEVERITY_PRIORITY[storedLevel] !== undefined) {
      return storedLevel;
    }
  }
  return loggerConfig?.level ?? 'INFO';
}

/**
 * Check if a severity level should be logged
 */
function shouldLog(severity: LogSeverity): boolean {
  return SEVERITY_PRIORITY[severity] >= SEVERITY_PRIORITY[getLogLevel()];
}

/**
 * Format log message for console output
 */
function formatForConsole(
  severity: LogSeverity,
  message: string,
  context?: Record<string, unknown>,
): string {
  const timestamp = new Date().toISOString();
  const service = loggerConfig?.service ?? 'unknown';
  let output = `[${timestamp}] ${severity} [${service}] ${message}`;

  if (context && Object.keys(context).length > 0) {
    output += ` ${JSON.stringify(context)}`;
  }

  return output;
}

/**
 * Get console method for severity
 */
function getConsoleMethod(severity: LogSeverity): 'log' | 'warn' | 'error' | 'debug' {
  switch (severity) {
    case 'DEBUG':
      return 'debug';
    case 'WARNING':
      return 'warn';
    case 'ERROR':
    case 'CRITICAL':
      return 'error';
    default:
      return 'log';
  }
}

/**
 * Report error to backend endpoint
 */
async function reportToBackend(
  severity: LogSeverity,
  message: string,
  error?: Error,
): Promise<void> {
  const endpoint = loggerConfig?.errorReportingEndpoint;
  if (!endpoint) return;

  // Only auto-report ERROR and CRITICAL
  if (SEVERITY_PRIORITY[severity] < SEVERITY_PRIORITY.ERROR) return;

  const breadcrumbs = getBreadcrumbBuffer()?.getAll() ?? [];

  const report = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    service: loggerConfig?.service ?? 'unknown',
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
    breadcrumbs: breadcrumbs as Breadcrumb[],
    environment: {
      userAgent: navigator.userAgent,
      url: window.location.pathname,
      referrer: document.referrer || undefined,
    },
    correlationId: getCorrelationId(),
  };

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': getCorrelationId(),
      },
      body: JSON.stringify(report),
    });
  } catch (e) {
    // Silently fail - don't create infinite error loops
    console.error('Failed to report error to backend:', e);
  }
}

/**
 * Core logging function
 */
function log(
  severity: LogSeverity,
  message: string,
  context?: Record<string, unknown>,
  error?: Error,
): void {
  if (!shouldLog(severity)) return;

  const formatted = formatForConsole(severity, message, context);
  const method = getConsoleMethod(severity);

  if (error) {
    console[method](formatted, error);
  } else {
    console[method](formatted);
  }

  // Add error breadcrumb for errors
  if (severity === 'ERROR' || severity === 'CRITICAL') {
    addErrorBreadcrumb(message, error?.stack);
    reportToBackend(severity, message, error);
  }
}

/**
 * Initialize the frontend logger
 */
export function initLogger(config: FrontendLoggerConfig): void {
  loggerConfig = config;
  initBreadcrumbs(config.maxBreadcrumbs ?? 50);
}

/**
 * Frontend logger instance
 */
export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    log('DEBUG', message, context);
  },

  info(message: string, context?: Record<string, unknown>): void {
    log('INFO', message, context);
  },

  warn(message: string, context?: Record<string, unknown>): void {
    log('WARNING', message, context);
  },

  error(message: string, context?: Record<string, unknown>): void {
    log('ERROR', message, context);
  },

  /**
   * Log an error with full exception details
   */
  errorWithException(message: string, error: Error, context?: Record<string, unknown>): void {
    log('ERROR', message, context, error);
  },

  critical(message: string, context?: Record<string, unknown>): void {
    log('CRITICAL', message, context);
  },

  /**
   * Log a critical error with full exception details
   */
  criticalWithException(message: string, error: Error, context?: Record<string, unknown>): void {
    log('CRITICAL', message, context, error);
  },
};
