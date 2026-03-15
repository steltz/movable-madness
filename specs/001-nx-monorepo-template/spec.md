# Feature Specification: Nx Monorepo GitHub Template Repository

**Feature Branch**: `001-nx-monorepo-template`
**Created**: 2026-01-09
**Status**: Draft
**Input**: User description: "Create a robust Nx Monorepo workspace designed to be a GitHub Template Repository. The stack includes a React (Vite) frontend, a NestJS backend (Cloud Run), and a dedicated Firebase Functions app."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Project from Template (Priority: P1)

A developer wants to bootstrap a new full-stack project using this template. They use GitHub's "Use this template" button, clone their new repository, and run a setup script that configures their project name and infrastructure settings.

**Why this priority**: This is the primary value proposition of the template - enabling rapid project bootstrapping. Without this working, the template serves no purpose.

**Independent Test**: Can be fully tested by creating a new repository from the template, running the setup script, and verifying all files are renamed and configured correctly.

**Acceptance Scenarios**:

1. **Given** a developer clicks "Use this template" on GitHub, **When** they clone the new repository and run the setup script, **Then** all workspace files reflect their chosen project name.
2. **Given** a developer runs the setup script, **When** they provide their GCP Project ID and region, **Then** the script configures the necessary cloud infrastructure settings.
3. **Given** a developer completes the setup script, **When** they view the README, **Then** it displays clean project-specific documentation (not template instructions).

---

### User Story 2 - Local Development Workflow (Priority: P1)

A developer wants to run the complete application stack locally with a single command. They execute `pnpm dev` and both the frontend and backend start in parallel, with API requests from the frontend automatically proxied to the backend.

**Why this priority**: One-command local development is essential for developer productivity and is a core philosophy of this template.

**Independent Test**: Can be fully tested by running `pnpm dev` and verifying both frontend and backend are accessible, with API proxy working correctly.

**Acceptance Scenarios**:

1. **Given** a developer has installed dependencies, **When** they run `pnpm dev`, **Then** both the React frontend and NestJS backend start simultaneously.
2. **Given** both services are running, **When** the frontend makes a request to `/api/*`, **Then** the request is proxied to the NestJS backend on port 3000.
3. **Given** the developer modifies frontend or backend code, **When** they save the file, **Then** hot-reload updates the running application.

---

### User Story 3 - Type-Safe Full-Stack Development (Priority: P2)

A developer wants to share TypeScript interfaces between frontend, backend, and serverless functions to ensure type consistency across the entire stack.

**Why this priority**: Type safety across the stack prevents runtime errors and improves developer experience, but the application can function without it.

**Independent Test**: Can be fully tested by importing a shared interface in all three apps and verifying compilation succeeds with type checking.

**Acceptance Scenarios**:

1. **Given** a shared type is defined in the shared-types library, **When** a developer imports it in the frontend, **Then** TypeScript provides full type checking and autocomplete.
2. **Given** the same shared type, **When** a developer imports it in the backend, **Then** the backend controller uses the exact same type definition.
3. **Given** the same shared type, **When** a developer imports it in the Firebase Functions app, **Then** the function can use the type for request/response validation.

---

### User Story 4 - Build and Validate Code (Priority: P2)

A developer pushes code to the repository and wants automated validation. The CI pipeline checks code formatting/linting with Biome and builds all applications.

**Why this priority**: CI validation ensures code quality and prevents broken builds from being merged.

**Independent Test**: Can be fully tested by pushing a commit and verifying the CI workflow runs successfully.

**Acceptance Scenarios**:

1. **Given** a developer pushes code, **When** the CI workflow runs, **Then** Biome validates formatting and linting rules.
2. **Given** all checks pass, **When** the build step runs, **Then** all three applications (web, api, functions) compile successfully.
3. **Given** a formatting issue exists, **When** CI runs, **Then** the pipeline fails with clear error messages.

---

### User Story 5 - Deploy Backend to Cloud Run (Priority: P3)

A developer wants to deploy the NestJS backend to Google Cloud Run. They build the Docker image and deploy it, with the application accessible via HTTPS.

**Why this priority**: Deployment is essential for production but developers can work locally without it initially.

**Independent Test**: Can be fully tested by building the Docker image and deploying to Cloud Run, then verifying the API responds correctly.

**Acceptance Scenarios**:

1. **Given** a developer builds the Docker image, **When** the build completes, **Then** a production-ready container image is created.
2. **Given** the image is deployed to Cloud Run, **When** the service starts, **Then** the NestJS API is accessible via HTTPS.
3. **Given** the Cloud Run service is running, **When** Firebase Hosting receives a request to `/api/*`, **Then** it rewrites the request to the Cloud Run service.

---

### User Story 6 - Deploy Firebase Functions (Priority: P3)

A developer wants to deploy serverless functions to Firebase. They build the functions app and deploy using the Firebase CLI.

**Why this priority**: Serverless functions extend the application but are not required for core functionality.

**Independent Test**: Can be fully tested by building the functions app and deploying to Firebase, then invoking a function.

**Acceptance Scenarios**:

1. **Given** a developer runs the build command for functions, **When** the build completes, **Then** the output directory contains a valid package.json with correct entry point.
2. **Given** the functions are deployed, **When** a user triggers the HTTP function, **Then** it responds with the expected output.

---

### Edge Cases

- What happens when a developer runs setup script multiple times? (Should be idempotent or warn about existing configuration)
- How does the system handle missing GCP credentials during setup? (Should provide clear error message and guidance)
- What happens when port 3000 or the frontend port is already in use? (Should fail gracefully with port conflict message)
- How does the Docker build handle missing pnpm-lock.yaml? (Should fail with clear error about running from wrong context)
- What happens when the shared-types library has circular dependencies? (Should fail at build time with clear error)

## Requirements *(mandatory)*

### Functional Requirements

**Workspace Initialization**

- **FR-001**: System MUST create an Nx workspace using pnpm as the package manager
- **FR-002**: System MUST NOT include ESLint or Prettier configuration files
- **FR-003**: System MUST configure Biome as the sole linting and formatting tool with a root biome.json
- **FR-004**: System MUST NOT generate IDE-specific configuration files (e.g., .vscode)

**Shared Library**

- **FR-005**: System MUST provide a TypeScript library at libs/shared-types
- **FR-006**: System MUST export at least one sample interface (ApiResponse) from the shared library
- **FR-007**: System MUST ensure the shared library is importable by all three applications

**Frontend Application**

- **FR-008**: System MUST provide a React application using Vite at apps/web
- **FR-009**: System MUST configure Vite to proxy /api requests to localhost:3000 during development
- **FR-010**: System MUST create firebase.json with rewrite rules for /api/** to Cloud Run service "api"

**Backend Application**

- **FR-011**: System MUST provide a NestJS application at apps/api
- **FR-012**: System MUST include a Dockerfile in apps/api optimized for Cloud Run deployment
- **FR-013**: System MUST configure the Dockerfile to build from the repository root context
- **FR-014**: System MUST implement the App Controller to return a typed ApiResponse

**Firebase Functions Application**

- **FR-015**: System MUST provide a Firebase Functions (2nd Gen) application at apps/functions
- **FR-016**: System MUST install firebase-functions and firebase-admin packages
- **FR-017**: System MUST configure main.ts to export Firebase triggers (not bootstrap a server)
- **FR-018**: System MUST configure build output to dist/apps/functions
- **FR-019**: System MUST generate/copy a package.json to dist/apps/functions with correct main field

**Orchestration**

- **FR-020**: System MUST provide a "dev" script in root package.json that runs web and api in parallel
- **FR-021**: System MUST provide a CI workflow that installs pnpm, runs Biome, and builds all apps

**Setup Script**

- **FR-022**: System MUST provide an interactive setup script at tools/scripts/setup-project.ts
- **FR-023**: System MUST prompt for new project name and rename all relevant files/configurations
- **FR-024**: System MUST prompt for GCP Project ID and Region
- **FR-025**: System MUST automate IAM policy configuration for Cloud Run public access
- **FR-026**: System MUST overwrite README.md with content from README.template.md after setup

### Key Entities

- **Workspace**: The root Nx monorepo containing all applications, libraries, and configuration. Contains package.json, nx.json, biome.json, and firebase.json.
- **Application**: A deployable unit (web, api, or functions) with its own build configuration and deployment target.
- **Shared Library**: A reusable TypeScript module containing types and interfaces shared across applications.
- **Setup Configuration**: User-provided values (project name, GCP settings) that customize the template for a specific project.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can create a new project from the template and have it fully configured in under 5 minutes
- **SC-002**: Running `pnpm dev` starts both frontend and backend within 30 seconds
- **SC-003**: API proxy correctly forwards 100% of /api/* requests from frontend to backend during local development
- **SC-004**: All three applications successfully import and use shared types without type errors
- **SC-005**: CI pipeline completes all checks (lint, format, build) in under 5 minutes
- **SC-006**: Docker image builds successfully from repository root and runs on Cloud Run without modification
- **SC-007**: Firebase Functions deploy successfully with the generated package.json configuration
- **SC-008**: Zero ESLint or Prettier dependencies exist in the final template
- **SC-009**: No IDE-specific configuration files exist in the repository

## Assumptions

- Developers using this template have Node.js 18+ and pnpm installed
- Developers have access to a GCP project for Cloud Run deployment
- Developers have Firebase CLI installed for functions deployment
- The NestJS backend will run on port 3000 by default
- The React frontend will run on port 4200 by default (Vite default for Nx)
- Firebase Hosting is used for frontend deployment in production
- Cloud Run service will be named "api" for Firebase rewrites
- 2nd Generation Firebase Functions are preferred over 1st Generation

## Out of Scope

- Database setup or ORM configuration
- Authentication/authorization implementation
- Environment variable management beyond basic setup
- Production deployment automation (Terraform, Pulumi, etc.)
- Monitoring and logging infrastructure
- Multi-environment configuration (staging, production)
- Secret management
