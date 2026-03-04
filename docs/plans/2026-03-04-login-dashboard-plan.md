# Login & Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Login screen (anonymous auth + bracket name) and Dashboard screen (greeting + navigation cards) for the Movable Madness bracket app.

**Architecture:** Extend existing AuthProvider to support anonymous Firebase auth alongside admin auth. New NestJS API endpoints handle bracket user profile CRUD in a separate `bracketUsers/{uid}` Firestore collection. Frontend adds two new pages (Login at `/`, Dashboard at `/dashboard`) with Movable Ink brand styling.

**Tech Stack:** React 19, NestJS 11, Firebase Auth (anonymous), Firestore, Tailwind CSS 4, shadcn/ui, React Router 7

---

### Task 1: Add BracketUserDocument shared type

**Files:**
- Modify: `libs/shared-types/src/lib/bracket-user.ts` (create)
- Modify: `libs/shared-types/src/index.ts`

**Step 1: Create the BracketUserDocument type**

Create `libs/shared-types/src/lib/bracket-user.ts`:

```typescript
export interface BracketUserDocument {
  uid: string;
  bracketName: string;
  createdAt: string;
}
```

Note: `createdAt` is `string` (ISO format) for API transport. Firestore stores as Timestamp server-side.

**Step 2: Export from shared-types barrel**

Add to `libs/shared-types/src/index.ts`:

```typescript
export type { BracketUserDocument } from './lib/bracket-user';
```

**Step 3: Commit**

```bash
git add libs/shared-types/src/lib/bracket-user.ts libs/shared-types/src/index.ts
git commit -m "feat: add BracketUserDocument shared type"
```

---

### Task 2: Create BracketUsers API module (NestJS)

**Files:**
- Create: `apps/api/src/bracket-users/bracket-users.controller.ts`
- Create: `apps/api/src/bracket-users/bracket-users.service.ts`
- Create: `apps/api/src/bracket-users/bracket-users.module.ts`
- Create: `apps/api/src/bracket-users/dto/create-bracket-user.dto.ts`
- Modify: `apps/api/src/app/app.module.ts`

**Step 1: Create the DTO**

Create `apps/api/src/bracket-users/dto/create-bracket-user.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateBracketUserDto {
  @ApiProperty({ description: 'Display name for the bracket entry', example: 'My March Picks' })
  bracketName: string;
}
```

**Step 2: Create the service**

Create `apps/api/src/bracket-users/bracket-users.service.ts`:

```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import type { BracketUserDocument } from '@workspace/shared-types';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class BracketUsersService {
  private get db() {
    return getFirestore();
  }

  async create(uid: string, bracketName: string): Promise<BracketUserDocument> {
    const docRef = this.db.collection('bracketUsers').doc(uid);
    const existing = await docRef.get();

    if (existing.exists) {
      throw new ConflictException('Bracket user profile already exists');
    }

    const now = new Date().toISOString();
    const data: BracketUserDocument = {
      uid,
      bracketName,
      createdAt: now,
    };

    await docRef.set(data);
    return data;
  }

  async findByUid(uid: string): Promise<BracketUserDocument> {
    const doc = await this.db.collection('bracketUsers').doc(uid).get();

    if (!doc.exists) {
      throw new NotFoundException('Bracket user profile not found');
    }

    return doc.data() as BracketUserDocument;
  }
}
```

**Step 3: Create the controller**

Create `apps/api/src/bracket-users/bracket-users.controller.ts`:

```typescript
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, type RequestWithUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '@workspace/auth';
import { BracketUsersService } from './bracket-users.service';
import { CreateBracketUserDto } from './dto/create-bracket-user.dto';

@ApiTags('Bracket Users')
@Controller('bracket-users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BracketUsersController {
  constructor(private readonly bracketUsersService: BracketUsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create bracket user profile' })
  @ApiResponse({ status: 201, description: 'Bracket user profile created' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBracketUserDto) {
    const data = await this.bracketUsersService.create(user.uid, dto.bracketName);
    return { success: true, data };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current bracket user profile' })
  @ApiResponse({ status: 200, description: 'Returns bracket user profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMe(@CurrentUser() user: AuthUser) {
    const data = await this.bracketUsersService.findByUid(user.uid);
    return { success: true, data };
  }
}
```

**Step 4: Create the module**

Create `apps/api/src/bracket-users/bracket-users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BracketUsersController } from './bracket-users.controller';
import { BracketUsersService } from './bracket-users.service';

@Module({
  imports: [AuthModule],
  controllers: [BracketUsersController],
  providers: [BracketUsersService],
})
export class BracketUsersModule {}
```

**Step 5: Register module in AppModule**

In `apps/api/src/app/app.module.ts`, add import:

```typescript
import { BracketUsersModule } from '../bracket-users/bracket-users.module';
```

Add `BracketUsersModule` to the `imports` array.

**Step 6: Verify API compiles**

Run: `pnpm nx build api`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add apps/api/src/bracket-users/ apps/api/src/app/app.module.ts
git commit -m "feat: add bracket-users API module with create and get endpoints"
```

---

### Task 3: Add Inter font and Brand Magenta theme color

**Files:**
- Modify: `apps/web/index.html`
- Modify: `apps/web/src/styles.css`

**Step 1: Add Inter font to HTML head**

In `apps/web/index.html`, add inside `<head>` before the stylesheet link:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

Also update the `<title>` to `Movable Madness`.

**Step 2: Add font-family and brand color to styles.css**

In `apps/web/src/styles.css`, add to the `:root` block:

```css
--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
--brand-magenta: oklch(0.55 0.24 350);
--brand-magenta-hover: oklch(0.48 0.24 350);
```

Add to the `@theme inline` block:

```css
--font-family-sans: var(--font-sans);
--color-brand-magenta: var(--brand-magenta);
--color-brand-magenta-hover: var(--brand-magenta-hover);
```

Add to the `@layer base` block:

```css
body {
  @apply bg-background text-foreground font-sans;
}
```

**Step 3: Commit**

```bash
git add apps/web/index.html apps/web/src/styles.css
git commit -m "feat: add Inter font and Brand Magenta theme color"
```

---

### Task 4: Add anonymous auth functions to frontend

**Files:**
- Create: `apps/web/src/features/bracket-auth/api/bracket-auth.ts`
- Create: `apps/web/src/features/bracket-auth/api/bracket-users-api.ts`
- Create: `apps/web/src/features/bracket-auth/index.ts`

**Step 1: Create anonymous auth wrapper**

Create `apps/web/src/features/bracket-auth/api/bracket-auth.ts`:

```typescript
import { signInAnonymously as firebaseSignInAnonymously, type User } from 'firebase/auth';
import { getFirebaseAuth } from '../../../shared/config/firebase';

export async function signInAnonymously(): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await firebaseSignInAnonymously(auth);
  return credential.user;
}
```

**Step 2: Create bracket users API client**

Create `apps/web/src/features/bracket-auth/api/bracket-users-api.ts`:

```typescript
import type { ApiResponse } from '@workspace/shared-types';
import type { BracketUserDocument } from '@workspace/shared-types';
import { get, post } from '../../../shared/api/api-client';

export async function createBracketUser(bracketName: string): Promise<BracketUserDocument> {
  const response = await post<ApiResponse<BracketUserDocument>>('/bracket-users', { bracketName });
  if (!response.success || !response.data) {
    throw new Error('Failed to create bracket user profile');
  }
  return response.data;
}

export async function getBracketUserMe(): Promise<BracketUserDocument | null> {
  try {
    const response = await get<ApiResponse<BracketUserDocument>>('/bracket-users/me');
    return response.data ?? null;
  } catch {
    return null;
  }
}
```

**Step 3: Create barrel export**

Create `apps/web/src/features/bracket-auth/index.ts`:

```typescript
export { signInAnonymously } from './api/bracket-auth';
export { createBracketUser, getBracketUserMe } from './api/bracket-users-api';
```

**Step 4: Commit**

```bash
git add apps/web/src/features/bracket-auth/
git commit -m "feat: add anonymous auth and bracket users API client"
```

---

### Task 5: Extend AuthProvider with bracket user support

**Files:**
- Modify: `apps/web/src/app/providers/auth-provider.tsx`

**Step 1: Update AuthProvider**

The current `AuthContextValue` has `user`, `firebaseUser`, `loading`, `isAuthenticated`. Extend it:

```typescript
import type { AuthUser } from '@workspace/auth';
import type { BracketUserDocument } from '@workspace/shared-types';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth, initFirebase } from '../../shared/config/firebase';
import { getBracketUserMe } from '../../features/bracket-auth';

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: User | null;
  bracketUser: BracketUserDocument | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  refreshBracketUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [bracketUser, setBracketUser] = useState<BracketUserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBracketUser = async () => {
    const profile = await getBracketUserMe();
    setBracketUser(profile);
  };

  useEffect(() => {
    initFirebase();
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        if (fbUser.isAnonymous) {
          // Anonymous user — fetch bracket profile
          setUser(null);
          await fetchBracketUser();
        } else {
          // Regular user — extract role from token claims
          try {
            const tokenResult = await fbUser.getIdTokenResult();
            const role = (tokenResult.claims.role as AuthUser['role']) ?? 'viewer';
            setUser({
              uid: fbUser.uid,
              email: fbUser.email ?? '',
              role,
            });
          } catch {
            setUser(null);
          }
          setBracketUser(null);
        }
      } else {
        setUser(null);
        setBracketUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    firebaseUser,
    bracketUser,
    loading,
    isAuthenticated: user !== null || bracketUser !== null,
    isAnonymous: firebaseUser?.isAnonymous ?? false,
    refreshBracketUser: fetchBracketUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
```

Key changes:
- Added `bracketUser`, `isAnonymous`, `refreshBracketUser` to context
- `onAuthStateChanged` checks `fbUser.isAnonymous` and fetches bracket profile
- `isAuthenticated` is true if either `user` or `bracketUser` exists
- `refreshBracketUser` lets the login page trigger a re-fetch after creating the profile

**Step 2: Verify web builds**

Run: `pnpm nx build web`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/web/src/app/providers/auth-provider.tsx
git commit -m "feat: extend AuthProvider with bracket user and anonymous auth support"
```

---

### Task 6: Build the Login page

**Files:**
- Create: `apps/web/src/pages/login/login-page.tsx`

**Step 1: Create the Login page component**

Create `apps/web/src/pages/login/login-page.tsx`:

```tsx
import { Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@workspace/ui';
import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/auth-provider';
import { createBracketUser, signInAnonymously } from '../../features/bracket-auth';

export function LoginPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();
  const [bracketName, setBracketName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = bracketName.trim();
    if (!trimmed) {
      setError('Please enter a bracket name');
      return;
    }

    setSubmitting(true);
    try {
      await signInAnonymously();
      await createBracketUser(trimmed);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Movable Madness</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Enter your bracket name to get started</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="bracketName">Bracket Name</Label>
              <Input
                id="bracketName"
                type="text"
                value={bracketName}
                onChange={(e) => setBracketName(e.target.value)}
                placeholder="e.g. Nick's Hot Picks"
                disabled={submitting}
                autoComplete="off"
                maxLength={50}
              />
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-brand-magenta text-white hover:bg-brand-magenta-hover"
              size="lg"
              disabled={submitting}
            >
              {submitting ? 'Joining...' : 'Join Tournament'}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-2">
              You must use the same browser to return to your picks. Your session is tied to this device.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/login/login-page.tsx
git commit -m "feat: add Login page with anonymous auth and bracket name input"
```

---

### Task 7: Build the Dashboard page

**Files:**
- Create: `apps/web/src/pages/dashboard/dashboard-page.tsx`

**Step 1: Create the Dashboard page component**

Create `apps/web/src/pages/dashboard/dashboard-page.tsx`:

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@workspace/ui';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/auth-provider';

export function DashboardPage() {
  const { bracketUser, isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !bracketUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {bracketUser.bracketName}!
          </h1>
          <p className="text-muted-foreground mt-2">What would you like to do?</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-0 border-t-4 border-t-brand-magenta shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Edit My Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Make your picks for all 64 teams in the tournament.
              </p>
              <Button
                className="w-full bg-brand-magenta text-white hover:bg-brand-magenta-hover"
                size="lg"
                onClick={() => navigate('/bracket/edit')}
              >
                Edit My Bracket
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 border-t-4 border-t-brand-magenta shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">View Submitted Brackets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                See how other participants filled out their brackets.
              </p>
              <Button
                className="w-full bg-brand-magenta text-white hover:bg-brand-magenta-hover"
                size="lg"
                onClick={() => navigate('/brackets')}
              >
                View Submitted Brackets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/dashboard/dashboard-page.tsx
git commit -m "feat: add Dashboard page with bracket name greeting and navigation cards"
```

---

### Task 8: Wire up routes in app.tsx

**Files:**
- Modify: `apps/web/src/app/app.tsx`

**Step 1: Update routes**

Replace the current `HomePage` and update routes. The key changes:

1. Remove the inline `HomePage` component (it's replaced by `LoginPage`)
2. Import `LoginPage` and `DashboardPage`
3. Update route table:
   - `/` → `<LoginPage />`
   - `/dashboard` → `<DashboardPage />` (protected for bracket users)
   - Keep `/sign-in`, `/admin`, `/admin/settings` unchanged

Updated `AppRoutes`:

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/login/login-page';
import { DashboardPage } from '../pages/dashboard/dashboard-page';
import { SignInPage } from '../pages/sign-in/sign-in-page';
import { AdminHomePage } from '../pages/admin/home/admin-home-page';
import { AccountSettingsPage } from '../pages/admin/settings/account-settings-page';
import { AppErrorBoundary } from './app-error-boundary';
import { AuthProvider, useAuthContext } from './providers/auth-provider';
import { ThemeProvider } from './providers/theme-provider';

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
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

Note: The `DashboardPage` handles its own auth check internally (redirects to `/` if no bracket user). The `LoginPage` redirects to `/dashboard` if already authenticated.

**Step 2: Verify web builds**

Run: `pnpm nx build web`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/web/src/app/app.tsx
git commit -m "feat: wire login and dashboard routes, replace home page with login"
```

---

### Task 9: Manual smoke test

**Step 1: Start dev servers**

Run: `pnpm dev`

**Step 2: Verify login flow**

1. Navigate to `http://localhost:4200/`
2. See the Login page with "Movable Madness" header, bracket name input, "Join Tournament" button (Brand Magenta), and browser warning text
3. Enter a bracket name (e.g., "Nick's Hot Picks")
4. Click "Join Tournament"
5. Should redirect to `/dashboard`
6. See "Welcome, Nick's Hot Picks!" greeting
7. See two cards with Brand Magenta top borders: "Edit My Bracket" and "View Submitted Brackets"

**Step 3: Verify returning user flow**

1. Refresh the page at `/dashboard`
2. Should still show the dashboard (anonymous session persists)
3. Navigate to `/` — should redirect to `/dashboard` (already authenticated)

**Step 4: Verify admin flow unchanged**

1. Navigate to `http://localhost:4200/sign-in`
2. Admin sign-in form should still work
3. Navigate to `http://localhost:4200/admin` — should work for admin users

**Step 5: Fix any issues found during testing**

Address any visual or functional issues.

**Step 6: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
