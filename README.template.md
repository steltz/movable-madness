# Project Name

A full-stack application built with React, NestJS, and Firebase Functions.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Firebase CLI (for functions deployment)
- Google Cloud SDK (for Cloud Run deployment)

### Local Development

Start the development server:

```bash
pnpm dev
```

This starts:
- Frontend at http://localhost:4200
- API at http://localhost:3000

The frontend proxies `/api/*` requests to the backend automatically.

### Building

Build all applications:

```bash
pnpm build
```

### Linting and Formatting

Check code quality:

```bash
pnpm lint
```

Format code:

```bash
pnpm format
```

## Project Structure

```
apps/
  web/        # React + Vite frontend
  api/        # NestJS backend (Cloud Run)
  functions/  # Firebase Functions 2nd Gen
libs/
  shared-types/  # Shared TypeScript interfaces
```

## Deployment

### API (Cloud Run)

Build and deploy the Docker image:

```bash
docker build -f apps/api/Dockerfile -t gcr.io/PROJECT_ID/api .
docker push gcr.io/PROJECT_ID/api
gcloud run deploy api --image gcr.io/PROJECT_ID/api --region REGION
```

### Functions

Deploy Firebase Functions:

```bash
firebase deploy --only functions
```

### Hosting

Deploy frontend to Firebase Hosting:

```bash
pnpm build
firebase deploy --only hosting
```

## License

MIT
