# Submitted Brackets Directory — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a public "Submitted Brackets" directory screen that lists all bracket participants with real-time updates from Firestore.

**Architecture:** Feature-based module (`features/brackets/`) with a Firestore `onSnapshot` real-time listener hook, a presentational table component using shadcn/ui, and a page component wired into React Router. Firestore SDK is initialized alongside the existing Firebase Auth config.

**Tech Stack:** React 19, Firestore Web SDK (real-time listener), shadcn/ui Table + Skeleton + Badge, Tailwind CSS v4, React Router 7

---

### Task 1: Add shadcn/ui Table and Skeleton components

**Files:**
- Create: `libs/ui/src/components/table.tsx`
- Create: `libs/ui/src/components/skeleton.tsx`
- Modify: `libs/ui/src/index.ts`

**Step 1: Add Table component via shadcn CLI**

Run from the project root:
```bash
pnpm dlx shadcn@latest add table
```

This generates `libs/ui/src/components/table.tsx` based on the aliases in `components.json`.

**Step 2: Add Skeleton component via shadcn CLI**

```bash
pnpm dlx shadcn@latest add skeleton
```

This generates `libs/ui/src/components/skeleton.tsx`.

**Step 3: Export new components from the UI library**

Modify `libs/ui/src/index.ts` — add these exports after the existing ones:

```typescript
export { Skeleton } from './components/skeleton';
export {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './components/table';
```

**Step 4: Verify the build**

```bash
pnpm nx build ui
```
Expected: BUILD SUCCESS

**Step 5: Commit**

```bash
git add libs/ui/src/components/table.tsx libs/ui/src/components/skeleton.tsx libs/ui/src/index.ts
git commit -m "feat(ui): add Table and Skeleton shadcn components"
```

---

### Task 2: Add Firestore initialization to Firebase config

**Files:**
- Modify: `apps/web/src/shared/config/firebase.ts`

**Step 1: Add Firestore import and getter**

Add to `apps/web/src/shared/config/firebase.ts`:

```typescript
import { type Firestore, getFirestore } from 'firebase/firestore';
```

Add a module-level variable alongside existing `app` and `auth`:

```typescript
let db: Firestore;
```

Add a new exported function after `getFirebaseAuth()`:

```typescript
export function getFirebaseFirestore(): Firestore {
  if (!db) {
    if (getApps().length === 0) {
      initFirebase();
    }
    db = getFirestore(getApps()[0]);
  }
  return db;
}
```

**Step 2: Verify the app still compiles**

```bash
pnpm nx build web
```
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add apps/web/src/shared/config/firebase.ts
git commit -m "feat(web): add Firestore initialization to Firebase config"
```

---

### Task 3: Create bracket types

**Files:**
- Create: `apps/web/src/features/brackets/model/bracket.types.ts`

**Step 1: Create the types file**

Create `apps/web/src/features/brackets/model/bracket.types.ts`:

```typescript
export type BracketStatus = 'in_progress' | 'submitted';

export interface BracketEntry {
  id: string;
  bracketName: string;
  userId: string;
  status: BracketStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/brackets/model/bracket.types.ts
git commit -m "feat(brackets): add bracket entry TypeScript types"
```

---

### Task 4: Create the Firestore real-time listener hook

**Files:**
- Create: `apps/web/src/features/brackets/api/use-brackets-listener.ts`

**Step 1: Create the hook**

Create `apps/web/src/features/brackets/api/use-brackets-listener.ts`:

```typescript
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getFirebaseFirestore } from '../../../shared/config/firebase';
import type { BracketEntry } from '../model/bracket.types';

interface UseBracketsListenerResult {
  brackets: BracketEntry[];
  loading: boolean;
  error: string | null;
}

export function useBracketsListener(): UseBracketsListenerResult {
  const [brackets, setBrackets] = useState<BracketEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const bracketsQuery = query(
      collection(db, 'brackets'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      bracketsQuery,
      (snapshot) => {
        const entries: BracketEntry[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            bracketName: data.bracketName,
            userId: data.userId,
            status: data.status,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
          };
        });
        setBrackets(entries);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Brackets listener error:', err);
        setError('Failed to load brackets. Please try again.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { brackets, loading, error };
}
```

**Step 2: Verify the app compiles**

```bash
pnpm nx build web
```
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add apps/web/src/features/brackets/api/use-brackets-listener.ts
git commit -m "feat(brackets): add Firestore real-time listener hook"
```

---

### Task 5: Create the SubmittedBracketsTable component

**Files:**
- Create: `apps/web/src/features/brackets/ui/submitted-brackets-table.tsx`

**Step 1: Create the table component**

Create `apps/web/src/features/brackets/ui/submitted-brackets-table.tsx`:

```typescript
import {
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui';
import type { BracketEntry } from '../model/bracket.types';

interface SubmittedBracketsTableProps {
  brackets: BracketEntry[];
  loading: boolean;
}

function StatusBadge({ status }: { status: BracketEntry['status'] }) {
  if (status === 'submitted') {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
        Picks Submitted
      </Badge>
    );
  }
  return <Badge variant="secondary">In Progress</Badge>;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-28" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SubmittedBracketsTable({ brackets, loading }: SubmittedBracketsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border-t-4 border-t-[#E31C79] shadow-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="font-semibold">Bracket Name</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : (
              brackets.map((bracket, index) => (
                <TableRow
                  key={bracket.id}
                  className={index % 2 === 0 ? 'bg-muted/50' : ''}
                >
                  <TableCell className="font-medium">
                    {bracket.bracketName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={bracket.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

**Step 2: Verify the app compiles**

```bash
pnpm nx build web
```
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add apps/web/src/features/brackets/ui/submitted-brackets-table.tsx
git commit -m "feat(brackets): add SubmittedBracketsTable component"
```

---

### Task 6: Create the feature barrel export

**Files:**
- Create: `apps/web/src/features/brackets/index.ts`

**Step 1: Create the barrel file**

Create `apps/web/src/features/brackets/index.ts`:

```typescript
// API
export { useBracketsListener } from './api/use-brackets-listener';

// Model
export type { BracketEntry, BracketStatus } from './model/bracket.types';

// UI
export { SubmittedBracketsTable } from './ui/submitted-brackets-table';
```

**Step 2: Commit**

```bash
git add apps/web/src/features/brackets/index.ts
git commit -m "feat(brackets): add feature barrel export"
```

---

### Task 7: Create the SubmittedBracketsPage and wire up routing

**Files:**
- Create: `apps/web/src/pages/brackets/submitted-brackets-page.tsx`
- Modify: `apps/web/src/app/app.tsx`

**Step 1: Create the page component**

Create `apps/web/src/pages/brackets/submitted-brackets-page.tsx`:

```typescript
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui';
import { useBracketsListener, SubmittedBracketsTable } from '../../features/brackets';

export function SubmittedBracketsPage() {
  const { brackets, loading, error } = useBracketsListener();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-[Inter,system-ui,sans-serif]">
      <h1 className="mb-6 text-3xl font-bold text-foreground">
        Submitted Brackets
      </h1>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !loading && brackets.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No brackets submitted yet. Be the first!
        </p>
      ) : (
        <SubmittedBracketsTable brackets={brackets} loading={loading} />
      )}
    </div>
  );
}
```

**Step 2: Add the route to app.tsx**

Modify `apps/web/src/app/app.tsx`:

Add import at the top (after other page imports):
```typescript
import { SubmittedBracketsPage } from '../pages/brackets/submitted-brackets-page';
```

Add route inside `<Routes>` in the `AppRoutes` function, after the `/sign-in` route:
```tsx
<Route path="/brackets" element={<SubmittedBracketsPage />} />
```

**Step 3: Verify the app compiles**

```bash
pnpm nx build web
```
Expected: BUILD SUCCESS

**Step 4: Commit**

```bash
git add apps/web/src/pages/brackets/submitted-brackets-page.tsx apps/web/src/app/app.tsx
git commit -m "feat(brackets): add Submitted Brackets page and /brackets route"
```

---

### Task 8: Add Inter font to the app

**Files:**
- Modify: `apps/web/index.html` (or `apps/web/src/styles.css`)

**Step 1: Check if Inter is already available**

Check `apps/web/index.html` for any font links. If Inter is not included, add a Google Fonts link in the `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

**Step 2: Verify the font renders**

Start the dev server:
```bash
pnpm nx serve web
```
Navigate to `http://localhost:4200/brackets`. Confirm Inter font renders on the page.

**Step 3: Commit**

```bash
git add apps/web/index.html
git commit -m "feat(web): add Inter font from Google Fonts"
```

---

### Task 9: Manual smoke test with Firestore

**Step 1: Start the dev server**

```bash
pnpm nx serve web
```

**Step 2: Navigate to `/brackets`**

Open `http://localhost:4200/brackets` in the browser.

Expected states to verify:
- **Loading:** 4 skeleton rows appear briefly
- **Empty:** "No brackets submitted yet. Be the first!" message shows
- **Magenta accent:** Pink/magenta top border on the table container
- **Font:** Inter renders on the page heading and table text

**Step 3: Add a test document to Firestore**

Go to the Firebase Console > Firestore > Create collection `brackets` > Add document with:
```json
{
  "bracketName": "Test Bracket",
  "userId": "test-user-123",
  "status": "submitted",
  "createdAt": (server timestamp),
  "updatedAt": (server timestamp)
}
```

Expected: The table updates in real-time showing "Test Bracket" with a green "Picks Submitted" badge.

**Step 4: Add a second document with `status: "in_progress"`**

Expected: Shows "In Progress" with a muted/secondary badge. Alternating row colors visible.

**Step 5: Clean up test data from Firestore**

Delete the test documents from the Firebase Console.
