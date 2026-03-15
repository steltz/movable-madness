<!--
SYNC IMPACT REPORT
==================
Version: 1.1.0 → 1.2.0 (MINOR: Added Feature Slice Design to Vite/React conventions)

Modified Principles:
- III. Framework Conventions: Expanded Vite/React with Feature Slice Design architecture

Added Sections: None
Removed Sections: None

Templates Status:
- .specify/templates/plan-template.md: ✅ Compatible (no updates needed)
- .specify/templates/spec-template.md: ✅ Compatible (no updates needed)
- .specify/templates/tasks-template.md: ✅ Compatible (no updates needed)
- .specify/templates/commands/: ⚠️ No command files present

Follow-up TODOs: None
-->

# Scaffold Repo Constitution

## Core Principles

### I. Nx Monorepo Structure

All code MUST be organized within the Nx workspace structure:
- `apps/` for deployable applications (web, api, functions)
- `libs/` for shared libraries with clear boundaries
- Each library MUST have a single responsibility and explicit public API via `index.ts`
- Cross-library imports MUST use Nx path aliases (`@org/lib-name`), never relative paths
- Library boundaries MUST be enforced via `nx.json` module boundary rules

**Rationale**: Explicit boundaries enable independent builds, clear dependency graphs, and prevent circular dependencies.

### II. High-Value Unit Testing

Testing strategy prioritizes ROI over coverage metrics:
- Unit tests MUST cover: business logic, utility functions, data transformations
- Unit tests SHOULD NOT cover: simple getters/setters, framework boilerplate, trivial mappings
- Integration tests are OPTIONAL and limited to critical cross-boundary contracts
- E2E tests are EXCLUDED from this project's scope
- Test files MUST be co-located with source (`*.spec.ts` adjacent to source)
- Use Vitest for all testing

**Rationale**: High-value tests catch real bugs without slowing development. Coverage for coverage's sake wastes effort.

### III. Framework Conventions

**NestJS (Backend)**:
- Use decorators and DI as designed; avoid fighting the framework
- Controllers handle HTTP; Services contain business logic
- Keep modules focused; split when exceeding ~5-7 providers
- Use class-validator for DTOs; return typed responses

**Vite/React (Frontend - Feature Slice Design)**:

Layer Structure (strict import rules - upper layers import from lower only):
1. `app/` - App-wide config, providers, global styles, router setup
2. `pages/` - Route components; compose features and widgets
3. `widgets/` - Composite UI blocks (e.g., Header, Sidebar); combine features
4. `features/` - User interactions with business value (e.g., AddToCart, LoginForm)
5. `entities/` - Business domain objects (e.g., User, Product, Order)
6. `shared/` - Reusable utilities, UI kit, types, API clients

Slice Rules:
- Each slice MUST be self-contained with its own ui/, model/, api/ subfolders as needed
- Cross-slice imports within same layer are FORBIDDEN (use composition at higher layer)
- Public API via `index.ts` barrel export; internal files are private
- Lazy-load at page level; features load with their parent page

Component Conventions:
- Prefer function components with hooks
- Co-locate component, styles, and tests within slice
- Use React Query for server state; local state for UI-only concerns

**Firebase Functions (Serverless)**:
- Use 2nd Gen functions exclusively (`onRequest`, `onCall`, `onDocumentWritten`, etc.)
- One function per file in `apps/functions/src/`; export via barrel `index.ts`
- Keep functions stateless; use Firestore/external services for persistence
- Set explicit memory/timeout limits per function based on workload
- Use `defineSecret` for sensitive config; avoid hardcoded values
- Prefer `onCall` for authenticated client calls; `onRequest` for webhooks/public APIs
- Batch Firestore writes when possible; respect 500 writes/transaction limit

**Firestore (Database)**:
- Design collections for query patterns, not relational normalization
- Use subcollections for 1:many relationships with bounded growth
- Denormalize read-heavy data; accept write complexity tradeoff
- Security rules MUST mirror backend validation; never trust client-only validation
- Use typed converters for all document read/writes

**Rationale**: Following framework idioms reduces friction and makes code predictable to any developer familiar with the stack.

### IV. Simplicity & Pragmatism

- Start with the simplest solution that works; refactor when complexity is justified by real need
- Avoid premature abstractions, wrapper layers, and patterns without proven benefit
- Delete code rather than comment it out (git preserves history)
- Maximum 3 levels of nesting in any logic block

**Rationale**: Simple code is easier to understand, test, and maintain. YAGNI applies aggressively.

## Technology Standards

**Stack Requirements**:
- TypeScript 5.x with strict mode enabled
- Node.js 18+ with pnpm 9+
- Nx 19+ for workspace orchestration
- Biome for linting/formatting (replaces ESLint/Prettier)
- Vitest for unit testing
- Firebase Functions 2nd Gen for serverless workloads
- Firestore for document storage (when applicable)

**Formatting**:
- Run `pnpm format` before commits
- Biome configuration in `biome.json` is authoritative
- No overrides via inline comments unless documented in PR

**Dependencies**:
- Minimize external dependencies; prefer built-in Node/framework capabilities
- Pin major versions; use caret ranges for patch updates
- Shared dependencies MUST be in workspace root; app-specific in app's package.json

## Development Workflow

**Git Practices**:
- Semantic commits (feat:, fix:, chore:, docs:, refactor:, test:)
- One logical change per commit
- PR branches: `###-feature-name` format

**Code Review Gates**:
- All tests pass (`pnpm test`)
- Linting clean (`pnpm lint`)
- Nx affected graph validates module boundaries
- No TODO comments without linked issue

**Build Verification**:
- `nx affected:test` for changed libraries
- `nx affected:build` for deployable apps
- CI MUST complete before merge

## Governance

This constitution defines non-negotiable standards for the project. All pull requests and code reviews MUST verify compliance.

**Amendment Process**:
1. Propose change via PR to this file
2. Document rationale and migration impact
3. Update dependent templates if principles change
4. Version bump according to semantic rules (MAJOR/MINOR/PATCH)

**Compliance**:
- Constitution violations block PR approval
- Justified exceptions MUST be documented in Complexity Tracking (plan.md)
- Quarterly review recommended to prune outdated constraints

**Version**: 1.2.0 | **Ratified**: 2026-01-10 | **Last Amended**: 2026-01-10
