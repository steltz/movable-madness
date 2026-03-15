# Implementation Plan: Admin User Seeding & CASL-Based RBAC

**Branch**: `005-admin-rbac-casl` | **Date**: 2026-01-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-admin-rbac-casl/spec.md`

## Summary

Implement admin user seeding script and CASL-based role-based access control (RBAC) for the NestJS API with Firebase Auth custom claims. The seeding script creates an admin user in Firebase Auth and Firestore using ADC. The NestJS API verifies Firebase ID tokens and uses CASL to enforce permissions. The React web app provides a sign-in form that authenticates via Firebase and includes tokens in API requests.

## Technical Context

**Language/Version**: TypeScript 5.9.2, Node.js 18+ (pnpm 9.15.4)
**Primary Dependencies**: NestJS 11.x, Firebase Admin SDK 13.x, CASL (to install), React 19.x, Firebase Auth Client SDK (to install)
**Storage**: Firebase Auth (identity + custom claims), Firestore (user profile data at `/users/{uid}`)
**Testing**: Vitest 4.0 (unit tests for ability factory, guards)
**Target Platform**: Node.js server (NestJS API), Browser (React web app)
**Project Type**: Web application (Nx monorepo with apps/api, apps/web, apps/functions)
**Performance Goals**: N/A (auth operations are infrequent, standard latency acceptable)
**Constraints**: Script must use ADC (no service account JSON files), idempotent seeding
**Scale/Scope**: Single admin role initially, extensible to additional roles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Nx Monorepo Structure | ✅ PASS | Using existing `apps/api`, `apps/web`; new shared auth lib in `libs/` with explicit public API |
| II. High-Value Unit Testing | ✅ PASS | Unit tests for CASL ability factory and business logic; no E2E tests |
| III. NestJS Framework Conventions | ✅ PASS | Using decorators, guards, DI; Controllers for HTTP, Services for logic |
| III. Vite/React Feature Slice Design | ✅ PASS | Auth feature in `features/auth/` with ui/, model/, api/ subfolders |
| III. Firestore Conventions | ✅ PASS | `/users/{uid}` collection; security rules mirror backend validation |
| IV. Simplicity & Pragmatism | ✅ PASS | Single role initially; no premature abstractions |
| Technology Standards | ✅ PASS | TypeScript 5.x strict, Node 18+, pnpm 9+, Nx 22.x, Biome, Vitest |
| Dependencies | ✅ PASS | @casl/ability (6.7.5) is lightweight; firebase client SDK already used in similar projects |

## Project Structure

### Documentation (this feature)

```text
specs/005-admin-rbac-casl/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Seeding Script
tools/scripts/
└── seed-admin.ts              # Admin seeding script (pnpm run seed:admin)

# Shared Auth Library (new)
libs/auth/
├── src/
│   ├── lib/
│   │   ├── casl/
│   │   │   ├── ability.factory.ts      # CASL ability factory
│   │   │   ├── ability.factory.spec.ts # Unit tests
│   │   │   └── actions.ts              # Action definitions
│   │   ├── types/
│   │   │   ├── user.ts                 # User type with role
│   │   │   └── roles.ts                # Role enum/types
│   │   └── index.ts                    # Barrel export
│   └── index.ts                        # Public API
├── project.json
└── tsconfig.json

# NestJS API (existing, additions)
apps/api/src/
├── auth/
│   ├── auth.module.ts                  # Auth module
│   ├── auth.guard.ts                   # Firebase token verification guard
│   ├── auth.guard.spec.ts              # Guard tests
│   ├── casl-ability.guard.ts           # CASL permission guard
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   │   └── check-policies.decorator.ts # @CheckPolicies() decorator
│   └── firebase-admin.service.ts       # Firebase Admin SDK service
└── app/
    └── app.module.ts                   # Updated to import AuthModule

# React Web App (existing, additions per Feature Slice Design)
apps/web/src/
├── app/
│   ├── app.tsx                         # Updated with auth provider
│   └── providers/
│       └── auth-provider.tsx           # Firebase auth context provider
├── features/
│   └── auth/
│       ├── ui/
│       │   ├── sign-in-form.tsx        # Sign-in form component
│       │   └── sign-in-form.spec.tsx   # Component tests
│       ├── model/
│       │   └── use-auth.ts             # Auth hook (sign-in, sign-out, user state)
│       ├── api/
│       │   └── firebase-auth.ts        # Firebase client SDK wrapper
│       └── index.ts                    # Feature public API
├── pages/
│   └── sign-in/
│       └── sign-in-page.tsx            # Sign-in page (composes auth feature)
└── shared/
    └── api/
        └── api-client.ts               # HTTP client with auth header injection

# Firestore Security Rules (new)
firestore.rules                          # Security rules for /users collection
```

**Structure Decision**: Using Nx monorepo web application structure with new `libs/auth` shared library for CASL types and ability factory. NestJS API gets new auth module with guards and decorators. React web app follows Feature Slice Design with auth feature.

## Complexity Tracking

> No constitution violations detected. All principles pass.

## Post-Design Constitution Re-check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Nx Monorepo Structure | ✅ PASS | New `libs/auth` follows convention with barrel exports |
| II. High-Value Unit Testing | ✅ PASS | Tests planned for ability.factory.ts and auth.guard.ts |
| III. NestJS Conventions | ✅ PASS | AuthModule follows standard module/guard/decorator patterns |
| III. Feature Slice Design | ✅ PASS | Auth feature properly structured with ui/model/api folders |
| III. Firestore Conventions | ✅ PASS | Security rules defined; typed converters planned |
| IV. Simplicity | ✅ PASS | No over-engineering; direct CASL usage without wrappers |
| Technology Standards | ✅ PASS | All packages are current versions |
| Dependencies | ✅ PASS | Verified: @casl/ability is 34KB gzipped; firebase is tree-shakeable |

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Plan | `specs/005-admin-rbac-casl/plan.md` | This implementation plan |
| Research | `specs/005-admin-rbac-casl/research.md` | Technology decisions and patterns |
| Data Model | `specs/005-admin-rbac-casl/data-model.md` | Entity definitions and relationships |
| API Contract | `specs/005-admin-rbac-casl/contracts/auth-api.openapi.yaml` | OpenAPI 3.0 specification |
| Quickstart | `specs/005-admin-rbac-casl/quickstart.md` | Developer getting started guide |

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
