# Contributing

## Development Workflow

### Getting Started

1. Clone the repository
2. Run `pnpm install` (this automatically installs Git hooks)
3. Start development with `pnpm dev`

## Code Quality

### Layered Validation

This project uses a three-layer validation approach:

```
Layer 1: Pre-commit (Comprehensive, uses --base=HEAD)
├── Biome lint + format on staged files (auto-fix)
├── nx affected:lint
├── nx affected:test
└── nx affected:build

Layer 2: Pre-push (Full branch validation, uses --base=origin/main)
├── nx affected:lint
├── nx affected:test
└── nx affected:build

Layer 3: CI/CD (Mandatory)
├── Full validation on every PR
└── Branch protection rules
```

### Pre-commit Hook

The pre-commit hook runs on staged files:
- Biome lint + format with auto-fix
- Re-stages fixed files automatically
- `nx affected -t lint test build --base=HEAD` on affected projects
- Blocks commit on errors

### Pre-push Hook

The pre-push hook validates all branch changes:
- `nx affected -t lint test build --base=origin/main`
- Runs lint, test, and build in parallel
- Blocks push if any check fails

### Bypassing Hooks

For emergencies, you can bypass hooks:

```bash
git commit --no-verify -m "emergency fix"
git push --no-verify
```

**Important**: CI/CD will still run all checks. Bypassing locally only delays validation - it doesn't skip it. All PRs must pass CI checks before merging.

### Troubleshooting

#### Hooks not running

```bash
# Verify hooks are installed
ls -la .husky/

# Re-install hooks
pnpm exec husky
```

#### Permission denied

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

#### Pre-push takes too long

Consider making smaller, more focused commits. The `nx affected` command only runs checks on changed projects, but large changes will naturally take longer.

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with descriptive commits
3. Push to your fork (pre-push hooks will run)
4. Open a PR to `main`
5. Ensure CI checks pass
6. Request review
