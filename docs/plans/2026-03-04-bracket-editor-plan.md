# Bracket Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive 64-team bracket editor screen with CSS Grid layout, pick advancement logic, and a NestJS API endpoint to save completed brackets to Firestore.

**Architecture:** React feature module at `apps/web/src/features/bracket/` with CSS Grid layout. Pure utility functions for bracket logic (testable without React). NestJS brackets module at `apps/api/src/brackets/` with Firestore write via Firebase Admin SDK. Shared types in `libs/shared-types/`.

**Tech Stack:** React 19, Tailwind CSS 4, shadcn/ui, NestJS 11, Firebase Admin SDK, Vitest (frontend), Jest (API)

---

### Task 1: Shared Types

**Files:**
- Create: `libs/shared-types/src/lib/bracket.ts`
- Modify: `libs/shared-types/src/index.ts`

**Step 1: Create the shared bracket types**

Create `libs/shared-types/src/lib/bracket.ts`:

```typescript
export interface Team {
  id: string;
  name: string;
  seed: number;
  region: 'East' | 'West' | 'South' | 'Midwest';
}

export interface BracketEntry {
  id?: string;
  userId: string;
  bracketName: string;
  picks: Record<string, string>;
  submittedAt?: string;
}

export interface CreateBracketRequest {
  userId: string;
  bracketName: string;
  picks: Record<string, string>;
}
```

**Step 2: Export from shared-types index**

Add to `libs/shared-types/src/index.ts`:

```typescript
export type { BracketEntry, CreateBracketRequest, Team } from './lib/bracket';
```

**Step 3: Verify TypeScript compiles**

Run: `pnpm nx run shared-types:lint`
Expected: No errors

**Step 4: Commit**

```bash
git add libs/shared-types/src/lib/bracket.ts libs/shared-types/src/index.ts
git commit -m "feat: add shared bracket types"
```

---

### Task 2: Hardcoded Teams Data

**Files:**
- Create: `apps/web/src/features/bracket/data/teams.ts`

**Step 1: Create the 64-team array**

Create `apps/web/src/features/bracket/data/teams.ts` with a hardcoded array of 64 teams. Teams are organized into 4 regions (East, West, South, Midwest) with 16 teams each, seeded 1-16. Array order determines Round 1 matchups (index 0 vs 1, 2 vs 3, etc.).

Use real-sounding placeholder team names (e.g., "Blue Hawks", "Red Wolves", "Silver Knights"). Each team has:
- `id`: `"team-{n}"` where n is 1-64
- `name`: unique placeholder name
- `seed`: 1-16 within its region (traditional 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15 seeding order per region)
- `region`: one of the four regions

```typescript
import type { Team } from '@workspace/shared-types';

export const TEAMS: Team[] = [
  // East Region (16 teams, in matchup order: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
  { id: 'team-1', name: 'Blue Hawks', seed: 1, region: 'East' },
  { id: 'team-2', name: 'Red Wolves', seed: 16, region: 'East' },
  { id: 'team-3', name: 'Silver Knights', seed: 8, region: 'East' },
  { id: 'team-4', name: 'Gold Eagles', seed: 9, region: 'East' },
  { id: 'team-5', name: 'Iron Bears', seed: 5, region: 'East' },
  { id: 'team-6', name: 'Crimson Tigers', seed: 12, region: 'East' },
  { id: 'team-7', name: 'Storm Chasers', seed: 4, region: 'East' },
  { id: 'team-8', name: 'Thunder Bolts', seed: 13, region: 'East' },
  { id: 'team-9', name: 'Emerald Falcons', seed: 6, region: 'East' },
  { id: 'team-10', name: 'Shadow Vipers', seed: 11, region: 'East' },
  { id: 'team-11', name: 'Frost Giants', seed: 3, region: 'East' },
  { id: 'team-12', name: 'Blaze Runners', seed: 14, region: 'East' },
  { id: 'team-13', name: 'Titan Sharks', seed: 7, region: 'East' },
  { id: 'team-14', name: 'Phantom Riders', seed: 10, region: 'East' },
  { id: 'team-15', name: 'Cobalt Jaguars', seed: 2, region: 'East' },
  { id: 'team-16', name: 'Amber Foxes', seed: 15, region: 'East' },

  // West Region
  { id: 'team-17', name: 'Scarlet Lions', seed: 1, region: 'West' },
  { id: 'team-18', name: 'Onyx Panthers', seed: 16, region: 'West' },
  { id: 'team-19', name: 'Azure Dolphins', seed: 8, region: 'West' },
  { id: 'team-20', name: 'Rustic Bison', seed: 9, region: 'West' },
  { id: 'team-21', name: 'Neon Hornets', seed: 5, region: 'West' },
  { id: 'team-22', name: 'Jade Serpents', seed: 12, region: 'West' },
  { id: 'team-23', name: 'Violet Ravens', seed: 4, region: 'West' },
  { id: 'team-24', name: 'Copper Stallions', seed: 13, region: 'West' },
  { id: 'team-25', name: 'Pearl Orcas', seed: 6, region: 'West' },
  { id: 'team-26', name: 'Obsidian Wolves', seed: 11, region: 'West' },
  { id: 'team-27', name: 'Coral Turtles', seed: 3, region: 'West' },
  { id: 'team-28', name: 'Slate Condors', seed: 14, region: 'West' },
  { id: 'team-29', name: 'Ruby Lynx', seed: 7, region: 'West' },
  { id: 'team-30', name: 'Steel Rhinos', seed: 10, region: 'West' },
  { id: 'team-31', name: 'Indigo Rams', seed: 2, region: 'West' },
  { id: 'team-32', name: 'Bronze Pelicans', seed: 15, region: 'West' },

  // South Region
  { id: 'team-33', name: 'Magenta Marlins', seed: 1, region: 'South' },
  { id: 'team-34', name: 'Ivory Owls', seed: 16, region: 'South' },
  { id: 'team-35', name: 'Teal Otters', seed: 8, region: 'South' },
  { id: 'team-36', name: 'Charcoal Crows', seed: 9, region: 'South' },
  { id: 'team-37', name: 'Lavender Huskies', seed: 5, region: 'South' },
  { id: 'team-38', name: 'Sage Cougars', seed: 12, region: 'South' },
  { id: 'team-39', name: 'Midnight Wolves', seed: 4, region: 'South' },
  { id: 'team-40', name: 'Solar Flares', seed: 13, region: 'South' },
  { id: 'team-41', name: 'Ocean Rays', seed: 6, region: 'South' },
  { id: 'team-42', name: 'Desert Hawks', seed: 11, region: 'South' },
  { id: 'team-43', name: 'Alpine Goats', seed: 3, region: 'South' },
  { id: 'team-44', name: 'Volcanic Ashes', seed: 14, region: 'South' },
  { id: 'team-45', name: 'Prairie Dogs', seed: 7, region: 'South' },
  { id: 'team-46', name: 'Arctic Foxes', seed: 10, region: 'South' },
  { id: 'team-47', name: 'Canyon Eagles', seed: 2, region: 'South' },
  { id: 'team-48', name: 'River Otters', seed: 15, region: 'South' },

  // Midwest Region
  { id: 'team-49', name: 'Prairie Thunder', seed: 1, region: 'Midwest' },
  { id: 'team-50', name: 'Lake Sharks', seed: 16, region: 'Midwest' },
  { id: 'team-51', name: 'Grain Harvesters', seed: 8, region: 'Midwest' },
  { id: 'team-52', name: 'Wind Riders', seed: 9, region: 'Midwest' },
  { id: 'team-53', name: 'Corn Huskers', seed: 5, region: 'Midwest' },
  { id: 'team-54', name: 'Iron Miners', seed: 12, region: 'Midwest' },
  { id: 'team-55', name: 'Valley Kings', seed: 4, region: 'Midwest' },
  { id: 'team-56', name: 'Forest Rangers', seed: 13, region: 'Midwest' },
  { id: 'team-57', name: 'River Cats', seed: 6, region: 'Midwest' },
  { id: 'team-58', name: 'Hill Climbers', seed: 11, region: 'Midwest' },
  { id: 'team-59', name: 'Plains Runners', seed: 3, region: 'Midwest' },
  { id: 'team-60', name: 'Dust Devils', seed: 14, region: 'Midwest' },
  { id: 'team-61', name: 'Creek Otters', seed: 7, region: 'Midwest' },
  { id: 'team-62', name: 'Bluff Chargers', seed: 10, region: 'Midwest' },
  { id: 'team-63', name: 'Summit Wolves', seed: 2, region: 'Midwest' },
  { id: 'team-64', name: 'Mesa Coyotes', seed: 15, region: 'Midwest' },
];
```

**Step 2: Commit**

```bash
git add apps/web/src/features/bracket/data/teams.ts
git commit -m "feat: add hardcoded 64-team bracket data"
```

---

### Task 3: Bracket Utility Functions

**Files:**
- Create: `apps/web/src/features/bracket/lib/bracket-utils.ts`
- Create: `apps/web/src/features/bracket/lib/bracket-utils.test.ts`

**Step 1: Write failing tests for bracket utilities**

Create `apps/web/src/features/bracket/lib/bracket-utils.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  cascadeReset,
  getFeederMatchupIds,
  getMatchupId,
  getMatchupTeams,
  getPickCount,
  getRoundMatchupCount,
  TOTAL_PICKS,
  TOTAL_ROUNDS,
} from './bracket-utils';
import { TEAMS } from '../data/teams';

describe('bracket-utils', () => {
  describe('constants', () => {
    it('has 6 total rounds', () => {
      expect(TOTAL_ROUNDS).toBe(6);
    });

    it('has 63 total picks', () => {
      expect(TOTAL_PICKS).toBe(63);
    });
  });

  describe('getMatchupId', () => {
    it('generates correct matchup ID', () => {
      expect(getMatchupId(1, 1)).toBe('R1-M1');
      expect(getMatchupId(3, 5)).toBe('R3-M5');
    });
  });

  describe('getRoundMatchupCount', () => {
    it('returns 32 for round 1', () => {
      expect(getRoundMatchupCount(1)).toBe(32);
    });

    it('returns 1 for round 6 (championship)', () => {
      expect(getRoundMatchupCount(6)).toBe(1);
    });

    it('halves each round', () => {
      expect(getRoundMatchupCount(2)).toBe(16);
      expect(getRoundMatchupCount(3)).toBe(8);
      expect(getRoundMatchupCount(4)).toBe(4);
      expect(getRoundMatchupCount(5)).toBe(2);
    });
  });

  describe('getFeederMatchupIds', () => {
    it('returns undefined for round 1 (no feeders)', () => {
      expect(getFeederMatchupIds(1, 1)).toBeUndefined();
    });

    it('returns correct feeders for round 2', () => {
      expect(getFeederMatchupIds(2, 1)).toEqual(['R1-M1', 'R1-M2']);
      expect(getFeederMatchupIds(2, 3)).toEqual(['R1-M5', 'R1-M6']);
    });

    it('returns correct feeders for round 3', () => {
      expect(getFeederMatchupIds(3, 1)).toEqual(['R2-M1', 'R2-M2']);
    });

    it('returns correct feeders for championship', () => {
      expect(getFeederMatchupIds(6, 1)).toEqual(['R5-M1', 'R5-M2']);
    });
  });

  describe('getMatchupTeams', () => {
    it('returns teams for round 1 matchup from teams array', () => {
      const result = getMatchupTeams(1, 1, TEAMS, {});
      expect(result).toEqual([TEAMS[0], TEAMS[1]]);
    });

    it('returns correct teams for round 1 matchup 3', () => {
      const result = getMatchupTeams(1, 3, TEAMS, {});
      expect(result).toEqual([TEAMS[4], TEAMS[5]]);
    });

    it('returns winners from feeder matchups for round 2', () => {
      const picks = { 'R1-M1': 'team-1', 'R1-M2': 'team-4' };
      const result = getMatchupTeams(2, 1, TEAMS, picks);
      expect(result).toEqual([TEAMS[0], TEAMS[3]]);
    });

    it('returns null for missing feeder winners', () => {
      const result = getMatchupTeams(2, 1, TEAMS, {});
      expect(result).toEqual([null, null]);
    });

    it('returns partial teams when one feeder is picked', () => {
      const picks = { 'R1-M1': 'team-1' };
      const result = getMatchupTeams(2, 1, TEAMS, picks);
      expect(result).toEqual([TEAMS[0], null]);
    });
  });

  describe('cascadeReset', () => {
    it('clears downstream picks when changing a round 1 pick', () => {
      const picks: Record<string, string> = {
        'R1-M1': 'team-1',
        'R1-M2': 'team-4',
        'R2-M1': 'team-1',
        'R3-M1': 'team-1',
      };
      // Change R1-M1 winner from team-1 to team-2
      const result = cascadeReset(picks, 'R1-M1', 'team-1');
      expect(result['R2-M1']).toBeUndefined();
      expect(result['R3-M1']).toBeUndefined();
      // R1-M2 is unaffected
      expect(result['R1-M2']).toBe('team-4');
    });

    it('returns picks unchanged if old winner was not advanced', () => {
      const picks: Record<string, string> = {
        'R1-M1': 'team-1',
        'R1-M2': 'team-4',
      };
      const result = cascadeReset(picks, 'R1-M1', 'team-1');
      expect(result['R1-M2']).toBe('team-4');
    });

    it('handles cascade across multiple rounds', () => {
      const picks: Record<string, string> = {
        'R1-M1': 'team-1',
        'R1-M2': 'team-4',
        'R2-M1': 'team-1',
        'R3-M1': 'team-1',
        'R4-M1': 'team-1',
      };
      const result = cascadeReset(picks, 'R1-M1', 'team-1');
      expect(result['R2-M1']).toBeUndefined();
      expect(result['R3-M1']).toBeUndefined();
      expect(result['R4-M1']).toBeUndefined();
    });
  });

  describe('getPickCount', () => {
    it('returns 0 for empty picks', () => {
      expect(getPickCount({})).toBe(0);
    });

    it('returns correct count', () => {
      expect(getPickCount({ 'R1-M1': 'team-1', 'R1-M2': 'team-4' })).toBe(2);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm nx run web:test --testPathPattern=bracket-utils`
Expected: FAIL — module not found

**Step 3: Implement bracket utilities**

Create `apps/web/src/features/bracket/lib/bracket-utils.ts`:

```typescript
import type { Team } from '@workspace/shared-types';

export const TOTAL_ROUNDS = 6;
export const TOTAL_PICKS = 63; // 32 + 16 + 8 + 4 + 2 + 1

export function getMatchupId(round: number, matchup: number): string {
  return `R${round}-M${matchup}`;
}

export function getRoundMatchupCount(round: number): number {
  return 32 / Math.pow(2, round - 1);
}

export function getFeederMatchupIds(
  round: number,
  matchup: number,
): [string, string] | undefined {
  if (round === 1) return undefined;
  const feeder1 = getMatchupId(round - 1, matchup * 2 - 1);
  const feeder2 = getMatchupId(round - 1, matchup * 2);
  return [feeder1, feeder2];
}

export function getMatchupTeams(
  round: number,
  matchup: number,
  teams: Team[],
  picks: Record<string, string>,
): [Team | null, Team | null] {
  if (round === 1) {
    const idx = (matchup - 1) * 2;
    return [teams[idx], teams[idx + 1]];
  }

  const feeders = getFeederMatchupIds(round, matchup);
  if (!feeders) return [null, null];

  const [feeder1Id, feeder2Id] = feeders;
  const winner1Id = picks[feeder1Id];
  const winner2Id = picks[feeder2Id];

  const team1 = winner1Id ? teams.find((t) => t.id === winner1Id) ?? null : null;
  const team2 = winner2Id ? teams.find((t) => t.id === winner2Id) ?? null : null;

  return [team1, team2];
}

export function cascadeReset(
  picks: Record<string, string>,
  changedMatchupId: string,
  oldWinnerId: string,
): Record<string, string> {
  const newPicks = { ...picks };

  // Find all matchups that reference the old winner and remove them
  const toRemove: string[] = [];

  for (const [matchupId, winnerId] of Object.entries(newPicks)) {
    if (matchupId === changedMatchupId) continue;
    if (winnerId === oldWinnerId) {
      toRemove.push(matchupId);
    }
  }

  for (const id of toRemove) {
    delete newPicks[id];
  }

  // Recursively cascade for each removed matchup
  for (const id of toRemove) {
    const furtherRemoved = cascadeReset(newPicks, id, oldWinnerId);
    Object.assign(newPicks, furtherRemoved);
    // Actually we need to delete keys that were removed in recursion
    for (const key of Object.keys(newPicks)) {
      if (!(key in furtherRemoved) && key !== changedMatchupId && toRemove.includes(key)) {
        delete newPicks[key];
      }
    }
  }

  return newPicks;
}

export function getPickCount(picks: Record<string, string>): number {
  return Object.keys(picks).length;
}
```

Note: The `cascadeReset` implementation above is a starting point. The key insight is simpler than it looks — when a team is deselected, remove it from ALL later rounds where it appears as a winner. A cleaner implementation:

```typescript
export function cascadeReset(
  picks: Record<string, string>,
  _changedMatchupId: string,
  oldWinnerId: string,
): Record<string, string> {
  const newPicks: Record<string, string> = {};

  for (const [matchupId, winnerId] of Object.entries(picks)) {
    if (matchupId !== _changedMatchupId && winnerId !== oldWinnerId) {
      newPicks[matchupId] = winnerId;
    } else if (matchupId === _changedMatchupId) {
      // Keep the changed matchup itself (caller will update the value)
    }
  }

  // Also need to check: if a team was removed as a winner from round N,
  // the matchup in round N+1 that this team would have appeared in may now
  // have an invalid winner too. But since we only remove by winnerId match,
  // this naturally handles it — if team-1 was picked in R2 and R3,
  // both entries are removed.

  return newPicks;
}
```

Use this simpler version. The function removes ALL entries where `winnerId === oldWinnerId` (except the changed matchup itself), which handles multi-round cascades in one pass.

**Step 4: Run tests to verify they pass**

Run: `pnpm nx run web:test --testPathPattern=bracket-utils`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/web/src/features/bracket/lib/
git commit -m "feat: add bracket utility functions with tests"
```

---

### Task 4: TeamSlot Component

**Files:**
- Create: `apps/web/src/features/bracket/components/TeamSlot.tsx`

**Step 1: Create the TeamSlot component**

```tsx
import type { Team } from '@workspace/shared-types';

interface TeamSlotProps {
  team: Team | null;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export function TeamSlot({ team, isSelected, isDisabled, onClick }: TeamSlotProps) {
  if (!team) {
    return (
      <div className="flex h-9 w-44 items-center rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 opacity-40">
        <span className="text-xs text-[#999]">TBD</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`flex h-9 w-44 items-center gap-2 rounded border px-2 text-left transition-colors
        ${isSelected
          ? 'border-[#E31C79] bg-[#E31C79]/10 text-white'
          : 'border-[#2a2a2a] bg-[#1a1a1a] text-white hover:bg-[#252525]'
        }
        ${isDisabled ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
      `}
    >
      <span className="min-w-5 text-xs text-[#999]">{team.seed}</span>
      <span className="truncate text-sm font-medium">{team.name}</span>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/bracket/components/TeamSlot.tsx
git commit -m "feat: add TeamSlot component"
```

---

### Task 5: Matchup Component

**Files:**
- Create: `apps/web/src/features/bracket/components/Matchup.tsx`

**Step 1: Create the Matchup component**

```tsx
import type { Team } from '@workspace/shared-types';
import { TeamSlot } from './TeamSlot';

interface MatchupProps {
  matchupId: string;
  teams: [Team | null, Team | null];
  selectedWinnerId: string | undefined;
  onSelectWinner: (matchupId: string, teamId: string) => void;
}

export function Matchup({ matchupId, teams, selectedWinnerId, onSelectWinner }: MatchupProps) {
  const [teamA, teamB] = teams;

  return (
    <div className="flex flex-col gap-0.5">
      <TeamSlot
        team={teamA}
        isSelected={selectedWinnerId === teamA?.id}
        isDisabled={!teamA}
        onClick={() => teamA && onSelectWinner(matchupId, teamA.id)}
      />
      <TeamSlot
        team={teamB}
        isSelected={selectedWinnerId === teamB?.id}
        isDisabled={!teamB}
        onClick={() => teamB && onSelectWinner(matchupId, teamB.id)}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/bracket/components/Matchup.tsx
git commit -m "feat: add Matchup component"
```

---

### Task 6: BracketRound Component

**Files:**
- Create: `apps/web/src/features/bracket/components/BracketRound.tsx`

**Step 1: Create the BracketRound component**

```tsx
import type { Team } from '@workspace/shared-types';
import { getMatchupId, getMatchupTeams, getRoundMatchupCount } from '../lib/bracket-utils';
import { TEAMS } from '../data/teams';
import { Matchup } from './Matchup';

const ROUND_LABELS: Record<number, string> = {
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite 8',
  5: 'Final Four',
  6: 'Championship',
};

interface BracketRoundProps {
  round: number;
  picks: Record<string, string>;
  onSelectWinner: (matchupId: string, teamId: string) => void;
  /** Which half of the bracket (for regional grouping). 'left' = first 16 matchups, 'right' = last 16 */
  side: 'left' | 'right';
}

export function BracketRound({ round, picks, onSelectWinner, side }: BracketRoundProps) {
  const totalMatchups = getRoundMatchupCount(round);

  // For rounds 1-4, split matchups by side. Left = first half, Right = second half.
  // For rounds 5-6 (Final Four, Championship), show all matchups on both sides? No —
  // Final Four and Championship are shared (center). We handle this in BracketGrid.
  let startMatchup: number;
  let endMatchup: number;

  if (round <= 4) {
    const halfCount = totalMatchups / 2;
    if (side === 'left') {
      startMatchup = 1;
      endMatchup = halfCount;
    } else {
      startMatchup = halfCount + 1;
      endMatchup = totalMatchups;
    }
  } else {
    // Rounds 5-6: all matchups shown (will only be called once from center)
    startMatchup = 1;
    endMatchup = totalMatchups;
  }

  const matchups: { id: string; teams: [Team | null, Team | null] }[] = [];
  for (let m = startMatchup; m <= endMatchup; m++) {
    const id = getMatchupId(round, m);
    const teams = getMatchupTeams(round, m, TEAMS, picks);
    matchups.push({ id, teams });
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#999]">
        {ROUND_LABELS[round] ?? `Round ${round}`}
      </h3>
      <div className="flex flex-col justify-around gap-4" style={{ flex: 1 }}>
        {matchups.map((matchup) => (
          <Matchup
            key={matchup.id}
            matchupId={matchup.id}
            teams={matchup.teams}
            selectedWinnerId={picks[matchup.id]}
            onSelectWinner={onSelectWinner}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/bracket/components/BracketRound.tsx
git commit -m "feat: add BracketRound component"
```

---

### Task 7: SubmitFooter Component

**Files:**
- Create: `apps/web/src/features/bracket/components/SubmitFooter.tsx`

**Step 1: Create the SubmitFooter component**

```tsx
import { Button } from '@workspace/ui';
import { TOTAL_PICKS } from '../lib/bracket-utils';

interface SubmitFooterProps {
  pickCount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function SubmitFooter({ pickCount, isSubmitting, onSubmit }: SubmitFooterProps) {
  const isComplete = pickCount >= TOTAL_PICKS;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-[#E31C79] px-6 py-3">
      <span className="text-sm font-medium text-white">
        {pickCount}/{TOTAL_PICKS} picks made
      </span>
      <Button
        onClick={onSubmit}
        disabled={!isComplete || isSubmitting}
        className="bg-white text-[#E31C79] hover:bg-white/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Bracket'}
      </Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/bracket/components/SubmitFooter.tsx
git commit -m "feat: add SubmitFooter component"
```

---

### Task 8: BracketGrid Component (Main Bracket Layout)

**Files:**
- Create: `apps/web/src/features/bracket/components/BracketGrid.tsx`

**Step 1: Create the BracketGrid component**

This is the core component that:
- Owns the `picks` state
- Handles team selection and cascade resets
- Renders rounds in CSS grid columns (left half -> center -> right half)

```tsx
import { useCallback, useState } from 'react';
import type { CreateBracketRequest } from '@workspace/shared-types';
import { post } from '../../../../shared/api/api-client';
import { cascadeReset, getPickCount, TOTAL_PICKS } from '../lib/bracket-utils';
import { BracketRound } from './BracketRound';
import { SubmitFooter } from './SubmitFooter';

interface BracketGridProps {
  userId: string;
  bracketName: string;
}

export function BracketGrid({ userId, bracketName }: BracketGridProps) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectWinner = useCallback((matchupId: string, teamId: string) => {
    setPicks((prev) => {
      const oldWinnerId = prev[matchupId];

      // If clicking the same team, deselect it
      if (oldWinnerId === teamId) {
        const newPicks = { ...prev };
        delete newPicks[matchupId];
        // Cascade reset for the deselected team
        return cascadeReset(newPicks, matchupId, teamId);
      }

      let newPicks = { ...prev };

      // If changing an existing pick, cascade reset the old winner
      if (oldWinnerId) {
        newPicks = cascadeReset(newPicks, matchupId, oldWinnerId);
      }

      // Set the new winner
      newPicks[matchupId] = teamId;
      return newPicks;
    });
  }, []);

  const handleSubmit = async () => {
    if (getPickCount(picks) < TOTAL_PICKS) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await post<{ id: string }>('/v1/brackets', {
        userId,
        bracketName,
        picks,
      } satisfies CreateBracketRequest);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit bracket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Bracket Submitted!</h2>
          <p className="text-[#999]">Your bracket "{bracketName}" has been saved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-16">
      {submitError && (
        <div className="mx-4 mt-4 rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {submitError}
        </div>
      )}

      <div className="overflow-x-auto px-4 pt-4">
        <div className="flex items-start gap-6" style={{ minWidth: '1800px' }}>
          {/* Left half: Rounds 1-4 (left to right) */}
          {[1, 2, 3, 4].map((round) => (
            <BracketRound
              key={`left-${round}`}
              round={round}
              picks={picks}
              onSelectWinner={handleSelectWinner}
              side="left"
            />
          ))}

          {/* Center: Final Four + Championship */}
          <BracketRound round={5} picks={picks} onSelectWinner={handleSelectWinner} side="left" />
          <BracketRound round={6} picks={picks} onSelectWinner={handleSelectWinner} side="left" />

          {/* Right half: Rounds 4-1 (right to left, mirrored) */}
          {[4, 3, 2, 1].map((round) => (
            <BracketRound
              key={`right-${round}`}
              round={round}
              picks={picks}
              onSelectWinner={handleSelectWinner}
              side="right"
            />
          ))}
        </div>
      </div>

      <SubmitFooter
        pickCount={getPickCount(picks)}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/bracket/components/BracketGrid.tsx
git commit -m "feat: add BracketGrid component with bracket state management"
```

---

### Task 9: BracketEditorPage and Route

**Files:**
- Create: `apps/web/src/features/bracket/pages/BracketEditorPage.tsx`
- Modify: `apps/web/src/app/app.tsx`

**Step 1: Create the page component**

Create `apps/web/src/features/bracket/pages/BracketEditorPage.tsx`:

```tsx
import { useParams, useSearchParams } from 'react-router-dom';
import { BracketGrid } from '../components/BracketGrid';

export function BracketEditorPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const bracketName = searchParams.get('name') ?? 'My Bracket';

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
        <p className="text-red-400">Missing user ID</p>
      </div>
    );
  }

  return <BracketGrid userId={userId} bracketName={bracketName} />;
}
```

**Step 2: Add the route to app.tsx**

Add import at the top of `apps/web/src/app/app.tsx`:

```typescript
import { BracketEditorPage } from '../features/bracket/pages/BracketEditorPage';
```

Add route inside `<Routes>` in `AppRoutes`:

```tsx
<Route path="/bracket/:userId" element={<BracketEditorPage />} />
```

**Step 3: Verify the app compiles**

Run: `pnpm nx run web:build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/features/bracket/pages/BracketEditorPage.tsx apps/web/src/app/app.tsx
git commit -m "feat: add bracket editor page and route"
```

---

### Task 10: NestJS Brackets Module — DTO

**Files:**
- Create: `apps/api/src/brackets/dto/create-bracket.dto.ts`

**Step 1: Create the DTO**

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateBracketDto {
  @ApiProperty({ description: 'Firebase anonymous user ID', example: 'abc123' })
  userId!: string;

  @ApiProperty({ description: 'User-chosen bracket name', example: 'My Championship Picks' })
  bracketName!: string;

  @ApiProperty({
    description: 'Map of matchup IDs to winning team IDs (63 total)',
    example: { 'R1-M1': 'team-5', 'R1-M2': 'team-12' },
  })
  picks!: Record<string, string>;
}
```

**Step 2: Commit**

```bash
git add apps/api/src/brackets/dto/create-bracket.dto.ts
git commit -m "feat: add CreateBracketDto"
```

---

### Task 11: NestJS Brackets Module — Service

**Files:**
- Create: `apps/api/src/brackets/brackets.service.ts`

**Step 1: Create the service**

```typescript
import { BadRequestException, Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import type { CreateBracketDto } from './dto/create-bracket.dto';

const TOTAL_PICKS = 63;
const VALID_TEAM_IDS = new Set(
  Array.from({ length: 64 }, (_, i) => `team-${i + 1}`),
);

@Injectable()
export class BracketsService {
  async createBracket(dto: CreateBracketDto) {
    this.validate(dto);

    const db = getFirestore();
    const docRef = await db.collection('brackets').add({
      userId: dto.userId,
      bracketName: dto.bracketName,
      picks: dto.picks,
      submittedAt: new Date().toISOString(),
    });

    const doc = await docRef.get();
    return { id: docRef.id, ...doc.data() };
  }

  private validate(dto: CreateBracketDto): void {
    const pickEntries = Object.entries(dto.picks);

    if (pickEntries.length !== TOTAL_PICKS) {
      throw new BadRequestException(
        `Expected ${TOTAL_PICKS} picks, got ${pickEntries.length}`,
      );
    }

    for (const [matchupId, teamId] of pickEntries) {
      if (!/^R[1-6]-M\d+$/.test(matchupId)) {
        throw new BadRequestException(`Invalid matchup ID: ${matchupId}`);
      }
      if (!VALID_TEAM_IDS.has(teamId)) {
        throw new BadRequestException(`Invalid team ID: ${teamId}`);
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add apps/api/src/brackets/brackets.service.ts
git commit -m "feat: add BracketsService with Firestore write"
```

---

### Task 12: NestJS Brackets Module — Controller and Module

**Files:**
- Create: `apps/api/src/brackets/brackets.controller.ts`
- Create: `apps/api/src/brackets/brackets.module.ts`
- Modify: `apps/api/src/app/app.module.ts`

**Step 1: Create the controller**

```typescript
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BracketsService } from './brackets.service';
import { CreateBracketDto } from './dto/create-bracket.dto';

@ApiTags('Brackets')
@Controller('v1/brackets')
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a completed bracket' })
  @ApiResponse({ status: 201, description: 'Bracket saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid bracket data' })
  async createBracket(@Body() dto: CreateBracketDto) {
    const bracket = await this.bracketsService.createBracket(dto);
    return { success: true, data: bracket };
  }
}
```

**Step 2: Create the module**

```typescript
import { Module } from '@nestjs/common';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';

@Module({
  controllers: [BracketsController],
  providers: [BracketsService],
})
export class BracketsModule {}
```

**Step 3: Register in AppModule**

Add to `apps/api/src/app/app.module.ts`:

Import:
```typescript
import { BracketsModule } from '../brackets/brackets.module';
```

Add `BracketsModule` to the `imports` array.

**Step 4: Verify API compiles**

Run: `pnpm nx run api:build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/api/src/brackets/ apps/api/src/app/app.module.ts
git commit -m "feat: add brackets API module with POST /v1/brackets endpoint"
```

---

### Task 13: Visual Polish and Connector Lines

**Files:**
- Modify: `apps/web/src/features/bracket/components/Matchup.tsx`

**Step 1: Add connector line CSS to Matchup**

Update the Matchup component to include connector lines using CSS. Between the two team slots and connecting to the next round via a horizontal line on the right side:

```tsx
import type { Team } from '@workspace/shared-types';
import { TeamSlot } from './TeamSlot';

interface MatchupProps {
  matchupId: string;
  teams: [Team | null, Team | null];
  selectedWinnerId: string | undefined;
  onSelectWinner: (matchupId: string, teamId: string) => void;
  showConnector?: boolean;
}

export function Matchup({ matchupId, teams, selectedWinnerId, onSelectWinner, showConnector = true }: MatchupProps) {
  const [teamA, teamB] = teams;

  return (
    <div className="relative flex flex-col gap-0.5">
      <TeamSlot
        team={teamA}
        isSelected={selectedWinnerId === teamA?.id}
        isDisabled={!teamA}
        onClick={() => teamA && onSelectWinner(matchupId, teamA.id)}
      />
      <TeamSlot
        team={teamB}
        isSelected={selectedWinnerId === teamB?.id}
        isDisabled={!teamB}
        onClick={() => teamB && onSelectWinner(matchupId, teamB.id)}
      />
      {/* Right-side connector line */}
      {showConnector && (
        <div className="absolute -right-3 top-1/2 h-px w-3 bg-[#333]" />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/bracket/components/Matchup.tsx
git commit -m "feat: add connector lines to matchup component"
```

---

### Task 14: End-to-End Smoke Test

**Step 1: Start both apps**

Run: `pnpm dev`

**Step 2: Open the bracket editor in a browser**

Navigate to: `http://localhost:4200/bracket/test-user-123?name=Test%20Bracket`

**Step 3: Verify functionality**

- [ ] All 32 Round 1 matchups display with team names and seeds
- [ ] Clicking a team highlights it with magenta styling
- [ ] Picking both teams in adjacent R1 matchups populates the R2 slot
- [ ] Changing an R1 pick cascades (clears downstream picks for that team)
- [ ] Submit footer shows correct pick count and stays stuck to bottom
- [ ] Submit button is disabled until all 63 picks are made
- [ ] After filling all 63 picks, submitting saves to Firestore
- [ ] Success state shows after submission

**Step 4: Fix any issues found during testing**

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: bracket editor smoke test fixes"
```

---

### Task 15: Firestore Security Rules

**Files:**
- Modify: `firestore.rules`

**Step 1: Add brackets collection rules**

Add to the Firestore rules file, inside the `match /databases/{database}/documents` block:

```
match /brackets/{bracketId} {
  allow read: if true;
  allow write: if request.resource.data.keys().hasAll(['userId', 'bracketName', 'picks', 'submittedAt']);
}
```

Note: Since this is a demo app with anonymous auth, we keep rules permissive. The API handles validation.

**Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore rules for brackets collection"
```
