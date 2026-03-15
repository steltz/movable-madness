# Nx Monorepo Template

A production-ready Nx monorepo template for full-stack TypeScript applications with React, NestJS, and Firebase Functions.

## Features

- **React + Vite** frontend with hot module replacement
- **NestJS** backend ready for Cloud Run deployment
- **Firebase Functions 2nd Gen** for serverless workloads
- **Shared TypeScript types** across all applications
- **Biome** for fast linting and formatting (no ESLint/Prettier)
- **GitHub Actions CI** pipeline included
- **Docker** configuration for Cloud Run deployment

## Quick Start

### 1. Create a new repository from this template

Click the "Use this template" button on GitHub to create a new repository.

### 2. Clone your new repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run the setup script

```bash
pnpm setup
```

This interactive script will:
- Rename the project to your chosen name
- Configure GCP project settings
- Set up Cloud Run IAM policies (optional)
- Replace this README with project-specific documentation

### 5. Start developing

```bash
pnpm dev
```

## Project Structure

```
apps/
  web/        # React + Vite frontend (localhost:4200)
  api/        # NestJS backend (localhost:3000)
  functions/  # Firebase Functions 2nd Gen
libs/
  shared-types/  # Shared TypeScript interfaces
tools/
  scripts/    # Setup and utility scripts
```

## Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) for Git hooks to ensure code quality before commits reach CI/CD.

### Pre-commit Hook

Runs on every `git commit`:
- Biome lint and format on staged files with auto-fix
- Automatically re-stages fixed files
- `nx affected -t lint test build` on changed projects (uses `--base=HEAD`)

### Pre-push Hook

Runs on every `git push`:
- `nx affected -t lint test build` on all branch changes (uses `--base=origin/main`)
- Blocks push if any check fails

Hooks are automatically installed when you run `pnpm install` (via the `prepare` script).

**Bypass**: Use `--no-verify` for emergencies, but CI/CD will still enforce all checks.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start frontend and backend in development mode |
| `pnpm build` | Build all applications |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |
| `pnpm setup` | Run project setup wizard |

## Tech Stack

- **Nx 19.x** - Monorepo build system
- **React 18.x** - Frontend framework
- **Vite 5.x** - Frontend bundler
- **NestJS 10.x** - Backend framework
- **Firebase Functions** - Serverless functions (2nd Gen)
- **Biome** - Linting and formatting
- **pnpm** - Package manager

## Requirements

- Node.js 18+
- pnpm 9+

## License

MIT
