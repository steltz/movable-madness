# View Bracket Screen Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only bracket visualization screen at `/brackets/:bracketId` that fetches a 64-team bracket from Firestore and displays it in a horizontal scrolling layout.

**Architecture:** Full vertical slice — shared types define the data model, a NestJS API endpoint fetches from Firestore, and React components render a classic bracket layout. A pure utility function derives matchup structure from flat teams/picks data. All bracket logic is self-contained in a `brackets` feature module on both frontend and backend.

**Tech Stack:** React 19, React Router 7, NestJS 11, Firebase Admin SDK, Tailwind CSS v4, shadcn/ui, Vitest, Jest

**Spec:** `docs/superpowers/specs/2026-03-15-view-bracket-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `libs/shared-types/src/lib/bracket.ts` | `BracketDocument` and `Matchup` type definitions |
| `apps/api/src/brackets/brackets.service.ts` | Firestore bracket fetching logic |
| `apps/api/src/brackets/brackets.controller.ts` | `GET /brackets/:bracketId` endpoint |
| `apps/api/src/brackets/brackets.module.ts` | NestJS brackets feature module |
| `apps/web/src/features/brackets/utils/derive-bracket-matchups.ts` | Pure function: teams[] + picks → Matchup[][] |
| `apps/web/src/features/brackets/utils/derive-bracket-matchups.spec.ts` | Unit tests for derivation logic |
| `apps/web/src/features/brackets/api/brackets-api.ts` | Frontend API client for bracket endpoints |
| `apps/web/src/features/brackets/components/MatchupCard.tsx` | Single matchup: two teams, winner highlight, TBD state |
| `apps/web/src/features/brackets/components/BracketRound.tsx` | Column of matchup cards for one round |
| `apps/web/src/features/brackets/components/BracketGrid.tsx` | Horizontally scrollable container of all 6 rounds |
| `apps/web/src/features/brackets/components/BracketHeader.tsx` | Magenta header with bracket name, date, share button |
| `apps/web/src/pages/brackets/view/ViewBracketPage.tsx` | Page component: fetches data, orchestrates layout |
| `tools/scripts/seed-bracket.ts` | Creates test bracket in Firestore for visual testing |

### Modified Files

| File | Change |
|------|--------|
| `libs/shared-types/src/index.ts` | Add barrel exports for `BracketDocument`, `Matchup` |
| `apps/api/src/app/app.module.ts` | Add `BracketsModule` to imports |
| `apps/web/src/app/app.tsx` | Add `/brackets/:bracketId` route |
| `package.json` | Add `seed:bracket` script |

---

## Chunk 1: Shared Types & Bracket Derivation Logic

### Task 1: Shared Types

**Files:**
- Create: `libs/shared-types/src/lib/bracket.ts`
- Modify: `libs/shared-types/src/index.ts`

- [ ] **Step 1: Create bracket types file**

Create `libs/shared-types/src/lib/bracket.ts`:

```typescript
export interface BracketDocument {
  id?: string;
  bracketName: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  teams: string[];
  picks: Record<string, string>;
}

export interface Matchup {
  key: string;
  topTeam: string | null;
  bottomTeam: string | null;
  winner: string | null;
  topSeed?: number;
  bottomSeed?: number;
}
```

- [ ] **Step 2: Add barrel exports**

Add to `libs/shared-types/src/index.ts`, after the existing exports:

```typescript
export type { BracketDocument, Matchup } from './lib/bracket';
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm nx run shared-types:build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add libs/shared-types/src/lib/bracket.ts libs/shared-types/src/index.ts
git commit -m "feat(shared-types): add BracketDocument and Matchup types"
```

---

### Task 2: Bracket Derivation Utility — Tests

**Files:**
- Create: `apps/web/src/features/brackets/utils/derive-bracket-matchups.spec.ts`

The derivation function transforms a flat `teams[]` + `picks` record into a `Matchup[][]` (6 rounds). This is the core logic — test it thoroughly before implementing.

**Seed-to-index mapping context:** The `teams[]` array is pre-ordered for bracket matchups. In a standard 64-team bracket, each 16-team region has matchups: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15. So the first 32 entries in `teams[]` represent 16 matchups. The seed for `teams[i]` is determined by a constant lookup: `SEEDS_BY_INDEX[i]`. For example, index 0 = seed 1, index 1 = seed 16, index 2 = seed 8, index 3 = seed 9, etc.

- [ ] **Step 1: Create test file with helper data**

Create `apps/web/src/features/brackets/utils/derive-bracket-matchups.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { deriveBracketMatchups, ROUND_NAMES } from './derive-bracket-matchups';

// 64 sample teams in bracket matchup order (adjacent pairs = R1 matchups)
// Region 1 (indexes 0-15): 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
// Regions 2-4 follow the same pattern
function makeTeams(): string[] {
  const teams: string[] = [];
  for (let i = 1; i <= 64; i++) {
    teams.push(`Team ${i}`);
  }
  return teams;
}

// Picks for a fully completed bracket (all 63 matchups)
function makeFullPicks(teams: string[]): Record<string, string> {
  const picks: Record<string, string> = {};
  // R1: 32 matchups — pick the first team (top) in each
  for (let m = 1; m <= 32; m++) {
    picks[`R1_M${m}`] = teams[(m - 1) * 2]; // top team wins
  }
  // R2: 16 matchups — winners of R1 pairs
  for (let m = 1; m <= 16; m++) {
    picks[`R2_M${m}`] = picks[`R1_M${(m - 1) * 2 + 1}`]!;
  }
  // R3: 8 matchups
  for (let m = 1; m <= 8; m++) {
    picks[`R3_M${m}`] = picks[`R2_M${(m - 1) * 2 + 1}`]!;
  }
  // R4: 4 matchups
  for (let m = 1; m <= 4; m++) {
    picks[`R4_M${m}`] = picks[`R3_M${(m - 1) * 2 + 1}`]!;
  }
  // R5: 2 matchups
  for (let m = 1; m <= 2; m++) {
    picks[`R5_M${m}`] = picks[`R4_M${(m - 1) * 2 + 1}`]!;
  }
  // R6: championship
  picks['R6_M1'] = picks['R5_M1']!;
  return picks;
}

describe('deriveBracketMatchups', () => {
  it('returns 6 rounds with correct matchup counts', () => {
    const teams = makeTeams();
    const picks = makeFullPicks(teams);
    const rounds = deriveBracketMatchups(teams, picks);

    expect(rounds).toHaveLength(6);
    expect(rounds[0]).toHaveLength(32);
    expect(rounds[1]).toHaveLength(16);
    expect(rounds[2]).toHaveLength(8);
    expect(rounds[3]).toHaveLength(4);
    expect(rounds[4]).toHaveLength(2);
    expect(rounds[5]).toHaveLength(1);
  });

  it('correctly assigns R1 matchup teams from the teams array', () => {
    const teams = makeTeams();
    const rounds = deriveBracketMatchups(teams, {});

    // First matchup: teams[0] vs teams[1]
    expect(rounds[0][0].topTeam).toBe('Team 1');
    expect(rounds[0][0].bottomTeam).toBe('Team 2');
    expect(rounds[0][0].key).toBe('R1_M1');

    // Second matchup: teams[2] vs teams[3]
    expect(rounds[0][1].topTeam).toBe('Team 3');
    expect(rounds[0][1].bottomTeam).toBe('Team 4');
    expect(rounds[0][1].key).toBe('R1_M2');

    // Last matchup: teams[62] vs teams[63]
    expect(rounds[0][31].topTeam).toBe('Team 63');
    expect(rounds[0][31].bottomTeam).toBe('Team 64');
    expect(rounds[0][31].key).toBe('R1_M32');
  });

  it('sets winner from picks in R1', () => {
    const teams = makeTeams();
    const picks: Record<string, string> = { R1_M1: 'Team 1' };
    const rounds = deriveBracketMatchups(teams, picks);

    expect(rounds[0][0].winner).toBe('Team 1');
    expect(rounds[0][1].winner).toBeNull(); // no pick for M2
  });

  it('propagates winners to later rounds', () => {
    const teams = makeTeams();
    const picks: Record<string, string> = {
      R1_M1: 'Team 1',
      R1_M2: 'Team 3',
      R2_M1: 'Team 1',
    };
    const rounds = deriveBracketMatchups(teams, picks);

    // R2_M1 should have winners of R1_M1 and R1_M2
    expect(rounds[1][0].topTeam).toBe('Team 1');
    expect(rounds[1][0].bottomTeam).toBe('Team 3');
    expect(rounds[1][0].winner).toBe('Team 1');
  });

  it('shows null teams in later rounds when prior picks are missing', () => {
    const teams = makeTeams();
    const rounds = deriveBracketMatchups(teams, {}); // no picks at all

    // R2 teams should all be null since no R1 winners exist
    expect(rounds[1][0].topTeam).toBeNull();
    expect(rounds[1][0].bottomTeam).toBeNull();
  });

  it('assigns seed numbers in R1', () => {
    const teams = makeTeams();
    const rounds = deriveBracketMatchups(teams, {});

    // Seeds come from SEEDS_BY_INDEX constant
    expect(rounds[0][0].topSeed).toBeDefined();
    expect(rounds[0][0].bottomSeed).toBeDefined();
    expect(typeof rounds[0][0].topSeed).toBe('number');
  });

  it('tracks seeds through later rounds', () => {
    const teams = makeTeams();
    const picks: Record<string, string> = {
      R1_M1: 'Team 1',
      R1_M2: 'Team 3',
      R2_M1: 'Team 1',
    };
    const rounds = deriveBracketMatchups(teams, picks);

    // R2_M1 top team is Team 1, which was at index 0 in teams[]
    // Its seed should match SEEDS_BY_INDEX[0]
    expect(rounds[1][0].topSeed).toBeDefined();
  });

  it('handles a fully completed bracket', () => {
    const teams = makeTeams();
    const picks = makeFullPicks(teams);
    const rounds = deriveBracketMatchups(teams, picks);

    // Championship should have a winner
    expect(rounds[5][0].winner).toBeTruthy();
    // Every R1 matchup should have a winner
    for (const matchup of rounds[0]) {
      expect(matchup.winner).toBeTruthy();
    }
  });

  it('handles empty picks gracefully', () => {
    const teams = makeTeams();
    const rounds = deriveBracketMatchups(teams, {});

    // R1 still has teams
    expect(rounds[0][0].topTeam).toBe('Team 1');
    // But no winners
    expect(rounds[0][0].winner).toBeNull();
    // Later rounds have null teams
    expect(rounds[1][0].topTeam).toBeNull();
  });
});

describe('ROUND_NAMES', () => {
  it('has 6 round names', () => {
    expect(ROUND_NAMES).toHaveLength(6);
    expect(ROUND_NAMES[0]).toBe('Round of 64');
    expect(ROUND_NAMES[5]).toBe('Championship');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx run web:test -- --run --reporter=verbose apps/web/src/features/brackets/utils/derive-bracket-matchups.spec.ts`
Expected: FAIL — module `./derive-bracket-matchups` not found.

- [ ] **Step 3: Commit failing tests**

```bash
git add apps/web/src/features/brackets/utils/derive-bracket-matchups.spec.ts
git commit -m "test(brackets): add failing tests for deriveBracketMatchups"
```

---

### Task 3: Bracket Derivation Utility — Implementation

**Files:**
- Create: `apps/web/src/features/brackets/utils/derive-bracket-matchups.ts`

- [ ] **Step 1: Implement deriveBracketMatchups**

Create `apps/web/src/features/brackets/utils/derive-bracket-matchups.ts`:

```typescript
import type { Matchup } from '@movable-madness/shared-types';

/**
 * Round names for display. Index 0 = Round 1, Index 5 = Round 6.
 */
export const ROUND_NAMES = [
  'Round of 64',
  'Round of 32',
  'Sweet 16',
  'Elite 8',
  'Final Four',
  'Championship',
] as const;

/**
 * Seed number for each index position in the teams[] array.
 * The teams array is pre-ordered for bracket matchups in groups of 16
 * (4 regions x 16 teams). Within each region of 16, the matchup order is:
 * 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
 */
const REGION_SEEDS = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];

function getSeed(teamIndex: number): number {
  return REGION_SEEDS[teamIndex % 16];
}

/**
 * Derives structured matchup data from flat teams and picks arrays.
 *
 * @param teams - 64 teams in bracket matchup order (adjacent pairs = R1 matchups)
 * @param picks - Record with keys like "R1_M1" mapping to winning team name
 * @returns 6 rounds of matchups (Matchup[][])
 */
export function deriveBracketMatchups(
  teams: string[],
  picks: Record<string, string>,
): Matchup[][] {
  const rounds: Matchup[][] = [];

  // Build a map of team name → original index for seed lookups
  const teamIndexMap = new Map<string, number>();
  for (let i = 0; i < teams.length; i++) {
    teamIndexMap.set(teams[i], i);
  }

  // Round 1: pair adjacent teams
  const round1: Matchup[] = [];
  for (let m = 0; m < 32; m++) {
    const key = `R1_M${m + 1}`;
    const topTeam = teams[m * 2] ?? null;
    const bottomTeam = teams[m * 2 + 1] ?? null;
    const winner = picks[key] ?? null;

    round1.push({
      key,
      topTeam,
      bottomTeam,
      winner,
      topSeed: topTeam != null ? getSeed(m * 2) : undefined,
      bottomSeed: bottomTeam != null ? getSeed(m * 2 + 1) : undefined,
    });
  }
  rounds.push(round1);

  // Rounds 2-6: derive from previous round winners
  const matchupsPerRound = [32, 16, 8, 4, 2, 1];
  for (let r = 1; r < 6; r++) {
    const count = matchupsPerRound[r];
    const prevRound = rounds[r - 1];
    const currentRound: Matchup[] = [];

    for (let m = 0; m < count; m++) {
      const key = `R${r + 1}_M${m + 1}`;
      const topParent = prevRound[m * 2];
      const bottomParent = prevRound[m * 2 + 1];

      const topTeam = topParent?.winner ?? null;
      const bottomTeam = bottomParent?.winner ?? null;
      const winner = picks[key] ?? null;

      // Look up seed from original teams array
      const topSeed =
        topTeam != null && teamIndexMap.has(topTeam)
          ? getSeed(teamIndexMap.get(topTeam)!)
          : undefined;
      const bottomSeed =
        bottomTeam != null && teamIndexMap.has(bottomTeam)
          ? getSeed(teamIndexMap.get(bottomTeam)!)
          : undefined;

      currentRound.push({
        key,
        topTeam,
        bottomTeam,
        winner,
        topSeed,
        bottomSeed,
      });
    }
    rounds.push(currentRound);
  }

  return rounds;
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm nx run web:test -- --run --reporter=verbose apps/web/src/features/brackets/utils/derive-bracket-matchups.spec.ts`
Expected: All 8 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/brackets/utils/derive-bracket-matchups.ts
git commit -m "feat(brackets): implement deriveBracketMatchups utility"
```

---

## Chunk 2: Backend API

### Task 4: Brackets NestJS Module

**Files:**
- Create: `apps/api/src/brackets/brackets.service.ts`
- Create: `apps/api/src/brackets/brackets.controller.ts`
- Create: `apps/api/src/brackets/brackets.module.ts`
- Modify: `apps/api/src/app/app.module.ts`

**Context:** This endpoint is public (no auth guard). The service imports `getFirestore` directly from `firebase-admin/firestore` — it works because `AuthModule` (which contains `FirebaseAdminService`) initializes the Firebase app on startup. The controller returns `ApiResponse<BracketDocument>` manually (not using NestJS exception filters) for consistency.

- [ ] **Step 1: Create the brackets service**

Create `apps/api/src/brackets/brackets.service.ts`:

```typescript
import type { BracketDocument } from '@movable-madness/shared-types';
import { Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class BracketsService {
  async findById(bracketId: string): Promise<BracketDocument | null> {
    const doc = await getFirestore().collection('brackets').doc(bracketId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...(doc.data() as Omit<BracketDocument, 'id'>),
    };
  }
}
```

- [ ] **Step 2: Create the brackets controller**

Create `apps/api/src/brackets/brackets.controller.ts`:

```typescript
import type { ApiResponse, BracketDocument } from '@movable-madness/shared-types';
import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { BracketsService } from './brackets.service';

@ApiTags('Brackets')
@Controller('brackets')
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Get(':bracketId')
  @ApiOperation({ summary: 'Get a bracket by ID' })
  @ApiParam({
    name: 'bracketId',
    description: 'Firestore bracket document ID',
    type: String,
  })
  @SwaggerResponse({
    status: 200,
    description: 'Returns the bracket document',
  })
  @SwaggerResponse({
    status: 404,
    description: 'Bracket not found',
  })
  async getBracket(
    @Param('bracketId') bracketId: string,
    @Res() res: Response,
  ): Promise<void> {
    const bracket = await this.bracketsService.findById(bracketId);

    if (!bracket) {
      const errorResponse: ApiResponse<never> = {
        success: false,
        error: {
          code: 'BRACKET_NOT_FOUND',
          message: 'Bracket not found',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse<BracketDocument> = {
      success: true,
      data: bracket,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }
}
```

- [ ] **Step 3: Create the brackets module**

Create `apps/api/src/brackets/brackets.module.ts`:

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

- [ ] **Step 4: Register module in AppModule**

In `apps/api/src/app/app.module.ts`, add the import and register the module:

```typescript
// Add this import at the top (after existing imports):
import { BracketsModule } from '../brackets/brackets.module';

// Add BracketsModule to the imports array (after UsersModule):
imports: [
  LoggingModule.forRoot({ ... }),
  AuthModule,
  UsersModule,
  BracketsModule,  // <-- add this
],
```

- [ ] **Step 5: Verify API compiles**

Run: `pnpm nx run api:build`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/brackets/ apps/api/src/app/app.module.ts
git commit -m "feat(api): add GET /brackets/:bracketId endpoint"
```

---

## Chunk 3: Frontend Components & Page

### Task 5: Frontend API Client

**Files:**
- Create: `apps/web/src/features/brackets/api/brackets-api.ts`

**Context:** The existing `apps/web/src/shared/api/api-client.ts` provides typed `get()` helper. Since this endpoint is public, the auth token is optional (the client sends it if available, the server ignores it).

- [ ] **Step 1: Create brackets API client**

Create `apps/web/src/features/brackets/api/brackets-api.ts`:

```typescript
import type { ApiResponse, BracketDocument } from '@movable-madness/shared-types';

const API_BASE_URL = '/api';

export async function fetchBracket(bracketId: string): Promise<ApiResponse<BracketDocument>> {
  const response = await fetch(`${API_BASE_URL}/brackets/${bracketId}`);
  return response.json();
}
```

**Note:** This does NOT use the shared `api-client.ts` because that client throws on non-2xx responses. This endpoint is public and we need to handle 404s gracefully by reading the JSON body (which contains the structured `ApiResponse` error). Using raw `fetch` lets us always return the parsed JSON regardless of status code.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/brackets/api/brackets-api.ts
git commit -m "feat(brackets): add frontend API client for brackets"
```

---

### Task 6: MatchupCard Component

**Files:**
- Create: `apps/web/src/features/brackets/components/MatchupCard.tsx`

**Context:** Displays a single matchup: two team rows, winner highlighted with magenta checkmark, loser grayed out, unpicked slots show "TBD" in gray italic. Championship matchup gets a magenta border.

- [ ] **Step 1: Create MatchupCard**

Create `apps/web/src/features/brackets/components/MatchupCard.tsx`:

```typescript
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
        className={`px-2.5 py-1.5 text-xs text-gray-400 italic${
          isTop ? '' : ' border-t border-dashed border-gray-200'
        }`}
      >
        TBD
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 text-xs${
        isTop ? '' : ' border-t border-gray-200'
      }${isWinner ? '' : ' text-gray-400'}`}
    >
      <span>
        {seed != null && (
          <span className="mr-1 text-[10px] text-gray-400">({seed})</span>
        )}
        {team}
      </span>
      {isWinner && (
        <span className="font-semibold text-[#E31C79]">&#10003;</span>
      )}
    </div>
  );
}

export function MatchupCard({ matchup, isChampionship = false }: MatchupCardProps) {
  const hasAnyTeam = matchup.topTeam != null || matchup.bottomTeam != null;
  const borderClass = isChampionship
    ? 'border-2 border-[#E31C79] rounded-lg'
    : hasAnyTeam
      ? 'border border-gray-300 rounded-md'
      : 'border border-dashed border-gray-300 rounded-md';

  return (
    <div className={`bg-white overflow-hidden ${borderClass}`}>
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

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/brackets/components/MatchupCard.tsx
git commit -m "feat(brackets): add MatchupCard component"
```

---

### Task 7: BracketRound Component

**Files:**
- Create: `apps/web/src/features/brackets/components/BracketRound.tsx`

**Context:** A vertical column of matchup cards for one round with a magenta round label header.

- [ ] **Step 1: Create BracketRound**

Create `apps/web/src/features/brackets/components/BracketRound.tsx`:

```typescript
import type { Matchup } from '@movable-madness/shared-types';
import { MatchupCard } from './MatchupCard';

interface BracketRoundProps {
  name: string;
  matchups: Matchup[];
  roundIndex: number;
  isChampionship: boolean;
}

export function BracketRound({ name, matchups, roundIndex, isChampionship }: BracketRoundProps) {
  // Offset each subsequent round vertically to suggest bracket narrowing
  // Round 0 = 0px, Round 1 = 30px, Round 2 = 65px, etc.
  const topOffset = roundIndex === 0 ? 0 : Math.round(30 * (2 ** roundIndex - 1) * 0.5);

  return (
    <div className="flex shrink-0 basis-40 flex-col gap-2" style={{ marginTop: topOffset }}>
      <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#E31C79]">
        {name}
      </div>
      {matchups.map((matchup) => (
        <MatchupCard
          key={matchup.key}
          matchup={matchup}
          isChampionship={isChampionship}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/brackets/components/BracketRound.tsx
git commit -m "feat(brackets): add BracketRound component"
```

---

### Task 8: BracketGrid Component

**Files:**
- Create: `apps/web/src/features/brackets/components/BracketGrid.tsx`

**Context:** Horizontally scrollable container rendering 6 BracketRound columns. Calls `deriveBracketMatchups` to transform flat data into structured rounds. Shows champion callout below the championship matchup.

- [ ] **Step 1: Create BracketGrid**

Create `apps/web/src/features/brackets/components/BracketGrid.tsx`:

```typescript
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
                <div className="text-[10px] uppercase tracking-wide text-gray-400">
                  Champion
                </div>
                <div
                  className={`mt-1 rounded-lg border-2 border-dashed px-3 py-2 text-base font-bold ${
                    champion
                      ? 'border-[#E31C79] bg-pink-50 text-[#E31C79]'
                      : 'border-gray-300 bg-gray-50 text-gray-400 italic'
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

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/brackets/components/BracketGrid.tsx
git commit -m "feat(brackets): add BracketGrid component"
```

---

### Task 9: BracketHeader Component

**Files:**
- Create: `apps/web/src/features/brackets/components/BracketHeader.tsx`

**Context:** Brand Magenta header with bracket name, submission date, and a share-link button that copies the current URL to clipboard with a "Copied!" tooltip.

- [ ] **Step 1: Create BracketHeader**

Create `apps/web/src/features/brackets/components/BracketHeader.tsx`:

```typescript
import { useCallback, useState } from 'react';

interface BracketHeaderProps {
  bracketName: string;
  createdAt: string;
}

export function BracketHeader({ bracketName, createdAt }: BracketHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between bg-[#E31C79] px-6 py-4 text-white">
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

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/brackets/components/BracketHeader.tsx
git commit -m "feat(brackets): add BracketHeader component"
```

---

### Task 10: ViewBracketPage & Route Registration

**Files:**
- Create: `apps/web/src/pages/brackets/view/ViewBracketPage.tsx`
- Modify: `apps/web/src/app/app.tsx`

**Context:** Page component fetches bracket data by ID from URL params, handles loading/error/not-found states, renders BracketHeader + BracketGrid. Route is public (no auth required).

- [ ] **Step 1: Create ViewBracketPage**

Create `apps/web/src/pages/brackets/view/ViewBracketPage.tsx`:

```typescript
import type { BracketDocument } from '@movable-madness/shared-types';
import { Alert, AlertDescription } from '@movable-madness/ui';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BracketGrid } from '../../../features/brackets/components/BracketGrid';
import { BracketHeader } from '../../../features/brackets/components/BracketHeader';
import { fetchBracket } from '../../../features/brackets/api/brackets-api';

function BracketSkeleton() {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[1100px] gap-4 px-4 py-6">
        {[32, 16, 8, 4].map((count, i) => (
          <div key={i} className="flex shrink-0 basis-40 flex-col gap-2">
            <div className="mx-auto h-3 w-20 animate-pulse rounded bg-gray-200" />
            {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
              <div key={j} className="h-12 animate-pulse rounded-md bg-gray-200" />
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
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse bg-pink-200 px-6 py-4">
          <div className="h-6 w-48 rounded bg-pink-300" />
          <div className="mt-2 h-3 w-32 rounded bg-pink-300" />
        </div>
        <BracketSkeleton />
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md px-4">
          <Alert variant="destructive">
            <AlertDescription>{error ?? 'Bracket not found'}</AlertDescription>
          </Alert>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm text-[#E31C79] underline hover:text-[#c4166a]"
            >
              Try again
            </button>
            <a href="/" className="text-sm text-gray-500 underline hover:text-gray-700">
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BracketHeader
        bracketName={bracket.bracketName}
        createdAt={bracket.createdAt}
      />
      <BracketGrid teams={bracket.teams} picks={bracket.picks} />
    </div>
  );
}
```

- [ ] **Step 2: Register the route**

In `apps/web/src/app/app.tsx`, add the import and route:

```typescript
// Add import at the top (after existing page imports):
import { ViewBracketPage } from '../pages/brackets/view/ViewBracketPage';

// Add route inside <Routes> (after the last existing <Route>):
<Route path="/brackets/:bracketId" element={<ViewBracketPage />} />
```

- [ ] **Step 3: Verify frontend compiles**

Run: `pnpm nx run web:build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/brackets/view/ViewBracketPage.tsx apps/web/src/app/app.tsx
git commit -m "feat(brackets): add ViewBracketPage and register route"
```

---

## Chunk 4: Seed Script

### Task 11: Bracket Seed Script

**Files:**
- Create: `tools/scripts/seed-bracket.ts`

**Context:** Creates a test bracket document in Firestore for visual testing. Follows the pattern of `tools/scripts/seed-admin.ts`: reads project ID from `firebase.json`, initializes Firebase Admin, writes to Firestore. Uses 64 real-ish team names and a mix of completed and incomplete picks to test all visual states.

- [ ] **Step 1: Create seed script**

Create `tools/scripts/seed-bracket.ts`:

```typescript
/**
 * Bracket Seeding Script
 * Creates a test bracket document in Firestore for visual testing.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../');
const BRACKET_ID = 'test-bracket-1';

function getProjectIdFromFirebaseJson(): string | null {
  const firebaseJsonPath = path.join(WORKSPACE_ROOT, 'firebase.json');
  if (!fs.existsSync(firebaseJsonPath)) {
    return null;
  }
  const content = fs.readFileSync(firebaseJsonPath, 'utf-8');
  const config = JSON.parse(content);
  return config.projectId ?? null;
}

// 64 teams in bracket matchup order (adjacent pairs = R1 matchups)
// 4 regions x 8 matchups per region (1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
const TEAMS = [
  // Region 1 (East)
  'Duke', 'Norfolk St', 'Memphis', 'Florida Atlantic',
  'Gonzaga', 'McNeese', 'Arizona', 'Vermont',
  'Clemson', 'New Mexico', 'Purdue', 'High Point',
  'Wisconsin', 'Montana', 'Texas Tech', 'UConn',
  // Region 2 (West)
  'Houston', 'SIU Edwardsville', 'Iowa St', 'Lipscomb',
  'Michigan St', 'Bryant', 'Marquette', 'Western Carolina',
  'Oregon', 'Liberty', 'Tennessee', 'Wofford',
  'Saint Mary\'s', 'Grand Canyon', 'Alabama', 'Robert Morris',
  // Region 3 (South)
  'Auburn', 'Alabama St', 'BYU', 'VCU',
  'Illinois', 'Troy', 'Kentucky', 'Colgate',
  'UCLA', 'UC San Diego', 'Florida', 'Norfolk',
  'Baylor', 'Akron', 'Kansas', 'Arkansas',
  // Region 4 (Midwest)
  'North Carolina', 'Merrimack', 'Boise St', 'SMU',
  'Maryland', 'Grand Canyon St', 'Creighton', 'UC Irvine',
  'Ole Miss', 'Dayton', 'Michigan', 'UC Davis',
  'San Diego St', 'Louisville', 'Texas A&M', 'Drake',
];

// Picks: complete through Round 3, partial Round 4, empty R5-R6
function makePicks(): Record<string, string> {
  const picks: Record<string, string> = {};

  // R1: top team wins in all 32 matchups
  for (let m = 0; m < 32; m++) {
    picks[`R1_M${m + 1}`] = TEAMS[m * 2];
  }

  // R2: top team (winner of odd matchup) wins in all 16
  for (let m = 0; m < 16; m++) {
    picks[`R2_M${m + 1}`] = picks[`R1_M${m * 2 + 1}`];
  }

  // R3: top team wins in all 8 (Sweet 16)
  for (let m = 0; m < 8; m++) {
    picks[`R3_M${m + 1}`] = picks[`R2_M${m * 2 + 1}`];
  }

  // R4: only first 2 of 4 matchups picked (Elite 8 — partial)
  picks['R4_M1'] = picks['R3_M1'];
  picks['R4_M2'] = picks['R3_M3'];

  // R5 and R6 left empty to test TBD state

  return picks;
}

async function main() {
  console.log('\n🏀 Bracket Seeding Script\n');

  const projectId = getProjectIdFromFirebaseJson();
  if (!projectId) {
    console.error('❌ No projectId found in firebase.json');
    console.error('   Run the setup script first: pnpm run setup');
    process.exit(1);
  }

  console.log(`📍 Target Firebase project: ${projectId}`);

  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  const firestore = getFirestore();
  const picks = makePicks();

  console.log(`📝 Writing bracket "${BRACKET_ID}"...`);
  console.log(`   Teams: ${TEAMS.length}`);
  console.log(`   Picks: ${Object.keys(picks).length} of 63`);

  await firestore.collection('brackets').doc(BRACKET_ID).set({
    bracketName: "Nick's March Madness Picks",
    userId: 'seed-user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teams: TEAMS,
    picks,
  });

  console.log(`\n✅ Bracket seeded successfully!`);
  console.log(`   View at: /brackets/${BRACKET_ID}\n`);
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
```

- [ ] **Step 2: Verify script compiles**

Run: `npx tsx tools/scripts/seed-bracket.ts 2>&1 | head -5`
Expected: Script starts executing and prints the header line. It will likely error on Firebase connection if credentials aren't configured, which is fine — we just want to confirm it compiles and starts.

- [ ] **Step 3: Add package.json script**

In `package.json`, add to the `scripts` section (alongside the existing `seed:admin` entry):

```json
"seed:bracket": "npx tsx tools/scripts/seed-bracket.ts"
```

- [ ] **Step 4: Commit**

```bash
git add tools/scripts/seed-bracket.ts package.json
git commit -m "feat(tools): add bracket seeding script"
```

---

## Final Verification

- [ ] **Step 1: Run all tests**

Run: `pnpm nx run web:test -- --run`
Expected: All tests pass including new bracket derivation tests.

- [ ] **Step 2: Build all**

Run: `pnpm nx run-many -t build`
Expected: Both `web` and `api` builds succeed.

- [ ] **Step 3: Final commit (if any lint fixes)**

If Biome auto-fixes any formatting, stage only the affected files:
```bash
git diff --name-only | xargs git add
git commit -m "style: apply biome formatting"
```
