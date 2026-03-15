# Bracket Login & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Login and Dashboard screens for the Movable Madness bracket tournament app, including anonymous auth, API endpoint, Firestore integration, and route guards.

**Architecture:** Extend the existing AuthProvider to handle Firebase Anonymous Authentication alongside email/password auth. Bracket data lives in a separate `bracketEntries` Firestore collection. Data writes go through the NestJS API; bracket name reads use a Firestore real-time listener.

**Tech Stack:** React 19, React Router 7, Firebase Auth (anonymous), Firestore, NestJS, shadcn/ui, Tailwind CSS, Vitest (frontend), Jest (API)

**Spec:** `docs/superpowers/specs/2026-03-15-bracket-login-dashboard-design.md`

---

## Chunk 1: Auth & Roles Foundation

### Task 1: Add `bracket_user` Role

**Files:**
- Modify: `libs/auth/src/lib/types/roles.ts`

- [ ] **Step 1: Add BRACKET_USER to Roles const**

In `libs/auth/src/lib/types/roles.ts`, add the new role:

```typescript
export const Roles = {
  ADMIN: 'admin',
  BRACKET_USER: 'bracket_user',
} as const;
```

The `Role` type union automatically expands to `'admin' | 'bracket_user'`.

- [ ] **Step 2: Run existing auth lib tests to verify nothing breaks**

Run: `pnpm nx test auth`
Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/lib/types/roles.ts
git commit -m "feat(auth): add bracket_user role"
```

---

### Task 2: Make `AuthUser.email` Optional

**Files:**
- Modify: `libs/auth/src/lib/types/user.ts`
- Modify: `apps/api/src/auth/firebase-admin.service.ts`
- Modify: `apps/web/src/app/providers/auth-provider.tsx`

- [ ] **Step 1: Update AuthUser interface**

In `libs/auth/src/lib/types/user.ts`, make `email` optional:

```typescript
export interface AuthUser {
  uid: string;
  email?: string;
  role: Role;
}
```

- [ ] **Step 2: Fix any TypeScript errors caused by the optional email**

Check `apps/api/src/auth/firebase-admin.service.ts` — the `extractUser` method currently sets `email: decodedToken.email ?? ''`. This is fine; an empty string is still a valid `string | undefined`.

Check `apps/web/src/app/app.tsx` — the `HomePage` displays `user?.email`. Since `email` is now optional, this already uses optional chaining and is safe.

Check `apps/web/src/pages/admin/home/admin-home-page.tsx` — displays `user?.email`. Also safe.

- [ ] **Step 3: Run existing tests**

Run: `pnpm nx test auth`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add libs/auth/src/lib/types/user.ts
git commit -m "feat(auth): make AuthUser.email optional for anonymous users"
```

---

### Task 3: Update `extractUser()` Server-Side Role Fallback

**Files:**
- Modify: `apps/api/src/auth/firebase-admin.service.ts`
- Test: `apps/api/src/auth/firebase-admin.service.spec.ts`

- [ ] **Step 1: Write failing test for anonymous user extraction**

Create `apps/api/src/auth/firebase-admin.service.spec.ts`:

```typescript
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAdminService } from './firebase-admin.service';

// Mock firebase-admin/app to prevent actual initialization
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(),
  applicationDefault: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('FirebaseAdminService', () => {
  let service: FirebaseAdminService;

  beforeEach(() => {
    service = new FirebaseAdminService();
  });

  describe('extractUser', () => {
    it('should assign bracket_user role for anonymous sign-in provider', () => {
      const decodedToken = {
        uid: 'anon-uid-123',
        email: undefined,
        firebase: {
          sign_in_provider: 'anonymous',
        },
      } as unknown as DecodedIdToken;

      const user = service.extractUser(decodedToken);

      expect(user).toEqual({
        uid: 'anon-uid-123',
        email: '',
        role: 'bracket_user',
      });
    });

    it('should assign admin role for non-anonymous users without role claim', () => {
      const decodedToken = {
        uid: 'admin-uid-456',
        email: 'admin@example.com',
        firebase: {
          sign_in_provider: 'password',
        },
      } as unknown as DecodedIdToken;

      const user = service.extractUser(decodedToken);

      expect(user).toEqual({
        uid: 'admin-uid-456',
        email: 'admin@example.com',
        role: 'admin',
      });
    });

    it('should use role from custom claims when present', () => {
      const decodedToken = {
        uid: 'user-uid-789',
        email: 'user@example.com',
        role: 'admin',
        firebase: {
          sign_in_provider: 'password',
        },
      } as unknown as DecodedIdToken;

      const user = service.extractUser(decodedToken);

      expect(user).toEqual({
        uid: 'user-uid-789',
        email: 'user@example.com',
        role: 'admin',
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/api/src/auth/firebase-admin.service.spec.ts --no-cache`
Expected: FAIL — the anonymous test expects `bracket_user` but gets `admin`.

- [ ] **Step 3: Update extractUser to check sign_in_provider**

In `apps/api/src/auth/firebase-admin.service.ts`, update the `extractUser` method:

```typescript
extractUser(decodedToken: DecodedIdToken): AuthUser {
  const isAnonymous = decodedToken.firebase?.sign_in_provider === 'anonymous';
  const defaultRole = isAnonymous ? 'bracket_user' : 'admin';

  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? '',
    role: (decodedToken.role as AuthUser['role']) ?? defaultRole,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest apps/api/src/auth/firebase-admin.service.spec.ts --no-cache`
Expected: All 3 tests PASS.

- [ ] **Step 5: Run existing auth guard tests to check for regressions**

Run: `npx jest apps/api/src/auth/auth.guard.spec.ts --no-cache`
Expected: All existing tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth/firebase-admin.service.ts apps/api/src/auth/firebase-admin.service.spec.ts
git commit -m "feat(api): assign bracket_user role for anonymous sign-in"
```

---

### Task 4: Add CASL Rules for `bracket_user`

**Files:**
- Modify: `libs/auth/src/lib/casl/ability.factory.ts`

- [ ] **Step 1: Add bracket_user case to ability factory**

In `libs/auth/src/lib/casl/ability.factory.ts`, add a case after the `ADMIN` case:

```typescript
case Roles.BRACKET_USER:
  // Bracket users have no admin permissions
  // They interact with bracket entries only through the API
  break;
```

This explicitly handles the role (falling into the documented default-deny is fine, but an explicit case is clearer).

- [ ] **Step 2: Run auth lib tests**

Run: `pnpm nx test auth`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/lib/casl/ability.factory.ts
git commit -m "feat(auth): add CASL rules for bracket_user role"
```

---

### Task 5: Update Firestore Rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add bracketEntries collection rules**

In `firestore.rules`, add the `bracketEntries` match block inside the `match /databases/{database}/documents` block, after the `/users` block:

```
    // Bracket entries collection
    match /bracketEntries/{userId} {
      // Allow read if authenticated user is reading their own document
      allow read: if request.auth != null && request.auth.uid == userId;

      // All writes go through the NestJS API via Firebase Admin SDK
    }
```

- [ ] **Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat(firestore): add bracketEntries collection rules"
```

---

## Chunk 2: API Endpoint

### Task 6: Create Brackets Module, Controller, and Service

**Files:**
- Create: `apps/api/src/brackets/brackets.service.ts`
- Create: `apps/api/src/brackets/brackets.controller.ts`
- Create: `apps/api/src/brackets/brackets.module.ts`
- Modify: `apps/api/src/app/app.module.ts`
- Test: `apps/api/src/brackets/brackets.service.spec.ts`
- Test: `apps/api/src/brackets/brackets.controller.spec.ts`

- [ ] **Step 1: Write failing test for BracketsService**

Create `apps/api/src/brackets/brackets.service.spec.ts`:

```typescript
import { BracketsService } from './brackets.service';

// Mock firebase-admin/app
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(),
  applicationDefault: jest.fn(),
}));

// Mock firebase-admin/firestore
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: mockCollection,
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  },
}));

describe('BracketsService', () => {
  let service: BracketsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BracketsService();
  });

  describe('joinBracket', () => {
    it('should create a new bracket entry when none exists', async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await service.joinBracket('user-123', 'My Bracket');

      expect(mockCollection).toHaveBeenCalledWith('bracketEntries');
      expect(mockDoc).toHaveBeenCalledWith('user-123');
      expect(mockSet).toHaveBeenCalledWith(
        {
          bracketName: 'My Bracket',
          createdAt: 'SERVER_TIMESTAMP',
        },
        { merge: false },
      );
      expect(result).toEqual({ isNew: true });
    });

    it('should update an existing bracket entry', async () => {
      mockGet.mockResolvedValue({ exists: true });

      const result = await service.joinBracket('user-456', 'Updated Bracket');

      expect(mockSet).toHaveBeenCalledWith(
        {
          bracketName: 'Updated Bracket',
          updatedAt: 'SERVER_TIMESTAMP',
        },
        { merge: true },
      );
      expect(result).toEqual({ isNew: false });
    });

    it('should trim the bracket name', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await service.joinBracket('user-789', '  Spaced Name  ');

      expect(mockSet).toHaveBeenCalledWith(
        {
          bracketName: 'Spaced Name',
          createdAt: 'SERVER_TIMESTAMP',
        },
        { merge: false },
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/api/src/brackets/brackets.service.spec.ts --no-cache`
Expected: FAIL — `BracketsService` module not found.

- [ ] **Step 3: Implement BracketsService**

Create `apps/api/src/brackets/brackets.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class BracketsService {
  async joinBracket(uid: string, bracketName: string): Promise<{ isNew: boolean }> {
    const trimmedName = bracketName.trim();
    const db = getFirestore();
    const docRef = db.collection('bracketEntries').doc(uid);
    const doc = await docRef.get();

    if (doc.exists) {
      await docRef.set(
        {
          bracketName: trimmedName,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { isNew: false };
    }

    await docRef.set(
      {
        bracketName: trimmedName,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: false },
    );
    return { isNew: true };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest apps/api/src/brackets/brackets.service.spec.ts --no-cache`
Expected: All 3 tests PASS.

- [ ] **Step 5: Write failing test for BracketsController**

Create `apps/api/src/brackets/brackets.controller.spec.ts`:

```typescript
import { BadRequestException } from '@nestjs/common';
import type { AuthUser } from '@movable-madness/auth';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';

describe('BracketsController', () => {
  let controller: BracketsController;
  let service: jest.Mocked<BracketsService>;

  beforeEach(() => {
    service = {
      joinBracket: jest.fn(),
    } as unknown as jest.Mocked<BracketsService>;
    controller = new BracketsController(service);
  });

  const mockUser: AuthUser = {
    uid: 'user-123',
    email: undefined,
    role: 'bracket_user',
  };

  describe('join', () => {
    it('should create a bracket entry and return 201 for new entries', async () => {
      service.joinBracket.mockResolvedValue({ isNew: true });

      const result = await controller.join(mockUser, { bracketName: 'My Bracket' });

      expect(service.joinBracket).toHaveBeenCalledWith('user-123', 'My Bracket');
      expect(result).toEqual({
        success: true,
        data: { bracketName: 'My Bracket' },
      });
    });

    it('should reject empty bracket name', async () => {
      await expect(controller.join(mockUser, { bracketName: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject whitespace-only bracket name', async () => {
      await expect(controller.join(mockUser, { bracketName: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject bracket name longer than 50 characters', async () => {
      const longName = 'a'.repeat(51);
      await expect(controller.join(mockUser, { bracketName: longName })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx jest apps/api/src/brackets/brackets.controller.spec.ts --no-cache`
Expected: FAIL — `BracketsController` module not found.

- [ ] **Step 7: Implement BracketsController**

Create `apps/api/src/brackets/brackets.controller.ts`:

```typescript
import type { AuthUser } from '@movable-madness/auth';
import { BadRequestException, Body, Controller, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BracketsService } from './brackets.service';

interface JoinBracketBody {
  bracketName: string;
}

@Controller('brackets')
@UseGuards(AuthGuard)
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Post('join')
  async join(
    @CurrentUser() user: AuthUser,
    @Body() body: JoinBracketBody,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const trimmedName = body.bracketName?.trim();

    if (!trimmedName || trimmedName.length === 0) {
      throw new BadRequestException('Bracket name is required');
    }

    if (trimmedName.length > 50) {
      throw new BadRequestException('Bracket name must be 50 characters or less');
    }

    const { isNew } = await this.bracketsService.joinBracket(user.uid, trimmedName);

    if (res) {
      res.status(isNew ? HttpStatus.CREATED : HttpStatus.OK);
    }

    return {
      success: true,
      data: { bracketName: trimmedName },
    };
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx jest apps/api/src/brackets/brackets.controller.spec.ts --no-cache`
Expected: All 4 tests PASS.

- [ ] **Step 9: Create BracketsModule**

Create `apps/api/src/brackets/brackets.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';

@Module({
  imports: [AuthModule],
  controllers: [BracketsController],
  providers: [BracketsService],
})
export class BracketsModule {}
```

- [ ] **Step 10: Register BracketsModule in AppModule**

In `apps/api/src/app/app.module.ts`, add the import:

```typescript
import { BracketsModule } from '../brackets/brackets.module';
```

And add `BracketsModule` to the `imports` array:

```typescript
imports: [
  LoggingModule.forRoot({
    service: 'api',
    enableRequestLogging: true,
  }),
  AuthModule,
  UsersModule,
  BracketsModule,
],
```

- [ ] **Step 11: Run all API tests to check for regressions**

Run: `npx jest apps/api/src --no-cache`
Expected: All tests PASS.

- [ ] **Step 12: Commit**

```bash
git add apps/api/src/brackets/ apps/api/src/app/app.module.ts
git commit -m "feat(api): add POST /api/brackets/join endpoint"
```

---

## Chunk 3: Frontend Auth Changes

### Task 7: Add `signInAnonymously` to Firebase Auth Module

**Files:**
- Modify: `apps/web/src/features/auth/api/firebase-auth.ts`
- Modify: `apps/web/src/features/auth/index.ts`

- [ ] **Step 1: Add signInAnonymously function**

In `apps/web/src/features/auth/api/firebase-auth.ts`, add this import at the top:

```typescript
import {
  type Auth,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
```

Then add the function:

```typescript
/**
 * Signs in a user anonymously for bracket tournament access.
 */
export async function signInAnonymously(): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await firebaseSignInAnonymously(auth);
  return credential.user;
}
```

- [ ] **Step 2: Export signInAnonymously from the auth feature**

In `apps/web/src/features/auth/index.ts`, add `signInAnonymously` to the exports:

```typescript
export { getIdToken, getUserRole, signIn, signInAnonymously, signOut } from './api/firebase-auth';
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/auth/api/firebase-auth.ts apps/web/src/features/auth/index.ts
git commit -m "feat(auth): add signInAnonymously function"
```

---

### Task 8: Extend AuthProvider with Anonymous User Support

**Files:**
- Modify: `apps/web/src/shared/config/firebase.ts`
- Modify: `apps/web/src/app/providers/auth-provider.tsx`

- [ ] **Step 1: Add Firestore to Firebase config**

In `apps/web/src/shared/config/firebase.ts`, add Firestore initialization:

```typescript
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

export function initFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  return { app, auth, db };
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initFirebase();
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    initFirebase();
  }
  return db;
}
```

- [ ] **Step 2: Extend AuthProvider with bracketName and isAnonymous**

Replace the full contents of `apps/web/src/app/providers/auth-provider.tsx`:

```typescript
import type { AuthUser } from '@movable-madness/auth';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth, getFirebaseDb, initFirebase } from '../../shared/config/firebase';

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  bracketName: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [bracketName, setBracketName] = useState<string | null>(null);

  useEffect(() => {
    initFirebase();
    const auth = getFirebaseAuth();

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up previous Firestore listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      setFirebaseUser(fbUser);

      if (fbUser) {
        const anonymous = fbUser.isAnonymous;
        setIsAnonymous(anonymous);

        if (anonymous) {
          setUser({
            uid: fbUser.uid,
            role: 'bracket_user',
          });

          // Attach Firestore real-time listener for bracket name
          const db = getFirebaseDb();
          const docRef = doc(db, 'bracketEntries', fbUser.uid);
          unsubscribeSnapshot = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setBracketName(data.bracketName ?? null);
            } else {
              setBracketName(null);
            }
          });
        } else {
          try {
            const tokenResult = await fbUser.getIdTokenResult();
            const role = (tokenResult.claims.role as AuthUser['role']) ?? 'admin';
            setUser({
              uid: fbUser.uid,
              email: fbUser.email ?? '',
              role,
            });
          } catch {
            setUser(null);
          }
          setBracketName(null);
        }
      } else {
        setUser(null);
        setIsAnonymous(false);
        setBracketName(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const value: AuthContextValue = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: user !== null,
    isAnonymous,
    bracketName,
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

- [ ] **Step 3: Verify the web app builds without TypeScript errors**

Run: `pnpm nx build web --skip-nx-cache 2>&1 | head -50`
Expected: Build succeeds (or only warnings, no errors).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/shared/config/firebase.ts apps/web/src/app/providers/auth-provider.tsx
git commit -m "feat(web): extend AuthProvider with anonymous user support"
```

---

### Task 9: Update Route Guards

**Files:**
- Modify: `apps/web/src/app/app.tsx`

- [ ] **Step 1: Add BracketProtectedRoute and update ProtectedRoute**

In `apps/web/src/app/app.tsx`, update the `ProtectedRoute` function to also check `!isAnonymous`:

```typescript
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
```

Add a new `BracketProtectedRoute` function below `ProtectedRoute`:

```typescript
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
    return <Navigate to="/bracket/login" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Verify the web app still builds**

Run: `pnpm nx build web --skip-nx-cache 2>&1 | head -50`
Expected: Build succeeds. The route guards are defined but not yet used — no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/app.tsx
git commit -m "feat(web): add bracket route guards"
```

---

## Chunk 4: Login & Dashboard Pages

### Task 10: Build the Login Page

**Files:**
- Create: `apps/web/src/pages/bracket/login/bracket-login-page.tsx`

- [ ] **Step 1: Create BracketLoginPage component**

Create `apps/web/src/pages/bracket/login/bracket-login-page.tsx`:

```tsx
import { Button, Input, Label } from '@movable-madness/ui';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { signInAnonymously } from '../../../features/auth';
import { post } from '../../../shared/api/api-client';

export function BracketLoginPage() {
  const { isAuthenticated, isAnonymous, loading } = useAuthContext();
  const navigate = useNavigate();
  const [bracketName, setBracketName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Redirect if already authenticated as anonymous user
  if (isAuthenticated && isAnonymous) {
    return <Navigate to="/bracket/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = bracketName.trim();
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
      navigate('/bracket/dashboard', { replace: true });
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
              value={bracketName}
              onChange={(e) => setBracketName(e.target.value)}
              maxLength={50}
              disabled={submitting}
              className="w-full"
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
```

- [ ] **Step 2: Verify the file was created correctly**

Run: `ls apps/web/src/pages/bracket/login/bracket-login-page.tsx`
Expected: File exists.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/bracket/login/bracket-login-page.tsx
git commit -m "feat(web): add bracket login page"
```

---

### Task 11: Build the Dashboard Page

**Files:**
- Create: `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx`

- [ ] **Step 1: Create BracketDashboardPage component**

Create `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx`:

```tsx
import { Button } from '@movable-madness/ui';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { signOut } from '../../../features/auth';

export function BracketDashboardPage() {
  const { bracketName } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/bracket/login', { replace: true });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-[Inter,system-ui,sans-serif]">
      {/* Top bar */}
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

      {/* Content */}
      <main className="mx-auto max-w-[640px] px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-1.5 text-2xl font-bold text-gray-900">
            Welcome, {bracketName ?? 'Player'}! 👋
          </h1>
          <p className="text-base text-gray-500">What would you like to do?</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Edit My Bracket card */}
          <Link to="/bracket/edit" className="block">
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

          {/* View Submitted Brackets card */}
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
                  <p className="text-sm text-gray-500">
                    See how others filled out their brackets
                  </p>
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

- [ ] **Step 2: Verify the file was created correctly**

Run: `ls apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx`
Expected: File exists.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx
git commit -m "feat(web): add bracket dashboard page"
```

---

### Task 12: Wire Up Bracket Routes in AppRoutes

**Files:**
- Modify: `apps/web/src/app/app.tsx`

- [ ] **Step 1: Add page imports and routes**

Now that both page components exist, add the imports at the top of `apps/web/src/app/app.tsx`:

```typescript
import { BracketLoginPage } from '../pages/bracket/login/bracket-login-page';
import { BracketDashboardPage } from '../pages/bracket/dashboard/bracket-dashboard-page';
```

Add the bracket routes to the `AppRoutes` function, inside the `<Routes>` component:

```typescript
<Route path="/bracket/login" element={<BracketLoginPage />} />
<Route
  path="/bracket/dashboard"
  element={
    <BracketProtectedRoute>
      <BracketDashboardPage />
    </BracketProtectedRoute>
  }
/>
```

- [ ] **Step 2: Verify web app builds**

Run: `pnpm nx build web --skip-nx-cache 2>&1 | head -50`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/app.tsx
git commit -m "feat(web): wire up bracket login and dashboard routes"
```

---

### Task 13: Add Frontend Component Tests

**Files:**
- Create: `apps/web/src/pages/bracket/login/bracket-login-page.spec.tsx`
- Create: `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.spec.tsx`

- [ ] **Step 1: Create login page test**

Create `apps/web/src/pages/bracket/login/bracket-login-page.spec.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BracketLoginPage } from './bracket-login-page';

// Mock the auth context
const mockAuthContext = {
  user: null,
  firebaseUser: null,
  loading: false,
  isAuthenticated: false,
  isAnonymous: false,
  bracketName: null,
};

vi.mock('../../../app/providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}));

vi.mock('../../../features/auth', () => ({
  signInAnonymously: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
}));

vi.mock('../../../shared/api/api-client', () => ({
  post: vi.fn().mockResolvedValue({ success: true }),
}));

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <BracketLoginPage />
    </MemoryRouter>,
  );

describe('BracketLoginPage', () => {
  beforeEach(() => {
    mockAuthContext.loading = false;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isAnonymous = false;
  });

  it('should render the login form', () => {
    renderWithRouter();
    expect(screen.getByText('Movable Madness')).toBeInTheDocument();
    expect(screen.getByText('Join Tournament')).toBeInTheDocument();
    expect(screen.getByLabelText(/bracket name/i)).toBeInTheDocument();
  });

  it('should show warning text about browser persistence', () => {
    renderWithRouter();
    expect(screen.getByText(/same browser/i)).toBeInTheDocument();
  });

  it('should show error when submitting empty bracket name', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Join Tournament'));
    expect(await screen.findByText('Please enter a bracket name')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockAuthContext.loading = true;
    renderWithRouter();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create dashboard page test**

Create `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BracketDashboardPage } from './bracket-dashboard-page';

const mockAuthContext = {
  user: { uid: 'test-uid', role: 'bracket_user' as const },
  firebaseUser: null,
  loading: false,
  isAuthenticated: true,
  isAnonymous: true,
  bracketName: "Nick's Final Four",
};

vi.mock('../../../app/providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}));

vi.mock('../../../features/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <BracketDashboardPage />
    </MemoryRouter>,
  );

describe('BracketDashboardPage', () => {
  it('should display the bracket name in the welcome header', () => {
    renderWithRouter();
    expect(screen.getByText(/Nick's Final Four/)).toBeInTheDocument();
  });

  it('should render Edit My Bracket navigation card', () => {
    renderWithRouter();
    expect(screen.getByText('Edit My Bracket')).toBeInTheDocument();
    expect(screen.getByText('Make your picks for all 64 teams')).toBeInTheDocument();
  });

  it('should render View Submitted Brackets navigation card', () => {
    renderWithRouter();
    expect(screen.getByText('View Submitted Brackets')).toBeInTheDocument();
    expect(screen.getByText('See how others filled out their brackets')).toBeInTheDocument();
  });

  it('should link Edit My Bracket to /bracket/edit', () => {
    renderWithRouter();
    const link = screen.getByText('Edit My Bracket').closest('a');
    expect(link).toHaveAttribute('href', '/bracket/edit');
  });

  it('should link View Submitted Brackets to /brackets', () => {
    renderWithRouter();
    const link = screen.getByText('View Submitted Brackets').closest('a');
    expect(link).toHaveAttribute('href', '/brackets');
  });

  it('should render Sign Out button', () => {
    renderWithRouter();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should show fallback name when bracketName is null', () => {
    mockAuthContext.bracketName = null;
    renderWithRouter();
    expect(screen.getByText(/Player/)).toBeInTheDocument();
    mockAuthContext.bracketName = "Nick's Final Four";
  });
});
```

- [ ] **Step 3: Run the frontend tests**

Run: `pnpm nx test web --skip-nx-cache`
Expected: All tests pass. (Note: if `@testing-library/react` is not installed, install it first: `pnpm add -D @testing-library/react @testing-library/jest-dom`. If Vitest test setup doesn't include DOM matchers, add a `vitest-setup.ts` in `apps/web/` that imports `@testing-library/jest-dom/vitest` and configure it in `vite.config.mts` under `test.setupFiles`.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/bracket/login/bracket-login-page.spec.tsx apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.spec.tsx
git commit -m "test(web): add component tests for bracket login and dashboard pages"
```

---

### Task 14: Verify Full Build

**Files:** None (verification only)

- [ ] **Step 1: Build the web app**

Run: `pnpm nx build web --skip-nx-cache`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Build the API**

Run: `pnpm nx build api --skip-nx-cache`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Run all API tests**

Run: `npx jest apps/api/src --no-cache`
Expected: All tests pass.

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: No lint errors (warnings are acceptable).

- [ ] **Step 5: Fix any issues discovered in steps 1-4, then commit**

If fixes are needed, commit them:

```bash
git add -A
git commit -m "fix: resolve build and test issues"
```
