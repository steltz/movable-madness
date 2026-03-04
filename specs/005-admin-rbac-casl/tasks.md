# Tasks: Admin User Seeding & CASL-Based RBAC

**Input**: Design documents from `/specs/005-admin-rbac-casl/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests for CASL ability factory and auth guard as specified in constitution (High-Value Unit Testing principle).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Nx Monorepo**: `apps/api/src/`, `apps/web/src/`, `libs/auth/src/`, `tools/scripts/`
- **Tests**: Co-located with source (`*.spec.ts` adjacent to source)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and shared library setup

- [X] T001 Install @casl/ability dependency in workspace root via `pnpm add @casl/ability`
- [X] T002 Install firebase client SDK in apps/web via `pnpm add firebase --filter web`
- [X] T003 [P] Generate libs/auth library using `nx g @nx/js:library auth --directory=libs/auth --bundler=tsc`
- [X] T004 [P] Configure libs/auth/tsconfig.json with strict mode and proper paths
- [X] T005 Update tsconfig.base.json to add @workspace/auth path alias for libs/auth

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, CASL infrastructure, and Firebase Admin service that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Create Role types in libs/auth/src/lib/types/roles.ts with Roles constant and Role type
- [X] T007 [P] Create AuthUser interface in libs/auth/src/lib/types/user.ts with uid, email, role fields
- [X] T008 [P] Create Action types in libs/auth/src/lib/casl/actions.ts with READ, CREATE, UPDATE, DELETE, MANAGE
- [X] T009 Create Subjects type and AppAbility type in libs/auth/src/lib/casl/types.ts
- [X] T010 Create CaslAbilityFactory in libs/auth/src/lib/casl/ability.factory.ts using createMongoAbility
- [X] T011 Create ability.factory.spec.ts unit tests in libs/auth/src/lib/casl/ability.factory.spec.ts
- [X] T012 [P] Create barrel export in libs/auth/src/lib/index.ts exporting all types and factory
- [X] T013 Create public API barrel in libs/auth/src/index.ts
- [X] T014 Create FirebaseAdminService in apps/api/src/auth/firebase-admin.service.ts with verifyIdToken method
- [X] T015 Create AuthModule in apps/api/src/auth/auth.module.ts exporting FirebaseAdminService

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Admin User Seeding (Priority: P1) MVP

**Goal**: Developer can run `pnpm run seed:admin` to create admin user in Firebase Auth and Firestore

**Independent Test**: Run `pnpm run seed:admin` against Firebase project, verify user exists in Auth console with custom claim and in Firestore `/users/{uid}` collection

### Implementation for User Story 1

- [X] T016 [US1] Create seed-admin.ts script in tools/scripts/seed-admin.ts with ADC initialization
- [X] T017 [US1] Implement project ID display and user confirmation prompt in tools/scripts/seed-admin.ts
- [X] T018 [US1] Implement idempotent user creation (getUserByEmail check) in tools/scripts/seed-admin.ts
- [X] T019 [US1] Implement setCustomUserClaims for role: admin in tools/scripts/seed-admin.ts
- [X] T020 [US1] Implement Firestore user document creation at /users/{uid} in tools/scripts/seed-admin.ts
- [X] T021 [US1] Add seed:admin script to package.json scripts section
- [X] T022 [US1] Add clear success/failure logging with user details in tools/scripts/seed-admin.ts

**Checkpoint**: `pnpm run seed:admin` creates admin user with custom claims and Firestore document

---

## Phase 4: User Story 2 - Admin Signs Into Web App (Priority: P1)

**Goal**: Admin can sign in via web app form and receive ID token with role claim for API requests

**Independent Test**: Navigate to /sign-in, enter admin@admin.com / admin123, verify successful auth and role visible in context

### Implementation for User Story 2

- [X] T023 [P] [US2] Create Firebase config in apps/web/src/shared/config/firebase.ts with initializeApp
- [X] T024 [P] [US2] Create firebase-auth.ts wrapper in apps/web/src/features/auth/api/firebase-auth.ts with signIn, signOut, getToken
- [X] T025 [US2] Create useAuth hook in apps/web/src/features/auth/model/use-auth.ts with auth state and methods
- [X] T026 [US2] Create AuthProvider context in apps/web/src/app/providers/auth-provider.tsx using onAuthStateChanged
- [X] T027 [US2] Create SignInForm component in apps/web/src/features/auth/ui/sign-in-form.tsx with email/password fields
- [X] T028 [US2] Create auth feature barrel export in apps/web/src/features/auth/index.ts
- [X] T029 [US2] Create SignInPage in apps/web/src/pages/sign-in/sign-in-page.tsx composing SignInForm
- [X] T030 [US2] Update apps/web/src/app/app.tsx to wrap with AuthProvider
- [X] T031 [US2] Add routing for /sign-in page in apps/web/src/app/app.tsx or router config
- [X] T032 [P] [US2] Create api-client.ts in apps/web/src/shared/api/api-client.ts with auth header injection

**Checkpoint**: Admin can sign in at /sign-in and see authenticated state with role

---

## Phase 5: User Story 3 - RBAC Protects API Endpoints (Priority: P1)

**Goal**: API returns 401 for unauthenticated requests, 200 for admin requests, 403 for unauthorized role

**Independent Test**: curl requests without token get 401, with admin token get 200, verify via Swagger/Postman

### Tests for User Story 3

- [X] T033 [P] [US3] Create auth.guard.spec.ts unit tests in apps/api/src/auth/auth.guard.spec.ts

### Implementation for User Story 3

- [X] T034 [US3] Create AuthGuard in apps/api/src/auth/auth.guard.ts verifying Firebase ID tokens
- [X] T035 [US3] Create @CurrentUser() decorator in apps/api/src/auth/decorators/current-user.decorator.ts
- [X] T036 [US3] Create @CheckPolicies() decorator in apps/api/src/auth/decorators/check-policies.decorator.ts
- [X] T037 [US3] Create PoliciesGuard (CASL) in apps/api/src/auth/casl-ability.guard.ts using ability factory
- [X] T038 [US3] Create AuthController with GET /auth/me endpoint in apps/api/src/auth/auth.controller.ts
- [X] T039 [US3] Create UsersController with GET /users and GET /users/:uid in apps/api/src/users/users.controller.ts
- [X] T040 [US3] Create UsersModule in apps/api/src/users/users.module.ts
- [X] T041 [US3] Update AuthModule to export guards and provide CaslAbilityFactory in apps/api/src/auth/auth.module.ts
- [X] T042 [US3] Update AppModule to import AuthModule and UsersModule in apps/api/src/app/app.module.ts
- [X] T043 [US3] Add OpenAPI decorators (@ApiBearerAuth, @ApiResponse) to auth and users controllers

**Checkpoint**: Protected endpoints return correct 401/403/200 responses based on auth state

---

## Phase 6: User Story 4 - Extensible RBAC for Future Roles (Priority: P2)

**Goal**: New roles can be added by modifying only role definition and ability mapping (1-2 files)

**Independent Test**: Add a test role in roles.ts and ability.factory.ts, verify permissions work without guard changes

### Implementation for User Story 4

- [X] T044 [US4] Add inline documentation for extending roles in libs/auth/src/lib/types/roles.ts
- [X] T045 [US4] Add role extension example and documentation in libs/auth/src/lib/casl/ability.factory.ts
- [X] T046 [US4] Ensure ability factory has default deny for unrecognized roles in libs/auth/src/lib/casl/ability.factory.ts
- [X] T047 [US4] Update quickstart.md with "Adding New Roles" section verification in specs/005-admin-rbac-casl/quickstart.md

**Checkpoint**: Documentation and code structure allow adding new roles in 1-2 files

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Security rules, final validation, and cleanup

- [X] T048 [P] Create firestore.rules with /users collection security rules at repository root
- [X] T049 [P] Update apps/api OpenAPI spec to include new auth endpoints in apps/api/src/main.ts
- [X] T050 Verify lint passes with `pnpm run lint`
- [X] T051 Verify build passes with `pnpm run build`
- [X] T052 Run quickstart.md validation end-to-end (seed, sign-in, API calls)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Seeding): Can start immediately after Foundational
  - US2 (Web Auth): Can start immediately after Foundational (parallel with US1)
  - US3 (RBAC API): Depends on Foundational and benefits from US1 for testing
  - US4 (Extensibility): Can start after US3 (extends CASL implementation)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - only needs Foundational phase
- **User Story 2 (P1)**: Independent - only needs Foundational phase
- **User Story 3 (P1)**: Benefits from US1 (seeded user for testing) but can be developed in parallel
- **User Story 4 (P2)**: Extends US3 implementation, should complete after US3

### Within Each User Story

- Models/types before services
- Services before guards/controllers
- Guards before controllers
- Controllers before integration testing
- Commit after each task or logical group

### Parallel Opportunities

**Setup Phase:**
```bash
# These can run in parallel:
Task: "Generate libs/auth library"
Task: "Configure libs/auth/tsconfig.json"
```

**Foundational Phase:**
```bash
# These can run in parallel:
Task: "Create Role types in libs/auth/src/lib/types/roles.ts"
Task: "Create AuthUser interface in libs/auth/src/lib/types/user.ts"
Task: "Create Action types in libs/auth/src/lib/casl/actions.ts"
```

**User Stories 1 & 2 in parallel:**
```bash
# Developer A: User Story 1 (Seeding)
Task: "Create seed-admin.ts script"

# Developer B: User Story 2 (Web Auth)
Task: "Create Firebase config in apps/web"
Task: "Create firebase-auth.ts wrapper"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (install dependencies, generate lib)
2. Complete Phase 2: Foundational (types, CASL factory, Firebase service)
3. Complete Phase 3: User Story 1 (seed:admin script)
4. Complete Phase 4: User Story 2 (web sign-in)
5. Complete Phase 5: User Story 3 (RBAC guards and endpoints)
6. **STOP and VALIDATE**: Test full auth flow end-to-end
7. Deploy/demo core functionality

### Incremental Delivery

1. Setup + Foundational → Types and infrastructure ready
2. Add User Story 1 → Admin seeding works → Can test manually
3. Add User Story 2 → Web sign-in works → Visual demo possible
4. Add User Story 3 → Full RBAC working → Feature complete (MVP!)
5. Add User Story 4 → Extensibility documented → Scaffold ready for reuse
6. Polish → Security rules, validation → Production ready

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Seeding) + User Story 4 (Extensibility)
   - Developer B: User Story 2 (Web Auth) + User Story 3 (RBAC API)
3. Merge and validate together in Polish phase

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 52 |
| Phase 1 (Setup) | 5 |
| Phase 2 (Foundational) | 10 |
| Phase 3 (US1 - Seeding) | 7 |
| Phase 4 (US2 - Web Auth) | 10 |
| Phase 5 (US3 - RBAC API) | 11 |
| Phase 6 (US4 - Extensibility) | 4 |
| Phase 7 (Polish) | 5 |
| Parallel Opportunities | 16 tasks marked [P] |

**MVP Scope**: User Stories 1-3 (32 tasks after Foundational)

**Independent Test Criteria**:
- US1: Run seed:admin, check Firebase console
- US2: Navigate to /sign-in, authenticate, see user context
- US3: curl endpoints with/without token, verify 401/403/200
- US4: Add test role, verify no guard changes needed
