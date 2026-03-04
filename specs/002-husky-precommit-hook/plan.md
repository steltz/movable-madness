# Implementation Plan: Husky Pre-Commit Hook for Local CI/CD

**Branch**: `002-husky-precommit-hook` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-husky-precommit-hook/spec.md`

## Summary

Implement a robust, speed-optimized pre-commit hook using Husky that runs Biome linting (with auto-fix), Vitest tests (affected-only via Nx), and Nx builds before each commit. The hook will support agentic coding workflows by automatically fixing trivial issues and cannot be bypassed via --no-verify.

## Technical Context

**Language/Version**: TypeScript 5.9.2, Node.js (pnpm 9.15.4)
**Primary Dependencies**: Husky (to install), Nx 22.3.3, Biome 2.3.11, Vitest 4.0
**Storage**: N/A (Git hooks, no persistent data)
**Testing**: Vitest (via Nx/Vite plugin)
**Target Platform**: Local development (macOS/Linux/Windows)
**Project Type**: Nx monorepo with apps (api, functions, web) and libs (shared-types)
**Performance Goals**: Pre-commit checks complete in <60 seconds for typical single-project changes
**Constraints**: Must not block developer flow; must leverage Nx caching; bypass prevention required
**Scale/Scope**: 3 applications, 1 shared library, ~5-10 developers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file contains template placeholders without defined principles. No gates are currently defined that would block this feature. Proceeding with standard best practices:

- [x] **Simplicity**: Hook implementation uses existing tooling (Husky, Nx, Biome) without custom abstractions
- [x] **No over-engineering**: Single shell script for pre-commit, no complex orchestration
- [x] **Leverages existing infrastructure**: Uses Nx affected, Biome CLI, Vitest via Nx targets

## Project Structure

### Documentation (this feature)

```text
specs/002-husky-precommit-hook/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # N/A - no data entities
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A - no API contracts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Pre-commit hook infrastructure
.husky/
├── _/                   # Husky internals (auto-generated)
├── pre-commit           # Main pre-commit hook script
└── commit-msg           # Optional: commit message validation

# Supporting scripts
tools/
└── scripts/
    └── pre-commit/
        ├── run-checks.sh        # Main orchestration script
        ├── detect-affected.sh   # Nx affected detection helper
        └── bypass-guard.sh      # --no-verify prevention

# Package configuration changes
package.json             # Add husky, lint-staged (if needed), prepare script
nx.json                  # Ensure affected targets are properly configured
```

**Structure Decision**: Using `.husky/` for Git hooks (Husky standard) with `tools/scripts/pre-commit/` for modular helper scripts. This keeps hook logic maintainable and testable while following Husky conventions.

## Complexity Tracking

No constitution violations detected. Implementation uses standard tooling without custom abstractions.
