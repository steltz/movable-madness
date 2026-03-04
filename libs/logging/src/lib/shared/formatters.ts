import type { LogEntry, LogSeverity } from './types';

/**
 * ANSI color codes for pretty printing
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
} as const;

/**
 * Get color for severity level
 */
function getSeverityColor(severity: LogSeverity): string {
  switch (severity) {
    case 'DEBUG':
      return COLORS.gray;
    case 'INFO':
      return COLORS.green;
    case 'WARNING':
      return COLORS.yellow;
    case 'ERROR':
      return COLORS.red;
    case 'CRITICAL':
      return COLORS.magenta;
    default:
      return COLORS.reset;
  }
}

/**
 * Format log entry as JSON (for production/GCP)
 */
export function formatAsJson(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Format log entry as pretty-printed output (for development)
 */
export function formatAsPretty(entry: LogEntry): string {
  const color = getSeverityColor(entry.severity);
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const correlationPart = entry.correlationId
    ? ` ${COLORS.gray}[${entry.correlationId.slice(0, 8)}]${COLORS.reset}`
    : '';
  const componentPart = entry.component ? `/${entry.component}` : '';

  let output = `${COLORS.gray}${time}${COLORS.reset} ${color}${entry.severity.padEnd(8)}${COLORS.reset} ${COLORS.cyan}[${entry.service}${componentPart}]${COLORS.reset}${correlationPart} ${entry.message}`;

  if (entry.error) {
    output += `\n${COLORS.red}  Error: ${entry.error.name}: ${entry.error.message}${COLORS.reset}`;
    if (entry.error.stack) {
      const stackLines = entry.error.stack.split('\n').slice(1, 4);
      output += `\n${COLORS.gray}${stackLines.map((line) => `    ${line.trim()}`).join('\n')}${COLORS.reset}`;
    }
  }

  if (entry.httpRequest) {
    const { method, url, statusCode, latencyMs } = entry.httpRequest;
    const statusColor = statusCode && statusCode >= 400 ? COLORS.red : COLORS.green;
    output += `\n  ${COLORS.blue}${method} ${url}${COLORS.reset}`;
    if (statusCode) {
      output += ` ${statusColor}${statusCode}${COLORS.reset}`;
    }
    if (latencyMs !== undefined) {
      output += ` ${COLORS.gray}(${latencyMs}ms)${COLORS.reset}`;
    }
  }

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += `\n${COLORS.gray}  Context: ${JSON.stringify(entry.context)}${COLORS.reset}`;
  }

  return output;
}

/**
 * Format log entry based on format type
 */
export function formatLogEntry(entry: LogEntry, format: 'json' | 'pretty'): string {
  return format === 'json' ? formatAsJson(entry) : formatAsPretty(entry);
}
