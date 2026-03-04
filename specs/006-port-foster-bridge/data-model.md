# Data Model: Port foster-bridge Features

**Date**: 2026-01-18 | **Branch**: `006-port-foster-bridge`

## Overview

This document defines the data structures and entities for the logging infrastructure and related features. Since this feature primarily involves utility code and UI components (not persistent data), the focus is on runtime data structures.

---

## 1. Log Entry

The primary structure for all log messages.

```typescript
interface LogEntry {
  // Required fields (GCP-compatible)
  severity: LogSeverity;
  message: string;
  timestamp: string; // ISO 8601 format

  // Context fields
  correlationId?: string;
  service: string;
  component?: string;

  // Optional structured data
  context?: Record<string, unknown>;
  error?: ErrorInfo;
  httpRequest?: HttpRequestInfo;
  userId?: string;
  breadcrumbs?: Breadcrumb[];

  // GCP-specific
  'logging.googleapis.com/trace'?: string;
  'logging.googleapis.com/spanId'?: string;
}

type LogSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| severity | LogSeverity | Yes | Log level matching GCP Logging |
| message | string | Yes | Human-readable log message |
| timestamp | string | Yes | ISO 8601 timestamp |
| correlationId | string | No | Request correlation ID (UUID) |
| service | string | Yes | Service name (e.g., "api", "web") |
| component | string | No | Component within service |
| context | Record | No | Additional structured data |
| error | ErrorInfo | No | Error details if logging an error |
| httpRequest | HttpRequestInfo | No | HTTP request details |
| userId | string | No | Authenticated user ID |
| breadcrumbs | Breadcrumb[] | No | User action trail (frontend) |

---

## 2. Correlation Context

Request-scoped context stored in AsyncLocalStorage.

```typescript
interface CorrelationContext {
  correlationId: string;  // UUID v4
  traceId?: string;       // GCP Cloud Trace ID
  spanId?: string;        // GCP Span ID
  userId?: string;        // Set after auth middleware
  operation?: string;     // Current operation name
  startTime: number;      // Request start timestamp (ms)
}
```

### State Transitions

```
┌─────────────┐
│  No Context │ (default state)
└─────┬───────┘
      │ CorrelationMiddleware.use()
      ▼
┌─────────────┐
│  Initialized│ correlationId, startTime set
└─────┬───────┘
      │ AuthMiddleware.use() (optional)
      ▼
┌─────────────┐
│  Enriched   │ userId added
└─────┬───────┘
      │ Request completes
      ▼
┌─────────────┐
│  Logged     │ Final log with latency
└─────────────┘
```

---

## 3. Breadcrumb

User action record for debugging frontend issues.

```typescript
interface Breadcrumb {
  type: BreadcrumbType;
  timestamp: string;      // ISO 8601
  message: string;        // Human-readable description
  category?: string;      // Grouping (e.g., "auth", "api", "ui")
  data?: Record<string, unknown>;  // Type-specific data
}

type BreadcrumbType =
  | 'click'         // User clicked an element
  | 'navigation'    // Route change
  | 'input'         // Form input change
  | 'api_request'   // API call started
  | 'api_response'  // API call completed
  | 'error'         // Error occurred
  | 'custom';       // Developer-defined
```

### Breadcrumb Data by Type

| Type | Data Fields |
|------|-------------|
| click | `{ element: string, text?: string }` |
| navigation | `{ from: string, to: string }` |
| input | `{ field: string, length: number }` (never actual value) |
| api_request | `{ method: string, url: string }` |
| api_response | `{ method: string, url: string, status: number, duration: number }` |
| error | `{ message: string, stack?: string }` |
| custom | User-defined |

---

## 4. Logger Configuration

Configuration for logger initialization.

```typescript
// Backend configuration
interface BackendLoggerConfig {
  service: string;                    // Required: service name
  level?: LogSeverity;                // Default: 'INFO'
  format?: 'json' | 'pretty';         // Default: 'json' in prod, 'pretty' in dev
  defaultContext?: Record<string, unknown>;
  redaction?: RedactionConfig;
}

// Frontend configuration
interface FrontendLoggerConfig {
  service: string;                    // Required: service name
  level?: LogSeverity;                // Default: 'INFO'
  maxBreadcrumbs?: number;            // Default: 50
  errorReportingEndpoint?: string;    // Optional: auto-report errors
  defaultContext?: Record<string, unknown>;
}
```

---

## 5. Redaction Configuration

Settings for sensitive data redaction.

```typescript
interface RedactionConfig {
  additionalFields?: string[];    // Extra field names to redact
  additionalValues?: RegExp[];    // Extra value patterns to redact
  disableDefaults?: boolean;      // Skip default patterns (dangerous)
}

// Default redaction patterns
const DEFAULT_FIELD_PATTERNS = [
  /password/i,
  /token/i,
  /apiKey/i,
  /secret/i,
  /authorization/i,
  /credential/i,
  /key$/i,
];

const DEFAULT_VALUE_PATTERNS = [
  /^Bearer\s+.+$/,                    // Bearer tokens
  /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, // JWTs
];
```

---

## 6. Error Info

Structured error information for logs.

```typescript
interface ErrorInfo {
  name: string;           // Error name (e.g., "TypeError")
  message: string;        // Error message
  stack?: string;         // Stack trace
  code?: string;          // Error code if available
}
```

---

## 7. HTTP Request Info

HTTP request/response details for logging.

```typescript
interface HttpRequestInfo {
  method: string;         // HTTP method
  url: string;            // Request URL
  userAgent?: string;     // User-Agent header
  referer?: string;       // Referer header
  statusCode?: number;    // Response status
  latencyMs?: number;     // Request duration in ms
  remoteIp?: string;      // Client IP (be careful with PII)
}
```

---

## 8. Frontend Error Report

DTO for frontend-to-backend error reporting.

```typescript
interface FrontendErrorReport {
  severity: LogSeverity;
  message: string;
  timestamp: string;
  service: string;

  // Error details
  error?: {
    name: string;
    message: string;
    stack?: string;
  };

  // Context
  breadcrumbs?: Breadcrumb[];
  environment: {
    userAgent: string;
    url: string;
    referrer?: string;
  };

  // Optional user context
  userId?: string;
  correlationId?: string;
}
```

---

## 9. NestJS Logging Module Options

Configuration for LoggingModule.forRoot().

```typescript
interface LoggingModuleOptions {
  service: string;                    // Required: service name
  enableRequestLogging?: boolean;     // Default: true
  level?: LogSeverity;                // Default: from env or 'INFO'
  format?: 'json' | 'pretty';         // Default: from env or auto-detect
  redaction?: RedactionConfig;
}
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (API)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CorrelationMiddleware                                          │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │ CorrelationContext│────▶│ StructuredLogger │                 │
│  │ (AsyncLocalStorage)│     │ (LoggerService)  │                 │
│  └──────────────────┘     └────────┬─────────┘                 │
│                                     │                           │
│                                     ▼                           │
│                           ┌──────────────────┐                 │
│                           │    LogEntry      │                 │
│                           │ (JSON or Pretty) │                 │
│                           └────────┬─────────┘                 │
│                                     │                           │
│  ┌──────────────────┐               │ redact()                 │
│  │RequestLogging    │───────────────┤                          │
│  │Interceptor       │               ▼                           │
│  └──────────────────┘     ┌──────────────────┐                 │
│                           │   Console/Stdout │                 │
│                           └──────────────────┘                 │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │LoggingController │◀──────── FrontendErrorReport             │
│  │POST /api/v1/logs │                                          │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Web)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Actions                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │ BreadcrumbBuffer │◀────│ addBreadcrumb()  │                 │
│  │ (Circular, max=50)│     │ helpers          │                 │
│  └────────┬─────────┘     └──────────────────┘                 │
│           │                                                     │
│           │ On ERROR/CRITICAL                                   │
│           ▼                                                     │
│  ┌──────────────────┐                                          │
│  │ FrontendLogger   │                                          │
│  │ (error, warn...) │                                          │
│  └────────┬─────────┘                                          │
│           │                                                     │
│           │ Auto-report to endpoint                             │
│           ▼                                                     │
│  ┌──────────────────┐                                          │
│  │FrontendErrorReport│─────────▶ POST /api/v1/logs/errors      │
│  │ + breadcrumbs     │                                          │
│  └──────────────────┘                                          │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │ AppErrorBoundary │─────────▶ FrontendLogger.errorWithEx()   │
│  │ (Class Component) │                                          │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### LogEntry
- `severity` must be one of: DEBUG, INFO, WARNING, ERROR, CRITICAL
- `message` must be non-empty string
- `timestamp` must be valid ISO 8601 format
- `correlationId` if present, must be valid UUID v4

### Breadcrumb
- `type` must be valid BreadcrumbType enum value
- `timestamp` must be valid ISO 8601 format
- `message` must be non-empty string
- `data.input` must NEVER contain actual input values (only field name and length)

### FrontendErrorReport
- `service` must be non-empty string
- `message` must be non-empty string
- `timestamp` must be valid ISO 8601 format
- `environment.userAgent` must be non-empty string
- `environment.url` must be valid URL
