# Tasks: Port Reusable Features from foster-bridge

**Input**: Design documents from `/specs/006-port-foster-bridge/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Not explicitly requested - test tasks are NOT included

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Nx monorepo**: `apps/web/src/`, `apps/api/src/`, `libs/logging/src/`
- **GitHub Actions**: `.github/workflows/`
- **Git hooks**: `.husky/`
- **Type declarations**: `types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared library scaffolding

- [X] T001 Create `libs/logging/` library structure with Nx generator or manually create project.json, package.json, tsconfig.json files
- [X] T002 [P] Create shared types in `libs/logging/src/lib/shared/types.ts` (LogEntry, LogSeverity, Breadcrumb, CorrelationContext, ErrorInfo, HttpRequestInfo)
- [X] T003 [P] Create barrel exports in `libs/logging/src/lib/shared/index.ts`
- [X] T004 [P] Create `types/env.d.ts` for NodeJS.ProcessEnv augmentation (LOG_LEVEL, LOG_FORMAT, NODE_ENV, GCP_PROJECT_ID)
- [X] T005 [P] Install react-router-dom dependency: `pnpm add react-router-dom`
- [X] T006 Create main barrel export in `libs/logging/src/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Implement shared correlation ID generator in `libs/logging/src/lib/shared/correlation.ts` (generateCorrelationId, isValidCorrelationId)
- [X] T008 [P] Implement shared redaction utility in `libs/logging/src/lib/shared/redaction.ts` (redact function with configurable patterns)
- [X] T009 [P] Implement shared formatters in `libs/logging/src/lib/shared/formatters.ts` (formatAsJson, formatAsPretty)
- [X] T010 Update shared barrel export in `libs/logging/src/lib/shared/index.ts` to include correlation, redaction, formatters
- [X] T011 Configure workspace alias `@workspace/logging` in root tsconfig.base.json if not present
- [X] T012 Setup React Router in `apps/web/src/app/app.tsx` - wrap app with BrowserRouter and configure routes

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Error Boundary Protection (Priority: P1) 🎯 MVP

**Goal**: Gracefully handle React rendering errors with a user-friendly fallback UI

**Independent Test**: Intentionally throw an error in a React component and verify fallback UI displays with "Something went wrong" message, reload button, and home button

### Implementation for User Story 1

- [X] T013 [US1] Create AppErrorBoundary class component in `apps/web/src/app/app-error-boundary.tsx` with componentDidCatch, getDerivedStateFromError, fallback UI with inline CSS
- [X] T014 [US1] Update `apps/web/src/app/app.tsx` to wrap entire app with AppErrorBoundary component
- [X] T015 [US1] Modify `apps/web/src/app/providers/auth-provider.tsx` to default users without role claims to 'viewer' role (not 'admin')

**Checkpoint**: Error boundary catches rendering errors, displays fallback UI, and users without role default to 'viewer'

---

## Phase 4: User Story 2 - Admin Authentication Flow (Priority: P1)

**Goal**: Automatic redirect to admin dashboard after login, secure sign out functionality

**Independent Test**: Sign in with admin credentials, verify redirect to /admin, click Sign Out, verify redirect to sign-in page

### Implementation for User Story 2

- [X] T016 [P] [US2] Create AdminHomePage component in `apps/web/src/pages/admin/home/admin-home-page.tsx` (admin landing page)
- [X] T017 [P] [US2] Create AccountSettingsPage component in `apps/web/src/pages/admin/settings/account-settings-page.tsx` with user email, role display, and Sign Out button (inline CSS)
- [X] T018 [US2] Modify `apps/web/src/pages/sign-in/sign-in-page.tsx` to redirect authenticated admin users to /admin using Navigate component
- [X] T019 [US2] Modify `apps/web/src/features/auth/ui/sign-in-form.tsx` to navigate to '/admin' with `replace: true` after successful authentication
- [X] T020 [US2] Update `apps/web/src/app/app.tsx` routes to include /admin, /admin/settings, and protected route logic

**Checkpoint**: Admin users redirected after login, can access account settings, sign out works correctly

---

## Phase 5: User Story 3 - Firestore CI/CD Deployment (Priority: P2)

**Goal**: Automated Firestore rules/indexes deployment on push to main

**Independent Test**: Modify firestore.rules or firestore.indexes.json, push to main, verify GitHub Actions workflow deploys changes

### Implementation for User Story 3

- [X] T021 [US3] Create `.github/workflows/deploy-firestore.yml` with:
  - Trigger on push to main with path filters (firestore.rules, firestore.indexes.json)
  - Trigger on pull_request with same path filters
  - workflow_dispatch with deploy_rules and deploy_indexes boolean inputs
  - Concurrency group with cancel-in-progress for PR events
- [X] T022 [US3] Add JSON validation step for firestore.indexes.json using Node.js JSON.parse
- [X] T023 [US3] Configure Workload Identity Federation authentication (GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_SERVICE_ACCOUNT secrets)
- [X] T024 [US3] Add change detection logic to only deploy modified components
- [X] T025 [US3] Add deployment summary output to GITHUB_STEP_SUMMARY

**Checkpoint**: Firestore deployment workflow runs on rules/indexes changes, validates JSON, deploys only changed components

---

## Phase 6: User Story 4 - Structured Logging Infrastructure (Priority: P2)

**Goal**: Request correlation, structured logging with GCP compatibility, frontend error reporting

**Independent Test**: Make API request, verify logs contain correlation ID, verify JSON format in production mode

### Backend Logging Implementation

- [X] T026 [P] [US4] Create StructuredLogger service in `libs/logging/src/lib/backend/nest-logger.service.ts` implementing NestJS LoggerService with log, error, warn, debug, verbose methods
- [X] T027 [P] [US4] Create CorrelationMiddleware in `libs/logging/src/lib/backend/correlation.middleware.ts` using AsyncLocalStorage for request-scoped correlation context
- [X] T028 [P] [US4] Create RequestLoggingInterceptor in `libs/logging/src/lib/backend/request-logging.interceptor.ts` for HTTP request/response logging with timing
- [X] T029 [US4] Create backend barrel export in `libs/logging/src/lib/backend/index.ts`
- [X] T030 [US4] Create LoggingModule in `apps/api/src/logging/logging.module.ts` with forRoot() static method accepting LoggingModuleOptions
- [X] T031 [P] [US4] Create FrontendErrorReportDto in `apps/api/src/logging/dto/frontend-error-report.dto.ts` with class-validator decorators
- [X] T032 [US4] Create LoggingController in `apps/api/src/logging/logging.controller.ts` with POST /api/v1/logs/errors endpoint
- [X] T033 [US4] Modify `apps/api/src/main.ts` to initialize StructuredLogger as app logger

### Frontend Logging Implementation

- [X] T034 [P] [US4] Create BreadcrumbBuffer in `libs/logging/src/lib/frontend/breadcrumb.ts` (circular buffer with configurable max, breadcrumb helpers)
- [X] T035 [P] [US4] Create frontend correlation helper in `libs/logging/src/lib/frontend/correlation.ts` (getCorrelationId, setCorrelationId)
- [X] T036 [US4] Create frontend logger in `libs/logging/src/lib/frontend/logger.ts` (debug, info, warn, error, errorWithException methods, initLogger function, localStorage LOG_LEVEL support, auto-report to endpoint)
- [X] T037 [US4] Create frontend barrel export in `libs/logging/src/lib/frontend/index.ts`
- [X] T038 [US4] Create root lib barrel export in `libs/logging/src/lib/index.ts` combining backend, frontend, shared exports
- [X] T039 [US4] Initialize frontend logger in `apps/web/src/main.tsx` with initLogger({ service: 'web', errorReportingEndpoint: '/api/v1/logs/errors' })
- [X] T040 [US4] Integrate AppErrorBoundary with frontend logger - log caught errors using errorWithException

**Checkpoint**: Backend logs with correlation IDs, frontend logs with breadcrumbs, errors auto-report to backend

---

## Phase 7: User Story 5 - Pre-commit Hook Setup (Priority: P3)

**Goal**: Automatic code checking and fixing before commits

**Independent Test**: Stage files with linting issues, attempt commit, verify Biome runs and auto-fixes or blocks

### Implementation for User Story 5

- [X] T041 [US5] Create or modify `.husky/pre-commit` script with:
  - `biome check --staged --write --no-errors-on-unmatched` (auto-fix)
  - `git update-index --again` (re-stage fixed files)
  - `biome check --staged --no-errors-on-unmatched` (verify clean)
  - `npx nx affected -t lint test build --base=HEAD --parallel=3` (affected projects)
- [X] T042 [US5] Ensure husky is installed and initialized: `pnpm prepare` or `husky install`

**Checkpoint**: Pre-commit hook auto-fixes linting issues, re-stages files, runs affected project checks

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, validation, and cleanup

- [X] T043 [P] Verify all barrel exports are correct in `libs/logging/src/index.ts`
- [X] T044 [P] Verify workspace alias `@workspace/logging/backend` and `@workspace/logging/frontend` work correctly
- [X] T045 Run quickstart.md validation checklist for all features
- [X] T046 Verify Biome passes on all new files: `pnpm biome check libs/logging apps/web apps/api`
- [X] T047 Run full build to ensure no TypeScript errors: `pnpm nx run-many -t build -p web api logging`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T006) - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1): Can proceed in parallel after Foundational
  - US3 (P2) and US4 (P2): Can proceed in parallel after Foundational
  - US5 (P3): Can proceed after Foundational, independent of other stories
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Error Boundary)**: No dependencies on other stories
- **User Story 2 (Admin Auth)**: No dependencies on other stories (but should come after routing setup in Foundational)
- **User Story 3 (Firestore CI/CD)**: No dependencies on other stories (completely independent)
- **User Story 4 (Logging)**: No strict dependencies, but integrates with Error Boundary (T040)
- **User Story 5 (Pre-commit)**: No dependencies on other stories (completely independent)

### Within Each User Story

- Backend components before frontend integration (US4)
- Services before controllers (US4)
- Library code before app code (US4)
- Core implementation before integration

### Parallel Opportunities

**Phase 1 - Setup:**
- T002, T003, T004, T005 can run in parallel

**Phase 2 - Foundational:**
- T008, T009 can run in parallel

**Phase 3 - User Story 1:**
- No parallel tasks (linear dependency)

**Phase 4 - User Story 2:**
- T016, T017 can run in parallel

**Phase 5 - User Story 3:**
- Tasks are sequential (workflow file development)

**Phase 6 - User Story 4:**
- T026, T027, T028 can run in parallel (backend services)
- T034, T035 can run in parallel (frontend utilities)

**Phase 7 - User Story 5:**
- Tasks are sequential

**Phase 8 - Polish:**
- T043, T044 can run in parallel

---

## Parallel Example: User Story 4 (Logging)

```bash
# Launch backend logging services in parallel:
Task: "Create StructuredLogger service in libs/logging/src/lib/backend/nest-logger.service.ts"
Task: "Create CorrelationMiddleware in libs/logging/src/lib/backend/correlation.middleware.ts"
Task: "Create RequestLoggingInterceptor in libs/logging/src/lib/backend/request-logging.interceptor.ts"

# Launch frontend logging utilities in parallel:
Task: "Create BreadcrumbBuffer in libs/logging/src/lib/frontend/breadcrumb.ts"
Task: "Create frontend correlation helper in libs/logging/src/lib/frontend/correlation.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Error Boundary)
4. Complete Phase 4: User Story 2 (Admin Auth)
5. **STOP and VALIDATE**: Test error boundary and auth flow independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + 2 (both P1) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 + 4 (both P2) → Test independently → Deploy/Demo
4. Add User Story 5 (P3) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + 2 (frontend auth focus)
   - Developer B: User Story 4 (logging infrastructure)
   - Developer C: User Story 3 + 5 (CI/CD and hooks)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All UI components use inline CSS (no MUI or external UI libraries)
- React Router is required for auth flow - install in Setup phase
