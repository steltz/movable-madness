# Quick Pick Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Quick Pick button to the bracket editor that randomizes all 63 matchup selections with one click.

**Architecture:** Pure utility function `generateRandomPicks()` in bracket-utils.ts builds picks round-by-round. Hook exposes `quickPick()`. Editor page adds button + conditional AlertDialog.

**Tech Stack:** React 19, Vitest, shadcn/ui, Radix UI AlertDialog, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-15-quick-pick-design.md`

---

## Chunk 1: Core Logic + UI

### Task 1: Add AlertDialog component to shared UI library

**Files:**
- Create: `libs/ui/src/components/alert-dialog.tsx`
- Modify: `libs/ui/src/index.ts`

- [ ] **Step 1: Install @radix-ui/react-alert-dialog**

```bash
cd /Users/nicholasstelter/worktrees/movable-madness-w4 && pnpm add @radix-ui/react-alert-dialog
```

- [ ] **Step 2: Create the AlertDialog component**

Create `libs/ui/src/components/alert-dialog.tsx` with the standard shadcn/ui AlertDialog component. Follow the existing patterns in the codebase: function components (no forwardRef — React 19), `data-slot` attributes, `cn()` utility, `React.ComponentProps<>` typing.

```tsx
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import type * as React from 'react';

import { cn } from '../lib/utils';

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" className={className} {...props} />
  );
}

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
```

- [ ] **Step 3: Export from libs/ui/src/index.ts**

Add this export after the existing `Alert` export line:

```ts
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './components/alert-dialog';
```

- [ ] **Step 4: Verify it compiles**

```bash
cd /Users/nicholasstelter/worktrees/movable-madness-w4 && npx nx typecheck web
```

Expected: PASS (no type errors)

- [ ] **Step 5: Commit**

```bash
git add libs/ui/src/components/alert-dialog.tsx libs/ui/src/index.ts package.json pnpm-lock.yaml
git commit -m "feat(ui): add AlertDialog component from shadcn/ui"
```

---

### Task 2: Add `generateRandomPicks()` with tests (TDD)

**Files:**
- Modify: `apps/web/src/features/bracket/model/bracket-utils.ts`
- Modify: `apps/web/src/features/bracket/model/bracket-utils.test.ts`

**Dependencies:** None (pure function, no UI dependency)

- [ ] **Step 1: Write the failing tests**

First, update the existing import at the top of `apps/web/src/features/bracket/model/bracket-utils.test.ts` to include `generateRandomPicks`:

```ts
import {
  countPicks,
  createEmptyPicks,
  generateRandomPicks,
  getFeederMatchupIds,
  getFirstRoundTeams,
  getMatchupTeams,
  isComplete,
  matchupId,
  matchupsInRound,
  parseMatchupId,
  selectWinner,
} from './bracket-utils';
```

Then add the new describe block at the end of the file:

```ts
describe('generateRandomPicks', () => {
  it('returns a complete bracket with all 63 picks', () => {
    const picks = generateRandomPicks();
    expect(countPicks(picks)).toBe(63);
    expect(isComplete(picks)).toBe(true);
  });

  it('every pick is a valid team ID (1-64)', () => {
    const picks = generateRandomPicks();
    for (const value of Object.values(picks)) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(64);
    }
  });

  it('round 1 picks are one of the two matched teams', () => {
    const picks = generateRandomPicks();
    for (let i = 0; i < 32; i++) {
      const [team1, team2] = getFirstRoundTeams(i);
      const pick = picks[matchupId(1, i)];
      expect([team1.id, team2.id]).toContain(pick);
    }
  });

  it('round 2+ picks are one of the two feeder winners', () => {
    const picks = generateRandomPicks();
    for (let round = 2; round <= 6; round++) {
      const count = matchupsInRound(round);
      for (let i = 0; i < count; i++) {
        const [feeder1, feeder2] = getFeederMatchupIds(round, i);
        const pick = picks[matchupId(round, i)];
        expect([picks[feeder1], picks[feeder2]]).toContain(pick);
      }
    }
  });

  it('produces different results across multiple calls', () => {
    const results = new Set<string>();
    for (let n = 0; n < 10; n++) {
      const picks = generateRandomPicks();
      results.add(JSON.stringify(picks));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/nicholasstelter/worktrees/movable-madness-w4 && npx nx test web -- --run --reporter=verbose 2>&1 | tail -30
```

Expected: FAIL — `generateRandomPicks` is not exported from `./bracket-utils`

- [ ] **Step 3: Implement `generateRandomPicks()`**

Add to the end of `apps/web/src/features/bracket/model/bracket-utils.ts` (before the closing of the file):

```ts
/**
 * Generate a complete bracket with random picks (50/50 coin flip per matchup).
 * Iterates round-by-round so later rounds can reference earlier winners.
 */
export function generateRandomPicks(): BracketPicks {
  const picks: BracketPicks = {};

  for (let round = 1; round <= 6; round++) {
    const count = matchupsInRound(round);
    for (let i = 0; i < count; i++) {
      if (round === 1) {
        const [team1, team2] = getFirstRoundTeams(i);
        picks[matchupId(round, i)] = Math.random() < 0.5 ? team1.id : team2.id;
      } else {
        const [feeder1, feeder2] = getFeederMatchupIds(round, i);
        const team1Id = picks[feeder1]!;
        const team2Id = picks[feeder2]!;
        picks[matchupId(round, i)] = Math.random() < 0.5 ? team1Id : team2Id;
      }
    }
  }

  return picks;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/nicholasstelter/worktrees/movable-madness-w4 && npx nx test web -- --run --reporter=verbose 2>&1 | tail -40
```

Expected: ALL PASS (existing tests + 5 new tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/bracket/model/bracket-utils.ts apps/web/src/features/bracket/model/bracket-utils.test.ts
git commit -m "feat(bracket): add generateRandomPicks utility with tests"
```

---

### Task 3: Expose `quickPick()` from the hook

**Files:**
- Modify: `apps/web/src/features/bracket/model/use-bracket.ts`

**Dependencies:** Task 2 (needs `generateRandomPicks`)

- [ ] **Step 1: Add import**

In `apps/web/src/features/bracket/model/use-bracket.ts`, update the import from `./bracket-utils` to include `generateRandomPicks`:

```ts
import {
  selectWinner as applySelectWinner,
  isComplete as checkIsComplete,
  countPicks,
  createEmptyPicks,
  generateRandomPicks,
  getMatchupTeams,
} from './bracket-utils';
```

- [ ] **Step 2: Add `quickPick` to the `UseBracketReturn` interface**

Add after the `isSubmitted: boolean;` line (line 25):

```ts
  quickPick: () => void;
```

- [ ] **Step 3: Add the `quickPick` function inside the hook**

Add after the `submitBracket` callback (after line 62), before the return statement:

```ts
  const quickPick = useCallback(() => {
    setPicks(generateRandomPicks());
  }, []);
```

- [ ] **Step 4: Add `quickPick` to the return object**

Add `quickPick,` to the return object (after `isSubmitted,`):

```ts
  return {
    picks,
    selectWinner,
    getTeams,
    picksCount,
    isComplete,
    submitBracket,
    isSubmitting,
    submitError,
    isSubmitted,
    quickPick,
  };
```

- [ ] **Step 5: Verify it compiles**

```bash
cd /Users/nicholasstelter/worktrees/movable-madness-w4 && npx nx typecheck web
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/bracket/model/use-bracket.ts
git commit -m "feat(bracket): expose quickPick from useBracket hook"
```

---

### Task 4: Add Quick Pick button + confirmation to bracket editor

**Files:**
- Modify: `apps/web/src/features/bracket/ui/bracket-editor-page.tsx`

**Dependencies:** Task 1 (AlertDialog), Task 3 (quickPick from hook)

- [ ] **Step 1: Update the component**

Replace the entire contents of `apps/web/src/features/bracket/ui/bracket-editor-page.tsx` with:

```tsx
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@movable-madness/ui';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { useBracket } from '../model/use-bracket';
import { BracketGrid } from './bracket-grid';
import { SubmitFooter } from './submit-footer';

export function BracketEditorPage() {
  const { bracketName } = useAuthContext();

  if (!bracketName) {
    return <Navigate to="/brackets/dashboard" replace />;
  }

  return <BracketEditorContent bracketName={bracketName} />;
}

function BracketEditorContent({ bracketName }: { bracketName: string }) {
  const {
    picks,
    selectWinner,
    getTeams,
    picksCount,
    isComplete,
    submitBracket,
    isSubmitting,
    submitError,
    isSubmitted,
    quickPick,
  } = useBracket({ bracketName });

  const [showConfirm, setShowConfirm] = useState(false);

  const handleQuickPick = () => {
    if (picksCount > 0) {
      setShowConfirm(true);
    } else {
      quickPick();
    }
  };

  const handleConfirmQuickPick = () => {
    quickPick();
    setShowConfirm(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-3xl font-bold text-foreground">Bracket Submitted!</h1>
        <p className="text-muted-foreground">Your bracket "{bracketName}" has been saved.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{bracketName}</h1>
          <p className="text-sm text-muted-foreground">Click a team to advance them</p>
        </div>
        <Button variant="outline" aria-label="Quick Pick" onClick={handleQuickPick}>
          🎲 Quick Pick
        </Button>
      </header>
      <BracketGrid picks={picks} getTeams={getTeams} onSelectWinner={selectWinner} />
      <SubmitFooter
        picksCount={picksCount}
        isComplete={isComplete}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={submitBracket}
      />
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all picks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all your current picks with random selections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmQuickPick}>Quick Pick</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/nicholasstelter/worktrees/movable-madness-w4 && npx nx typecheck web
```

Expected: PASS

- [ ] **Step 3: Run all tests to verify nothing is broken**

```bash
cd /Users/nicholasstelter/worktrees/movable-madness-w4 && npx nx test web -- --run --reporter=verbose 2>&1 | tail -40
```

Expected: ALL PASS

- [ ] **Step 4: Manual smoke test**

```bash
cd /Users/nicholasstelter/worktrees/movable-madness-w4 && npx nx serve web
```

1. Navigate to `/brackets/login`, log in, go to `/brackets/edit`
2. Click "Quick Pick" — all 63 picks should fill instantly
3. Click "Quick Pick" again — confirmation dialog should appear
4. Click "Cancel" — picks should remain unchanged
5. Click "Quick Pick" in dialog — all picks should re-randomize

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/bracket/ui/bracket-editor-page.tsx
git commit -m "feat(bracket): add Quick Pick button with confirmation dialog"
```
