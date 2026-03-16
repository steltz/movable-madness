# Brackets Homepage Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` the main brackets homepage — showing a login form for unauthenticated users and the dashboard for authenticated bracket players.

**Architecture:** A single `HomePage` component replaces the dev homepage. It checks auth state via `useAuthContext` and conditionally renders the login form or dashboard. Old `/brackets/login` and `/brackets/dashboard` routes redirect to `/`.

**Tech Stack:** React 19, React Router v7, Vitest, Testing Library, shadcn/ui, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-15-brackets-homepage-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `apps/web/src/pages/home/home-page.tsx` | Create | Unified homepage: auth-conditional login form / dashboard |
| `apps/web/src/pages/home/home-page.spec.tsx` | Create | Tests for both auth states of the homepage |
| `apps/web/src/app/app.tsx` | Modify | Update routes, redirects, remove old `HomePage`, update `BracketProtectedRoute` |
| `apps/web/src/features/bracket/ui/bracket-editor-page.tsx` | Modify | Update redirect from `/brackets/dashboard` to `/` |
| `apps/web/src/pages/bracket/login/bracket-login-page.tsx` | Delete | Logic moved to homepage |
| `apps/web/src/pages/bracket/login/bracket-login-page.spec.tsx` | Delete | Tests moved to homepage |
| `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx` | Delete | Logic moved to homepage |
| `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.spec.tsx` | Delete | Tests moved to homepage |

---

## Chunk 1: Create the Homepage Component and Tests

### Task 1: Write homepage tests for unauthenticated state

**Files:**
- Create: `apps/web/src/pages/home/home-page.spec.tsx`

- [ ] **Step 1: Write tests for the login form (unauthenticated) view**

First create the directory: `mkdir -p apps/web/src/pages/home`

Create `apps/web/src/pages/home/home-page.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';

const mockAuthContext = {
  user: null,
  firebaseUser: null,
  loading: false,
  isAuthenticated: false,
  isAnonymous: false,
  bracketName: null,
};

vi.mock('../../app/providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}));

vi.mock('../../features/auth', () => ({
  signInAnonymously: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../shared/api/api-client', () => ({
  post: vi.fn().mockResolvedValue({ success: true }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('HomePage', () => {
  beforeEach(() => {
    mockAuthContext.user = null;
    mockAuthContext.firebaseUser = null;
    mockAuthContext.loading = false;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isAnonymous = false;
    mockAuthContext.bracketName = null;
  });

  describe('loading state', () => {
    it('should show loading text while auth initializes', () => {
      mockAuthContext.loading = true;
      renderPage();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('unauthenticated (login form)', () => {
    it('should render the login form with branding', () => {
      renderPage();
      expect(screen.getByText('Movable Madness')).toBeInTheDocument();
      expect(screen.getByText('Join Tournament')).toBeInTheDocument();
      expect(screen.getByLabelText(/bracket name/i)).toBeInTheDocument();
    });

    it('should show browser session warning', () => {
      renderPage();
      expect(screen.getByText(/same browser/i)).toBeInTheDocument();
    });

    it('should show error when submitting empty bracket name', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Join Tournament'));
      expect(await screen.findByText('Please enter a bracket name')).toBeInTheDocument();
    });
  });

  describe('authenticated bracket player (dashboard)', () => {
    beforeEach(() => {
      mockAuthContext.user = { uid: 'test-uid', role: 'bracket_user' as const };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.isAnonymous = true;
      mockAuthContext.bracketName = "Nick's Final Four";
    });

    it('should display the bracket name in the welcome header', () => {
      renderPage();
      expect(screen.getByText(/Nick's Final Four/)).toBeInTheDocument();
    });

    it('should render Edit My Bracket card linking to /brackets/edit', () => {
      renderPage();
      expect(screen.getByText('Edit My Bracket')).toBeInTheDocument();
      const link = screen.getByText('Edit My Bracket').closest('a');
      expect(link).toHaveAttribute('href', '/brackets/edit');
    });

    it('should render View Submitted Brackets card linking to /brackets', () => {
      renderPage();
      expect(screen.getByText('View Submitted Brackets')).toBeInTheDocument();
      const link = screen.getByText('View Submitted Brackets').closest('a');
      expect(link).toHaveAttribute('href', '/brackets');
    });

    it('should render Sign Out button', () => {
      renderPage();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should show fallback name when bracketName is null', () => {
      mockAuthContext.bracketName = null;
      renderPage();
      expect(screen.getByText(/Player/)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx nx test web -- --run --reporter=verbose home-page`
Expected: FAIL — `home-page.tsx` does not exist yet.

- [ ] **Step 3: Commit the test file**

```bash
git add apps/web/src/pages/home/home-page.spec.tsx
git commit -m "test: add homepage tests for login and dashboard views"
```

---

### Task 2: Implement the unified HomePage component

**Files:**
- Create: `apps/web/src/pages/home/home-page.tsx`

- [ ] **Step 1: Create the HomePage component**

Create `apps/web/src/pages/home/home-page.tsx`:

```tsx
import { Button, Input, Label } from '@movable-madness/ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/auth-provider';
import { signInAnonymously, signOut } from '../../features/auth';
import { post } from '../../shared/api/api-client';

export function HomePage() {
  const { isAuthenticated, isAnonymous, loading, bracketName } = useAuthContext();
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Show dashboard for authenticated anonymous users (bracket players)
  // The submitting guard prevents premature flip to dashboard during join flow
  const showDashboard = isAuthenticated && isAnonymous && !submitting;

  if (showDashboard) {
    return <Dashboard bracketName={bracketName} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = inputName.trim();
    if (!trimmed) {
      setError('Please enter a bracket name');
      return;
    }
    if (trimmed.length > 50) {
      setError('Bracket name must be 50 characters or less');
      return;
    }

    setSubmitting(true);
    try {
      await signInAnonymously();
      await post('/brackets/join', { bracketName: trimmed });
      // Auth state change triggers re-render to dashboard view
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4 font-[Inter,system-ui,sans-serif]">
      <div className="w-full max-w-[400px] rounded-xl bg-white p-10 shadow-[0_4px_24px_rgba(0,0,0,0.08)] text-center">
        <div className="mb-2 text-4xl">🏀</div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Movable Madness</h1>
        <p className="mb-8 text-sm text-gray-500">Enter your bracket name to get started</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 text-left">
            <Label htmlFor="bracketName" className="mb-1.5 block text-xs font-medium text-gray-600">
              Bracket Name
            </Label>
            <Input
              id="bracketName"
              type="text"
              placeholder="e.g., Nick's Final Four"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              maxLength={50}
              disabled={submitting}
              className="w-full dark:text-gray-900"
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#E31C79] py-3 text-sm font-semibold text-white hover:bg-[#c8186b] disabled:opacity-50"
          >
            {submitting ? 'Joining...' : 'Join Tournament'}
          </Button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#FFF8E1] p-3 text-left">
          <span className="flex-shrink-0 text-base">⚠️</span>
          <p className="text-xs leading-relaxed text-[#7a6520]">
            You must use the same browser to return to your picks. Your session is tied to this
            browser only.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ bracketName }: { bracketName: string | null }) {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-[Inter,system-ui,sans-serif]">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏀</span>
          <span className="text-lg font-bold text-gray-900">Movable Madness</span>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="text-sm font-medium text-[#E31C79] hover:text-[#c8186b]"
        >
          Sign Out
        </Button>
      </header>

      <main className="mx-auto max-w-[640px] px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-1.5 text-2xl font-bold text-gray-900">
            Welcome, {bracketName ?? 'Player'}! 👋
          </h1>
          <p className="text-base text-gray-500">What would you like to do?</p>
        </div>

        <div className="flex flex-col gap-5">
          <Link to="/brackets/edit" className="block">
            <div className="rounded-xl border-t-[3px] border-t-[#E31C79] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FDE8F1] text-2xl">
                  ✏️
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">Edit My Bracket</h3>
                  <p className="text-sm text-gray-500">Make your picks for all 64 teams</p>
                </div>
                <span className="text-xl text-gray-300">→</span>
              </div>
            </div>
          </Link>

          <Link to="/brackets" className="block">
            <div className="rounded-xl border-t-[3px] border-t-[#E31C79] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FDE8F1] text-2xl">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    View Submitted Brackets
                  </h3>
                  <p className="text-sm text-gray-500">See how others filled out their brackets</p>
                </div>
                <span className="text-xl text-gray-300">→</span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx nx test web -- --run --reporter=verbose home-page`
Expected: All 9 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/home/home-page.tsx
git commit -m "feat: add unified brackets homepage component"
```

---

## Chunk 2: Update Routing and Clean Up Old Files

### Task 3: Update app.tsx routing

**Files:**
- Modify: `apps/web/src/app/app.tsx`

- [ ] **Step 1: Update app.tsx**

In `apps/web/src/app/app.tsx`, make these changes:

1. Remove imports for `BracketLoginPage`, `BracketDashboardPage`, `ApiResponse`, `useEffect`, `signOut`, and `Link` (if no longer used by remaining code — `Link` is still used in the 404 route).
2. Remove the old inline `HomePage` function (lines 18-80).
3. Add import for the new `HomePage`:
   ```tsx
   import { HomePage } from '../pages/home/home-page';
   ```
4. Remove unused imports: `ApiResponse` from `@movable-madness/shared-types`, `useEffect` and `useState` from `react`, `signOut` from `../features/auth`. Keep `Link` (used in 404 route) and `Button` only if still used (it's not — remove it too).
5. Update `BracketProtectedRoute` redirect target (line 112):
   ```tsx
   // Change:
   return <Navigate to="/brackets/login" replace />;
   // To:
   return <Navigate to="/" replace />;
   ```
6. Update `AppRoutes` — replace the old route definitions for `/`, `/brackets/login`, `/brackets/dashboard`:
   ```tsx
   <Route path="/" element={<HomePage />} />
   <Route path="/brackets/login" element={<Navigate to="/" replace />} />
   <Route path="/brackets/dashboard" element={<Navigate to="/" replace />} />
   ```

The full updated `app.tsx` should be:

```tsx
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { BracketEditorPage } from '../features/bracket';
import { AdminHomePage } from '../pages/admin/home/admin-home-page';
import { AccountSettingsPage } from '../pages/admin/settings/account-settings-page';
import { BracketsDirectoryPage } from '../pages/brackets/brackets-directory-page';
import { ViewBracketPage } from '../pages/brackets/view/ViewBracketPage';
import { HomePage } from '../pages/home/home-page';
import { SignInPage } from '../pages/sign-in/sign-in-page';
import { AppErrorBoundary } from './app-error-boundary';
import { AuthProvider, useAuthContext } from './providers/auth-provider';
import { ThemeProvider } from './providers/theme-provider';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAnonymous, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || isAnonymous) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

function BracketProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAnonymous, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAnonymous) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/brackets/login" element={<Navigate to="/" replace />} />
      <Route path="/brackets/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/brackets" element={<BracketsDirectoryPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/brackets/:bracketId" element={<ViewBracketPage />} />
      <Route
        path="/brackets/edit"
        element={
          <BracketProtectedRoute>
            <BracketEditorPage />
          </BracketProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
            <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
            <Link to="/" className="text-sm text-[#E31C79] underline hover:text-[#c8186b]">
              Go home
            </Link>
          </div>
        }
      />
    </Routes>
  );
}

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
```

- [ ] **Step 2: Run tests to verify nothing broke**

Run: `npx nx test web -- --run --reporter=verbose`
Expected: All tests PASS (homepage tests + any other existing tests).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/app.tsx
git commit -m "feat: update routing to use unified homepage with redirects"
```

---

### Task 4: Update bracket editor redirect

**Files:**
- Modify: `apps/web/src/features/bracket/ui/bracket-editor-page.tsx:11`

- [ ] **Step 1: Update the redirect target**

In `apps/web/src/features/bracket/ui/bracket-editor-page.tsx`, change line 11:

```tsx
// From:
return <Navigate to="/brackets/dashboard" replace />;
// To:
return <Navigate to="/" replace />;
```

- [ ] **Step 2: Run tests**

Run: `npx nx test web -- --run --reporter=verbose`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/bracket/ui/bracket-editor-page.tsx
git commit -m "fix: update bracket editor redirect to homepage"
```

---

### Task 5: Delete old login and dashboard files

**Files:**
- Delete: `apps/web/src/pages/bracket/login/bracket-login-page.tsx`
- Delete: `apps/web/src/pages/bracket/login/bracket-login-page.spec.tsx`
- Delete: `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx`
- Delete: `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.spec.tsx`

- [ ] **Step 1: Delete the old files and empty directories**

```bash
rm apps/web/src/pages/bracket/login/bracket-login-page.tsx
rm apps/web/src/pages/bracket/login/bracket-login-page.spec.tsx
rmdir apps/web/src/pages/bracket/login
rm apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx
rm apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.spec.tsx
rmdir apps/web/src/pages/bracket/dashboard
```

If the `apps/web/src/pages/bracket/` directory is now empty, remove it too:
```bash
rmdir apps/web/src/pages/bracket 2>/dev/null || true
```

- [ ] **Step 2: Run all tests to verify nothing references the deleted files**

Run: `npx nx test web -- --run --reporter=verbose`
Expected: All tests PASS. No import errors.

- [ ] **Step 3: Run typecheck to verify no broken imports**

Run: `npx nx typecheck web`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/pages/bracket/
git commit -m "refactor: remove old bracket login and dashboard pages"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npx nx test web -- --run --reporter=verbose`
Expected: All tests PASS.

- [ ] **Step 2: Run typecheck**

Run: `npx nx typecheck web`
Expected: No errors.

- [ ] **Step 3: Run lint**

Run: `npx nx lint web`
Expected: No errors.

- [ ] **Step 4: Manual smoke test (optional)**

Start the dev server: `npx nx dev web`

Verify:
- `/` shows login form when not logged in
- Entering a name and clicking "Join Tournament" shows the dashboard
- Dashboard shows "Edit My Bracket" and "View Submitted Brackets" cards
- Sign Out returns to the login form
- `/brackets/login` redirects to `/`
- `/brackets/dashboard` redirects to `/`
- `/brackets/edit` still works for authenticated bracket players
- Admin flow at `/sign-in` → `/admin` is unchanged
