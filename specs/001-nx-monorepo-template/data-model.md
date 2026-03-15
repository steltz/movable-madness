# Data Model: Nx Monorepo GitHub Template Repository

**Feature Branch**: `001-nx-monorepo-template`
**Date**: 2026-01-09

## Overview

This template does not include persistent data storage (databases are out of scope per spec). The data model focuses on **shared TypeScript interfaces** used for API communication between frontend, backend, and serverless functions.

---

## Shared Types (libs/shared-types)

### ApiResponse<T>

Generic response wrapper for all API endpoints.

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| success | boolean | Yes | Indicates if the request was successful |
| data | T | No | Response payload (generic type) |
| error | ApiError | No | Error details if success is false |
| timestamp | string | Yes | ISO 8601 timestamp of response |

### ApiError

Structured error information for failed requests.

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Machine-readable error code (e.g., "VALIDATION_ERROR") |
| message | string | Yes | Human-readable error message |
| details | Record<string, unknown> | No | Additional context for debugging |

### HealthCheckResponse

Response type for health check endpoints.

```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services?: ServiceStatus[];
}

interface ServiceStatus {
  name: string;
  status: 'up' | 'down';
  latency?: number;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | enum | Yes | Overall health status |
| version | string | Yes | Application version |
| uptime | number | Yes | Uptime in seconds |
| services | ServiceStatus[] | No | Status of dependent services |

---

## Configuration Entities

These are not persisted but represent runtime configuration.

### SetupConfig

Configuration collected by the setup script.

```typescript
interface SetupConfig {
  projectName: string;
  gcpProjectId: string;
  gcpRegion: string;
  cloudRunServiceName: string;
}
```

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| projectName | string | kebab-case, 3-50 chars | Name for the new project |
| gcpProjectId | string | GCP project ID format | Google Cloud project identifier |
| gcpRegion | string | Valid GCP region | Deployment region (e.g., "us-central1") |
| cloudRunServiceName | string | lowercase, alphanumeric | Cloud Run service name (default: "api") |

---

## Type Export Structure

**libs/shared-types/src/index.ts**:
```typescript
// Response types
export type { ApiResponse, ApiError } from './lib/api-response';
export type { HealthCheckResponse, ServiceStatus } from './lib/health-check';

// Config types (used by setup script)
export type { SetupConfig } from './lib/setup-config';
```

---

## Usage Examples

### Backend (NestJS Controller)

```typescript
import type { ApiResponse, HealthCheckResponse } from '@workspace/shared-types';

@Controller()
export class AppController {
  @Get()
  getHello(): ApiResponse<string> {
    return {
      success: true,
      data: 'Hello from NestJS!',
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  getHealth(): ApiResponse<HealthCheckResponse> {
    return {
      success: true,
      data: {
        status: 'healthy',
        version: '1.0.0',
        uptime: process.uptime()
      },
      timestamp: new Date().toISOString()
    };
  }
}
```

### Frontend (React)

```typescript
import type { ApiResponse } from '@workspace/shared-types';

async function fetchHello(): Promise<ApiResponse<string>> {
  const response = await fetch('/api');
  return response.json();
}
```

### Firebase Functions

```typescript
import type { ApiResponse } from '@workspace/shared-types';
import { onRequest } from 'firebase-functions/v2/https';

export const hello = onRequest((req, res) => {
  const response: ApiResponse<string> = {
    success: true,
    data: 'Hello from Firebase!',
    timestamp: new Date().toISOString()
  };
  res.json(response);
});
```

---

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| ApiResponse | timestamp | Must be valid ISO 8601 format |
| ApiError | code | SCREAMING_SNAKE_CASE |
| SetupConfig | projectName | Must be valid npm package name |
| SetupConfig | gcpProjectId | Must match pattern `^[a-z][a-z0-9-]{4,28}[a-z0-9]$` |
| SetupConfig | gcpRegion | Must be valid GCP region |

---

## Notes

- All types are exported as TypeScript interfaces (no runtime validation)
- The template uses type-only imports where possible to reduce bundle size
- For runtime validation, consumers can add libraries like Zod or class-validator
