# Dark Mode Audit & Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded colors across 10 component files with semantic CSS custom properties so every page works correctly in dark mode.

**Architecture:** Add 6 new CSS custom properties (brand + warning tokens) to the existing theme system in `styles.css`, register them with Tailwind, then systematically replace hardcoded color classes in each component file. No structural changes — only className string replacements.

**Tech Stack:** Tailwind CSS v4, CSS custom properties (oklch color space), React/TypeScript

**Spec:** `docs/superpowers/specs/2026-03-15-dark-mode-audit-design.md`

---

## Chunk 1: CSS Tokens + Page Components

### Task 1: Add new CSS custom properties to styles.css

**Files:**
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Add brand and warning tokens to `:root`**

Add these lines after `--ring: oklch(0.708 0 0);` (line 52) inside the `:root` block:

```css
  --brand: oklch(0.56 0.24 350);
  --brand-foreground: oklch(1 0 0);
  --brand-muted: oklch(0.94 0.03 340);
  --brand-muted-foreground: oklch(0.35 0.12 350);
  --warning: oklch(0.97 0.03 90);
  --warning-foreground: oklch(0.48 0.08 85);
```

- [ ] **Step 2: Add dark mode overrides to `.dark`**

Add these lines after `--ring: oklch(0.556 0 0);` (line 74) inside the `.dark` block:

```css
  --brand: oklch(0.56 0.24 350);
  --brand-foreground: oklch(1 0 0);
  --brand-muted: oklch(0.25 0.04 340);
  --brand-muted-foreground: oklch(0.78 0.1 340);
  --warning: oklch(0.25 0.04 85);
  --warning-foreground: oklch(0.78 0.1 85);
```

- [ ] **Step 3: Register tokens in `@theme inline`**

Add these lines after `--color-ring: var(--ring);` (line 25) inside the `@theme inline` block:

```css
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-muted: var(--brand-muted);
  --color-brand-muted-foreground: var(--brand-muted-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
```

- [ ] **Step 4: Verify build compiles**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "feat: add brand and warning CSS tokens for dark mode"
```

---

### Task 2: Update bracket-dashboard-page.tsx

**Files:**
- Modify: `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx`

- [ ] **Step 1: Replace all hardcoded colors**

Apply these replacements throughout the file:

Line 20 — outer div:
```
bg-[#f5f5f5]  →  bg-muted
```

Line 22 — header:
```
border-gray-200 bg-white  →  border-border bg-card
```

Line 25 — brand name:
```
text-gray-900  →  text-foreground
```

Line 30 — sign out button:
```
text-[#E31C79] hover:text-[#c8186b]  →  text-brand hover:text-brand
```

Line 39 — welcome heading:
```
text-gray-900  →  text-foreground
```

Line 42 — subtitle:
```
text-gray-500  →  text-muted-foreground
```

Line 48 — card 1:
```
border-t-[#E31C79] bg-white  →  border-t-brand bg-card
shadow-[0_2px_12px_rgba(0,0,0,0.06)]  →  shadow-md dark:shadow-lg dark:shadow-black/20
hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]  →  hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/25
```

Line 50 — icon box 1:
```
bg-[#FDE8F1]  →  bg-brand-muted
```

Line 54 — card title:
```
text-gray-900  →  text-foreground
```

Line 55 — card subtitle:
```
text-gray-500  →  text-muted-foreground
```

Line 57 — arrow:
```
text-gray-300  →  text-muted-foreground
```

Line 64 — card 2 (same pattern as card 1):
```
border-t-[#E31C79] bg-white  →  border-t-brand bg-card
shadow-[0_2px_12px_rgba(0,0,0,0.06)]  →  shadow-md dark:shadow-lg dark:shadow-black/20
hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]  →  hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/25
```

Line 66 — icon box 2:
```
bg-[#FDE8F1]  →  bg-brand-muted
```

Line 70 — card 2 title:
```
text-gray-900  →  text-foreground
```

Line 73 — card 2 subtitle:
```
text-gray-500  →  text-muted-foreground
```

Line 75 — arrow 2:
```
text-gray-300  →  text-muted-foreground
```

The full resulting file should be:

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
    <div className="min-h-screen bg-muted font-[Inter,system-ui,sans-serif]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏀</span>
          <span className="text-lg font-bold text-foreground">Movable Madness</span>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="text-sm font-medium text-brand hover:text-brand"
        >
          Sign Out
        </Button>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[640px] px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-1.5 text-2xl font-bold text-foreground">
            Welcome, {bracketName ?? 'Player'}! 👋
          </h1>
          <p className="text-base text-muted-foreground">What would you like to do?</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Edit My Bracket card */}
          <Link to="/bracket/edit" className="block">
            <div className="rounded-xl border-t-[3px] border-t-brand bg-card p-7 shadow-md transition-shadow hover:shadow-lg dark:shadow-lg dark:shadow-black/20 dark:hover:shadow-xl dark:hover:shadow-black/25">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-muted text-2xl">
                  ✏️
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">Edit My Bracket</h3>
                  <p className="text-sm text-muted-foreground">Make your picks for all 64 teams</p>
                </div>
                <span className="text-xl text-muted-foreground">→</span>
              </div>
            </div>
          </Link>

          {/* View Submitted Brackets card */}
          <Link to="/brackets" className="block">
            <div className="rounded-xl border-t-[3px] border-t-brand bg-card p-7 shadow-md transition-shadow hover:shadow-lg dark:shadow-lg dark:shadow-black/20 dark:hover:shadow-xl dark:hover:shadow-black/25">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-muted text-2xl">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">
                    View Submitted Brackets
                  </h3>
                  <p className="text-sm text-muted-foreground">See how others filled out their brackets</p>
                </div>
                <span className="text-xl text-muted-foreground">→</span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx
git commit -m "feat: replace hardcoded colors with semantic tokens in bracket dashboard"
```

---

### Task 3: Update bracket-login-page.tsx

**Files:**
- Modify: `apps/web/src/pages/bracket/login/bracket-login-page.tsx`

- [ ] **Step 1: Replace all hardcoded colors**

The full resulting file should be:

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
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Redirect if already authenticated as anonymous user (but not while submitting,
  // since signInAnonymously fires onAuthStateChanged before the API call completes)
  if (isAuthenticated && isAnonymous && !submitting) {
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
    <div className="flex min-h-screen items-center justify-center bg-muted p-4 font-[Inter,system-ui,sans-serif]">
      <div className="w-full max-w-[400px] rounded-xl bg-card p-10 shadow-lg text-center dark:shadow-xl dark:shadow-black/20">
        <div className="mb-2 text-4xl">🏀</div>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Movable Madness</h1>
        <p className="mb-8 text-sm text-muted-foreground">Enter your bracket name to get started</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 text-left">
            <Label htmlFor="bracketName" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            {submitting ? 'Joining...' : 'Join Tournament'}
          </Button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-lg bg-warning p-3 text-left">
          <span className="flex-shrink-0 text-base">⚠️</span>
          <p className="text-xs leading-relaxed text-warning-foreground">
            You must use the same browser to return to your picks. Your session is tied to this
            browser only.
          </p>
        </div>
      </div>
    </div>
  );
}
```

Key changes:
- `bg-[#f5f5f5]` → `bg-muted`
- `bg-white` → `bg-card`
- `shadow-[0_4px_24px_rgba(0,0,0,0.08)]` → `shadow-lg dark:shadow-xl dark:shadow-black/20`
- `text-gray-900` → `text-foreground`
- `text-gray-500` → `text-muted-foreground`
- `text-gray-600` → `text-muted-foreground`
- `dark:text-gray-900` on Input → removed (just `className="w-full"`)
- `bg-[#E31C79]` → `bg-brand`, `hover:bg-[#c8186b]` → `hover:bg-brand/90`
- `text-white` on button → `text-brand-foreground`
- `text-red-600` → `text-destructive`
- `bg-[#FFF8E1]` → `bg-warning`
- `text-[#7a6520]` → `text-warning-foreground`

- [ ] **Step 2: Verify build compiles**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/bracket/login/bracket-login-page.tsx
git commit -m "feat: replace hardcoded colors with semantic tokens in bracket login"
```

---

### Task 4: Update ViewBracketPage.tsx

**Files:**
- Modify: `apps/web/src/pages/brackets/view/ViewBracketPage.tsx`

- [ ] **Step 1: Replace all hardcoded colors**

The full resulting file should be:

```tsx
import type { BracketDocument } from '@movable-madness/shared-types';
import { Alert, AlertDescription } from '@movable-madness/ui';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBracket } from '../../../features/brackets/api/brackets-api';
import { BracketGrid } from '../../../features/brackets/components/BracketGrid';
import { BracketHeader } from '../../../features/brackets/components/BracketHeader';

function BracketSkeleton() {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[1100px] gap-4 px-4 py-6">
        {[32, 16, 8, 4].map((count) => (
          <div key={count} className="flex shrink-0 basis-40 flex-col gap-2">
            <div className="mx-auto h-3 w-20 animate-pulse rounded bg-muted" />
            {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton UI with no reordering
              <div key={j} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ViewBracketPage() {
  const { bracketId } = useParams<{ bracketId: string }>();
  const [bracket, setBracket] = useState<BracketDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bracketId) return;

    setLoading(true);
    setError(null);

    fetchBracket(bracketId)
      .then((response) => {
        if (response.success && response.data) {
          setBracket(response.data);
        } else {
          setError(response.error?.message ?? 'Bracket not found');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load bracket');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bracketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse bg-brand-muted px-6 py-4">
          <div className="h-6 w-48 rounded bg-brand-muted" />
          <div className="mt-2 h-3 w-32 rounded bg-brand-muted" />
        </div>
        <BracketSkeleton />
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md px-4">
          <Alert variant="destructive">
            <AlertDescription>{error ?? 'Bracket not found'}</AlertDescription>
          </Alert>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm text-brand underline hover:text-brand"
            >
              Try again
            </button>
            <a href="/" className="text-sm text-muted-foreground underline hover:text-foreground">
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BracketHeader bracketName={bracket.bracketName} createdAt={bracket.createdAt} />
      <BracketGrid teams={bracket.teams} picks={bracket.picks} />
    </div>
  );
}
```

Key changes:
- All 3 `bg-gray-50` → `bg-background`
- `bg-gray-200` (skeleton) → `bg-muted`
- `bg-pink-200` / `bg-pink-300` (skeleton header) → `bg-brand-muted`
- `text-[#E31C79]` / `hover:text-[#c4166a]` → `text-brand hover:text-brand`
- `text-gray-500` / `hover:text-gray-700` → `text-muted-foreground hover:text-foreground`

- [ ] **Step 2: Verify build compiles**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/brackets/view/ViewBracketPage.tsx
git commit -m "feat: replace hardcoded colors with semantic tokens in view bracket page"
```

---

## Chunk 2: Feature Components

### Task 5: Update MatchupCard.tsx

**Files:**
- Modify: `apps/web/src/features/brackets/components/MatchupCard.tsx`

- [ ] **Step 1: Replace all hardcoded colors**

The full resulting file should be:

```tsx
import type { Matchup } from '@movable-madness/shared-types';

interface MatchupCardProps {
  matchup: Matchup;
  isChampionship?: boolean;
}

function TeamRow({
  team,
  seed,
  isWinner,
  isTop,
}: {
  team: string | null;
  seed?: number;
  isWinner: boolean;
  isTop: boolean;
}) {
  if (team == null) {
    return (
      <div
        className={`px-2.5 py-1.5 text-xs text-muted-foreground italic${
          isTop ? '' : ' border-t border-dashed border-border'
        }`}
      >
        TBD
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 text-xs${
        isTop ? '' : ' border-t border-border'
      }${isWinner ? '' : ' text-muted-foreground'}`}
    >
      <span>
        {seed != null && <span className="mr-1 text-[10px] text-muted-foreground">({seed})</span>}
        {team}
      </span>
      {isWinner && <span className="font-semibold text-brand">&#10003;</span>}
    </div>
  );
}

export function MatchupCard({ matchup, isChampionship = false }: MatchupCardProps) {
  const hasAnyTeam = matchup.topTeam != null || matchup.bottomTeam != null;
  const borderClass = isChampionship
    ? 'border-2 border-brand rounded-lg'
    : hasAnyTeam
      ? 'border border-border rounded-md'
      : 'border border-dashed border-border rounded-md';

  return (
    <div className={`bg-card overflow-hidden ${borderClass}`}>
      <TeamRow
        team={matchup.topTeam}
        seed={matchup.topSeed}
        isWinner={matchup.winner === matchup.topTeam && matchup.topTeam != null}
        isTop={true}
      />
      <TeamRow
        team={matchup.bottomTeam}
        seed={matchup.bottomSeed}
        isWinner={matchup.winner === matchup.bottomTeam && matchup.bottomTeam != null}
        isTop={false}
      />
    </div>
  );
}
```

Key changes:
- `bg-white` → `bg-card`
- `text-gray-400` → `text-muted-foreground` (all occurrences)
- `border-gray-200` → `border-border` (preserving `border-dashed` style)
- `border-gray-300` → `border-border` (preserving `border-dashed` on empty matchups)
- `border-[#E31C79]` → `border-brand`
- `text-[#E31C79]` → `text-brand`

- [ ] **Step 2: Verify build compiles**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/brackets/components/MatchupCard.tsx
git commit -m "feat: replace hardcoded colors with semantic tokens in MatchupCard"
```

---

### Task 6: Update BracketGrid.tsx, BracketRound.tsx, and BracketHeader.tsx

**Files:**
- Modify: `apps/web/src/features/brackets/components/BracketGrid.tsx`
- Modify: `apps/web/src/features/brackets/components/BracketRound.tsx`
- Modify: `apps/web/src/features/brackets/components/BracketHeader.tsx`

These three files are small and closely related — updating them together.

- [ ] **Step 1: Update BracketGrid.tsx**

The full resulting file should be:

```tsx
import { deriveBracketMatchups, ROUND_NAMES } from '../utils/derive-bracket-matchups';
import { BracketRound } from './BracketRound';

interface BracketGridProps {
  teams: string[];
  picks: Record<string, string>;
}

export function BracketGrid({ teams, picks }: BracketGridProps) {
  const rounds = deriveBracketMatchups(teams, picks);
  const champion = rounds[5]?.[0]?.winner ?? null;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[1100px] gap-0 px-4 py-6">
        {rounds.map((matchups, i) => (
          <div key={ROUND_NAMES[i]} className="flex flex-col">
            <BracketRound
              name={ROUND_NAMES[i]}
              matchups={matchups}
              roundIndex={i}
              isChampionship={i === 5}
            />
            {i === 5 && (
              <div className="mt-3 text-center">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Champion</div>
                <div
                  className={`mt-1 rounded-lg border-2 border-dashed px-3 py-2 text-base font-bold ${
                    champion
                      ? 'border-brand bg-brand-muted text-brand'
                      : 'border-border bg-muted text-muted-foreground italic'
                  }`}
                >
                  {champion ?? 'TBD'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

Key changes:
- `text-gray-400` → `text-muted-foreground`
- `border-[#E31C79] bg-pink-50 text-[#E31C79]` → `border-brand bg-brand-muted text-brand`
- `border-gray-300 bg-gray-50 text-gray-400` → `border-border bg-muted text-muted-foreground`

- [ ] **Step 2: Update BracketRound.tsx**

The full resulting file should be:

```tsx
import type { Matchup } from '@movable-madness/shared-types';
import { MatchupCard } from './MatchupCard';

interface BracketRoundProps {
  name: string;
  matchups: Matchup[];
  roundIndex: number;
  isChampionship: boolean;
}

export function BracketRound({ name, matchups, roundIndex, isChampionship }: BracketRoundProps) {
  const topOffset = roundIndex === 0 ? 0 : Math.round(30 * (2 ** roundIndex - 1) * 0.5);

  return (
    <div className="flex shrink-0 basis-40 flex-col gap-2" style={{ marginTop: topOffset }}>
      <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-brand">
        {name}
      </div>
      {matchups.map((matchup) => (
        <MatchupCard key={matchup.key} matchup={matchup} isChampionship={isChampionship} />
      ))}
    </div>
  );
}
```

Key change: `text-[#E31C79]` → `text-brand`

- [ ] **Step 3: Update BracketHeader.tsx**

The full resulting file should be:

```tsx
import { useCallback, useState } from 'react';

interface BracketHeaderProps {
  bracketName: string;
  createdAt: string;
}

export function BracketHeader({ bracketName, createdAt }: BracketHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail without HTTPS or focus
    }
  }, []);

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between bg-brand px-6 py-4 text-brand-foreground">
      <div>
        <h1 className="text-xl font-bold">{bracketName}</h1>
        <p className="mt-0.5 text-sm opacity-85">Submitted {formattedDate}</p>
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="rounded-md bg-white/20 px-3.5 py-1.5 text-sm transition-colors hover:bg-white/30"
      >
        {copied ? 'Copied!' : 'Share Link'}
      </button>
    </div>
  );
}
```

Key changes:
- `bg-[#E31C79]` → `bg-brand`
- `text-white` → `text-brand-foreground`
- `bg-white/20` and `hover:bg-white/30` on share button left as-is (semi-transparent overlays work in both modes)

- [ ] **Step 4: Verify build compiles**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/brackets/components/BracketGrid.tsx apps/web/src/features/brackets/components/BracketRound.tsx apps/web/src/features/brackets/components/BracketHeader.tsx
git commit -m "feat: replace hardcoded colors with semantic tokens in bracket view components"
```

---

### Task 7: Update team-slot.tsx and submit-footer.tsx

**Files:**
- Modify: `apps/web/src/features/bracket/ui/team-slot.tsx`
- Modify: `apps/web/src/features/bracket/ui/submit-footer.tsx`

These two files are small and both in the bracket editor — updating together.

- [ ] **Step 1: Update team-slot.tsx**

The full resulting file should be:

```tsx
import type { Team } from '@movable-madness/shared-types';
import { cn } from '@movable-madness/ui';

interface TeamSlotProps {
  team: Team | null;
  isSelected: boolean;
  onClick: () => void;
}

export function TeamSlot({ team, isSelected, onClick }: TeamSlotProps) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-border/40 px-3 py-2 text-sm text-muted-foreground">
        <span className="w-5 text-center text-xs">—</span>
        <span>TBD</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-sm transition-colors',
        'hover:border-foreground/30 cursor-pointer',
        isSelected
          ? 'border-brand bg-brand/10 text-foreground'
          : 'border-transparent bg-card text-foreground',
      )}
    >
      <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
        {team.seed}
      </span>
      <span className="truncate font-medium">{team.name}</span>
    </button>
  );
}
```

Key changes:
- `border-[#E31C79]` → `border-brand`
- `bg-[#E31C79]/10` → `bg-brand/10`

- [ ] **Step 2: Update submit-footer.tsx**

The full resulting file should be:

```tsx
import { Button } from '@movable-madness/ui';
import { TOTAL_MATCHUPS } from '../model/teams';

interface SubmitFooterProps {
  picksCount: number;
  isComplete: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}

export function SubmitFooter({
  picksCount,
  isComplete,
  isSubmitting,
  submitError,
  onSubmit,
}: SubmitFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {submitError && (
        <div className="bg-destructive/90 px-4 py-2 text-center text-sm text-destructive-foreground">
          {submitError}
        </div>
      )}
      <div className="flex items-center justify-between bg-brand px-6 py-4">
        <span className="text-sm font-medium text-brand-foreground">
          <span className="font-bold">
            {picksCount} of {TOTAL_MATCHUPS}
          </span>{' '}
          picks made
        </span>
        <Button variant="secondary" disabled={!isComplete || isSubmitting} onClick={onSubmit}>
          {isSubmitting ? 'Submitting...' : 'Submit Bracket'}
        </Button>
      </div>
    </div>
  );
}
```

Key changes:
- `bg-[#E31C79]` → `bg-brand`
- `text-white` → `text-brand-foreground`

- [ ] **Step 3: Verify build compiles**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/bracket/ui/team-slot.tsx apps/web/src/features/bracket/ui/submit-footer.tsx
git commit -m "feat: replace hardcoded colors with semantic tokens in bracket editor components"
```

---

### Task 8: Update brackets-table.tsx

**Files:**
- Modify: `apps/web/src/pages/brackets/brackets-table.tsx`

This is the most complex file — it has row alternation, skeleton rows, and many `dark:` overrides to remove.

- [ ] **Step 1: Replace all hardcoded colors and remove dark: overrides**

The full resulting file should be:

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@movable-madness/ui';
import { Check, Circle } from 'lucide-react';
import type { BracketEntryWithId } from './use-brackets';

interface BracketsTableProps {
  entries: BracketEntryWithId[];
  loading?: boolean;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key, i) => (
        <TableRow
          key={key}
          className={
            i % 2 === 0
              ? 'border-0 bg-card'
              : 'border-0 bg-brand-muted'
          }
        >
          <TableCell className="px-5 py-3">
            <div className="h-4 w-3/5 animate-pulse rounded bg-brand-muted" />
          </TableCell>
          <TableCell className="px-5 py-3">
            <div className="h-4 w-2/6 animate-pulse rounded bg-brand-muted" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function StatusCell({ status }: { status: BracketEntryWithId['status'] }) {
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
    <div className="overflow-hidden rounded-xl border-t-4 border-t-brand shadow-md dark:shadow-lg dark:shadow-black/20">
      {/* Branded header bar */}
      <div className="bg-gradient-to-br from-brand to-brand/85 px-5 py-4">
        <span className="text-base font-bold tracking-tight text-brand-foreground">Submitted Brackets</span>
        {!loading && (
          <span className="ml-3 text-[13px] text-brand-foreground/70">
            {count} {count === 1 ? 'participant' : 'participants'}
          </span>
        )}
      </div>

      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="border-b-2 border-b-brand-muted bg-brand-muted hover:bg-brand-muted">
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-brand-muted-foreground">
              Bracket Name
            </TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-brand-muted-foreground">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows />
          ) : entries.length === 0 ? (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={2} className="py-12 text-center text-muted-foreground">
                No brackets yet — be the first to enter!
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, i) => (
              <TableRow
                key={entry.id}
                className={
                  i % 2 === 0
                    ? 'border-0 bg-card hover:bg-brand-muted/50'
                    : 'border-0 bg-brand-muted hover:bg-brand-muted/80'
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

Key changes:
- `border-t-[#E31C79]` → `border-t-brand`
- `from-[#E31C79] to-[#c4156a]` → `from-brand to-brand/85`
- `text-white` → `text-brand-foreground`
- `text-white/70` → `text-brand-foreground/70`
- `text-[#831843] dark:text-pink-300` → `text-brand-muted-foreground` (removed `dark:`)
- `bg-pink-200 dark:bg-zinc-700` → `bg-brand-muted` (removed `dark:`)
- Table header row: removed all `dark:` overrides, `bg-[#fdf2f8]` → `bg-brand-muted`, `border-b-pink-200` → `border-b-brand-muted`
- Even skeleton rows: `bg-white dark:bg-zinc-900` → `bg-card`
- Odd skeleton rows: `bg-[#fdf2f8] dark:bg-zinc-800` → `bg-brand-muted`
- Even data rows: `bg-white hover:bg-pink-50/50 dark:bg-zinc-900 dark:hover:bg-zinc-900/80` → `bg-card hover:bg-brand-muted/50`
- Odd data rows: `bg-[#fdf2f8] hover:bg-pink-100/50 dark:bg-zinc-800 dark:hover:bg-zinc-800/80` → `bg-brand-muted hover:bg-brand-muted/80`
- Status colors (`text-[#166534] dark:text-emerald-400`, `text-[#92400e] dark:text-amber-400`) left as-is

- [ ] **Step 2: Verify build compiles**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/brackets/brackets-table.tsx
git commit -m "feat: replace hardcoded colors with semantic tokens in brackets table"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full build verification**

Run: `pnpm exec nx build web --skip-nx-cache`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify no remaining hardcoded colors**

Run a grep to confirm no hardcoded colors remain in the modified files:

```bash
grep -rn 'bg-\[#\|text-\[#\|border-\[#\|bg-white\|bg-gray-\|text-gray-\|border-gray-\|bg-pink-\|text-pink-\|border-pink-' \
  apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx \
  apps/web/src/pages/bracket/login/bracket-login-page.tsx \
  apps/web/src/pages/brackets/view/ViewBracketPage.tsx \
  apps/web/src/features/brackets/components/MatchupCard.tsx \
  apps/web/src/features/brackets/components/BracketGrid.tsx \
  apps/web/src/features/brackets/components/BracketRound.tsx \
  apps/web/src/features/brackets/components/BracketHeader.tsx \
  apps/web/src/features/bracket/ui/team-slot.tsx \
  apps/web/src/features/bracket/ui/submit-footer.tsx \
  apps/web/src/pages/brackets/brackets-table.tsx
```

Expected: Only matches are `bg-white/20` and `hover:bg-white/30` in BracketHeader.tsx (intentionally kept).
