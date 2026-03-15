# Implementation Plan: Nx Monorepo GitHub Template Repository

**Branch**: `001-nx-monorepo-template` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-nx-monorepo-template/spec.md`

## Summary

Create a production-ready Nx monorepo GitHub template with React/Vite frontend, NestJS backend (Cloud Run-ready), and Firebase Functions (2nd Gen). The template uses pnpm, Biome for linting/formatting (no ESLint/Prettier), shared TypeScript types across all apps, and includes an interactive setup script for project customization.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+
**Primary Dependencies**: Nx 19.x, React 18.x, Vite 5.x, NestJS 10.x, Firebase Functions 2nd Gen, Biome 1.x
**Storage**: N/A (template does not include database configuration)
**Testing**: Vitest (frontend), Jest (backend/functions), Nx test runner orchestration
**Target Platform**: Web (frontend), Cloud Run (backend), Firebase Functions (serverless)
**Project Type**: Monorepo (Nx workspace with multiple apps and libs)
**Performance Goals**:
- Local dev startup < 30 seconds
- CI pipeline < 5 minutes
- Setup script completion < 5 minutes
**Constraints**:
- pnpm only (no npm/yarn)
- Biome only (no ESLint/Prettier)
- No IDE-specific configs
- Docker build must work from repo root context
**Scale/Scope**: Template for small-to-medium projects; 3 apps, 1 shared library

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> Note: Project constitution contains only template placeholders. Proceeding with industry best practices for Nx monorepo templates.

**Implicit Principles Applied**:
- [x] Simple over complex: Minimal viable configuration, no unnecessary abstractions
- [x] Type safety: Shared types library ensures consistency across apps
- [x] Single command DX: `pnpm dev` runs full stack
- [x] CI/CD ready: GitHub Actions workflow included
- [x] Cloud-native: Docker + Cloud Run + Firebase ready

**No violations detected** - proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-nx-monorepo-template/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Nx Monorepo Structure
/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── assets/
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts      # Includes /api proxy config
│   │   ├── tsconfig.json
│   │   └── project.json
│   │
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.controller.ts
│   │   │   │   ├── app.module.ts
│   │   │   │   └── app.service.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile          # Cloud Run optimized
│   │   ├── tsconfig.json
│   │   └── project.json
│   │
│   └── functions/              # Firebase Functions (2nd Gen)
│       ├── src/
│       │   └── main.ts         # Exports Firebase triggers
│       ├── package.json        # Template for dist output
│       ├── tsconfig.json
│       └── project.json
│
├── libs/
│   └── shared-types/           # Shared TypeScript interfaces
│       ├── src/
│       │   ├── index.ts
│       │   └── lib/
│       │       └── api-response.ts
│       ├── tsconfig.json
│       └── project.json
│
├── tools/
│   └── scripts/
│       └── setup-project.ts    # Interactive setup script
│
├── .github/
│   └── workflows/
│       └── ci.yml              # CI pipeline
│
├── biome.json                  # Workspace linting/formatting
├── firebase.json               # Firebase Hosting + rewrites
├── nx.json                     # Nx workspace config
├── package.json                # Root package with "dev" script
├── pnpm-workspace.yaml         # pnpm workspace config
├── tsconfig.base.json          # Base TypeScript config
├── README.md                   # Template README (replaced by setup)
└── README.template.md          # Clean project README template
```

**Structure Decision**: Nx monorepo with `apps/` for deployable units and `libs/` for shared code. This matches Nx conventions and supports independent builds, testing, and deployment per application.

## Complexity Tracking

> No constitution violations to justify. Structure follows Nx best practices.

| Component | Justification |
|-----------|---------------|
| 3 apps | Required: frontend (web), backend (api), serverless (functions) serve different deployment targets |
| 1 shared lib | Required: Type safety across apps per spec FR-005 through FR-007 |
| Setup script | Required: Template customization per spec FR-022 through FR-026 |

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completion.*

**Design Artifacts Produced**:
- [x] `research.md` - Technology decisions documented with rationale
- [x] `data-model.md` - Shared types defined (ApiResponse, ApiError, HealthCheckResponse)
- [x] `contracts/api.openapi.yaml` - OpenAPI 3.1 specification for backend API
- [x] `quickstart.md` - Developer onboarding guide

**Principle Compliance Post-Design**:

| Principle | Status | Evidence |
|-----------|--------|----------|
| Simple over complex | PASS | Minimal config, single biome.json, standard Nx structure |
| Type safety | PASS | Shared types lib with ApiResponse, imported by all apps |
| Single command DX | PASS | `pnpm dev` runs web + api in parallel |
| CI/CD ready | PASS | GitHub Actions workflow with Biome + build |
| Cloud-native | PASS | Docker multi-stage build, Firebase config, Cloud Run IAM |

**No New Violations** - Design phase completed successfully.

---

## Phase 1 Artifacts Summary

| Artifact | Path | Description |
|----------|------|-------------|
| Research | `specs/001-nx-monorepo-template/research.md` | Technology decisions and version recommendations |
| Data Model | `specs/001-nx-monorepo-template/data-model.md` | TypeScript interfaces for API contracts |
| API Contract | `specs/001-nx-monorepo-template/contracts/api.openapi.yaml` | OpenAPI 3.1 specification |
| Quickstart | `specs/001-nx-monorepo-template/quickstart.md` | Developer guide for template usage |

---

## Next Steps

Run `/speckit.tasks` to generate the implementation task list based on this plan.
