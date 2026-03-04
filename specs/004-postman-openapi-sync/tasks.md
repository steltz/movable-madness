# Tasks: Postman Collection Generator from OpenAPI

**Input**: Design documents from `/specs/004-postman-openapi-sync/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. The spec focuses on high-value unit tests for business logic (constitution II). Tests for the conversion logic are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md project structure:
- `apps/api/src/` - NestJS API source
- `apps/api/postman/` - Generated Postman output
- `tools/scripts/` - Generation scripts
- `libs/shared-types/src/` - Shared type definitions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create basic structure

- [X] T001 Install @nestjs/swagger and swagger-ui-express dependencies via `pnpm add @nestjs/swagger swagger-ui-express`
- [X] T002 Install dev dependencies via `pnpm add -D openapi-to-postmanv2 js-yaml @types/js-yaml`
- [X] T003 [P] Create output directory structure at apps/api/postman/environments/
- [X] T004 [P] Add postman:generate script to package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: NestJS Swagger configuration that MUST be complete before collection generation works

**⚠️ CRITICAL**: OpenAPI generation requires Swagger to be configured in NestJS

- [X] T005 Configure SwaggerModule in apps/api/src/main.ts with DocumentBuilder
- [X] T006 Add @ApiTags decorator to AppController in apps/api/src/app/app.controller.ts
- [X] T007 Add @ApiOperation and @ApiResponse decorators to getData() in apps/api/src/app/app.controller.ts
- [X] T008 Add @ApiOperation and @ApiResponse decorators to getHealth() in apps/api/src/app/app.controller.ts
- [X] T009 Create environment configuration types in libs/shared-types/src/api-config.ts

**Checkpoint**: Foundation ready - NestJS serves Swagger UI at /api-docs and exposes OpenAPI document

---

## Phase 3: User Story 1 - Quick Collection Update (Priority: P1) 🎯 MVP

**Goal**: Developer can regenerate Postman collection with single command after adding new endpoint

**Independent Test**: Add sample endpoint, run `pnpm postman:generate`, verify new endpoint appears in collection.json with correct request details

### Implementation for User Story 1

- [X] T010 [US1] Create generate-postman.ts script skeleton in tools/scripts/generate-postman.ts
- [X] T011 [US1] Implement OpenAPI spec generation using NestFactory.createApplicationContext() in tools/scripts/generate-postman.ts
- [X] T012 [US1] Implement Postman collection conversion using openapi-to-postmanv2 in tools/scripts/generate-postman.ts
- [X] T013 [US1] Add file output logic to write collection.json to apps/api/postman/collection.json
- [X] T014 [US1] Add error handling with clear messages for spec parsing failures in tools/scripts/generate-postman.ts
- [X] T015 [US1] Add console output with success/failure status and file paths in tools/scripts/generate-postman.ts

### Unit Tests for User Story 1 (High-Value)

- [X] T016 [P] [US1] Create test for OpenAPI to Postman conversion logic in tools/scripts/generate-postman.spec.ts
- [X] T017 [P] [US1] Create test for error handling with malformed OpenAPI spec in tools/scripts/generate-postman.spec.ts

**Checkpoint**: `pnpm postman:generate` works - generates collection.json from NestJS API

---

## Phase 4: User Story 2 - Environment-Aware Testing (Priority: P2)

**Goal**: Developer can switch between local/staging/production environments in Postman without manual URL edits

**Independent Test**: Generate environments, import into Postman, switch environment and verify {{baseUrl}} resolves correctly

### Implementation for User Story 2

- [X] T018 [US2] Create environment generation function in tools/scripts/generate-postman.ts
- [X] T019 [US2] Implement local environment file generation (local.json) with baseUrl http://localhost:3000
- [X] T020 [P] [US2] Implement staging environment file generation (staging.json) with Cloud Run URL
- [X] T021 [P] [US2] Implement production environment file generation (production.json) with Cloud Run URL
- [X] T022 [US2] Add accessToken variable (empty, type: secret) to all environment files
- [X] T023 [US2] Integrate environment generation into main generate-postman.ts execution flow

### Unit Tests for User Story 2 (High-Value)

- [X] T024 [P] [US2] Create test for environment file structure validation in tools/scripts/generate-postman.spec.ts

**Checkpoint**: Environment files generated - switching environments in Postman works correctly

---

## Phase 5: User Story 3 - Seamless Import Experience (Priority: P3)

**Goal**: Generated collection is immediately usable in Postman with logical folder organization and pre-configured auth

**Independent Test**: Import fresh collection into Postman, verify endpoints organized by tags, auth using {{accessToken}}

### Implementation for User Story 3

- [X] T025 [US3] Configure openapi-to-postmanv2 with folderStrategy: 'Tags' option in tools/scripts/generate-postman.ts
- [X] T026 [US3] Configure schemaFaker: true for example request body generation in tools/scripts/generate-postman.ts
- [X] T027 [US3] Add collection-level Bearer auth using {{accessToken}} variable in tools/scripts/generate-postman.ts
- [X] T028 [US3] Configure collection variables for baseUrl using {{baseUrl}} in tools/scripts/generate-postman.ts

**Checkpoint**: Collection imports with folders by tag, auth pre-configured, example bodies populated

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates

- [X] T029 [P] Add .gitkeep to apps/api/postman/environments/ to ensure directory exists
- [X] T030 Run quickstart.md validation - execute full workflow from quickstart guide
- [X] T031 Verify Swagger UI accessible at http://localhost:3000/api-docs when running `pnpm dev`
- [X] T032 Run lint and format checks via `pnpm lint` and `pnpm format`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3)
  - US2 and US3 extend the same generate-postman.ts file from US1
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 completing (extends generate-postman.ts with environment generation)
- **User Story 3 (P3)**: Depends on US1 completing (extends generate-postman.ts with folder/auth configuration)

### Within Each User Story

- Core implementation before output/validation
- File I/O after generation logic
- Error handling after happy path
- Tests after implementation (or in parallel if TDD)

### Parallel Opportunities

**Phase 1 (Setup)**:
- T003, T004 can run in parallel (different files)

**Phase 3 (US1)**:
- T016, T017 tests can run in parallel (different test cases)

**Phase 4 (US2)**:
- T020, T021 can run in parallel (different environment files)
- T024 test can run in parallel with implementation

---

## Parallel Example: Phase 1 Setup

```bash
# Launch in parallel:
Task: "Create output directory structure at apps/api/postman/environments/"
Task: "Add postman:generate script to package.json"
```

## Parallel Example: User Story 2 Environments

```bash
# Launch in parallel (after T019 local.json):
Task: "Implement staging environment file generation (staging.json) with Cloud Run URL"
Task: "Implement production environment file generation (production.json) with Cloud Run URL"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (5 tasks)
3. Complete Phase 3: User Story 1 (8 tasks)
4. **STOP and VALIDATE**: Run `pnpm postman:generate` and import collection into Postman
5. Verify SC-001: Collection generation completes in <30 seconds

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (9 tasks)
2. Add User Story 1 → Test independently → **MVP Ready!** (17 tasks total)
3. Add User Story 2 → Test environment switching (24 tasks total)
4. Add User Story 3 → Test import experience (28 tasks total)
5. Polish → Final validation (32 tasks total)

### Single Developer Strategy

Work sequentially: P1 → P2 → P3 → Polish
Each story builds on the previous, extending generate-postman.ts with new capabilities.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All stories extend the same generate-postman.ts script progressively
- US1 is the MVP - generates basic collection from OpenAPI
- US2 adds environment files for multi-environment testing
- US3 adds polish (folders, auth, examples) for seamless Postman experience
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
