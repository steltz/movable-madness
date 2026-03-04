# Design System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up a design system using shadcn/ui, Tailwind CSS v4, and Radix primitives in a shared `libs/ui` library, then migrate all existing UI components to use it with configurable light/dark theming.

**Architecture:** Create `libs/ui` as an Nx library containing shadcn/ui components and a `cn()` utility. Install Tailwind CSS v4 with the Vite plugin in `apps/web`. Define theme CSS variables in `apps/web/src/styles.css`. Add a `ThemeProvider` for light/dark toggle. Migrate all 6 existing components from inline styles to Tailwind + shadcn/ui components.

**Tech Stack:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`), shadcn/ui, Radix UI primitives, `clsx` + `tailwind-merge`, `tw-animate-css`, `lucide-react`

---

### Task 1: Install Tailwind CSS v4 and shadcn/ui dependencies

**Files:**
- Modify: `package.json` (root)
- Modify: `apps/web/vite.config.mts`

**Step 1: Install dependencies**

Run:
```bash
cd /Users/nicholasstelter/Code/apps/scaffold-repo
pnpm add tailwindcss @tailwindcss/vite tw-animate-css class-variance-authority clsx tailwind-merge lucide-react
```

**Step 2: Add Tailwind Vite plugin to `apps/web/vite.config.mts`**

Add the import and plugin:

```typescript
/// <reference types='vitest' />

import tailwindcss from '@tailwindcss/vite';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [react(), tailwindcss(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  build: {
    outDir: '../../dist/apps/web',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
```

**Step 3: Verify the build still works**

Run: `pnpm nx build web`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml apps/web/vite.config.mts
git commit -m "feat: install Tailwind CSS v4 and shadcn/ui dependencies"
```

---

### Task 2: Create `libs/ui` library with `cn()` utility

**Files:**
- Create: `libs/ui/project.json`
- Create: `libs/ui/tsconfig.json`
- Create: `libs/ui/tsconfig.lib.json`
- Create: `libs/ui/src/index.ts`
- Create: `libs/ui/src/lib/utils.ts`
- Modify: `tsconfig.base.json` (add path aliases)

**Step 1: Create the library directory structure**

```bash
mkdir -p libs/ui/src/lib
mkdir -p libs/ui/src/components
```

**Step 2: Create `libs/ui/project.json`**

```json
{
  "name": "ui",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/ui/src",
  "projectType": "library",
  "tags": [],
  "targets": {}
}
```

**Step 3: Create `libs/ui/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "emitDeclarationOnly": true,
    "declaration": true,
    "noEmit": false
  },
  "files": [],
  "include": [],
  "references": [
    { "path": "./tsconfig.lib.json" }
  ]
}
```

**Step 4: Create `libs/ui/tsconfig.lib.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["src/**/*.spec.ts", "src/**/*.spec.tsx", "src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

**Step 5: Create `libs/ui/src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 6: Create `libs/ui/src/index.ts`**

```typescript
export { cn } from './lib/utils';
```

**Step 7: Add path aliases to `tsconfig.base.json`**

Add these entries to `compilerOptions.paths`:

```json
"@workspace/ui": ["libs/ui/src/index.ts"],
"@workspace/ui/*": ["libs/ui/src/*"]
```

**Step 8: Commit**

```bash
git add libs/ui/ tsconfig.base.json
git commit -m "feat: create libs/ui library with cn() utility"
```

---

### Task 3: Configure shadcn/ui CLI and theme CSS variables

**Files:**
- Create: `components.json` (project root)
- Modify: `apps/web/src/styles.css`

**Step 1: Create `components.json` in project root**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "apps/web/src/styles.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@workspace/ui/components",
    "utils": "@workspace/ui/lib/utils",
    "ui": "@workspace/ui/components",
    "lib": "@workspace/ui/lib",
    "hooks": "@workspace/ui/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Step 2: Write `apps/web/src/styles.css` with Tailwind v4 theme**

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 3: Verify the build**

Run: `pnpm nx build web`
Expected: Build succeeds with Tailwind processing CSS

**Step 4: Commit**

```bash
git add components.json apps/web/src/styles.css
git commit -m "feat: configure shadcn/ui CLI and Tailwind v4 theme variables"
```

---

### Task 4: Add shadcn/ui components (Button, Input, Label, Card, Alert, Badge)

**Files:**
- Create: `libs/ui/src/components/button.tsx`
- Create: `libs/ui/src/components/input.tsx`
- Create: `libs/ui/src/components/label.tsx`
- Create: `libs/ui/src/components/card.tsx`
- Create: `libs/ui/src/components/alert.tsx`
- Create: `libs/ui/src/components/badge.tsx`
- Modify: `libs/ui/src/index.ts`

**Step 1: Try using the shadcn CLI to add components**

```bash
cd /Users/nicholasstelter/Code/apps/scaffold-repo
pnpm dlx shadcn@latest add button input label card alert badge
```

The CLI will read `components.json` and place components in the configured paths. If the CLI doesn't resolve the monorepo aliases correctly, fall back to manual installation in Step 2.

**Step 2: Verify components were created**

Check that files exist in `libs/ui/src/components/`. If the CLI placed them elsewhere (e.g., `src/components/`), move them to `libs/ui/src/components/`.

**Step 3: Fix import paths in generated components**

The shadcn CLI generates imports like `@/lib/utils`. These need to be changed to `../lib/utils` (relative imports within the library) in every generated component file. Search and replace `@/lib/utils` with `../lib/utils` in all files under `libs/ui/src/components/`.

**Step 4: Update `libs/ui/src/index.ts` barrel exports**

```typescript
export { cn } from './lib/utils';

export { Button, buttonVariants } from './components/button';
export { Input } from './components/input';
export { Label } from './components/label';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/card';
export { Alert, AlertTitle, AlertDescription } from './components/alert';
export { Badge, badgeVariants } from './components/badge';
```

**Step 5: Verify the build**

Run: `pnpm nx build web`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add libs/ui/src/
git commit -m "feat: add Button, Input, Label, Card, Alert, Badge shadcn/ui components"
```

---

### Task 5: Add ThemeProvider for light/dark mode

**Files:**
- Create: `apps/web/src/app/providers/theme-provider.tsx`
- Modify: `apps/web/src/app/app.tsx` (wrap with ThemeProvider)
- Modify: `apps/web/index.html` (add script to prevent flash)

**Step 1: Create `apps/web/src/app/providers/theme-provider.tsx`**

```typescript
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Theme) || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === 'system' ? getSystemTheme() : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(getSystemTheme());
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Step 2: Add inline script to `apps/web/index.html` to prevent FOUC**

Add this script inside `<head>`, before any stylesheets:

```html
<script>
  (function() {
    var theme = localStorage.getItem('theme') || 'system';
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(resolved);
  })();
</script>
```

**Step 3: Wrap App with ThemeProvider in `apps/web/src/app/app.tsx`**

Add import:
```typescript
import { ThemeProvider } from './providers/theme-provider';
```

Update the `App` function to wrap with `ThemeProvider`:
```typescript
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
```

**Step 4: Verify the app runs**

Run: `pnpm nx serve web`
Expected: App loads, no FOUC, `<html>` has `light` or `dark` class

**Step 5: Commit**

```bash
git add apps/web/src/app/providers/theme-provider.tsx apps/web/src/app/app.tsx apps/web/index.html
git commit -m "feat: add ThemeProvider for light/dark mode toggle"
```

---

### Task 6: Migrate SignInForm to shadcn/ui components

**Files:**
- Modify: `apps/web/src/features/auth/ui/sign-in-form.tsx`

**Step 1: Rewrite `sign-in-form.tsx`**

Replace the entire file:

```typescript
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@workspace/ui';
import { Button } from '@workspace/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui';
import { Input } from '@workspace/ui';
import { Label } from '@workspace/ui';
import { useAuth } from '../model/use-auth';

interface SignInFormProps {
  onSuccess?: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const { signIn, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter email and password');
      return;
    }

    try {
      await signIn(email, password);
      onSuccess?.();
      navigate('/admin', { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const displayError = formError || error;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {displayError && (
            <Alert variant="destructive">
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@admin.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify the app runs and sign-in form renders**

Run: `pnpm nx serve web`
Navigate to: `http://localhost:4200/sign-in`
Expected: Sign-in form renders with shadcn/ui styled components

**Step 3: Commit**

```bash
git add apps/web/src/features/auth/ui/sign-in-form.tsx
git commit -m "refactor: migrate SignInForm to shadcn/ui components"
```

---

### Task 7: Migrate SignInPage to Tailwind

**Files:**
- Modify: `apps/web/src/pages/sign-in/sign-in-page.tsx`

**Step 1: Rewrite `sign-in-page.tsx`**

```typescript
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/auth-provider';
import { SignInForm } from '../../features/auth';

export function SignInPage() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignInForm />
    </div>
  );
}
```

**Step 2: Verify**

Navigate to `http://localhost:4200/sign-in`
Expected: Page renders centered with proper background

**Step 3: Commit**

```bash
git add apps/web/src/pages/sign-in/sign-in-page.tsx
git commit -m "refactor: migrate SignInPage to Tailwind classes"
```

---

### Task 8: Migrate AdminHomePage to shadcn/ui components

**Files:**
- Modify: `apps/web/src/pages/admin/home/admin-home-page.tsx`

**Step 1: Rewrite `admin-home-page.tsx`**

```typescript
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { Badge } from '@workspace/ui';
import { Button } from '@workspace/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui';

export function AdminHomePage() {
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-semibold text-card-foreground">Admin Dashboard</h1>
        <nav>
          <Button variant="ghost" asChild>
            <Link to="/admin/settings">Account Settings</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl p-6">
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

**Step 2: Verify**

Navigate to `http://localhost:4200/admin` (signed in)
Expected: Dashboard renders with cards, badge, proper theme

**Step 3: Commit**

```bash
git add apps/web/src/pages/admin/home/admin-home-page.tsx
git commit -m "refactor: migrate AdminHomePage to shadcn/ui components"
```

---

### Task 9: Migrate AccountSettingsPage to shadcn/ui components

**Files:**
- Modify: `apps/web/src/pages/admin/settings/account-settings-page.tsx`

**Step 1: Rewrite `account-settings-page.tsx`**

```typescript
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { signOut } from '../../../features/auth';
import { Badge } from '@workspace/ui';
import { Button } from '@workspace/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui';

export function AccountSettingsPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <Button variant="link" className="mb-1 h-auto p-0 text-sm" asChild>
          <Link to="/admin">&larr; Back to Dashboard</Link>
        </Button>
        <h1 className="text-2xl font-semibold text-card-foreground">Account Settings</h1>
      </header>

      <main className="mx-auto max-w-xl p-6">
        <Card className="mb-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Sign out of your account. You will need to sign in again to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

**Step 2: Verify**

Navigate to `http://localhost:4200/admin/settings`
Expected: Settings page renders with cards, badge, destructive sign-out button

**Step 3: Commit**

```bash
git add apps/web/src/pages/admin/settings/account-settings-page.tsx
git commit -m "refactor: migrate AccountSettingsPage to shadcn/ui components"
```

---

### Task 10: Migrate HomePage and ProtectedRoute to Tailwind

**Files:**
- Modify: `apps/web/src/app/app.tsx`

**Step 1: Rewrite the `HomePage` and `ProtectedRoute` components in `app.tsx`**

Replace `HomePage`:

```typescript
function HomePage() {
  const [message, setMessage] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, loading } = useAuthContext();

  useEffect(() => {
    fetch('/api')
      .then((res) => res.json())
      .then((data: ApiResponse<string>) => {
        if (data.success && data.data) {
          setMessage(data.data);
        } else if (data.error) {
          setError(data.error.message);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Nx Monorepo Template</h1>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user?.email} ({user?.role})
              </span>
              <Button variant="destructive" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <a href="/sign-in">Sign In</a>
            </Button>
          )}
        </nav>
      </div>
      {error ? (
        <p className="mt-4 text-destructive">Error: {error}</p>
      ) : (
        <p className="mt-4 text-foreground">API Response: {message}</p>
      )}
    </div>
  );
}
```

Replace `ProtectedRoute`:

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
```

Add `Button` import at the top:

```typescript
import { Button } from '@workspace/ui';
```

**Step 2: Verify**

Navigate to `http://localhost:4200/`
Expected: Home page renders with styled buttons and text

**Step 3: Commit**

```bash
git add apps/web/src/app/app.tsx
git commit -m "refactor: migrate HomePage and ProtectedRoute to Tailwind and shadcn/ui"
```

---

### Task 11: Migrate AppErrorBoundary to Tailwind and shadcn/ui

**Files:**
- Modify: `apps/web/src/app/app-error-boundary.tsx`

**Step 1: Rewrite `app-error-boundary.tsx`**

```typescript
import { logger } from '@workspace/logging/frontend';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.errorWithException('React rendering error caught by error boundary', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-2xl font-bold text-destructive">!</span>
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-card-foreground">
              Something went wrong
            </h1>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              We're sorry, but an unexpected error occurred. Please try reloading the page or return
              to the home page.
            </p>
            {this.state.error && (
              <p className="mb-4 break-words rounded bg-destructive/10 p-3 font-mono text-xs text-destructive">
                {this.state.error.message}
              </p>
            )}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="rounded-md border bg-card px-4 py-2 text-sm font-medium text-card-foreground hover:bg-accent"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Note: We use plain `<button>` elements with Tailwind classes here instead of the shadcn `<Button>` component because this is a class component (error boundaries must be class components in React) and importing JSX components works fine, but keeping it simple with inline Tailwind avoids any potential issues with the error boundary itself failing.

**Step 2: Verify**

The error boundary only renders on errors, so visual verification is optional. Verify the build succeeds:

Run: `pnpm nx build web`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/web/src/app/app-error-boundary.tsx
git commit -m "refactor: migrate AppErrorBoundary to Tailwind classes"
```

---

### Task 12: Final cleanup and verification

**Files:**
- Verify: All files in `apps/web/src/` — no remaining inline `style=` attributes

**Step 1: Search for remaining inline styles**

Run: `grep -rn "style=" apps/web/src/ --include="*.tsx" | grep -v "node_modules"`
Expected: No matches (all inline styles removed)

**Step 2: Verify full build**

Run: `pnpm nx build web`
Expected: Clean build, no errors

**Step 3: Verify lint**

Run: `pnpm run lint`
Expected: No new lint errors

**Step 4: Commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore: final cleanup of inline styles migration"
```
