# Data Model: Postman Collection Generator

**Feature**: 004-postman-openapi-sync
**Date**: 2026-01-11

## Overview

This feature is a CLI tool that transforms data between formats. No persistent storage is required. This document defines the data structures used during transformation.

---

## Input Entities

### OpenAPI Specification

**Source**: Auto-generated from NestJS Swagger decorators in `apps/api/src/`

| Field | Type | Description |
|-------|------|-------------|
| `openapi` | string | Version (3.1.0) |
| `info.title` | string | API name → Collection name |
| `info.description` | string | API description → Collection description |
| `info.version` | string | API version |
| `servers[]` | array | Base URLs for environments |
| `paths` | object | Endpoint definitions |
| `components.schemas` | object | Request/response schemas |
| `components.securitySchemes` | object | Auth configurations |
| `tags[]` | array | Folder groupings |

### Environment Configuration

**Source**: Derived from OpenAPI `servers` + Firebase config

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Environment name (local, staging, production) |
| `baseUrl` | string | API base URL |
| `variables` | Record<string, string> | Additional env-specific vars |

---

## Output Entities

### Postman Collection (v2.1)

**Output**: `apps/api/postman/collection.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `info.name` | string | Yes | Collection name (from OpenAPI title) |
| `info.description` | string | No | Collection description |
| `info.schema` | string | Yes | Always `https://schema.postman.com/json/collection/v2.1.0/...` |
| `variable[]` | array | No | Collection-level variables |
| `auth` | object | No | Collection-level authentication |
| `item[]` | array | Yes | Folders and requests |

### Postman Folder

**Nested in**: `collection.item[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Folder name (from OpenAPI tag) |
| `description` | string | No | Tag description |
| `item[]` | array | Yes | Requests in this folder |

### Postman Request

**Nested in**: `folder.item[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Request name (from operationId/summary) |
| `request.method` | string | Yes | HTTP method |
| `request.url` | object | Yes | URL with path, query params |
| `request.header[]` | array | No | Request headers |
| `request.body` | object | No | Request body with examples |
| `request.auth` | object | No | Request-specific auth override |

### Postman Environment

**Output**: `apps/api/postman/environments/{name}.json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID for environment |
| `name` | string | Yes | Display name |
| `values[]` | array | Yes | Variable definitions |
| `values[].key` | string | Yes | Variable name |
| `values[].value` | string | Yes | Variable value |
| `values[].enabled` | boolean | Yes | Always `true` |

---

## Transformation Rules

### OpenAPI → Postman Mapping

| OpenAPI | Postman | Notes |
|---------|---------|-------|
| `info.title` | `info.name` | Direct copy |
| `info.description` | `info.description` | Direct copy |
| `tags[].name` | `item[].name` (folder) | Creates folder per tag |
| `paths.{path}.{method}` | Request in folder | Grouped by first tag |
| `operationId` | `request.name` | Fallback: summary → path |
| `parameters` | `url.query` / `header` | Based on `in` field |
| `requestBody.content` | `body.raw` | JSON example generated |
| `securitySchemes.bearerAuth` | `auth.bearer` | Mapped to `{{accessToken}}` |

### Server → Environment Mapping

| OpenAPI Server | Environment | baseUrl |
|----------------|-------------|---------|
| `http://localhost:3000` | local.json | `http://localhost:3000` |
| Cloud Run staging | staging.json | `https://api-staging-{project}.run.app` |
| Cloud Run production | production.json | `https://api-{project}.run.app` |

---

## Validation Rules

### Input Validation

| Rule | Error Message |
|------|---------------|
| Spec file must exist | "OpenAPI spec not found at {path}" |
| Spec must be valid YAML/JSON | "Failed to parse OpenAPI spec: {details}" |
| Spec must have `openapi` field | "Invalid OpenAPI spec: missing version field" |
| Spec must have `paths` | "Invalid OpenAPI spec: no paths defined" |

### Output Validation

| Rule | Verification |
|------|--------------|
| Collection importable | Postman import succeeds without errors |
| All endpoints present | Count matches OpenAPI paths |
| Variables resolved | `{{baseUrl}}` works with environment |

---

## State Transitions

Not applicable - this is a stateless transformation tool. Each execution reads input and produces fresh output.
