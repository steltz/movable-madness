# Research: Husky Pre-Commit Hook for Local CI/CD

**Branch**: `002-husky-precommit-hook`
**Date**: 2026-01-10
**Status**: Complete

## Research Questions

1. How to prevent bypassing pre-commit hooks with --no-verify?
2. How to use Nx affected with staged files in pre-commit context?
3. How to integrate Biome auto-fix in pre-commit hooks?

---

## Decision 1: Bypass Prevention Strategy

### Decision
Use a **layered validation approach**: Accept that client-side bypass is inevitable, but implement pre-push hooks for comprehensive checks and rely on CI/CD + branch protection as the real enforcement mechanism.

### Rationale
- Git's `--no-verify` flag cannot be disabled at the client level - it's a deliberate safety valve
- Server-side enforcement (CI + branch protection rules) provides guaranteed validation
- Trying to "block" --no-verify creates friction and workarounds (e.g., `HUSKY=0`)
- A layered approach provides fast feedback locally while ensuring nothing reaches main unvalidated

### Alternatives Considered

| Approach | Rejected Because |
|----------|------------------|
| Server-side pre-receive hooks | Most cloud providers (GitHub, GitLab SaaS) don't support custom server hooks |
| Custom Git wrapper scripts | Easily bypassed, adds complexity, poor DX |
| Remove --no-verify documentation | Doesn't actually prevent usage, team will discover it |

### Implementation
```
Layer 1: Pre-commit (Fast, <10s)
├── Biome lint + format on staged files
└── Optional: Type-check affected packages

Layer 2: Pre-push (Comprehensive)
├── nx affected:test
├── nx affected:build
└── Exit non-zero if anything fails

Layer 3: CI/CD (Mandatory)
├── Run identical checks on every PR
└── Use GitHub branch protection rules
```

---

## Decision 2: Nx Affected with Staged Files

### Decision
Use `nx affected --base=HEAD` for pre-commit hooks, which includes uncommitted changes (staging area). Use `nx affected --base=origin/main` for pre-push hooks for full comparison.

### Rationale
- `--base=HEAD` compares against the current commit, showing only what's changed in the working tree
- This naturally includes staged files since they differ from HEAD
- Using `origin/main` in pre-push ensures all changes since branching are validated
- Nx 22.3.3 auto-detects Vitest through the Vite plugin, so `nx affected -t test` works out of the box

### Alternatives Considered

| Approach | Rejected Because |
|----------|------------------|
| `--uncommitted` flag | Less predictable behavior, includes untracked files we may not want |
| lint-staged for everything | Overkill for Nx monorepo - Nx's affected detection is more intelligent |
| Full workspace checks | Too slow for pre-commit; defeats the purpose of speed optimization |

### Implementation
```bash
# Pre-commit (fast, lint only)
npx nx affected -t lint --base=HEAD --fix

# Pre-push (comprehensive)
npx nx affected -t test build --base=origin/main --parallel=3
```

---

## Decision 3: Biome Auto-Fix Integration

### Decision
Use Biome's built-in `--staged` flag with `git update-index --again` to auto-fix and re-stage corrected files. No lint-staged needed.

### Rationale
- Biome 2.3.11 has native `--staged` support, eliminating external dependencies
- `git update-index --again` efficiently re-stages only modified files
- Biome is already the linter in this project (replacing ESLint), so we leverage existing tooling
- Single command replaces multiple tools (linting + formatting in one pass)

### Alternatives Considered

| Approach | Rejected Because |
|----------|------------------|
| lint-staged + Biome | Unnecessary complexity; Biome has `--staged` built-in |
| pre-commit framework | Additional Python dependency; overkill for single tool |
| Biome without --staged | Would check entire codebase, defeating performance goals |

### Implementation
```bash
# In .husky/pre-commit
biome check --staged --write --no-errors-on-unmatched && git update-index --again
```

**Flags explained:**
- `--staged`: Process only staged files
- `--write`: Apply safe fixes (formatting + lint auto-fixes)
- `--no-errors-on-unmatched`: Don't fail if no files match patterns
- `git update-index --again`: Re-stage all modified files

---

## Decision 4: Hook Architecture

### Decision
Keep pre-commit hook minimal (Biome only), move Nx tests/builds to pre-push hook.

### Rationale
- Pre-commit hooks should complete in <10 seconds to avoid disrupting developer flow
- Biome checks on staged files are fast (typically <2 seconds)
- Nx affected:test and affected:build can take 30-60+ seconds
- Developers can commit frequently without waiting; validation happens before push

### Implementation Structure
```
.husky/
├── pre-commit     # Biome check --staged --write && git update-index --again
└── pre-push       # nx affected -t lint test build --base=origin/main

tools/scripts/pre-commit/
└── (not needed - keeping hooks simple in .husky/ directly)
```

---

## Decision 5: Automatic Hook Installation

### Decision
Use Husky's `prepare` script for automatic installation on `pnpm install`.

### Rationale
- Husky convention: `"prepare": "husky"` in package.json
- Runs automatically after any developer runs `pnpm install`
- No manual steps required for new team members
- Works reliably across all platforms (macOS, Linux, Windows)

### Implementation
```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.0.0"
  }
}
```

---

## Summary of Resolved NEEDS CLARIFICATION

| Original Question | Resolution |
|-------------------|------------|
| How to prevent --no-verify bypass? | Accept it; use layered validation with CI/CD as enforcement |
| How to run only affected tests? | Use `nx affected -t test --base=origin/main` in pre-push |
| How to auto-fix and re-stage? | `biome check --staged --write && git update-index --again` |
| Where to put complex logic? | Keep hooks simple; all logic in single-line commands |

---

## References

- [Biome Git Hooks Documentation](https://biomejs.dev/recipes/git-hooks/)
- [Nx Affected Command Reference](https://nx.dev/reference/core-api/nx/documents/affected)
- [Husky Documentation](https://typicode.github.io/husky/)
- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
