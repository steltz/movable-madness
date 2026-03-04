# View Bracket Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a read-only View Bracket page that fetches a user's saved bracket from Firestore via the NestJS API and displays all 64 teams across 6 rounds in a full CSS Grid bracket layout.

**Architecture:** Public route at `/brackets/:bracketId`. NestJS API endpoint reads from the `brackets` Firestore collection. Frontend reconstructs the bracket tree from a flat `picks` map + `teams` array and renders it in a 6-column CSS Grid with connector lines. Matchup cards highlight winners in Movable Ink Brand Magenta (#E31C79).

**Tech Stack:** React 19, React Router 7, Tailwind CSS v4, NestJS 11, Firebase Admin SDK, shared types from `@workspace/shared-types`

---

### Task 1: Add Shared Bracket Types

**Files:**
- Create: `libs/shared-types/src/lib/bracket.ts`
- Modify: `libs/shared-types/src/index.ts`

**Step 1: Create bracket type definitions**

Create `libs/shared-types/src/lib/bracket.ts`:

```typescript
export interface BracketDocument {
  bracketName: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  picks: Record<string, string>;
  teams: string[];
}

export interface Matchup {
  id: string;
  teamA: string | null;
  teamB: string | null;
  winner: string | null;
}

export interface Round {
  label: string;
  matchups: Matchup[];
}
```

**Step 2: Export from shared-types barrel**

Add to `libs/shared-types/src/index.ts`:

```typescript
export type { BracketDocument, Matchup, Round } from './lib/bracket';
```

**Step 3: Verify types compile**

Run: `npx nx build shared-types` or `npx tsc --noEmit -p libs/shared-types/tsconfig.json`
Expected: No errors

**Step 4: Commit**

```bash
git add libs/shared-types/src/lib/bracket.ts libs/shared-types/src/index.ts
git commit -m "feat: add shared bracket types for BracketDocument, Matchup, Round"
```

---

### Task 2: Create NestJS Brackets Module with GET Endpoint

**Files:**
- Create: `apps/api/src/brackets/brackets.module.ts`
- Create: `apps/api/src/brackets/brackets.controller.ts`
- Create: `apps/api/src/brackets/brackets.service.ts`
- Modify: `apps/api/src/app/app.module.ts`

**Step 1: Create the brackets service**

Create `apps/api/src/brackets/brackets.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import type { ApiResponse } from '@workspace/shared-types';
import type { BracketDocument } from '@workspace/shared-types';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class BracketsService {
  async getBracketById(bracketId: string): Promise<ApiResponse<BracketDocument>> {
    const doc = await getFirestore().collection('brackets').doc(bracketId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Bracket ${bracketId} not found`);
    }

    const data = doc.data() as BracketDocument;

    return {
      success: true,
      data: {
        bracketName: data.bracketName,
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        picks: data.picks ?? {},
        teams: data.teams ?? [],
      },
      timestamp: new Date().toISOString(),
    };
  }
}
```

**Step 2: Create the brackets controller**

Create `apps/api/src/brackets/brackets.controller.ts`:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BracketsService } from './brackets.service';

@ApiTags('Brackets')
@Controller('brackets')
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Get(':bracketId')
  @ApiOperation({ summary: 'Get a bracket by ID' })
  @ApiResponse({ status: 200, description: 'Returns the bracket document' })
  @ApiResponse({ status: 404, description: 'Bracket not found' })
  getBracket(@Param('bracketId') bracketId: string) {
    return this.bracketsService.getBracketById(bracketId);
  }
}
```

**Step 3: Create the brackets module**

Create `apps/api/src/brackets/brackets.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';

@Module({
  controllers: [BracketsController],
  providers: [BracketsService],
  exports: [BracketsService],
})
export class BracketsModule {}
```

**Step 4: Register module in AppModule**

Modify `apps/api/src/app/app.module.ts` — add `BracketsModule` to imports:

```typescript
import { BracketsModule } from '../brackets/brackets.module';

@Module({
  imports: [
    LoggingModule.forRoot({
      service: 'api',
      enableRequestLogging: true,
    }),
    AuthModule,
    UsersModule,
    BracketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Step 5: Verify API compiles**

Run: `npx nx build api`
Expected: No errors

**Step 6: Commit**

```bash
git add apps/api/src/brackets/ apps/api/src/app/app.module.ts
git commit -m "feat: add brackets API module with GET /brackets/:bracketId endpoint"
```

---

### Task 3: Create Bracket Tree Builder Utility

**Files:**
- Create: `apps/web/src/features/brackets/utils/build-bracket-tree.ts`

**Step 1: Create the utility**

This pure function reconstructs a bracket tree from the flat Firestore data.

Create `apps/web/src/features/brackets/utils/build-bracket-tree.ts`:

```typescript
import type { Matchup, Round } from '@workspace/shared-types';

const ROUND_LABELS = [
  'Round of 64',
  'Round of 32',
  'Sweet 16',
  'Elite 8',
  'Final Four',
  'Championship',
];

export function buildBracketTree(
  teams: string[],
  picks: Record<string, string>,
): Round[] {
  const rounds: Round[] = [];

  // Round 1: pair teams from the seed list
  const round1Matchups: Matchup[] = [];
  for (let i = 0; i < 32; i++) {
    const id = `R1_M${i + 1}`;
    round1Matchups.push({
      id,
      teamA: teams[i * 2] ?? null,
      teamB: teams[i * 2 + 1] ?? null,
      winner: picks[id] ?? null,
    });
  }
  rounds.push({ label: ROUND_LABELS[0], matchups: round1Matchups });

  // Rounds 2-6: derive from previous round winners
  let prevMatchups = round1Matchups;
  for (let round = 2; round <= 6; round++) {
    const matchups: Matchup[] = [];
    const matchupCount = prevMatchups.length / 2;

    for (let i = 0; i < matchupCount; i++) {
      const id = `R${round}_M${i + 1}`;
      const feedA = prevMatchups[i * 2];
      const feedB = prevMatchups[i * 2 + 1];

      matchups.push({
        id,
        teamA: feedA.winner,
        teamB: feedB.winner,
        winner: picks[id] ?? null,
      });
    }

    rounds.push({ label: ROUND_LABELS[round - 1], matchups });
    prevMatchups = matchups;
  }

  return rounds;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/brackets/utils/build-bracket-tree.ts
git commit -m "feat: add buildBracketTree utility to reconstruct bracket from flat picks"
```

---

### Task 4: Create MatchupCard Component

**Files:**
- Create: `apps/web/src/features/brackets/components/matchup-card.tsx`

**Step 1: Create the component**

Create `apps/web/src/features/brackets/components/matchup-card.tsx`:

```tsx
import { cn } from '@workspace/ui';
import type { Matchup } from '@workspace/shared-types';

interface MatchupCardProps {
  matchup: Matchup;
}

function TeamRow({
  name,
  isWinner,
}: {
  name: string | null;
  isWinner: boolean;
}) {
  if (!name) {
    return (
      <div className="px-3 py-1.5 text-sm italic text-gray-400">TBD</div>
    );
  }

  return (
    <div
      className={cn(
        'px-3 py-1.5 text-sm truncate',
        isWinner
          ? 'bg-[#E31C79]/10 font-semibold text-[#E31C79]'
          : 'text-gray-500',
      )}
    >
      {name}
    </div>
  );
}

export function MatchupCard({ matchup }: MatchupCardProps) {
  return (
    <div className="w-44 rounded-lg border border-gray-300 bg-white overflow-hidden">
      <TeamRow
        name={matchup.teamA}
        isWinner={!!matchup.winner && matchup.winner === matchup.teamA}
      />
      <div className="border-t border-gray-300" />
      <TeamRow
        name={matchup.teamB}
        isWinner={!!matchup.winner && matchup.winner === matchup.teamB}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/brackets/components/matchup-card.tsx
git commit -m "feat: add MatchupCard component with winner highlighting"
```

---

### Task 5: Create BracketRound Component

**Files:**
- Create: `apps/web/src/features/brackets/components/bracket-round.tsx`

**Step 1: Create the component**

Each round is a column that vertically spaces its matchups so they align with their feeder matchups. Uses flexbox with growing spacers.

Create `apps/web/src/features/brackets/components/bracket-round.tsx`:

```tsx
import type { Round } from '@workspace/shared-types';
import { MatchupCard } from './matchup-card';

interface BracketRoundProps {
  round: Round;
  roundIndex: number;
}

export function BracketRound({ round, roundIndex }: BracketRoundProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {round.label}
      </div>
      <div
        className="flex flex-col justify-around flex-1"
        style={{ gap: `${Math.pow(2, roundIndex) * 0.5}rem` }}
      >
        {round.matchups.map((matchup) => (
          <MatchupCard key={matchup.id} matchup={matchup} />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/brackets/components/bracket-round.tsx
git commit -m "feat: add BracketRound component with dynamic vertical spacing"
```

---

### Task 6: Create BracketGrid Component

**Files:**
- Create: `apps/web/src/features/brackets/components/bracket-grid.tsx`

**Step 1: Create the component**

The main grid container that lays out all 6 rounds horizontally with connector lines.

Create `apps/web/src/features/brackets/components/bracket-grid.tsx`:

```tsx
import type { Round } from '@workspace/shared-types';
import { BracketRound } from './bracket-round';

interface BracketGridProps {
  rounds: Round[];
}

export function BracketGrid({ rounds }: BracketGridProps) {
  return (
    <div className="overflow-x-auto p-6">
      <div className="inline-flex items-stretch gap-4 min-h-[1200px]">
        {rounds.map((round, index) => (
          <BracketRound key={round.label} round={round} roundIndex={index} />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/brackets/components/bracket-grid.tsx
git commit -m "feat: add BracketGrid component with horizontal round layout"
```

---

### Task 7: Create BracketHeader Component

**Files:**
- Create: `apps/web/src/features/brackets/components/bracket-header.tsx`

**Step 1: Create the component**

Create `apps/web/src/features/brackets/components/bracket-header.tsx`:

```tsx
interface BracketHeaderProps {
  bracketName: string;
}

export function BracketHeader({ bracketName }: BracketHeaderProps) {
  return (
    <header className="bg-[#E31C79] px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="text-sm font-medium tracking-wide text-white/80">
          Movable Madness
        </span>
        <h1 className="text-xl font-bold text-white">{bracketName}</h1>
        <div className="w-24" />
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/brackets/components/bracket-header.tsx
git commit -m "feat: add BracketHeader with Movable Ink Brand Magenta styling"
```

---

### Task 8: Create ViewBracketPage Route Component

**Files:**
- Create: `apps/web/src/pages/brackets/view/view-bracket-page.tsx`
- Modify: `apps/web/src/app/app.tsx`

**Step 1: Create the page component**

Create `apps/web/src/pages/brackets/view/view-bracket-page.tsx`:

```tsx
import type { ApiResponse, BracketDocument } from '@workspace/shared-types';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BracketGrid } from '../../../features/brackets/components/bracket-grid';
import { BracketHeader } from '../../../features/brackets/components/bracket-header';
import { buildBracketTree } from '../../../features/brackets/utils/build-bracket-tree';
import { get } from '../../../shared/api/api-client';

export function ViewBracketPage() {
  const { bracketId } = useParams<{ bracketId: string }>();
  const [bracket, setBracket] = useState<BracketDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bracketId) return;

    get<ApiResponse<BracketDocument>>(`/brackets/${bracketId}`)
      .then((res) => {
        if (res.success && res.data) {
          setBracket(res.data);
        } else {
          setError(res.error?.message ?? 'Failed to load bracket');
        }
      })
      .catch((err) => {
        setError(err.message ?? 'Failed to load bracket');
      })
      .finally(() => setLoading(false));
  }, [bracketId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading bracket...</p>
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-lg text-gray-700">
          {error ?? 'Bracket not found'}
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-[#E31C79] hover:underline"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const rounds = buildBracketTree(bracket.teams, bracket.picks);

  return (
    <div className="min-h-screen bg-gray-50">
      <BracketHeader bracketName={bracket.bracketName} />
      <BracketGrid rounds={rounds} />
    </div>
  );
}
```

**Step 2: Add route to app.tsx**

Modify `apps/web/src/app/app.tsx` — add the route inside `<Routes>`:

Add import at top:
```typescript
import { ViewBracketPage } from '../pages/brackets/view/view-bracket-page';
```

Add route inside `<Routes>` after the sign-in route:
```tsx
<Route path="/brackets/:bracketId" element={<ViewBracketPage />} />
```

**Step 3: Verify app compiles**

Run: `npx nx build web`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/pages/brackets/view/view-bracket-page.tsx apps/web/src/app/app.tsx
git commit -m "feat: add ViewBracketPage with route at /brackets/:bracketId"
```

---

### Task 9: Connector Lines Between Rounds

**Files:**
- Modify: `apps/web/src/features/brackets/components/bracket-grid.tsx`
- Create: `apps/web/src/features/brackets/components/connector-lines.css`

**Step 1: Add CSS for connector lines**

Create `apps/web/src/features/brackets/components/connector-lines.css`:

```css
.bracket-round-col {
  position: relative;
}

.bracket-matchup-wrapper {
  position: relative;
}

/* Right-side connector: horizontal line from matchup to the right */
.bracket-matchup-wrapper::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 50%;
  width: 8px;
  border-top: 1px solid #d1d5db; /* gray-300 */
}

/* Left-side connector: horizontal line from the left into matchup */
.bracket-round-col:not(:first-child) .bracket-matchup-wrapper::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  width: 8px;
  border-top: 1px solid #d1d5db;
}

/* Hide right connector on last round */
.bracket-round-col:last-child .bracket-matchup-wrapper::after {
  display: none;
}
```

**Step 2: Update BracketGrid to use connectors**

Update `apps/web/src/features/brackets/components/bracket-grid.tsx`:

```tsx
import type { Round } from '@workspace/shared-types';
import { BracketRound } from './bracket-round';
import './connector-lines.css';

interface BracketGridProps {
  rounds: Round[];
}

export function BracketGrid({ rounds }: BracketGridProps) {
  return (
    <div className="overflow-x-auto p-6">
      <div className="inline-flex items-stretch gap-4 min-h-[1200px]">
        {rounds.map((round, index) => (
          <div key={round.label} className="bracket-round-col">
            <BracketRound round={round} roundIndex={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Update BracketRound to wrap matchups**

Update `apps/web/src/features/brackets/components/bracket-round.tsx` — wrap each `MatchupCard` in a div with class `bracket-matchup-wrapper`:

```tsx
import type { Round } from '@workspace/shared-types';
import { MatchupCard } from './matchup-card';

interface BracketRoundProps {
  round: Round;
  roundIndex: number;
}

export function BracketRound({ round, roundIndex }: BracketRoundProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {round.label}
      </div>
      <div
        className="flex flex-col justify-around flex-1"
        style={{ gap: `${Math.pow(2, roundIndex) * 0.5}rem` }}
      >
        {round.matchups.map((matchup) => (
          <div key={matchup.id} className="bracket-matchup-wrapper">
            <MatchupCard matchup={matchup} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/features/brackets/components/connector-lines.css apps/web/src/features/brackets/components/bracket-grid.tsx apps/web/src/features/brackets/components/bracket-round.tsx
git commit -m "feat: add connector lines between bracket rounds"
```

---

### Task 10: Visual Testing with Seed Data

**Files:**
- No new files — manual verification

**Step 1: Start the dev servers**

Run: `pnpm dev`
Expected: Frontend on :4200, API on :3000

**Step 2: Seed a test bracket in Firestore**

Use the Firebase Console or a one-off script to create a document in the `brackets` collection with a known ID (e.g., `test-bracket-1`). The document should have:
- `bracketName`: "Test Bracket"
- `userId`: "test-user"
- `createdAt`: current timestamp string
- `updatedAt`: current timestamp string
- `teams`: array of 64 team name strings (e.g., "Team 1" through "Team 64")
- `picks`: object with some picks filled in (e.g., `{ "R1_M1": "Team 1", "R1_M2": "Team 4" }`) — leave some empty to test partial bracket rendering

**Step 3: Verify the page**

Navigate to `http://localhost:4200/brackets/test-bracket-1`
Expected:
- Magenta header showing "Test Bracket"
- 6 rounds displayed horizontally
- Round 1 shows all 64 teams in 32 matchups
- Picked winners highlighted in magenta
- Unpicked matchups show "TBD"

**Step 4: Test error state**

Navigate to `http://localhost:4200/brackets/nonexistent-id`
Expected: "Bracket not found" message with "Back to Home" link

**Step 5: Commit any tweaks**

If visual adjustments were needed during testing, commit them:
```bash
git add -u
git commit -m "fix: visual adjustments from bracket view testing"
```
