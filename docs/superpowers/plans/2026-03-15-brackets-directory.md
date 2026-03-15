# Submitted Brackets Directory Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public `/brackets` page that displays all bracket participants in a branded table with real-time Firestore updates.

**Architecture:** Firestore `collectionGroup("brackets")` real-time listener feeds a presentational table component. Shared `BracketEntry` type in `libs/shared-types`, generic `Table` primitives in `libs/ui`, page-specific branded table and hook in `apps/web`.

**Tech Stack:** React 19, Tailwind CSS v4, Firebase Web SDK (onSnapshot), shadcn/ui patterns, lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-03-15-brackets-directory-design.md`

---

## Chunk 1: Foundation (Types + Firebase Config + Firestore Rules)

### Task 1: Add BracketEntry shared type

**Files:**
- Create: `libs/shared-types/src/lib/bracket.ts`
- Modify: `libs/shared-types/src/index.ts`

- [ ] **Step 1: Create the BracketEntry type file**

```typescript
// libs/shared-types/src/lib/bracket.ts

export type BracketStatus = 'in_progress' | 'submitted';

/** Portable timestamp compatible with both firebase and firebase-admin SDKs. */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface BracketEntry {
  bracketName: string;
  status: BracketStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}
```

- [ ] **Step 2: Export from shared-types barrel**

Add to `libs/shared-types/src/index.ts`:

```typescript
export type { BracketEntry, BracketStatus, FirestoreTimestamp } from './lib/bracket';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx nx run shared-types:lint` or `npx tsc --noEmit -p libs/shared-types/tsconfig.json`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add libs/shared-types/src/lib/bracket.ts libs/shared-types/src/index.ts
git commit -m "feat: add BracketEntry shared type"
```

### Task 2: Add Firestore to Firebase config

**Files:**
- Modify: `apps/web/src/shared/config/firebase.ts`

- [ ] **Step 1: Add getFirestore import and export**

Update `apps/web/src/shared/config/firebase.ts`:

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

- [ ] **Step 2: Verify the app still compiles**

Run: `npx nx build web --skip-nx-cache`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/shared/config/firebase.ts
git commit -m "feat: add Firestore to Firebase config"
```

### Task 3: Update Firestore rules and index

**Files:**
- Modify: `firestore.rules`
- Create: `firestore.indexes.json`

- [ ] **Step 1: Add collection group read rule**

Update `firestore.rules` to add the brackets collection group rule inside the existing `match /databases/{database}/documents` block:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow read if authenticated user is reading their own document
      // or if user is admin
      allow read: if request.auth != null &&
        (request.auth.uid == userId || request.auth.token.role == 'admin');

      // Only admins can write to user documents
      allow write: if request.auth != null &&
        request.auth.token.role == 'admin';
    }

    // Brackets subcollection — public read for directory
    match /{path=**}/brackets/{bracketId} {
      allow read: if true;
    }
  }
}
```

- [ ] **Step 2: Create Firestore indexes file**

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "brackets",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat: add Firestore rules and index for brackets directory"
```

---

## Chunk 2: UI Primitives (Table component in libs/ui)

### Task 4: Create generic Table component

**Files:**
- Create: `libs/ui/src/components/table.tsx`
- Modify: `libs/ui/src/index.ts`

- [ ] **Step 1: Create the Table primitives**

Create `libs/ui/src/components/table.tsx` following the existing shadcn pattern (see `button.tsx`, `card.tsx` for style):

```typescript
// libs/ui/src/components/table.tsx
import type * as React from 'react';

import { cn } from '../lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div data-slot="table-wrapper" className="relative w-full overflow-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
```

- [ ] **Step 2: Export from ui barrel**

Add to `libs/ui/src/index.ts`:

```typescript
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/table';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add libs/ui/src/components/table.tsx libs/ui/src/index.ts
git commit -m "feat: add Table UI primitives to libs/ui"
```

---

## Chunk 3: Data Hook (useBrackets)

### Task 5: Create useBrackets hook

**Files:**
- Create: `apps/web/src/pages/brackets/use-brackets.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/web/src/pages/brackets/use-brackets.ts
import type { BracketEntry } from '@movable-madness/shared-types';
import {
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getFirebaseDb } from '../../shared/config/firebase';

interface UseBracketsResult {
  entries: BracketEntry[];
  loading: boolean;
  error: string | null;
}

export function useBrackets(): UseBracketsResult {
  const [entries, setEntries] = useState<BracketEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();
    const bracketsQuery = query(
      collectionGroup(db, 'brackets'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      bracketsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data() as BracketEntry);
        setEntries(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { entries, loading, error };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/brackets/use-brackets.ts
git commit -m "feat: add useBrackets real-time Firestore hook"
```

---

## Chunk 4: Branded Table + Page + Route

### Task 6: Create BracketsTable component

**Files:**
- Create: `apps/web/src/pages/brackets/brackets-table.tsx`

- [ ] **Step 1: Create the branded presentational table**

```typescript
// apps/web/src/pages/brackets/brackets-table.tsx
import type { BracketEntry } from '@movable-madness/shared-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@movable-madness/ui';
import { Check, Circle } from 'lucide-react';

interface BracketsTableProps {
  entries: BracketEntry[];
  loading?: boolean;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow
          key={i}
          className={
            i % 2 === 0
              ? 'border-0 bg-white dark:bg-zinc-900'
              : 'border-0 bg-[#fdf2f8] dark:bg-zinc-800'
          }
        >
          <TableCell className="px-5 py-3">
            <div className="h-4 w-3/5 animate-pulse rounded bg-pink-200 dark:bg-zinc-700" />
          </TableCell>
          <TableCell className="px-5 py-3">
            <div className="h-4 w-2/6 animate-pulse rounded bg-pink-200 dark:bg-zinc-700" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function StatusCell({ status }: { status: BracketEntry['status'] }) {
  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#166534] dark:text-emerald-400">
        <Check className="size-4" />
        Picks Submitted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#92400e] dark:text-amber-400">
      <Circle className="size-3.5" />
      In Progress
    </span>
  );
}

export function BracketsTable({ entries, loading }: BracketsTableProps) {
  const count = loading ? 0 : entries.length;

  return (
    <div className="overflow-hidden rounded-xl border-t-4 border-t-[#E31C79] shadow-md dark:shadow-lg dark:shadow-black/20">
      {/* Branded header bar */}
      <div className="bg-gradient-to-br from-[#E31C79] to-[#c4156a] px-5 py-4">
        <span className="text-base font-bold tracking-tight text-white">
          Submitted Brackets
        </span>
        {!loading && (
          <span className="ml-3 text-[13px] text-white/70">
            {count} {count === 1 ? 'participant' : 'participants'}
          </span>
        )}
      </div>

      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="border-b-2 border-b-pink-200 bg-[#fdf2f8] hover:bg-[#fdf2f8] dark:border-b-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-800">
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#831843] dark:text-pink-300">
              Bracket Name
            </TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#831843] dark:text-pink-300">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows />
          ) : entries.length === 0 ? (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell
                colSpan={2}
                className="py-12 text-center text-muted-foreground"
              >
                No brackets yet — be the first to enter!
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, i) => (
              <TableRow
                key={`${entry.bracketName}-${i}`}
                className={
                  i % 2 === 0
                    ? 'border-0 bg-white hover:bg-pink-50/50 dark:bg-zinc-900 dark:hover:bg-zinc-900/80'
                    : 'border-0 bg-[#fdf2f8] hover:bg-pink-100/50 dark:bg-zinc-800 dark:hover:bg-zinc-800/80'
                }
              >
                <TableCell className="px-5 py-3 font-medium text-foreground">
                  {entry.bracketName}
                </TableCell>
                <TableCell className="px-5 py-3">
                  <StatusCell status={entry.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/brackets/brackets-table.tsx
git commit -m "feat: add branded BracketsTable component"
```

### Task 7: Create BracketsDirectoryPage and wire route

**Files:**
- Create: `apps/web/src/pages/brackets/brackets-directory-page.tsx`
- Modify: `apps/web/src/app/app.tsx`

- [ ] **Step 1: Create the page component**

```typescript
// apps/web/src/pages/brackets/brackets-directory-page.tsx
import { Alert, AlertDescription, AlertTitle } from '@movable-madness/ui';
import { AlertCircle } from 'lucide-react';
import { BracketsTable } from './brackets-table';
import { useBrackets } from './use-brackets';

export function BracketsDirectoryPage() {
  const { entries, loading, error } = useBrackets();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unable to load brackets. Please try again later.
            </AlertDescription>
          </Alert>
        ) : (
          <BracketsTable entries={entries} loading={loading} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the /brackets route**

Add import at the top of `apps/web/src/app/app.tsx`:

```typescript
import { BracketsDirectoryPage } from '../pages/brackets/brackets-directory-page';
```

Add the route inside the `<Routes>` block in `AppRoutes`, after the `/sign-in` route:

```typescript
<Route path="/brackets" element={<BracketsDirectoryPage />} />
```

- [ ] **Step 3: Verify the app builds and the route is accessible**

Run: `npx nx build web --skip-nx-cache`
Expected: Build succeeds.

Then manually verify: run `npx nx serve web`, navigate to `http://localhost:4200/brackets`.
Expected: Page renders. If Firestore index is not yet deployed, you may see an error alert (this is correct behavior). If no data exists, you should see the empty state message.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/brackets/brackets-directory-page.tsx apps/web/src/app/app.tsx
git commit -m "feat: add BracketsDirectoryPage and /brackets route"
```

---

## Chunk 5: Deploy Firestore Index + Manual Smoke Test

### Task 8: Deploy Firestore rules and index

- [ ] **Step 1: Deploy Firestore rules**

Run: `npx firebase deploy --only firestore:rules`
Expected: Rules deployed successfully.

- [ ] **Step 2: Deploy Firestore indexes**

Run: `npx firebase deploy --only firestore:indexes`
Expected: Index creation initiated. Note: collection group indexes can take a few minutes to build.

- [ ] **Step 3: Commit any generated Firebase files (if applicable)**

If Firebase CLI modifies any files (like `.firebaserc`), stage and commit them.

### Task 9: Manual smoke test

- [ ] **Step 1: Start dev server**

Run: `npx nx serve web`

- [ ] **Step 2: Navigate to /brackets**

Open `http://localhost:4200/brackets` in the browser.

Expected states to verify:
1. **Loading**: Skeleton rows with pulsing placeholders appear briefly
2. **Empty**: If no bracket data exists, see "No brackets yet — be the first to enter!"
3. **Error**: If index is still building, an error alert appears above (correct behavior)

- [ ] **Step 3: Test dark mode**

Toggle to dark mode (if theme toggle exists, or add `dark` class to `<html>`).
Expected: Magenta header stays the same, rows switch to dark zinc tones, status colors use emerald-400/amber-400.

- [ ] **Step 4: Test with data (optional)**

If another agent has populated Firestore with bracket entries, verify:
- Bracket names appear in the table
- Status shows correct icon + text for each status
- Alternating row colors work
- Participant count in header is accurate
