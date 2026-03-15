# Quickstart: Husky Pre-Commit Hook

**Branch**: `002-husky-precommit-hook`
**Time to Complete**: ~15 minutes

## Overview

This feature adds a pre-commit hook that:
1. Auto-fixes linting/formatting issues with Biome
2. Re-stages corrected files
3. Runs affected tests and builds on pre-push
4. Cannot be bypassed (enforced via CI/CD)

## Prerequisites

- Node.js 18+ installed
- pnpm 9.15.4+ installed
- Git repository initialized
- Nx workspace configured (already done)
- Biome configured (already done)

## Quick Setup

### 1. Install Husky

```bash
pnpm add -D husky
```

### 2. Initialize Husky

```bash
pnpm exec husky init
```

This creates:
- `.husky/` directory
- `.husky/pre-commit` default hook
- Adds `"prepare": "husky"` to package.json

### 3. Configure Pre-Commit Hook

Replace `.husky/pre-commit` contents:

```bash
#!/bin/sh
biome check --staged --write --no-errors-on-unmatched && git update-index --again
```

### 4. Add Pre-Push Hook

Create `.husky/pre-push`:

```bash
#!/bin/sh
npx nx affected -t lint test build --base=origin/main --parallel=3
```

Make executable:

```bash
chmod +x .husky/pre-push
```

### 5. Verify Installation

```bash
# Stage a file with lint issues
echo "const x = 1" > test-file.ts
git add test-file.ts

# Attempt commit - should auto-fix
git commit -m "test commit"

# Clean up
git reset HEAD~1
rm test-file.ts
```

## How It Works

### Pre-Commit Flow

```
Developer runs: git commit -m "message"
       │
       ▼
┌──────────────────────────────────┐
│ .husky/pre-commit executes       │
│                                  │
│ biome check --staged --write     │
│   ├── Checks staged files only   │
│   ├── Auto-fixes what it can     │
│   └── Reports unfixable errors   │
│                                  │
│ git update-index --again         │
│   └── Re-stages fixed files      │
└──────────────────────────────────┘
       │
       ▼
   ┌───────┐
   │ Pass? │──No──► Commit blocked, errors shown
   └───────┘
       │
      Yes
       │
       ▼
   Commit succeeds
```

### Pre-Push Flow

```
Developer runs: git push
       │
       ▼
┌──────────────────────────────────┐
│ .husky/pre-push executes         │
│                                  │
│ nx affected -t lint test build   │
│   ├── Determines affected        │
│   │   projects since origin/main │
│   ├── Runs lint on affected      │
│   ├── Runs tests on affected     │
│   └── Runs build on affected     │
└──────────────────────────────────┘
       │
       ▼
   ┌───────┐
   │ Pass? │──No──► Push blocked, errors shown
   └───────┘
       │
      Yes
       │
       ▼
   Push succeeds
```

## Configuration Files

### package.json additions

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.0.0"
  }
}
```

### Expected file structure

```
.husky/
├── _/                  # Husky internals (auto-generated)
├── pre-commit          # Biome auto-fix
└── pre-push            # Nx affected checks
```

## Bypassing (For Emergencies)

While the hook runs on every commit, there are escape hatches:

```bash
# Skip pre-commit only (not recommended)
git commit --no-verify -m "emergency fix"

# Skip pre-push only (not recommended)
git push --no-verify
```

**Note**: CI/CD will still run all checks. Bypassing locally just delays failure.

## Troubleshooting

### Hook not running

```bash
# Verify hooks are installed
ls -la .husky/

# Re-initialize if needed
pnpm exec husky
```

### Biome errors on unknown files

Add `--files-ignore-unknown=true` to the pre-commit command:

```bash
biome check --staged --write --files-ignore-unknown=true --no-errors-on-unmatched
```

### Pre-push takes too long

Consider running only lint in pre-push, move tests to CI:

```bash
npx nx affected -t lint --base=origin/main
```

### Permission denied on hooks

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

## Next Steps

After implementing, consider:

1. **Add commit-msg hook** for conventional commits:
   ```bash
   echo 'npx commitlint --edit $1' > .husky/commit-msg
   ```

2. **Configure branch protection** in GitHub:
   - Require PR reviews
   - Require status checks to pass
   - Include administrators

3. **Add Nx Cloud** for remote caching (speeds up CI)
