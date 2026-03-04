# Tasks: Husky Pre-Commit Hook for Local CI/CD

**Input**: Design documents from `/specs/002-husky-precommit-hook/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Tests are NOT explicitly requested in this specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This feature uses:
- `.husky/` for Git hooks (Husky standard)
- `package.json` for npm scripts and dependencies
- No additional source directories needed (simple shell scripts in hooks)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Husky and configure automatic hook installation

- [x] T001 Install husky as dev dependency via `pnpm add -D husky`
- [x] T002 Initialize husky directory structure via `pnpm exec husky init`
- [x] T003 Add prepare script to package.json: `"prepare": "husky"`
- [x] T004 [P] Verify .husky/ directory created with default pre-commit hook

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure Nx and Biome are properly configured for hook commands

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Verify Biome configuration in biome.json supports --staged flag
- [x] T006 [P] Verify Nx lint target is available via `pnpm nx show project api --json`
- [x] T007 [P] Verify Nx test target is available via `pnpm nx show project web --json`
- [x] T008 [P] Verify Nx build target works via `pnpm nx run-many -t build --dry-run`
- [x] T009 Test Biome staged check works via `echo "test" > /tmp/test.ts && biome check --staged --write --no-errors-on-unmatched`

**Checkpoint**: Foundation ready - Husky installed, Biome and Nx commands verified

---

## Phase 3: User Story 1 - Automatic Code Quality Verification (Priority: P1) 🎯 MVP

**Goal**: Pre-commit hook executes lint, test, and build quality gates and blocks commits on failure

**Independent Test**: Stage changes with lint errors, attempt commit, verify hook blocks with clear error message

### Implementation for User Story 1

- [x] T010 [US1] Create pre-commit hook with Biome check in .husky/pre-commit: `biome check --staged --write --no-errors-on-unmatched && git update-index --again`
- [x] T011 [US1] Make pre-commit hook executable via `chmod +x .husky/pre-commit`
- [x] T012 [US1] Create pre-push hook with Nx affected checks in .husky/pre-push: `npx nx affected -t lint test build --base=origin/main --parallel=3`
- [x] T013 [US1] Make pre-push hook executable via `chmod +x .husky/pre-push`
- [x] T014 [US1] Test pre-commit blocks on lint errors: create file with lint issue, stage, attempt commit
- [x] T015 [US1] Test pre-push blocks on test failures: modify test to fail, push, verify block
- [x] T016 [US1] Verify clear error messages displayed when hook blocks commit

**Checkpoint**: User Story 1 complete - basic quality gates working, blocks on lint/test/build failures

---

## Phase 4: User Story 2 - Speed-Optimized Affected-Only Testing (Priority: P2)

**Goal**: Only affected projects' tests run, not the entire test suite

**Independent Test**: Modify single project, run pre-push, verify only that project's tests execute

### Implementation for User Story 2

- [x] T017 [US2] Verify pre-push uses `nx affected` with `--base=origin/main` in .husky/pre-push
- [x] T018 [US2] Add parallel execution flag `--parallel=3` to pre-push hook in .husky/pre-push
- [x] T019 [US2] Test affected detection: modify apps/api, verify only api tests run on pre-push
- [x] T020 [US2] Test affected detection: modify libs/shared-types, verify dependent app tests run
- [x] T021 [US2] Test skip behavior: modify README.md only, verify minimal or no test execution

**Checkpoint**: User Story 2 complete - affected-only testing validated, performance optimized

---

## Phase 5: User Story 3 - Automatic Error Fixing (Priority: P3)

**Goal**: Auto-fixable lint errors are corrected and re-staged before commit proceeds

**Independent Test**: Stage code with auto-fixable errors, commit, verify files are fixed and included in commit

### Implementation for User Story 3

- [x] T022 [US3] Verify pre-commit uses `--write` flag for auto-fix in .husky/pre-commit
- [x] T023 [US3] Verify pre-commit includes `git update-index --again` for re-staging in .husky/pre-commit
- [x] T024 [US3] Test auto-fix: stage file with trailing whitespace, commit, verify file fixed
- [x] T025 [US3] Test auto-fix: stage file with missing semicolon, commit, verify file fixed
- [x] T026 [US3] Test non-fixable error: stage file with real error, verify commit blocked with clear message
- [x] T027 [US3] Verify fixed files appear in commit (not left as unstaged changes)

**Checkpoint**: User Story 3 complete - auto-fix working, fixed files properly staged

---

## Phase 6: User Story 4 - Bypass Prevention (Priority: P4)

**Goal**: Hooks cannot be easily bypassed; automatic installation for new developers

**Independent Test**: Attempt `git commit --no-verify`, verify CI/CD provides fallback enforcement

### Implementation for User Story 4

- [x] T028 [US4] Document layered validation approach in README or CONTRIBUTING.md
- [x] T029 [US4] Verify prepare script runs on `pnpm install` and installs hooks
- [x] T030 [US4] Test new clone workflow: clone repo, run pnpm install, verify .husky/pre-commit exists
- [x] T031 [US4] Document that --no-verify bypasses hooks but CI/CD provides enforcement
- [x] T032 [US4] Add GitHub Actions workflow to run same checks as pre-push (optional but recommended)

**Checkpoint**: User Story 4 complete - automatic installation working, bypass documentation clear

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, edge cases, and final validation

- [x] T033 [P] Add hook documentation to README.md explaining pre-commit/pre-push behavior
- [x] T034 [P] Add troubleshooting section for common issues (permission denied, hook not running)
- [x] T035 Test edge case: empty commit (no staged changes)
- [x] T036 Test edge case: merge commit behavior
- [x] T037 Test edge case: large commit touching many projects
- [x] T038 Run quickstart.md validation steps to confirm all setup instructions work
- [x] T039 Commit all changes with working hooks enabled

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3 → P4)
  - US2, US3, US4 can technically start after US1 since they modify same files
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Creates core hook files
- **User Story 2 (P2)**: Depends on US1 - Validates affected detection in hooks created by US1
- **User Story 3 (P3)**: Depends on US1 - Validates auto-fix in hooks created by US1
- **User Story 4 (P4)**: Depends on US1 - Documents and validates installation created by US1

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:
- Phase 2: T006, T007, T008 can run in parallel (different Nx targets)
- Phase 7: T033, T034 can run in parallel (different doc sections)

---

## Parallel Example: Foundational Phase

```bash
# These verification tasks can run in parallel:
Task: "Verify Nx lint target is available via pnpm nx show project api --json"
Task: "Verify Nx test target is available via pnpm nx show project web --json"
Task: "Verify Nx build target works via pnpm nx run-many -t build --dry-run"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009)
3. Complete Phase 3: User Story 1 (T010-T016)
4. **STOP and VALIDATE**: Test pre-commit and pre-push hooks work
5. Hooks are functional - can commit to main

### Incremental Delivery

1. Setup + Foundational → Husky installed, dependencies verified
2. Add User Story 1 → Core quality gates working (MVP!)
3. Add User Story 2 → Affected-only testing validated
4. Add User Story 3 → Auto-fix verified
5. Add User Story 4 → Installation automation + documentation complete
6. Polish → Edge cases, troubleshooting docs

---

## Notes

- [P] tasks = different files/targets, no dependencies
- [Story] label maps task to specific user story for traceability
- User stories 2-4 are validation/refinement of hooks created in US1
- Most tasks are verification/testing rather than new file creation
- Core implementation is minimal (2 hook files, 1 package.json change)
- Avoid: modifying hooks in parallel from different stories
