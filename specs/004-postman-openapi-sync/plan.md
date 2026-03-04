# Implementation Plan: Postman Collection Generator from OpenAPI

**Branch**: `004-postman-openapi-sync` | **Date**: 2026-01-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-postman-openapi-sync/spec.md`

## Summary

Generate Postman collections and environment files from NestJS Swagger/OpenAPI specifications with a single command. The solution uses `@nestjs/swagger` to auto-generate OpenAPI specs at build time, then converts them to Postman v2.1 format using `openapi-to-postmanv2`.

## Technical Context

**Language/Version**: TypeScript 5.9.2, Node.js 18+ (pnpm 9.15.4)
**Primary Dependencies**: @nestjs/swagger (OpenAPI generation), openapi-to-postmanv2 (OpenAPI→Postman conversion), js-yaml (YAML parsing)
**Storage**: N/A (file-based output only - generates JSON files to `apps/api/postman/`)
**Testing**: Vitest 4.0
**Target Platform**: Nx monorepo workspace (existing apps/api NestJS application)
**Project Type**: Nx monorepo - adds tooling to existing `apps/api`
**Performance Goals**: Collection generation completes in <30 seconds (per SC-001)
**Constraints**: Must work offline (no server required for spec generation); must preserve API folder structure by tags
**Scale/Scope**: Single API application with ~10-50 endpoints expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Nx Monorepo Structure | ✅ PASS | Feature adds to existing `apps/api`; generation scripts go in `tools/scripts/` |
| II. High-Value Unit Testing | ✅ PASS | Test coverage for conversion logic; no E2E tests required |
| III. Framework Conventions - NestJS | ✅ PASS | Uses @nestjs/swagger decorators as designed; Swagger UI at `/api-docs` |
| IV. Simplicity & Pragmatism | ✅ PASS | Single command approach; uses proven npm packages; no over-engineering |
| Technology Standards | ✅ PASS | TypeScript 5.x, Node 18+, pnpm, Vitest, Biome |
| Development Workflow | ✅ PASS | Semantic commits; npm scripts for generation |

**Gate Result**: PASS - All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/004-postman-openapi-sync/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/api/
├── src/
│   ├── main.ts                    # Modified: Add Swagger setup
│   └── app/
│       └── *.controller.ts        # Modified: Add Swagger decorators
├── postman/                       # NEW: Generated Postman files
│   ├── collection.json            # Generated Postman collection
│   └── environments/              # Generated environment files
│       ├── local.json
│       ├── staging.json
│       └── production.json
└── project.json                   # Modified: Add generate:postman target

tools/scripts/
└── generate-postman.ts            # NEW: Generation script

libs/shared-types/
└── src/
    └── api-config.ts              # NEW: Environment configuration types
```

**Structure Decision**: Feature integrates into existing Nx monorepo structure. Generation script lives in `tools/scripts/` (standard Nx location for workspace scripts). Output files go in `apps/api/postman/` for co-location with the API source.

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Nx Monorepo Structure | ✅ PASS | Script in `tools/scripts/`, output in `apps/api/postman/`, follows workspace conventions |
| II. High-Value Unit Testing | ✅ PASS | Unit tests for OpenAPI→Postman transformation; tests co-located in `tools/scripts/*.spec.ts` |
| III. Framework Conventions - NestJS | ✅ PASS | Uses `@nestjs/swagger` decorators idiomatically; SwaggerModule.setup() for dev UI |
| IV. Simplicity & Pragmatism | ✅ PASS | Single script, two npm packages, no abstractions; full overwrite strategy per FR-012 |
| Technology Standards | ✅ PASS | TypeScript 5.9.2, pnpm 9.15.4, Vitest, Biome compliant |
| Development Workflow | ✅ PASS | `pnpm postman:generate` script; no breaking changes to existing workflow |
| Dependencies | ✅ PASS | Only 2 new dev deps (openapi-to-postmanv2, js-yaml); @nestjs/swagger is peer of existing NestJS |

**Gate Result**: PASS - Design satisfies all constitution principles.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |
