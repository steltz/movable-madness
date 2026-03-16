# App Bar with Breadcrumbs Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent app bar with breadcrumbs, theme toggle, and sign out across all authenticated routes.

**Architecture:** Layout route wrapper pattern — an `AppLayout` component wraps authenticated routes using React Router's `<Outlet />`. The app bar conditionally renders based on auth state. Breadcrumbs are derived from a static route-to-label map.

**Tech Stack:** React 19, React Router v6, shadcn/ui Breadcrumb, Tailwind CSS v4, lucide-react icons, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-15-app-bar-breadcrumbs-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/web/src/app/layouts/app-layout.tsx` | Layout wrapper: conditionally renders AppBar + Outlet based on auth state |
| Create | `apps/web/src/app/layouts/app-layout.spec.tsx` | Tests for AppLayout |
| Create | `apps/web/src/features/app-bar/app-bar.tsx` | AppBar component: logo, breadcrumbs, theme toggle, sign out |
| Create | `apps/web/src/features/app-bar/app-bar.spec.tsx` | Tests for AppBar |
| Create | `apps/web/src/features/app-bar/use-breadcrumbs.ts` | Hook to derive breadcrumb segments from current URL path |
| Create | `apps/web/src/features/app-bar/use-breadcrumbs.spec.ts` | Tests for useBreadcrumbs hook |
| Install | `libs/ui/src/components/breadcrumb.tsx` | shadcn Breadcrumb component |
| Modify | `libs/ui/src/index.ts` | Export Breadcrumb components |
| Modify | `apps/web/src/app/app.tsx` | Restructure routes to use AppLayout wrapper |
| Modify | `apps/web/src/pages/home/home-page.tsx` | Remove Dashboard header and min-h-screen wrapper |
| Modify | `apps/web/src/pages/home/home-page.spec.tsx` | Update tests for removed header |
| Modify | `apps/web/src/pages/admin/settings/account-settings-page.tsx` | Remove back link and sign out button |
| Modify | `apps/web/src/pages/admin/home/admin-home-page.tsx` | Remove header bar (keep Account Settings link in page content) |

---

## Chunk 1: Dependencies and Breadcrumb Hook

### Task 1: Install shadcn Breadcrumb component

**Files:**
- Create: `libs/ui/src/components/breadcrumb.tsx`
- Modify: `libs/ui/src/index.ts`

- [ ] **Step 1: Install the shadcn Breadcrumb component**

Run:
```bash
cd libs/ui && npx shadcn@latest add breadcrumb --overwrite
```

If the CLI doesn't work in the Nx monorepo context, manually create the file. The shadcn Breadcrumb component source is available at https://ui.shadcn.com/docs/components/breadcrumb.

- [ ] **Step 2: Export Breadcrumb components from libs/ui**

In `libs/ui/src/index.ts`, add:
```typescript
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/breadcrumb';
```

- [ ] **Step 3: Verify the build**

Run:
```bash
npx nx build ui
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add libs/ui/src/components/breadcrumb.tsx libs/ui/src/index.ts
git commit -m "feat(ui): add shadcn Breadcrumb component"
```

---

### Task 2: Create useBreadcrumbs hook

**Files:**
- Create: `apps/web/src/features/app-bar/use-breadcrumbs.ts`
- Test: `apps/web/src/features/app-bar/use-breadcrumbs.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/features/app-bar/use-breadcrumbs.spec.ts`:

```typescript
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useBreadcrumbs } from './use-breadcrumbs';

function renderWithRouter(initialPath: string) {
  return renderHook(() => useBreadcrumbs(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    ),
  });
}

describe('useBreadcrumbs', () => {
  it('should return only Home for root path', () => {
    const { result } = renderWithRouter('/');
    expect(result.current).toEqual([{ label: 'Home', path: '/', isCurrentPage: true }]);
  });

  it('should return Home and Brackets for /brackets', () => {
    const { result } = renderWithRouter('/brackets');
    expect(result.current).toEqual([
      { label: 'Home', path: '/', isCurrentPage: false },
      { label: 'Brackets', path: '/brackets', isCurrentPage: true },
    ]);
  });

  it('should return Home, Brackets, and Edit Bracket for /brackets/edit', () => {
    const { result } = renderWithRouter('/brackets/edit');
    expect(result.current).toEqual([
      { label: 'Home', path: '/', isCurrentPage: false },
      { label: 'Brackets', path: '/brackets', isCurrentPage: false },
      { label: 'Edit Bracket', path: '/brackets/edit', isCurrentPage: true },
    ]);
  });

  it('should return Home and Admin for /admin', () => {
    const { result } = renderWithRouter('/admin');
    expect(result.current).toEqual([
      { label: 'Home', path: '/', isCurrentPage: false },
      { label: 'Admin', path: '/admin', isCurrentPage: true },
    ]);
  });

  it('should return Home, Admin, and Settings for /admin/settings', () => {
    const { result } = renderWithRouter('/admin/settings');
    expect(result.current).toEqual([
      { label: 'Home', path: '/', isCurrentPage: false },
      { label: 'Admin', path: '/admin', isCurrentPage: false },
      { label: 'Settings', path: '/admin/settings', isCurrentPage: true },
    ]);
  });

  it('should use capitalized segment name for unknown paths', () => {
    const { result } = renderWithRouter('/unknown');
    expect(result.current).toEqual([
      { label: 'Home', path: '/', isCurrentPage: false },
      { label: 'Unknown', path: '/unknown', isCurrentPage: true },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run apps/web/src/features/app-bar/use-breadcrumbs.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement useBreadcrumbs hook**

Create `apps/web/src/features/app-bar/use-breadcrumbs.ts`:

```typescript
import { useLocation } from 'react-router-dom';

export interface BreadcrumbSegment {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/brackets': 'Brackets',
  '/brackets/edit': 'Edit Bracket',
  '/admin': 'Admin',
  '/admin/settings': 'Settings',
};

export function useBreadcrumbs(): BreadcrumbSegment[] {
  const { pathname } = useLocation();

  if (pathname === '/') {
    return [{ label: 'Home', path: '/', isCurrentPage: true }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbSegment[] = [{ label: 'Home', path: '/', isCurrentPage: false }];

  segments.forEach((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    const label = ROUTE_LABELS[path] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, path, isCurrentPage: isLast });
  });

  return crumbs;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run apps/web/src/features/app-bar/use-breadcrumbs.spec.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/app-bar/use-breadcrumbs.ts apps/web/src/features/app-bar/use-breadcrumbs.spec.ts
git commit -m "feat(app-bar): add useBreadcrumbs hook with tests"
```

---

## Chunk 2: AppBar Component

### Task 3: Create AppBar component

**Files:**
- Create: `apps/web/src/features/app-bar/app-bar.tsx`
- Test: `apps/web/src/features/app-bar/app-bar.spec.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/features/app-bar/app-bar.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppBar } from './app-bar';

const mockSetTheme = vi.fn();
let mockTheme = 'dark';

vi.mock('../../app/providers/theme-provider', () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
}));

const mockSignOut = vi.fn().mockResolvedValue(undefined);
vi.mock('../auth', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderAppBar = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppBar />
    </MemoryRouter>,
  );

describe('AppBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = 'dark';
  });

  it('should render the app name linking to home', () => {
    renderAppBar();
    const link = screen.getByText('Movable Madness');
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('should render breadcrumbs for the current path', () => {
    renderAppBar('/brackets');
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Brackets')).toBeInTheDocument();
  });

  it('should render ancestor breadcrumbs as links', () => {
    renderAppBar('/admin/settings');
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
    const adminLink = screen.getByText('Admin').closest('a');
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('should render current page breadcrumb as non-link text', () => {
    renderAppBar('/admin/settings');
    const settings = screen.getByText('Settings');
    expect(settings.closest('a')).toBeNull();
  });

  it('should render sign out button', () => {
    renderAppBar();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('should call signOut and navigate to /sign-in on sign out click', async () => {
    const user = userEvent.setup();
    renderAppBar();
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/sign-in', { replace: true });
  });

  it('should render theme toggle button', () => {
    renderAppBar();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('should toggle theme from dark to light', async () => {
    mockTheme = 'dark';
    const user = userEvent.setup();
    renderAppBar();
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should toggle theme from light to dark', async () => {
    mockTheme = 'light';
    const user = userEvent.setup();
    renderAppBar();
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should treat system theme as dark and toggle to light', async () => {
    mockTheme = 'system';
    const user = userEvent.setup();
    renderAppBar();
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run apps/web/src/features/app-bar/app-bar.spec.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement AppBar component**

Create `apps/web/src/features/app-bar/app-bar.tsx`:

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from '@movable-madness/ui';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../app/providers/theme-provider';
import { signOut } from '../auth';
import { useBreadcrumbs } from './use-breadcrumbs';

export function AppBar() {
  const breadcrumbs = useBreadcrumbs();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const handleToggleTheme = () => {
    // Two-state toggle: dark <-> light. Treat 'system' as dark.
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  const currentPage = breadcrumbs[breadcrumbs.length - 1];

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b-2 border-b-[#E31C79] bg-card px-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-[15px] font-bold text-[#E31C79] hover:text-[#c8186b]">
          Movable Madness
        </Link>

        <span className="text-muted-foreground">/</span>

        {/* Full breadcrumb trail — hidden on small screens */}
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.path}>
                {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                <BreadcrumbItem>
                  {crumb.isCurrentPage ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Current page only — shown on small screens */}
        <span className="text-sm font-medium text-foreground sm:hidden">
          {currentPage.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-1.5 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
```

Note: The `Breadcrumb` component from shadcn uses `<nav>` internally. The first breadcrumb separator after the app name is rendered manually as a `/` span to visually connect the app name to the breadcrumb trail. The breadcrumb component's internal separators use `/` instead of the default `>` via children override on `BreadcrumbSeparator`.

If `BreadcrumbLink` does not support `asChild`, use `<BreadcrumbLink href={crumb.path}>` instead and rely on React Router's `<Link>` integration. Check the installed shadcn component source to confirm the prop API.

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run apps/web/src/features/app-bar/app-bar.spec.tsx
```

Expected: All 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/app-bar/app-bar.tsx apps/web/src/features/app-bar/app-bar.spec.tsx
git commit -m "feat(app-bar): add AppBar component with breadcrumbs, theme toggle, and sign out"
```

---

## Chunk 3: AppLayout and Route Restructuring

### Task 4: Create AppLayout component

**Files:**
- Create: `apps/web/src/app/layouts/app-layout.tsx`
- Test: `apps/web/src/app/layouts/app-layout.spec.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/app/layouts/app-layout.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from './app-layout';

const mockAuthContext = {
  user: null,
  firebaseUser: null,
  loading: false,
  isAuthenticated: false,
  isAnonymous: false,
  bracketName: null,
};

vi.mock('../providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}));

vi.mock('../providers/theme-provider', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

vi.mock('../../features/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

const renderWithRoute = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Home Content</div>} />
          <Route path="/brackets" element={<div>Brackets Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('AppLayout', () => {
  beforeEach(() => {
    mockAuthContext.user = null;
    mockAuthContext.loading = false;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isAnonymous = false;
  });

  it('should render app bar and outlet when authenticated', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { uid: 'test', role: 'admin' as const };
    renderWithRoute('/');
    expect(screen.getByText('Movable Madness')).toBeInTheDocument();
    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });

  it('should render only outlet when not authenticated', () => {
    renderWithRoute('/');
    expect(screen.queryByText('Movable Madness')).not.toBeInTheDocument();
    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });

  it('should render only outlet when loading', () => {
    mockAuthContext.loading = true;
    renderWithRoute('/');
    expect(screen.queryByText('Movable Madness')).not.toBeInTheDocument();
    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run apps/web/src/app/layouts/app-layout.spec.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement AppLayout component**

Create `apps/web/src/app/layouts/app-layout.tsx`:

```tsx
import { Outlet } from 'react-router-dom';
import { AppBar } from '../../features/app-bar/app-bar';
import { useAuthContext } from '../providers/auth-provider';

export function AppLayout() {
  const { isAuthenticated, loading } = useAuthContext();

  return (
    <>
      {isAuthenticated && !loading && <AppBar />}
      <Outlet />
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npx vitest run apps/web/src/app/layouts/app-layout.spec.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/layouts/app-layout.tsx apps/web/src/app/layouts/app-layout.spec.tsx
git commit -m "feat(app-bar): add AppLayout component with conditional app bar rendering"
```

---

### Task 5: Restructure routes in app.tsx

**Files:**
- Modify: `apps/web/src/app/app.tsx`

- [ ] **Step 1: Update app.tsx with layout route wrapper**

In `apps/web/src/app/app.tsx`, add this import alongside the existing imports (e.g. after line 9):

```tsx
import { AppLayout } from './layouts/app-layout';
```

Then replace the `AppRoutes` function body (lines 49-95) with:

```tsx
function AppRoutes() {
  return (
    <Routes>
      {/* No app bar */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/brackets/:bracketId" element={<ViewBracketPage />} />

      {/* App bar shown when authenticated */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/brackets" element={<BracketsDirectoryPage />} />
        <Route
          path="/brackets/edit"
          element={
            <BracketProtectedRoute>
              <BracketEditorPage />
            </BracketProtectedRoute>
          }
        />
        <Route path="/brackets/login" element={<Navigate to="/" replace />} />
        <Route path="/brackets/dashboard" element={<Navigate to="/" replace />} />
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
      </Route>

      {/* 404 - no app bar */}
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
```

The `ProtectedRoute` and `BracketProtectedRoute` functions remain unchanged.

- [ ] **Step 2: Verify the app compiles**

Run:
```bash
npx nx build web
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/app.tsx
git commit -m "feat(app-bar): restructure routes to use AppLayout wrapper"
```

---

## Chunk 4: Page Cleanup

### Task 6: Clean up HomePage Dashboard

**Files:**
- Modify: `apps/web/src/pages/home/home-page.tsx:103-172`
- Modify: `apps/web/src/pages/home/home-page.spec.tsx`

- [ ] **Step 1: Remove header and min-h-screen from Dashboard component**

In `apps/web/src/pages/home/home-page.tsx`, replace the `Dashboard` function (lines 103-172) with:

```tsx
function Dashboard({ bracketName }: { bracketName: string | null }) {
  return (
    <div className="bg-[#f5f5f5] font-[Inter,system-ui,sans-serif]">
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

Changes from original:
- Removed `min-h-screen` from outer div (AppLayout handles page chrome)
- Removed entire `<header>` element (app name + sign out button — now in AppBar)
- Removed `handleSignOut` function and `signOut` import (no longer needed here)

Also remove the `signOut` import from the top of the file (line 5). The `signInAnonymously` import should remain. The updated import line:

```typescript
import { signInAnonymously } from '../../features/auth';
```

- [ ] **Step 2: Update home page tests**

In `apps/web/src/pages/home/home-page.spec.tsx`, update the authenticated dashboard tests (lines 73-110):

Remove the test "should render Sign Out button" (line 100-103) since sign out is now in the AppBar, not the Dashboard.

Update the test "should display the bracket name in the welcome header" — this still works as-is.

Update the test "should render the login form with branding" — the "Movable Madness" text is now only in the AppBar, not in the join form. The join form still has the `🏀` emoji and "Movable Madness" heading. Actually, checking lines 59-60 of `home-page.tsx`, the join form has `<h1>Movable Madness</h1>` — this stays. But the Dashboard no longer has "Movable Madness" in a header. The existing test on line 57 checks for "Movable Madness" in the unauthenticated view, which still renders it. So this test is fine.

The test on line 83 checks for the bracket name in the dashboard — this still works.

Remove the sign out test block (lines 100-103):

```typescript
// DELETE this entire test:
it('should render Sign Out button', () => {
  renderPage();
  expect(screen.getByText('Sign Out')).toBeInTheDocument();
});
```

Also update the `signOut` mock (line 19-22) to remove the now-unused `signOut` mock:

```typescript
// Change from:
vi.mock('../../features/auth', () => ({
  signInAnonymously: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

// Change to:
vi.mock('../../features/auth', () => ({
  signInAnonymously: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
}));
```

- [ ] **Step 3: Run tests to verify they pass**

Run:
```bash
npx vitest run apps/web/src/pages/home/home-page.spec.tsx
```

Expected: All remaining tests PASS. The sign out test is removed.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/home/home-page.tsx apps/web/src/pages/home/home-page.spec.tsx
git commit -m "refactor(home): remove dashboard header, sign out handled by app bar"
```

---

### Task 7: Clean up AccountSettingsPage

**Files:**
- Modify: `apps/web/src/pages/admin/settings/account-settings-page.tsx`

- [ ] **Step 1: Remove back link, sign out button, and header**

In `apps/web/src/pages/admin/settings/account-settings-page.tsx`, replace the entire component with:

```tsx
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@movable-madness/ui';
import { useAuthContext } from '../../../app/providers/auth-provider';

export function AccountSettingsPage() {
  const { user } = useAuthContext();

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-xl p-6">
        <h1 className="mb-6 text-2xl font-semibold text-card-foreground">Account Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Email</p>
              <p className="text-foreground">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">User ID</p>
              <p className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                {user?.uid}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Role</p>
              <Badge variant="secondary">{user?.role}</Badge>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

Changes from original:
- Removed `<header>` with back link and page title — back navigation is now via breadcrumbs
- Moved page title `<h1>` into `<main>` as a simple heading
- Removed the "Account Actions" card with sign out button — sign out is now in AppBar
- Removed `signOut` import, `useNavigate`, `Link`, `Button`, `CardDescription` imports
- Removed `min-h-screen` — AppLayout handles page chrome
- Removed `handleSignOut` function

- [ ] **Step 2: Verify build**

Run:
```bash
npx nx build web
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/admin/settings/account-settings-page.tsx
git commit -m "refactor(admin): remove back link and sign out from account settings, handled by app bar"
```

---

### Task 8: Clean up AdminHomePage

**Files:**
- Modify: `apps/web/src/pages/admin/home/admin-home-page.tsx`

- [ ] **Step 1: Remove header bar, keep Account Settings link in page content**

In `apps/web/src/pages/admin/home/admin-home-page.tsx`, replace the component with:

```tsx
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movable-madness/ui';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';

export function AdminHomePage() {
  const { user } = useAuthContext();

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-card-foreground">Admin Dashboard</h1>
          <Button variant="ghost" asChild>
            <Link to="/admin/settings">Account Settings</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
            <CardDescription>
              You are signed in as <strong>{user?.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Role: <Badge variant="secondary">{user?.role}</Badge>
            </p>
          </CardContent>
        </Card>

        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Settings</CardTitle>
              <CardDescription>Configure application settings</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

Changes from original:
- Removed `<header>` with border-b styling — replaced with inline flex row for title + Account Settings link
- Removed `min-h-screen` — AppLayout handles page chrome
- Kept Account Settings link (breadcrumbs don't provide forward navigation)

- [ ] **Step 2: Verify build**

Run:
```bash
npx nx build web
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/admin/home/admin-home-page.tsx
git commit -m "refactor(admin): remove header bar from admin home, handled by app bar"
```

---

### Task 9: Run full test suite

- [ ] **Step 1: Run all web tests**

Run:
```bash
npx vitest run --project web
```

If that doesn't work, try:
```bash
npx nx test web
```

Expected: All tests pass.

- [ ] **Step 2: Run linter**

Run:
```bash
npx nx lint web
```

Expected: No lint errors. Biome may auto-reorder imports — if so, stage and commit the changes.

- [ ] **Step 3: Final commit if needed**

If Biome made formatting changes:
```bash
git add -A
git commit -m "style: apply biome formatting"
```
