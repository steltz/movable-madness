import { Injectable, type LoggerService, type LogLevel } from '@nestjs/common';
import {
  type BackendLoggerConfig,
  formatLogEntry,
  type LogEntry,
  type LogSeverity,
  type RedactionConfig,
  redact,
} from '../shared';
import { getCorrelationContext } from './correlation.middleware';

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

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly service: string;
  private readonly minLevel: LogSeverity;
  private readonly format: 'json' | 'pretty';
  private readonly defaultContext: Record<string, unknown>;
  private readonly redactionConfig: RedactionConfig;

  constructor(config: BackendLoggerConfig) {
    this.service = config.service;
    this.minLevel = config.level ?? (process.env['LOG_LEVEL'] as LogSeverity) ?? 'INFO';
    this.format =
      config.format ??
      (process.env['LOG_FORMAT'] as 'json' | 'pretty') ??
      (process.env['NODE_ENV'] === 'production' ? 'json' : 'pretty');
    this.defaultContext = config.defaultContext ?? {};
    this.redactionConfig = config.redaction ?? {};
  }

  private shouldLog(severity: LogSeverity): boolean {
    return SEVERITY_PRIORITY[severity] >= SEVERITY_PRIORITY[this.minLevel];
  }

  private createEntry(
    severity: LogSeverity,
    message: string,
    context?: string | Record<string, unknown>,
    error?: Error,
  ): LogEntry {
    const correlationContext = getCorrelationContext();
    const component = typeof context === 'string' ? context : undefined;
    const additionalContext = typeof context === 'object' ? context : undefined;

    const entry: LogEntry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      component,
      correlationId: correlationContext?.correlationId,
      userId: correlationContext?.userId,
      context: {
        ...this.defaultContext,
        ...additionalContext,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (correlationContext?.traceId) {
      entry['logging.googleapis.com/trace'] =
        `projects/${process.env['GCP_PROJECT_ID']}/traces/${correlationContext.traceId}`;
    }

    if (correlationContext?.spanId) {
      entry['logging.googleapis.com/spanId'] = correlationContext.spanId;
    }

    return redact(entry, this.redactionConfig);
  }

  private output(entry: LogEntry): void {
    const formatted = formatLogEntry(entry, this.format);
    if (entry.severity === 'ERROR' || entry.severity === 'CRITICAL') {
      console.error(formatted);
    } else if (entry.severity === 'WARNING') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  log(message: string, context?: string): void {
    if (this.shouldLog('INFO')) {
      this.output(this.createEntry('INFO', message, context));
    }
  }

  error(message: string, trace?: string, context?: string): void {
    if (this.shouldLog('ERROR')) {
      const error = trace ? new Error(trace) : undefined;
      this.output(this.createEntry('ERROR', message, context, error));
    }
  }

  warn(message: string, context?: string): void {
    if (this.shouldLog('WARNING')) {
      this.output(this.createEntry('WARNING', message, context));
    }
  }

  debug(message: string, context?: string): void {
    if (this.shouldLog('DEBUG')) {
      this.output(this.createEntry('DEBUG', message, context));
    }
  }

  verbose(message: string, context?: string): void {
    if (this.shouldLog('DEBUG')) {
      this.output(this.createEntry('DEBUG', message, context));
    }
  }

  fatal(message: string, trace?: string, context?: string): void {
    if (this.shouldLog('CRITICAL')) {
      const error = trace ? new Error(trace) : undefined;
      this.output(this.createEntry('CRITICAL', message, context, error));
    }
  }

  setLogLevels(_levels: LogLevel[]): void {
    // Not implemented - we use our own severity filtering
  }

  /**
   * Log with explicit severity and structured context
   */
  logWithContext(
    severity: LogSeverity,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (this.shouldLog(severity)) {
      this.output(this.createEntry(severity, message, context, error));
    }
  }
}
