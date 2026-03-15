# Quickstart: Nx Monorepo GitHub Template

**Feature Branch**: `001-nx-monorepo-template`
**Date**: 2026-01-09

## Prerequisites

Before using this template, ensure you have installed:

- **Node.js 20+** (LTS recommended)
- **pnpm 9+** (`corepack enable pnpm`)
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Google Cloud SDK** (`gcloud`) - for Cloud Run deployment

---

## Quick Start (Template Usage)

### 1. Create from Template

Click **"Use this template"** on GitHub, or:

```bash
gh repo create my-new-project --template=<template-repo> --clone
cd my-new-project
```

### 2. Run Setup Script

```bash
pnpm install
pnpm setup
```

The interactive setup will:
- Ask for your **project name**
- Ask for your **GCP Project ID** and **region**
- Rename all workspace files and configurations
- Configure Cloud Run IAM for Firebase Hosting rewrites
- Generate a clean project README

### 3. Start Development

```bash
pnpm dev
```

This starts:
- **Frontend** (React/Vite) at `http://localhost:4200`
- **Backend** (NestJS) at `http://localhost:3000`

The frontend proxies `/api/*` requests to the backend automatically.

---

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + backend in parallel |
| `pnpm build` | Build all apps |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |
| `pnpm test` | Run all tests |
| `nx serve web` | Start frontend only |
| `nx serve api` | Start backend only |
| `nx build functions` | Build Firebase Functions |

---

## Project Structure

```
/
├── apps/
│   ├── web/           # React + Vite frontend
│   ├── api/           # NestJS backend (Cloud Run)
│   └── functions/     # Firebase Functions (2nd Gen)
├── libs/
│   └── shared-types/  # Shared TypeScript interfaces
├── tools/
│   └── scripts/       # Setup and utility scripts
├── biome.json         # Linting/formatting config
├── firebase.json      # Firebase Hosting + Functions
├── nx.json            # Nx workspace config
└── pnpm-workspace.yaml
```

---

## Adding Shared Types

1. Add your interface to `libs/shared-types/src/lib/`:

```typescript
// libs/shared-types/src/lib/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
}
```

2. Export from index:

```typescript
// libs/shared-types/src/index.ts
export type { User } from './lib/user';
```

3. Import anywhere:

```typescript
import type { User } from '@workspace/shared-types';
```

---

## Deployment

### Frontend (Firebase Hosting)

```bash
nx build web --prod
firebase deploy --only hosting
```

### Backend (Cloud Run)

```bash
# Build Docker image
docker build -t gcr.io/PROJECT_ID/api -f apps/api/Dockerfile .

# Push and deploy
docker push gcr.io/PROJECT_ID/api
gcloud run deploy api \
  --image gcr.io/PROJECT_ID/api \
  --region REGION \
  --allow-unauthenticated
```

### Functions (Firebase Functions)

```bash
nx build functions
firebase deploy --only functions
```

---

## Environment Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `PORT` | Server port (default: 3000) | api |
| `NODE_ENV` | Environment mode | all |
| `FIREBASE_CONFIG` | Firebase config (auto-set) | functions |

---

## Troubleshooting

### Port already in use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### pnpm install fails

```bash
# Clear pnpm cache
pnpm store prune
rm -rf node_modules
pnpm install
```

### Nx cache issues

```bash
nx reset
```

### Docker build fails

Ensure you're building from the repository root:

```bash
docker build -f apps/api/Dockerfile .  # Note the trailing dot
```

---

## Next Steps

After setup, consider:

1. **Add authentication** - Firebase Auth, Auth0, or custom JWT
2. **Add database** - Prisma, TypeORM, or Firebase Firestore
3. **Add testing** - Vitest for frontend, Jest for backend
4. **Set up CI/CD** - The template includes a basic GitHub Actions workflow
5. **Configure environments** - Add staging/production configs
