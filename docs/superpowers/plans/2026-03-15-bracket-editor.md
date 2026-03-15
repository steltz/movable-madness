# Bracket Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the interactive 64-team bracket editor screen where users click teams to advance them through 6 rounds and submit their completed bracket.

**Architecture:** Feature module at `apps/web/src/features/bracket/` following the existing `ui/model/api` pattern. A `useBracket` custom hook manages all bracket state and logic. Presentational components render the horizontal bracket grid. The API call uses the existing `apiClient` with auth token injection.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Vitest, React Router v7

**Spec:** `docs/superpowers/specs/2026-03-15-bracket-editor-design.md`

---

## File Structure

```
libs/shared-types/src/lib/bracket.ts              — Team, BracketPicks, BracketSubmission types
libs/shared-types/src/index.ts                     — re-export bracket types (modify)

apps/web/src/features/bracket/
├── index.ts                                       — public exports
├── model/
│   ├── teams.ts                                   — hardcoded 64-team array
│   ├── bracket-utils.ts                           — pure functions: matchup ID generation, feeder lookups, cascade logic
│   └── use-bracket.ts                             — React hook wrapping bracket-utils with state
├── api/
│   └── bracket-api.ts                             — POST /api/brackets call
└── ui/
    ├── team-slot.tsx                              — clickable team row
    ├── matchup.tsx                                — two team slots stacked
    ├── bracket-round.tsx                          — vertical column of matchups
    ├── bracket-grid.tsx                           — horizontally scrollable container
    ├── submit-footer.tsx                          — sticky bottom bar
    └── bracket-editor-page.tsx                    — page component (route target)

apps/web/src/app/app.tsx                           — add /bracket/edit route (modify)
```

**Key decomposition decision:** Bracket logic is split into `bracket-utils.ts` (pure functions, easily unit-testable without React) and `use-bracket.ts` (thin React wrapper with `useState`). This keeps the complex cascade/derivation logic testable without rendering components.

---

## Chunk 1: Types, Teams Data, and Bracket Utils

### Task 1: Shared Types

**Files:**
- Create: `libs/shared-types/src/lib/bracket.ts`
- Modify: `libs/shared-types/src/index.ts`

- [ ] **Step 1: Create bracket types file**

Create `libs/shared-types/src/lib/bracket.ts`:

```ts
export interface Team {
  id: number;
  name: string;
  seed: number;
  region: 'East' | 'West' | 'South' | 'Midwest';
}

export type BracketPicks = Record<string, number | null>;

export interface BracketSubmission {
  bracketName: string;
  picks: BracketPicks;
}
```

- [ ] **Step 2: Re-export from shared-types index**

Add to `libs/shared-types/src/index.ts`:

```ts
export type { BracketPicks, BracketSubmission, Team } from './lib/bracket';
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --project libs/shared-types/tsconfig.json --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add libs/shared-types/src/lib/bracket.ts libs/shared-types/src/index.ts
git commit -m "feat(shared-types): add bracket types"
```

---

### Task 2: Teams Data

**Files:**
- Create: `apps/web/src/features/bracket/model/teams.ts`

- [ ] **Step 1: Create the 64-team array**

Create `apps/web/src/features/bracket/model/teams.ts` with a hardcoded array of 64 NCAA-style teams. Organized into 4 regions with 16 seeded teams each. Use real team names for demo polish.

```ts
import type { Team } from '@movable-madness/shared-types';

export const TEAMS: Team[] = [
  // East Region
  { id: 1, name: 'Duke', seed: 1, region: 'East' },
  { id: 2, name: 'Vermont', seed: 16, region: 'East' },
  { id: 3, name: 'Tennessee', seed: 8, region: 'East' },
  { id: 4, name: 'Drake', seed: 9, region: 'East' },
  { id: 5, name: 'Purdue', seed: 5, region: 'East' },
  { id: 6, name: 'High Point', seed: 12, region: 'East' },
  { id: 7, name: 'Clemson', seed: 4, region: 'East' },
  { id: 8, name: 'Iona', seed: 13, region: 'East' },
  { id: 9, name: 'Creighton', seed: 6, region: 'East' },
  { id: 10, name: 'UC San Diego', seed: 11, region: 'East' },
  { id: 11, name: 'Illinois', seed: 3, region: 'East' },
  { id: 12, name: 'Troy', seed: 14, region: 'East' },
  { id: 13, name: 'Kentucky', seed: 7, region: 'East' },
  { id: 14, name: 'Lipscomb', seed: 10, region: 'East' },
  { id: 15, name: 'Arizona', seed: 2, region: 'East' },
  { id: 16, name: 'Norfolk St', seed: 15, region: 'East' },

  // West Region
  { id: 17, name: 'Florida', seed: 1, region: 'West' },
  { id: 18, name: 'FGCU', seed: 16, region: 'West' },
  { id: 19, name: 'UConn', seed: 8, region: 'West' },
  { id: 20, name: 'Oklahoma', seed: 9, region: 'West' },
  { id: 21, name: 'Memphis', seed: 5, region: 'West' },
  { id: 22, name: 'Colorado St', seed: 12, region: 'West' },
  { id: 23, name: 'Maryland', seed: 4, region: 'West' },
  { id: 24, name: 'Grand Canyon', seed: 13, region: 'West' },
  { id: 25, name: 'Missouri', seed: 6, region: 'West' },
  { id: 26, name: 'Liberty', seed: 11, region: 'West' },
  { id: 27, name: 'Texas Tech', seed: 3, region: 'West' },
  { id: 28, name: 'UNC Wilmington', seed: 14, region: 'West' },
  { id: 29, name: 'Kansas', seed: 7, region: 'West' },
  { id: 30, name: 'Arkansas', seed: 10, region: 'West' },
  { id: 31, name: 'St. John\'s', seed: 2, region: 'West' },
  { id: 32, name: 'Omaha', seed: 15, region: 'West' },

  // South Region
  { id: 33, name: 'Auburn', seed: 1, region: 'South' },
  { id: 34, name: 'Alabama St', seed: 16, region: 'South' },
  { id: 35, name: 'Louisville', seed: 8, region: 'South' },
  { id: 36, name: 'Oregon', seed: 9, region: 'South' },
  { id: 37, name: 'Baylor', seed: 5, region: 'South' },
  { id: 38, name: 'VCU', seed: 12, region: 'South' },
  { id: 39, name: 'Wisconsin', seed: 4, region: 'South' },
  { id: 40, name: 'Akron', seed: 13, region: 'South' },
  { id: 41, name: 'BYU', seed: 6, region: 'South' },
  { id: 42, name: 'Vanderbilt', seed: 11, region: 'South' },
  { id: 43, name: 'Texas A&M', seed: 3, region: 'South' },
  { id: 44, name: 'Yale', seed: 14, region: 'South' },
  { id: 45, name: 'UCLA', seed: 7, region: 'South' },
  { id: 46, name: 'Utah St', seed: 10, region: 'South' },
  { id: 47, name: 'Michigan', seed: 2, region: 'South' },
  { id: 48, name: 'Wofford', seed: 15, region: 'South' },

  // Midwest Region
  { id: 49, name: 'Houston', seed: 1, region: 'Midwest' },
  { id: 50, name: 'SIU Edwardsville', seed: 16, region: 'Midwest' },
  { id: 51, name: 'Gonzaga', seed: 8, region: 'Midwest' },
  { id: 52, name: 'Georgia', seed: 9, region: 'Midwest' },
  { id: 53, name: 'Marquette', seed: 5, region: 'Midwest' },
  { id: 54, name: 'New Mexico', seed: 12, region: 'Midwest' },
  { id: 55, name: 'Iowa St', seed: 4, region: 'Midwest' },
  { id: 56, name: 'Colgate', seed: 13, region: 'Midwest' },
  { id: 57, name: 'Michigan St', seed: 6, region: 'Midwest' },
  { id: 58, name: 'Xavier', seed: 11, region: 'Midwest' },
  { id: 59, name: 'Texas', seed: 3, region: 'Midwest' },
  { id: 60, name: 'Robert Morris', seed: 14, region: 'Midwest' },
  { id: 61, name: 'San Diego St', seed: 7, region: 'Midwest' },
  { id: 62, name: 'North Carolina', seed: 10, region: 'Midwest' },
  { id: 63, name: 'Alabama', seed: 2, region: 'Midwest' },
  { id: 64, name: 'Mount St. Mary\'s', seed: 15, region: 'Midwest' },
];

/**
 * Standard NCAA bracket seeding matchup order.
 * Each pair of indices into a region's 16 teams forms a first-round matchup.
 * Teams are ordered in the TEAMS array as: seed 1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15
 * This produces matchups: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
 */
export const ROUND_LABELS = [
  'Round 1',
  'Round 2',
  'Sweet 16',
  'Elite 8',
  'Final Four',
  'Championship',
] as const;

export const TOTAL_ROUNDS = 6;
export const TOTAL_MATCHUPS = 63;
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/model/teams.ts
git commit -m "feat(bracket): add hardcoded 64-team data"
```

---

### Task 3: Bracket Utils (Pure Functions)

**Files:**
- Create: `apps/web/src/features/bracket/model/bracket-utils.ts`

This file contains all pure bracket logic — no React, no state. Each function is independently testable.

- [ ] **Step 1: Write bracket-utils with all pure functions**

Create `apps/web/src/features/bracket/model/bracket-utils.ts`:

```ts
import type { BracketPicks, Team } from '@movable-madness/shared-types';
import { TEAMS, TOTAL_MATCHUPS } from './teams';

/**
 * Generate a matchup ID from round and matchup index.
 * Example: round 1, matchup 0 → "R1_M0"
 */
export function matchupId(round: number, matchIndex: number): string {
  return `R${round}_M${matchIndex}`;
}

/**
 * Parse a matchup ID into its round and matchup index.
 */
export function parseMatchupId(id: string): { round: number; matchIndex: number } {
  const match = id.match(/^R(\d+)_M(\d+)$/);
  if (!match) throw new Error(`Invalid matchup ID: ${id}`);
  return { round: Number(match[1]), matchIndex: Number(match[2]) };
}

/**
 * Get the number of matchups in a given round.
 * Round 1: 32, Round 2: 16, ..., Round 6: 1
 */
export function matchupsInRound(round: number): number {
  return 32 / Math.pow(2, round - 1);
}

/**
 * Get the two feeder matchup IDs for a given matchup in rounds 2+.
 * Matchup M in round R is fed by matchups 2*M and 2*M+1 in round R-1.
 */
export function getFeederMatchupIds(round: number, matchIndex: number): [string, string] {
  if (round <= 1) throw new Error('Round 1 has no feeders');
  return [
    matchupId(round - 1, matchIndex * 2),
    matchupId(round - 1, matchIndex * 2 + 1),
  ];
}

/**
 * Get the two teams for a first-round matchup.
 * Teams are arranged in the TEAMS array as pairs within each region:
 * indices 0-15 = East, 16-31 = West, 32-47 = South, 48-63 = Midwest.
 * Within each region, teams are paired: (0,1), (2,3), (4,5), ...
 * Matchup index 0-7 = East, 8-15 = West, 16-23 = South, 24-31 = Midwest.
 */
export function getFirstRoundTeams(matchIndex: number): [Team, Team] {
  const teamIndex = matchIndex * 2;
  return [TEAMS[teamIndex], TEAMS[teamIndex + 1]];
}

/**
 * Get the two teams for any matchup, given the current picks.
 * For round 1, returns the hardcoded teams.
 * For later rounds, derives teams from feeder matchup winners.
 * Returns null for a slot if the feeder pick hasn't been made.
 */
export function getMatchupTeams(
  round: number,
  matchIndex: number,
  picks: BracketPicks,
): [Team | null, Team | null] {
  if (round === 1) {
    return getFirstRoundTeams(matchIndex);
  }

  const [feeder1, feeder2] = getFeederMatchupIds(round, matchIndex);
  const team1Id = picks[feeder1];
  const team2Id = picks[feeder2];

  return [
    team1Id != null ? TEAMS.find((t) => t.id === team1Id) ?? null : null,
    team2Id != null ? TEAMS.find((t) => t.id === team2Id) ?? null : null,
  ];
}

/**
 * Initialize an empty picks object with all 63 matchup slots set to null.
 */
export function createEmptyPicks(): BracketPicks {
  const picks: BracketPicks = {};
  for (let round = 1; round <= 6; round++) {
    const count = matchupsInRound(round);
    for (let i = 0; i < count; i++) {
      picks[matchupId(round, i)] = null;
    }
  }
  return picks;
}

/**
 * Select a winner for a matchup and cascade-clear any downstream picks
 * that depended on a different team previously occupying that slot.
 *
 * Returns a new picks object (immutable update).
 */
export function selectWinner(
  picks: BracketPicks,
  id: string,
  teamId: number,
): BracketPicks {
  const { round, matchIndex } = parseMatchupId(id);
  const previousPick = picks[id];

  // If same team already selected, no-op
  if (previousPick === teamId) return picks;

  const newPicks = { ...picks, [id]: teamId };

  // Cascade: clear downstream picks that included the old winner
  if (previousPick != null) {
    clearDownstream(newPicks, round, matchIndex, previousPick);
  }

  return newPicks;
}

/**
 * Recursively clear downstream picks that included a specific team.
 * Mutates the picks object for efficiency (called on a fresh copy).
 */
function clearDownstream(
  picks: BracketPicks,
  fromRound: number,
  fromMatchIndex: number,
  clearedTeamId: number,
): void {
  const nextRound = fromRound + 1;
  if (nextRound > 6) return;

  const nextMatchIndex = Math.floor(fromMatchIndex / 2);
  const nextId = matchupId(nextRound, nextMatchIndex);

  if (picks[nextId] === clearedTeamId) {
    picks[nextId] = null;
    // Continue clearing further downstream
    clearDownstream(picks, nextRound, nextMatchIndex, clearedTeamId);
  }
}

/**
 * Count how many picks have been made (non-null values).
 */
export function countPicks(picks: BracketPicks): number {
  return Object.values(picks).filter((v) => v != null).length;
}

/**
 * Check if all 63 picks have been made.
 */
export function isComplete(picks: BracketPicks): boolean {
  return countPicks(picks) === TOTAL_MATCHUPS;
}
```

- [ ] **Step 2: Write unit tests for bracket-utils**

Create `apps/web/src/features/bracket/model/bracket-utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  countPicks,
  createEmptyPicks,
  getFeederMatchupIds,
  getFirstRoundTeams,
  getMatchupTeams,
  isComplete,
  matchupId,
  matchupsInRound,
  parseMatchupId,
  selectWinner,
} from './bracket-utils';

describe('matchupId', () => {
  it('generates correct ID format', () => {
    expect(matchupId(1, 0)).toBe('R1_M0');
    expect(matchupId(3, 5)).toBe('R3_M5');
  });
});

describe('parseMatchupId', () => {
  it('parses a valid matchup ID', () => {
    expect(parseMatchupId('R1_M0')).toEqual({ round: 1, matchIndex: 0 });
    expect(parseMatchupId('R6_M0')).toEqual({ round: 6, matchIndex: 0 });
  });

  it('throws on invalid ID', () => {
    expect(() => parseMatchupId('invalid')).toThrow('Invalid matchup ID');
  });
});

describe('matchupsInRound', () => {
  it('returns correct count per round', () => {
    expect(matchupsInRound(1)).toBe(32);
    expect(matchupsInRound(2)).toBe(16);
    expect(matchupsInRound(3)).toBe(8);
    expect(matchupsInRound(4)).toBe(4);
    expect(matchupsInRound(5)).toBe(2);
    expect(matchupsInRound(6)).toBe(1);
  });
});

describe('getFeederMatchupIds', () => {
  it('returns correct feeder IDs for round 2', () => {
    expect(getFeederMatchupIds(2, 0)).toEqual(['R1_M0', 'R1_M1']);
    expect(getFeederMatchupIds(2, 3)).toEqual(['R1_M6', 'R1_M7']);
  });

  it('throws for round 1', () => {
    expect(() => getFeederMatchupIds(1, 0)).toThrow('Round 1 has no feeders');
  });
});

describe('getFirstRoundTeams', () => {
  it('returns two teams for matchup 0 (East 1 vs 16)', () => {
    const [team1, team2] = getFirstRoundTeams(0);
    expect(team1.seed).toBe(1);
    expect(team2.seed).toBe(16);
    expect(team1.region).toBe('East');
    expect(team2.region).toBe('East');
  });

  it('returns two teams for matchup 8 (West 1 vs 16)', () => {
    const [team1, team2] = getFirstRoundTeams(8);
    expect(team1.seed).toBe(1);
    expect(team2.seed).toBe(16);
    expect(team1.region).toBe('West');
    expect(team2.region).toBe('West');
  });
});

describe('createEmptyPicks', () => {
  it('creates 63 null picks', () => {
    const picks = createEmptyPicks();
    const entries = Object.entries(picks);
    expect(entries).toHaveLength(63);
    expect(entries.every(([, v]) => v === null)).toBe(true);
  });

  it('has 32 round-1 matchups', () => {
    const picks = createEmptyPicks();
    const r1 = Object.keys(picks).filter((k) => k.startsWith('R1_'));
    expect(r1).toHaveLength(32);
  });
});

describe('getMatchupTeams', () => {
  it('returns hardcoded teams for round 1', () => {
    const picks = createEmptyPicks();
    const [t1, t2] = getMatchupTeams(1, 0, picks);
    expect(t1).not.toBeNull();
    expect(t2).not.toBeNull();
  });

  it('returns nulls for round 2 when feeders not picked', () => {
    const picks = createEmptyPicks();
    const [t1, t2] = getMatchupTeams(2, 0, picks);
    expect(t1).toBeNull();
    expect(t2).toBeNull();
  });

  it('returns teams for round 2 when feeders are picked', () => {
    let picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0); // R1_M0 top team
    const [team3] = getFirstRoundTeams(1); // R1_M1 top team
    picks = selectWinner(picks, 'R1_M0', team1.id);
    picks = selectWinner(picks, 'R1_M1', team3.id);
    const [t1, t2] = getMatchupTeams(2, 0, picks);
    expect(t1?.id).toBe(team1.id);
    expect(t2?.id).toBe(team3.id);
  });
});

describe('selectWinner', () => {
  it('sets the pick for a matchup', () => {
    const picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    const result = selectWinner(picks, 'R1_M0', team1.id);
    expect(result['R1_M0']).toBe(team1.id);
  });

  it('returns same object for same pick (no-op)', () => {
    let picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    picks = selectWinner(picks, 'R1_M0', team1.id);
    const result = selectWinner(picks, 'R1_M0', team1.id);
    expect(result).toBe(picks);
  });

  it('cascades clears when changing a pick', () => {
    let picks = createEmptyPicks();
    const [team1, team2] = getFirstRoundTeams(0);
    const [team3] = getFirstRoundTeams(1);

    // Pick team1 in R1_M0, team3 in R1_M1
    picks = selectWinner(picks, 'R1_M0', team1.id);
    picks = selectWinner(picks, 'R1_M1', team3.id);
    // Pick team1 in R2_M0
    picks = selectWinner(picks, 'R2_M0', team1.id);
    expect(picks['R2_M0']).toBe(team1.id);

    // Change R1_M0 to team2 — should cascade clear R2_M0
    picks = selectWinner(picks, 'R1_M0', team2.id);
    expect(picks['R1_M0']).toBe(team2.id);
    expect(picks['R2_M0']).toBeNull();
  });

  it('cascade clears multiple rounds deep', () => {
    let picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    const [, team2] = getFirstRoundTeams(0);
    const [team3] = getFirstRoundTeams(1);
    const [team5] = getFirstRoundTeams(2);
    const [team7] = getFirstRoundTeams(3);

    // Build a path: team1 wins R1_M0, R2_M0, R3_M0
    picks = selectWinner(picks, 'R1_M0', team1.id);
    picks = selectWinner(picks, 'R1_M1', team3.id);
    picks = selectWinner(picks, 'R2_M0', team1.id);
    picks = selectWinner(picks, 'R1_M2', team5.id);
    picks = selectWinner(picks, 'R1_M3', team7.id);
    picks = selectWinner(picks, 'R2_M1', team5.id);
    picks = selectWinner(picks, 'R3_M0', team1.id);

    // Change R1_M0 to team2 — should cascade clear R2_M0 and R3_M0
    picks = selectWinner(picks, 'R1_M0', team2.id);
    expect(picks['R2_M0']).toBeNull();
    expect(picks['R3_M0']).toBeNull();
  });
});

describe('countPicks / isComplete', () => {
  it('counts zero for empty picks', () => {
    expect(countPicks(createEmptyPicks())).toBe(0);
    expect(isComplete(createEmptyPicks())).toBe(false);
  });

  it('counts correctly after picks', () => {
    let picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    picks = selectWinner(picks, 'R1_M0', team1.id);
    expect(countPicks(picks)).toBe(1);
  });
});
```

- [ ] **Step 3: Add vitest config for the web app**

Add a `test` section to `apps/web/vite.config.mts` to enable vitest:

Add inside the `defineConfig` return object, after the `build` property:

```ts
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run --config apps/web/vite.config.mts`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/bracket/model/bracket-utils.ts apps/web/src/features/bracket/model/bracket-utils.test.ts apps/web/vite.config.mts
git commit -m "feat(bracket): add bracket utils with tests"
```

---

## Chunk 2: API Layer, Hook, and Feature Index

### Task 4: Bracket API

**Files:**
- Create: `apps/web/src/features/bracket/api/bracket-api.ts`

- [ ] **Step 1: Create the API service**

Create `apps/web/src/features/bracket/api/bracket-api.ts`:

```ts
import type { ApiResponse, BracketSubmission } from '@movable-madness/shared-types';
import { post } from '../../../shared/api/api-client';

export function submitBracket(
  submission: BracketSubmission,
): Promise<ApiResponse<{ bracketId: string }>> {
  return post('/brackets', submission);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/api/bracket-api.ts
git commit -m "feat(bracket): add bracket API service"
```

---

### Task 5: useBracket Hook

**Files:**
- Create: `apps/web/src/features/bracket/model/use-bracket.ts`

- [ ] **Step 1: Create the hook**

Create `apps/web/src/features/bracket/model/use-bracket.ts`:

```ts
import { useCallback, useMemo, useState } from 'react';
import type { BracketPicks, Team } from '@movable-madness/shared-types';
import {
  countPicks,
  createEmptyPicks,
  getMatchupTeams,
  isComplete as checkIsComplete,
  selectWinner as applySelectWinner,
} from './bracket-utils';
import { submitBracket as apiSubmitBracket } from '../api/bracket-api';

interface UseBracketOptions {
  bracketName: string;
}

interface UseBracketReturn {
  picks: BracketPicks;
  selectWinner: (matchupId: string, teamId: number) => void;
  getTeams: (round: number, matchIndex: number) => [Team | null, Team | null];
  picksCount: number;
  isComplete: boolean;
  submitBracket: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  isSubmitted: boolean;
}

export function useBracket({ bracketName }: UseBracketOptions): UseBracketReturn {
  const [picks, setPicks] = useState<BracketPicks>(createEmptyPicks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectWinner = useCallback((matchupId: string, teamId: number) => {
    setPicks((prev) => applySelectWinner(prev, matchupId, teamId));
  }, []);

  const getTeams = useCallback(
    (round: number, matchIndex: number): [Team | null, Team | null] => {
      return getMatchupTeams(round, matchIndex, picks);
    },
    [picks],
  );

  const picksCount = useMemo(() => countPicks(picks), [picks]);
  const isComplete = useMemo(() => checkIsComplete(picks), [picks]);

  const submitBracket = useCallback(async () => {
    if (!isComplete) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await apiSubmitBracket({ bracketName, picks });
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit bracket. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [bracketName, picks, isComplete]);

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
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/model/use-bracket.ts
git commit -m "feat(bracket): add useBracket hook"
```

---

## Chunk 3: UI Components

### Task 6: TeamSlot Component

**Files:**
- Create: `apps/web/src/features/bracket/ui/team-slot.tsx`

- [ ] **Step 1: Create TeamSlot**

Create `apps/web/src/features/bracket/ui/team-slot.tsx`:

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
          ? 'border-[#E31C79] bg-[#E31C79]/10 text-foreground'
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

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/ui/team-slot.tsx
git commit -m "feat(bracket): add TeamSlot component"
```

---

### Task 7: Matchup Component

**Files:**
- Create: `apps/web/src/features/bracket/ui/matchup.tsx`

- [ ] **Step 1: Create Matchup**

Create `apps/web/src/features/bracket/ui/matchup.tsx`:

```tsx
import type { Team } from '@movable-madness/shared-types';
import { TeamSlot } from './team-slot';

interface MatchupProps {
  team1: Team | null;
  team2: Team | null;
  selectedTeamId: number | null;
  onSelectWinner: (teamId: number) => void;
  /** Hide connector on the last round (championship) */
  hideConnector?: boolean;
}

export function Matchup({
  team1,
  team2,
  selectedTeamId,
  onSelectWinner,
  hideConnector = false,
}: MatchupProps) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/30 p-1">
        <TeamSlot
          team={team1}
          isSelected={team1 != null && selectedTeamId === team1.id}
          onClick={() => team1 && onSelectWinner(team1.id)}
        />
        <TeamSlot
          team={team2}
          isSelected={team2 != null && selectedTeamId === team2.id}
          onClick={() => team2 && onSelectWinner(team2.id)}
        />
      </div>
      {!hideConnector && (
        <div className="flex flex-col items-stretch" style={{ width: 16 }}>
          <div className="flex-1 border-t-2 border-r-2 border-border/50" />
          <div className="flex-1 border-b-2 border-r-2 border-border/50" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/ui/matchup.tsx
git commit -m "feat(bracket): add Matchup component"
```

---

### Task 8: BracketRound Component

**Files:**
- Create: `apps/web/src/features/bracket/ui/bracket-round.tsx`

- [ ] **Step 1: Create BracketRound**

Create `apps/web/src/features/bracket/ui/bracket-round.tsx`:

```tsx
import type { BracketPicks, Team } from '@movable-madness/shared-types';
import { matchupId, matchupsInRound } from '../model/bracket-utils';
import { ROUND_LABELS, TOTAL_ROUNDS } from '../model/teams';
import { Matchup } from './matchup';

interface BracketRoundProps {
  round: number;
  picks: BracketPicks;
  getTeams: (round: number, matchIndex: number) => [Team | null, Team | null];
  onSelectWinner: (matchupId: string, teamId: number) => void;
}

export function BracketRound({ round, picks, getTeams, onSelectWinner }: BracketRoundProps) {
  const count = matchupsInRound(round);
  const label = ROUND_LABELS[round - 1];
  const isLastRound = round === TOTAL_ROUNDS;

  return (
    <div className="flex shrink-0 flex-col gap-1" style={{ minWidth: 180 }}>
      <div className="mb-1 rounded-md bg-muted/50 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className="flex flex-1 flex-col"
        style={{ justifyContent: 'space-around' }}
      >
        {Array.from({ length: count }, (_, i) => {
          const id = matchupId(round, i);
          const [team1, team2] = getTeams(round, i);
          return (
            <Matchup
              key={id}
              team1={team1}
              team2={team2}
              selectedTeamId={picks[id]}
              onSelectWinner={(teamId) => onSelectWinner(id, teamId)}
              hideConnector={isLastRound}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/ui/bracket-round.tsx
git commit -m "feat(bracket): add BracketRound component"
```

---

### Task 9: BracketGrid Component

**Files:**
- Create: `apps/web/src/features/bracket/ui/bracket-grid.tsx`

- [ ] **Step 1: Create BracketGrid**

Create `apps/web/src/features/bracket/ui/bracket-grid.tsx`:

```tsx
import type { BracketPicks, Team } from '@movable-madness/shared-types';
import { TOTAL_ROUNDS } from '../model/teams';
import { BracketRound } from './bracket-round';

interface BracketGridProps {
  picks: BracketPicks;
  getTeams: (round: number, matchIndex: number) => [Team | null, Team | null];
  onSelectWinner: (matchupId: string, teamId: number) => void;
}

export function BracketGrid({ picks, getTeams, onSelectWinner }: BracketGridProps) {
  return (
    <div className="flex gap-2 overflow-x-auto p-4 pb-24">
      {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
        <BracketRound
          key={i + 1}
          round={i + 1}
          picks={picks}
          getTeams={getTeams}
          onSelectWinner={onSelectWinner}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/ui/bracket-grid.tsx
git commit -m "feat(bracket): add BracketGrid component"
```

---

### Task 10: SubmitFooter Component

**Files:**
- Create: `apps/web/src/features/bracket/ui/submit-footer.tsx`

- [ ] **Step 1: Create SubmitFooter**

Create `apps/web/src/features/bracket/ui/submit-footer.tsx`:

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
      <div className="flex items-center justify-between bg-[#E31C79] px-6 py-4">
        <span className="text-sm font-medium text-white">
          <span className="font-bold">{picksCount} of {TOTAL_MATCHUPS}</span> picks made
        </span>
        <Button
          variant="secondary"
          disabled={!isComplete || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Bracket'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/ui/submit-footer.tsx
git commit -m "feat(bracket): add SubmitFooter component"
```

---

### Task 11: BracketEditorPage Component

**Files:**
- Create: `apps/web/src/features/bracket/ui/bracket-editor-page.tsx`

- [ ] **Step 1: Create the page component**

Create `apps/web/src/features/bracket/ui/bracket-editor-page.tsx`:

```tsx
import { useSearchParams, Navigate } from 'react-router-dom';
import { useBracket } from '../model/use-bracket';
import { BracketGrid } from './bracket-grid';
import { SubmitFooter } from './submit-footer';

export function BracketEditorPage() {
  const [searchParams] = useSearchParams();
  const bracketName = searchParams.get('name');

  if (!bracketName) {
    return <Navigate to="/" replace />;
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
  } = useBracket({ bracketName });

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-3xl font-bold text-foreground">Bracket Submitted!</h1>
        <p className="text-muted-foreground">
          Your bracket "{bracketName}" has been saved.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">{bracketName}</h1>
        <p className="text-sm text-muted-foreground">Click a team to advance them</p>
      </header>
      <BracketGrid
        picks={picks}
        getTeams={getTeams}
        onSelectWinner={selectWinner}
      />
      <SubmitFooter
        picksCount={picksCount}
        isComplete={isComplete}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={submitBracket}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/ui/bracket-editor-page.tsx
git commit -m "feat(bracket): add BracketEditorPage component"
```

---

### Task 12: Feature Index

**Files:**
- Create: `apps/web/src/features/bracket/index.ts`

- [ ] **Step 1: Create the public exports**

Create `apps/web/src/features/bracket/index.ts`:

```ts
export { BracketEditorPage } from './ui/bracket-editor-page';
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/bracket/index.ts
git commit -m "feat(bracket): add feature index"
```

---

## Chunk 4: Route Integration and Verification

### Task 13: Add Route

**Files:**
- Modify: `apps/web/src/app/app.tsx`

- [ ] **Step 1: Add the bracket route**

In `apps/web/src/app/app.tsx`, add the import at the top with the other page imports:

```ts
import { BracketEditorPage } from '../features/bracket';
```

Then add a new `<Route>` inside the `<Routes>` block, after the existing routes:

```tsx
<Route path="/bracket/edit" element={<BracketEditorPage />} />
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/app.tsx
git commit -m "feat(bracket): add /bracket/edit route"
```

---

### Task 14: Verify Build and Tests

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --project apps/web/tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 2: Run unit tests**

Run: `npx vitest run --config apps/web/vite.config.mts`
Expected: All bracket-utils tests pass

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 4: Start dev server and verify visually**

Run: `pnpm dev`
Navigate to: `http://localhost:4200/bracket/edit?name=My%20Test%20Bracket`
Verify:
- Bracket name displays in the header
- 32 first-round matchups are visible (scroll horizontally)
- Clicking a team highlights it with magenta border
- Round 2 slots populate when both feeder picks are made
- Changing a pick cascades and clears downstream
- Progress counter in footer updates
- Submit button enables when all 63 picks are made
- Navigating to `/bracket/edit` (no name param) redirects to `/`

- [ ] **Step 5: Fix any issues found during verification**

Address any TypeScript, lint, or visual issues discovered.

- [ ] **Step 6: Final commit**

Stage only the files that were modified during verification fixes:

```bash
git add <changed-files>
git commit -m "fix(bracket): address verification issues"
```

(Only if Step 5 produced changes. Skip this step if no issues found.)
