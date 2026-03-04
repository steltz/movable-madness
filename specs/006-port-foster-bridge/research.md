# Research: Port foster-bridge Features

**Date**: 2026-01-18 | **Branch**: `006-port-foster-bridge`

## Overview

This document captures research findings for porting features from foster-bridge to the scaffold template. Since the implementations are already proven in foster-bridge, research focuses on integration patterns and scaffold-specific adaptations.

---

## 1. React Error Boundary Implementation

### Decision
Use a class component extending `React.Component` with `componentDidCatch` and `getDerivedStateFromError` lifecycle methods.

### Rationale
- React Error Boundaries MUST be class components (functional components cannot catch render errors)
- Class components with error boundary lifecycle are the only way to catch errors in the React component tree
- Already proven in foster-bridge PR #7

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| react-error-boundary library | Adds external dependency; not needed for simple use case |
| Functional wrapper with useErrorBoundary | Does not exist in React core; would require library |

### Key Implementation Notes
- Wrap at `App` level to catch all rendering errors
- Log errors with component stack to structured logging
- Provide user-friendly fallback with reload/home options
- Use inline CSS to avoid dependency on UI libraries

---

## 2. AsyncLocalStorage for Request Correlation

### Decision
Use Node.js `AsyncLocalStorage` for request-scoped correlation context in NestJS middleware.

### Rationale
- Built into Node.js (no external dependency)
- Automatically propagates context through async call chains
- NestJS middleware can set context at request start
- All subsequent log calls within the request can access correlation ID

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| cls-hooked library | Node.js AsyncLocalStorage is now stable and preferred |
| Request-scoped providers | More boilerplate; less flexible for utility functions |
| Pass context through all function calls | Intrusive; pollutes function signatures |

### Key Implementation Notes
- Create middleware that runs early in the request pipeline
- Generate UUID if no `X-Correlation-ID` header provided
- Validate incoming correlation IDs (must be valid UUID format)
- Export `getCorrelationContext()` function for logger access

---

## 3. Structured Logging Format

### Decision
Use Google Cloud Logging compatible JSON format in production, pretty-print in development.

### Rationale
- Scaffold targets Firebase/GCP deployment
- Google Cloud Logging has specific field requirements (severity, message, timestamp)
- JSON format enables log aggregation and search
- Pretty-print in dev improves local debugging experience

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| pino/winston | External dependencies; not needed for this scope |
| Always JSON | Poor developer experience during local development |
| Custom format | Would break GCP Logging integration |

### Key Implementation Notes
- Severity levels: DEBUG, INFO, WARNING, ERROR, CRITICAL (match GCP)
- Include: severity, message, timestamp, correlationId, service, component
- Optional fields: error (with stack), httpRequest, userId, breadcrumbs
- Detect environment via `NODE_ENV` for format selection

---

## 4. Sensitive Data Redaction

### Decision
Implement configurable redaction function that replaces sensitive values with `[REDACTED]`.

### Rationale
- Prevents accidental exposure of secrets in logs
- Configurable patterns allow project-specific customization
- Deep object traversal catches nested sensitive data

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Rely on developers to never log secrets | Error-prone; too risky |
| Log scrubbing at aggregation layer | Too late; secrets already in transport |
| Block log calls with sensitive data | Would need static analysis; too complex |

### Key Implementation Notes
- Default patterns: password, token, apiKey, secret, authorization, credential, key$
- Value patterns: Bearer tokens, JWTs (base64 with dots)
- Configurable: additionalFields, additionalValues, disableDefaults
- Recursively traverse objects to catch nested secrets

---

## 5. Frontend Error Reporting

### Decision
Automatic error reporting to backend with breadcrumb trail for reproduction.

### Rationale
- Frontend errors need server-side logging for monitoring
- Breadcrumbs provide context for debugging
- Circular buffer prevents memory bloat

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Sentry/Bugsnag | External service; adds cost and dependency |
| Console.error only | Logs lost when user closes browser |
| Manual error reporting | Developers forget to add it |

### Key Implementation Notes
- Breadcrumb types: click, navigation, input, api_request, api_response, error, custom
- Circular buffer with configurable max (default: 50)
- Auto-send ERROR/CRITICAL level logs to configured endpoint
- Include environment info (userAgent, url, timestamp)

---

## 6. Pre-commit Hook Strategy

### Decision
Use Husky with biome staged file checking and Nx affected targets.

### Rationale
- Husky is industry standard for Git hooks
- Biome `--staged` flag only checks staged files (fast)
- Nx affected ensures related projects are validated
- Auto-fix with re-stage reduces friction

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| lint-staged | Biome has built-in staged file support |
| Full repo lint on commit | Too slow; developers will skip |
| CI-only validation | Feedback loop too slow; wastes CI resources |

### Key Implementation Notes
- Run biome check with `--write` to auto-fix
- Run `git update-index --again` to re-stage fixed files
- Run verification pass without `--write` to ensure clean
- Run nx affected for lint, test, build

---

## 7. GitHub Actions Firestore Deployment

### Decision
Dedicated workflow with change detection and manual dispatch options.

### Rationale
- Automated deployment keeps rules in sync with code
- Change detection avoids unnecessary deployments
- Manual dispatch enables emergency updates
- Concurrency control prevents race conditions

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Deploy on every push | Wastes resources; may hit rate limits |
| Manual deployment only | Error-prone; rules drift from code |
| Deploy both always | Indexes can be slow; unnecessary |

### Key Implementation Notes
- Trigger on: push to main, pull_request (with path filters)
- Path filters: `firestore.rules`, `firestore.indexes.json`
- Manual dispatch with boolean inputs for rules/indexes
- Use Workload Identity Federation (no service account keys)
- JSON validation before deployment

---

## 8. Admin Auth Flow (React Router Navigation)

### Decision
Use React Router's `useNavigate` with `replace: true` for auth redirects.

### Rationale
- Current scaffold uses hash-based routing
- Need to migrate to React Router for proper navigation
- `replace: true` prevents back-button returning to sign-in

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Keep hash-based routing | No programmatic navigation support |
| window.location.href | Full page reload; loses state |
| Custom history wrapper | Reinventing the wheel |

### Key Implementation Notes
- SignInForm navigates to `/admin` on success
- SignInPage redirects authenticated users to `/admin`
- AccountSettingsPage navigates to `/sign-in` on sign out
- Use `<Navigate replace />` component for declarative redirect

### Scaffold Adaptation Required
**Note**: The current scaffold uses hash-based routing (`window.location.hash`). To implement proper auth redirects, we need to:
1. Install `react-router-dom` as a dependency
2. Migrate from hash routing to React Router
3. This is a prerequisite for the admin auth flow features

---

## Dependencies Confirmed

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| husky | ^9.x | Git hooks | Already in package.json |
| react-router-dom | ^6.x | Navigation/routing | **NEEDS INSTALL** |
| @nestjs/swagger | ^11.x | OpenAPI for logging endpoint | Already in package.json |
| firebase-admin | ^13.x | Backend auth verification | Already in package.json |
| firebase | ^12.x | Client auth | Already in package.json |

---

## Environment Variables Required

| Variable | Required In | Purpose |
|----------|-------------|---------|
| `NODE_ENV` | Backend | Format selection (json vs pretty) |
| `LOG_LEVEL` | Backend + Frontend | Minimum log level to output |
| `LOG_FORMAT` | Backend | Force format override |
| `GCP_PROJECT_ID` | Backend | Cloud trace integration |
| `localStorage.LOG_LEVEL` | Frontend | Browser-side log level override |

---

## Summary

All technical decisions are resolved. Key findings:

1. **Error Boundary**: Class component required (React limitation)
2. **Correlation**: AsyncLocalStorage is the modern Node.js solution
3. **Logging Format**: GCP-compatible JSON for production
4. **Redaction**: Configurable patterns with sensible defaults
5. **Breadcrumbs**: Circular buffer with 50 default max
6. **Pre-commit**: Husky + Biome staged + Nx affected
7. **Firestore CI/CD**: Change detection + WIF auth
8. **Auth Flow**: Requires react-router-dom migration

**Ready for Phase 1: Design & Contracts**
