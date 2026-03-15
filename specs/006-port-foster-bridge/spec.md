# Feature Specification: Port Reusable Features from foster-bridge

**Feature Branch**: `006-port-foster-bridge`
**Created**: 2026-01-18
**Status**: Draft
**Input**: User description: "Port reusable features from foster-bridge repository back to scaffold template, including App-Level Error Boundary, Admin Layout with Navigation Drawer, Admin Login Redirect and Account Settings, GitHub Actions Workflow for Firestore Deployment, Structured Logging Infrastructure, and Pre-commit Hook Setup."

## Clarifications

### Session 2026-01-18

- Q: What styling approach should be used for the Error Boundary and Account Settings UI components (since MUI is not a dependency)? → A: Inline CSS - Use inline styles directly in React components

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Error Boundary Protection (Priority: P1)

As a developer using the scaffold template, I want the application to gracefully handle unexpected React rendering errors so that users see a helpful error message instead of a blank screen, and I can debug issues more effectively.

**Why this priority**: Application stability is foundational. Without error boundaries, a single component crash can break the entire application, causing user frustration and lost data.

**Independent Test**: Can be fully tested by intentionally throwing an error in a React component and verifying the fallback UI displays with "Something went wrong" message, reload button, and home button.

**Acceptance Scenarios**:

1. **Given** a React component throws an error during rendering, **When** the error propagates up the component tree, **Then** the AppErrorBoundary catches it and displays a user-friendly error page with options to reload or go home
2. **Given** an error is caught by the boundary, **When** the error is processed, **Then** the error details (message, component stack) are logged using the structured logging system
3. **Given** a user authenticates without a role claim, **When** the AuthProvider processes their token, **Then** the user defaults to 'viewer' role (not 'admin') for security

---

### User Story 2 - Admin Authentication Flow (Priority: P1)

As an admin user, I want to be automatically redirected to the admin dashboard after login, and I want to be able to sign out securely.

**Why this priority**: Authentication flow is essential for admin security and user experience. Users should not have to manually navigate after login.

**Independent Test**: Can be fully tested by signing in with admin credentials, verifying redirect to /admin, then clicking Sign Out and verifying redirect to sign-in page.

**Acceptance Scenarios**:

1. **Given** I am on the sign-in page and enter valid admin credentials, **When** I submit the form, **Then** I am redirected to /admin with `replace: true` navigation
2. **Given** I am already authenticated as an admin, **When** I navigate to /sign-in, **Then** I am automatically redirected to /admin
3. **Given** I am on the Account Settings page, **When** I click Sign Out, **Then** my session is cleared and I am redirected to /sign-in with `replace: true`
4. **Given** I am on the Account Settings page, **When** I view my profile, **Then** I see my email and role displayed

---

### User Story 3 - Firestore CI/CD Deployment (Priority: P2)

As a developer, I want Firestore rules and indexes to be automatically deployed when I push changes to the main branch, so that database security rules are always in sync with code.

**Why this priority**: Automated deployment prevents manual errors and ensures security rules are consistently applied.

**Independent Test**: Can be tested by modifying firestore.rules or firestore.indexes.json, pushing to main, and verifying the GitHub Actions workflow deploys changes.

**Acceptance Scenarios**:

1. **Given** I modify firestore.rules and push to main, **When** the workflow runs, **Then** only Firestore rules are deployed (not indexes)
2. **Given** I modify firestore.indexes.json and push to main, **When** the workflow runs, **Then** only Firestore indexes are deployed (not rules)
3. **Given** I want to manually deploy, **When** I trigger the workflow via workflow_dispatch, **Then** I can choose to deploy rules, indexes, or both
4. **Given** invalid JSON in firestore.indexes.json, **When** the workflow runs, **Then** validation fails and deployment is blocked
5. **Given** concurrent workflows are triggered, **When** a PR event occurs, **Then** previous PR workflows are cancelled to save resources

---

### User Story 4 - Structured Logging Infrastructure (Priority: P2)

As a developer, I want structured logging with correlation IDs and automatic request tracing so that I can effectively debug issues across frontend and backend.

**Why this priority**: Debugging production issues without proper logging is nearly impossible. Structured logging with correlation enables request tracing.

**Independent Test**: Can be tested by making an API request, verifying logs contain correlation ID in both request and response, and verifying JSON format in production mode.

**Acceptance Scenarios**:

1. **Given** an HTTP request is made to the API, **When** the request is processed, **Then** logs include correlation ID, request timing, method, URL, and status code
2. **Given** the API is running in production, **When** logs are emitted, **Then** they are formatted as JSON compatible with Google Cloud Logging
3. **Given** the API is running in development, **When** logs are emitted, **Then** they are pretty-printed for readability
4. **Given** a frontend error occurs, **When** the error is logged, **Then** it is automatically reported to the backend with breadcrumbs showing user actions
5. **Given** log data contains sensitive fields (password, token, apiKey, secret), **When** the data is logged, **Then** sensitive values are replaced with [REDACTED]
6. **Given** I want to debug in the browser, **When** I set localStorage.LOG_LEVEL to DEBUG, **Then** debug logs appear in the console

---

### User Story 5 - Pre-commit Hook Setup (Priority: P3)

As a developer, I want pre-commit hooks to automatically check and fix code issues before I commit, so that the CI build doesn't fail due to linting errors.

**Why this priority**: Catching issues locally saves CI time and prevents broken commits, but it's not critical for core functionality.

**Independent Test**: Can be tested by staging files with linting issues and attempting to commit, verifying Biome runs and either auto-fixes or blocks the commit.

**Acceptance Scenarios**:

1. **Given** I have staged files with fixable linting issues, **When** I run git commit, **Then** Biome auto-fixes the issues and re-stages the files
2. **Given** I have staged files with unfixable linting issues, **When** I run git commit, **Then** the commit is blocked and errors are displayed
3. **Given** I have staged files affecting multiple projects, **When** I run git commit, **Then** Nx runs lint, test, and build for affected projects

---

### Edge Cases

- What happens when the correlation middleware receives an invalid X-Correlation-ID header? (Should generate a new valid ID)
- How does the error boundary handle errors thrown during the error state render? (Should not cause infinite loop)
- What happens if AsyncLocalStorage context is lost in async operations? (Should return 'no-correlation' as fallback)
- What happens when frontend error reporting endpoint is unavailable? (Should fail silently to console.error)

## Requirements *(mandatory)*

### Functional Requirements

**Error Boundary (PR #7)**

- **FR-001**: System MUST provide an `AppErrorBoundary` React class component that catches all uncaught rendering errors
- **FR-002**: Error boundary MUST display a fallback UI showing error message, reload button, and go home button (using inline CSS styles, no external dependencies)
- **FR-003**: Error boundary MUST log caught errors using structured logging with component stack trace and breadcrumbs
- **FR-004**: AuthProvider MUST default users without role claims to 'viewer' role (not 'admin') for security

**Admin Auth Flow (PR #10)**

- **FR-014**: SignInForm MUST navigate to '/admin' with `replace: true` after successful authentication
- **FR-015**: SignInPage MUST redirect authenticated admin users to '/admin' using React Router Navigate component
- **FR-016**: System MUST provide AccountSettingsPage at `/admin/settings` displaying user email and role (using inline CSS styles, no external dependencies)
- **FR-017**: AccountSettingsPage MUST include Sign Out button that calls signOut() and navigates to '/sign-in'

**Firestore CI/CD (PR #7)**

- **FR-019**: System MUST provide GitHub Actions workflow at `.github/workflows/deploy-firestore.yml`
- **FR-020**: Workflow MUST trigger on push to main and pull_request when firestore.rules or firestore.indexes.json change
- **FR-021**: Workflow MUST support workflow_dispatch with deploy_rules and deploy_indexes boolean inputs
- **FR-022**: Workflow MUST validate firestore.indexes.json syntax using Node.js JSON.parse before deployment
- **FR-023**: Workflow MUST detect which files changed and only deploy modified components
- **FR-024**: Workflow MUST use google-github-actions/auth@v2 with Workload Identity Federation (secrets: GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_SERVICE_ACCOUNT)
- **FR-025**: Workflow MUST use concurrency groups with cancel-in-progress for PR events
- **FR-026**: Workflow MUST output deployment summary to GITHUB_STEP_SUMMARY

**Structured Logging (PR #16)**

- **FR-027**: System MUST provide `libs/logging` library with separate backend and frontend exports
- **FR-028**: Backend MUST export StructuredLogger class implementing NestJS LoggerService interface
- **FR-029**: StructuredLogger MUST support log, error, warn, debug, and verbose methods with NestJS-compatible signatures
- **FR-030**: Logs MUST include severity, message, timestamp, correlationId, service, and component fields
- **FR-031**: Log severity levels MUST match Google Cloud Logging: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **FR-032**: Logs MUST be formatted as JSON in production (NODE_ENV=production) and pretty-printed in development
- **FR-033**: Backend MUST export CorrelationMiddleware using AsyncLocalStorage for request-scoped correlation context
- **FR-034**: Correlation middleware MUST read X-Correlation-ID header, validate it, or generate a new UUID if invalid
- **FR-035**: Correlation middleware MUST parse X-Cloud-Trace-Context header for Google Cloud trace integration
- **FR-036**: Correlation middleware MUST add correlation ID to response headers
- **FR-037**: Backend MUST export RequestLoggingInterceptor for HTTP request/response logging with timing
- **FR-038**: Request interceptor MUST log method, URL, user agent, status code, and latency in milliseconds
- **FR-039**: Frontend MUST export logger object with debug, info, warn, error, and errorWithException methods
- **FR-040**: Frontend MUST export initLogger function requiring service name configuration
- **FR-041**: Frontend logger MUST support localStorage LOG_LEVEL override for debugging
- **FR-042**: Frontend MUST export breadcrumb system (addBreadcrumb, getBreadcrumbs, addClickBreadcrumb, addNavigationBreadcrumb, addApiRequestBreadcrumb, addApiResponseBreadcrumb)
- **FR-043**: Breadcrumb buffer MUST use circular buffer with configurable maxBreadcrumbs (default: 50)
- **FR-044**: Frontend MUST automatically send ERROR/CRITICAL logs to configured errorReportingEndpoint with breadcrumbs and environment info
- **FR-045**: Backend MUST provide LoggingModule.forRoot() with configurable service name, enableRequestLogging, level, and format options
- **FR-046**: Backend MUST expose POST /api/v1/logs/errors endpoint via LoggingController for frontend error reports
- **FR-047**: Shared MUST export redact() function for sensitive data redaction (patterns: password, token, apiKey, secret, authorization, credential, key$, Bearer tokens, JWTs)
- **FR-048**: Redaction MUST have configurable additionalFields, additionalValues, and disableDefaults options
- **FR-049**: System MUST provide types/env.d.ts declaring NodeJS.ProcessEnv with LOG_LEVEL, LOG_FORMAT, NODE_ENV, GCP_PROJECT_ID to resolve TypeScript/Biome conflict

**Pre-commit Hooks (PR #12)**

- **FR-050**: System MUST provide `.husky/pre-commit` script
- **FR-051**: Pre-commit MUST run `biome check --staged --write --no-errors-on-unmatched` to auto-fix staged files
- **FR-052**: Pre-commit MUST run `git update-index --again` after Biome fixes to re-stage modified files
- **FR-053**: Pre-commit MUST run `biome check --staged --no-errors-on-unmatched` to verify no remaining errors
- **FR-054**: Pre-commit MUST run `npx nx affected -t lint test build --base=HEAD --parallel=3` for affected projects

### Key Entities

- **LogEntry**: Structured log record with severity, message, timestamp, correlationId, service, component, context, error, httpRequest, userId, breadcrumbs
- **CorrelationContext**: Request-scoped context with correlationId, traceId, spanId, userId, operation, startTime
- **Breadcrumb**: User action record with type (click, navigation, input, api_request, api_response, error, custom), timestamp, message, category, data
- **LoggerConfig**: Logger configuration with level, format, service, defaultContext, redaction, maxBreadcrumbs, errorReportingEndpoint
- **RedactionConfig**: Redaction settings with additionalFields, additionalValues, disableDefaults

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All React rendering errors are caught and displayed to users with recovery options (100% error capture rate)
- **SC-003**: Authenticated admin users are redirected to dashboard within 500ms of completing sign-in
- **SC-004**: Firestore rules/indexes are deployed automatically within 5 minutes of merging to main
- **SC-005**: All API requests are logged with correlation IDs that can trace a request end-to-end
- **SC-006**: Developers can identify and filter logs by severity level in production
- **SC-007**: No sensitive data (passwords, tokens, API keys) appears in log output
- **SC-008**: Pre-commit hooks prevent commits with linting errors (0% of linting errors reach CI)
- **SC-009**: Frontend errors are reported to backend with sufficient context (breadcrumbs, stack trace) to reproduce issues

## Technical Implementation Details

This section provides one-to-one implementation details from foster-bridge PRs for accurate porting.

### File Structure

```
apps/web/src/
├── app/
│   ├── app-error-boundary.tsx           # AppErrorBoundary class component
│   └── providers/
│       └── auth-provider.tsx            # AuthProvider with viewer default
├── pages/
│   ├── sign-in/
│   │   └── sign-in-page.tsx             # With redirect for authenticated users
│   └── admin/
│       ├── home/
│       │   └── admin-home-page.tsx      # Admin landing page
│       └── settings/
│           └── account-settings-page.tsx # User email, role, sign out
├── features/
│   └── auth/
│       └── ui/
│           └── sign-in-form.tsx          # With /admin redirect on success

apps/api/src/
├── logging/
│   ├── logging.module.ts                 # LoggingModule.forRoot()
│   ├── logging.controller.ts             # POST /api/v1/logs/errors
│   └── dto/
│       └── frontend-error-report.dto.ts  # Validation DTOs
└── main.ts                               # Logger initialization

libs/logging/
├── src/
│   ├── index.ts                          # Main exports
│   └── lib/
│       ├── index.ts
│       ├── backend/
│       │   ├── index.ts                  # Backend exports
│       │   ├── nest-logger.service.ts    # StructuredLogger
│       │   ├── correlation.middleware.ts # AsyncLocalStorage correlation
│       │   └── request-logging.interceptor.ts
│       ├── frontend/
│       │   ├── index.ts                  # Frontend exports
│       │   ├── logger.ts                 # Frontend logger
│       │   ├── breadcrumb.ts             # BreadcrumbBuffer
│       │   ├── correlation.ts            # Frontend correlation
│       │   └── error-boundary.tsx        # React error boundary
│       └── shared/
│           ├── index.ts
│           ├── types.ts                  # LogEntry, LogSeverity, etc.
│           ├── correlation.ts            # generateCorrelationId
│           ├── formatters.ts             # JSON/pretty formatters
│           └── redaction.ts              # Sensitive data redaction
├── project.json                          # Nx project config
├── package.json                          # Package metadata
└── tsconfig.*.json                       # TypeScript configs

types/
└── env.d.ts                              # NodeJS.ProcessEnv augmentation

.github/workflows/
└── deploy-firestore.yml                  # Firestore CI/CD

.husky/
└── pre-commit                            # Pre-commit hook script
```

### Key Implementation Patterns

**AuthProvider Role Default (auth-provider.tsx:35)**:
```typescript
const role = (tokenResult.claims.role as AuthUser['role']) ?? 'viewer';
```

**AsyncLocalStorage Correlation (correlation.middleware.ts)**:
```typescript
const correlationStorage = new AsyncLocalStorage<CorrelationContext>();
export function getCorrelationContext(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}
```

**Pre-commit Hook Commands**:
```bash
biome check --staged --write --no-errors-on-unmatched && git update-index --again
biome check --staged --no-errors-on-unmatched
npx nx affected -t lint test build --base=HEAD --parallel=3
```

**Environment Variable Type Declaration (types/env.d.ts)**:
```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'test';
    LOG_LEVEL?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    LOG_FORMAT?: 'json' | 'pretty';
    GCP_PROJECT_ID?: string;
  }
}
```

### Dependencies to Add

```json
{
  "devDependencies": {
    "husky": "^9.x"
  }
}
```

Note: React Router, NestJS, Firebase Admin SDK, and other core dependencies are already in the scaffold template. MUI is NOT a dependency for the scaffold repo.
