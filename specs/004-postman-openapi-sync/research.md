# Research: Postman Collection Generator from OpenAPI

**Feature**: 004-postman-openapi-sync
**Date**: 2026-01-11

## Decision Summary

| Topic | Decision | Rationale |
|-------|----------|-----------|
| OpenAPI Generation | NestJS Swagger with offline script | Build-time generation without server; uses `createApplicationContext()` |
| Conversion Library | openapi-to-postmanv2 | Official Postman library, actively maintained, OpenAPI 3.1 support, simpler than Portman for basic conversion |
| Folder Strategy | Tags-based | Matches API structure, cleaner organization than path-based |
| Environment Handling | Manual file generation | More control over variable naming, avoids conversion library limitations |
| Script Location | `tools/scripts/generate-postman.ts` | Follows existing pattern (`setup-project.ts`), consistent with Nx monorepo conventions |
| Output Location | `apps/api/postman/` | Co-located with API source, git-tracked for team sharing |

---

## 0. OpenAPI Auto-Generation from NestJS (FR-001 to FR-004)

### Decision: Standalone script with `NestFactory.createApplicationContext()`

**Rationale**:
- **No server required**: `createApplicationContext()` creates a lightweight NestJS context without HTTP server
- **CI/CD friendly**: Runs in build pipelines without port binding
- **Works with existing decorators**: Uses standard `@nestjs/swagger` decorators
- **Community standard**: NestJS team declined native CLI commands (Issue #597), recommending custom scripts

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Runtime generation (start server) | Requires running server; not suitable for build-time |
| Nestia (@nestia/sdk) | Different framework; requires migration from @nestjs/swagger |
| nest-openapi-gen | Less mature; smaller community |

**Implementation Pattern**:
```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './app/app.module';

async function generateSpec() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('./openapi.json', JSON.stringify(document, null, 2));

  await app.close();
}
```

**Swagger UI for Development (FR-004)**:
```typescript
// In main.ts (development mode only)
if (process.env.NODE_ENV !== 'production') {
  SwaggerModule.setup('api-docs', app, document);
}
```

---

## 1. Conversion Library Selection

### Decision: openapi-to-postmanv2

**Rationale**:
- Official Postman package, maintained by Postman team
- Full OpenAPI 3.1 support (confirmed, matches our `api.openapi.yaml`)
- Programmatic API suitable for CLI scripts
- Simpler than Portman (no test generation needed per FR-008)

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Portman | Over-engineered - auto-generates tests, but spec says devs maintain tests separately |
| OpenAPI Generator | Less Postman-specific, community maintained vs official |
| Postman API Import | Requires API key, not offline-capable |

**Usage Pattern**:
```typescript
import Converter from 'openapi-to-postmanv2';
import { readFileSync, writeFileSync } from 'node:fs';

const spec = readFileSync('specs/001-nx-monorepo-template/contracts/api.openapi.yaml', 'utf8');

Converter.convert(
  { type: 'string', data: spec },
  {
    folderStrategy: 'Tags',
    requestNameSource: 'fallback',
    schemaFaker: true,
    parametersResolution: 'Example'
  },
  (err, result) => {
    if (result.result) {
      writeFileSync('postman/collection.json', JSON.stringify(result.output[0].data, null, 2));
    }
  }
);
```

---

## 2. Folder Organization Strategy

### Decision: Tags-based organization

**Rationale**:
- OpenAPI spec already uses tags to group endpoints
- Results in logical folders: `Users/`, `Products/`, `Health/`
- Matches how developers think about API areas
- Path-based creates awkward nesting: `/api/v1/users/{id}/GET`

**Configuration**:
```typescript
{ folderStrategy: 'Tags' }
```

---

## 3. Environment File Generation

### Decision: Manual generation (not from converter)

**Rationale**:
- `openapi-to-postmanv2` doesn't generate environment files
- We need precise control over variable names for consistency
- Server URLs already defined in OpenAPI spec `servers:` section
- Can derive URLs from existing Firebase config

**Environment Structure** (Postman v2.1 format):
```json
{
  "id": "uuid-here",
  "name": "Local Development",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:3000", "enabled": true },
    { "key": "accessToken", "value": "", "enabled": true }
  ]
}
```

**Environments to Generate**:
1. **Local** (`local.json`): `http://localhost:3000`
2. **Staging** (`staging.json`): `https://api-staging-{gcpProjectId}.run.app`
3. **Production** (`production.json`): `https://api-{gcpProjectId}.run.app`

---

## 4. Authentication Configuration

### Decision: Bearer token via environment variable

**Rationale**:
- Spec requires auth using environment variables (FR-005)
- Bearer token is standard for NestJS APIs
- Collection-level auth inherits to all requests

**Implementation**:
```json
{
  "auth": {
    "type": "bearer",
    "bearer": [{ "key": "token", "value": "{{accessToken}}" }]
  }
}
```

---

## 5. Variable Naming Conventions

### Decision: camelCase with standard names

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `{{baseUrl}}` | API base URL | `http://localhost:3000` |
| `{{accessToken}}` | JWT bearer token | `eyJhbG...` |
| `{{apiVersion}}` | API version prefix | `v1` |

---

## 6. OpenAPI Spec Generation Flow

### Decision: Auto-generate from NestJS Swagger decorators (FR-001)

**Flow**:
1. Decorate all controllers with `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`, etc.
2. Decorate DTOs with `@ApiProperty()` for request/response schemas
3. Script uses `SwaggerModule.createDocument()` to generate OpenAPI spec at build time
4. Generated spec is written to `apps/api/postman/openapi.json` (intermediate file)
5. `openapi-to-postmanv2` converts to Postman collection

**Rationale**:
- Single source of truth: decorators in code
- Auto-synced with API changes
- No manual spec maintenance
- Per spec clarification: "Auto-generate from NestJS Swagger decorators"

---

## 7. npm Script Integration

### Decision: Add `pnpm postman:generate` script

**Rationale**:
- Consistent with existing scripts (`pnpm dev`, `pnpm build`)
- Single-command execution (FR-006)
- Easy to remember

**package.json addition**:
```json
{
  "scripts": {
    "postman:generate": "npx tsx tools/scripts/generate-postman.ts"
  }
}
```

---

## 8. Dependencies to Add

| Package | Version | Purpose |
|---------|---------|---------|
| `openapi-to-postmanv2` | ^4.x | OpenAPI → Postman conversion |
| `js-yaml` | ^4.x | Parse YAML spec files |
| `uuid` | ^9.x | Generate Postman environment IDs |

**Note**: `tsx` already available (used by `setup-project.ts`)

---

## 9. Error Handling Strategy

### Decision: Fail fast with clear messages

**Rationale**:
- FR-007 requires clear error messages
- No partial output on failure
- Exit code 1 for CI/CD detection

**Error Cases**:
1. Spec file not found → "OpenAPI spec not found at {path}"
2. Invalid YAML/JSON → "Failed to parse OpenAPI spec: {error}"
3. Conversion failure → "Conversion failed: {reason}"
4. Write permission error → "Cannot write to {path}: {error}"

---

## 10. Request Body Examples

### Decision: Use schema faker (enabled by default)

**Rationale**:
- FR-009 requires example request bodies
- `schemaFaker: true` generates realistic examples from JSON Schema
- Reduces manual editing in Postman

**Configuration**:
```typescript
{ schemaFaker: true, parametersResolution: 'Example' }
```
