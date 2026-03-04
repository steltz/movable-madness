# Quickstart: Port foster-bridge Features

**Date**: 2026-01-18 | **Branch**: `006-port-foster-bridge`

## Prerequisites

- Node.js 18+
- pnpm 9.15.4+
- Firebase project with Auth enabled
- GCP project with Workload Identity Federation (for Firestore CI/CD)
- GitHub repository secrets configured (for CI/CD)

## Installation

```bash
# Clone and checkout feature branch
git checkout 006-port-foster-bridge

# Install dependencies (husky should already be present)
pnpm install

# Verify husky is set up
ls -la .husky/
```

## Feature-Specific Setup

### 1. Error Boundary

No additional setup required. The error boundary wraps the entire app automatically.

**Test it:**
```tsx
// Temporarily add to any component to test:
throw new Error('Test error boundary');
```

### 2. Admin Auth Flow

**Setup React Router:**
The scaffold migrates from hash-based routing to React Router:

```bash
# Already in dependencies, just verify
pnpm list react-router-dom
```

**Test auth flow:**
1. Navigate to `/sign-in`
2. Sign in with admin credentials
3. Verify redirect to `/admin`
4. Navigate to `/admin/settings`
5. Click "Sign Out"
6. Verify redirect to `/sign-in`

### 3. Structured Logging (Backend)

**Initialize in main.ts:**
```typescript
import { LoggingModule, StructuredLogger } from '@workspace/logging';

// In bootstrap():
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(app.get(StructuredLogger));
```

**Add LoggingModule to AppModule:**
```typescript
@Module({
  imports: [
    LoggingModule.forRoot({
      service: 'api',
      enableRequestLogging: true,
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

**Environment variables:**
```bash
# .env (local development)
NODE_ENV=development
LOG_LEVEL=DEBUG
LOG_FORMAT=pretty

# Production
NODE_ENV=production
LOG_LEVEL=INFO
# LOG_FORMAT defaults to json in production
```

### 4. Structured Logging (Frontend)

**Initialize in main.tsx:**
```typescript
import { initLogger } from '@workspace/logging/frontend';

initLogger({
  service: 'web',
  maxBreadcrumbs: 50,
  errorReportingEndpoint: '/api/v1/logs/errors',
});
```

**Use in components:**
```typescript
import { logger, addClickBreadcrumb } from '@workspace/logging/frontend';

function MyComponent() {
  const handleClick = () => {
    addClickBreadcrumb('Submit button', 'button', 'Submit');
    logger.info('Form submitted');
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

**Debug in browser:**
```javascript
// In browser console
localStorage.setItem('LOG_LEVEL', 'DEBUG');
// Refresh the page
```

### 5. Pre-commit Hooks

**Hooks are already installed. Test them:**

```bash
# Make a change with a linting issue
echo "const x = 1" >> apps/web/src/test-file.ts

# Stage and commit
git add apps/web/src/test-file.ts
git commit -m "test: verify pre-commit hook"

# Biome should auto-fix and the commit should proceed
# Or it should fail if there are unfixable issues

# Clean up
git checkout -- apps/web/src/test-file.ts
```

### 6. Firestore CI/CD

**Required GitHub Secrets:**
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Your Workload Identity Provider resource name
- `GCP_SERVICE_ACCOUNT`: Service account email with Firestore deploy permissions

**Test locally:**
```bash
# Validate firestore.indexes.json
node -e "JSON.parse(require('fs').readFileSync('firestore.indexes.json'))"

# Deploy manually (requires gcloud auth)
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

**Trigger workflow:**
```bash
# Modify firestore.rules and push to main
# Or trigger manually via GitHub Actions UI
```

## Verification Checklist

### Error Boundary
- [ ] App wraps content in `<AppErrorBoundary>`
- [ ] Throwing error shows fallback UI
- [ ] "Reload" button refreshes page
- [ ] "Go Home" button navigates to root

### Admin Auth Flow
- [ ] Unauthenticated users on `/admin/*` redirect to `/sign-in`
- [ ] Authenticated users on `/sign-in` redirect to `/admin`
- [ ] Sign-in form navigates to `/admin` on success
- [ ] Account settings shows email and role
- [ ] Sign out clears session and redirects

### Structured Logging (Backend)
- [ ] Logs include correlationId
- [ ] Request/response logging shows timing
- [ ] Production logs are JSON format
- [ ] Development logs are pretty-printed
- [ ] Sensitive data is redacted

### Structured Logging (Frontend)
- [ ] Logger outputs to console
- [ ] Breadcrumbs track user actions
- [ ] Errors auto-report to backend
- [ ] localStorage.LOG_LEVEL override works

### Pre-commit Hooks
- [ ] `biome check --staged` runs on commit
- [ ] Auto-fix re-stages files
- [ ] `nx affected` runs for changed projects

### Firestore CI/CD
- [ ] Workflow triggers on rules/indexes changes
- [ ] JSON validation runs before deploy
- [ ] Manual dispatch works with options
- [ ] Deployment summary appears in PR

## Common Issues

### "Cannot find module '@workspace/logging'"
Run `pnpm install` to ensure the workspace package is linked.

### "AsyncLocalStorage not working"
Ensure correlation middleware is registered in NestJS before other middleware:
```typescript
consumer.apply(CorrelationMiddleware).forRoutes('*');
```

### "Pre-commit hook not running"
Ensure husky is initialized:
```bash
pnpm prepare  # Runs husky install
```

### "Firestore deploy fails with auth error"
Verify Workload Identity Federation is configured correctly:
- Service account has `roles/firebase.admin` or specific Firestore roles
- WIF provider is linked to GitHub repository
- Repository/branch restrictions match

## Next Steps

After verifying all features work:

1. Run the full test suite: `pnpm test`
2. Run the linter: `pnpm lint`
3. Build all projects: `pnpm build`
4. Create a PR to main
