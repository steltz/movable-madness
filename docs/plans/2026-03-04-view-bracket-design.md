# View Bracket Screen - Design Document

## Overview

Read-only screen that visualizes a user's submitted bracket picks for the Movable Madness 64-team bracket demo app. Accessible via a shareable public URL.

## Route

`/brackets/:bracketId` - Public route, no authentication required.

## Firestore Schema

Collection: `brackets/{bracketId}`

```
bracketName: string          // User-chosen name
userId: string               // Firebase auth UID
createdAt: Timestamp
updatedAt: Timestamp
picks: Record<string, string> // Key = matchup ID (e.g. "R1_M1"), Value = winning team
teams: string[]               // 64 teams in seed order
```

Matchup ID format: `R{round}_M{matchup}` where round 1 = Round of 64, round 6 = Championship.

## Page Layout

### Header
- Full-width bar with `bg-[#E31C79]` (Movable Ink Brand Magenta)
- White text, bracket name centered
- "Movable Madness" wordmark on the left

### Bracket Container
- Horizontally scrollable area below the header
- Contains the full 6-round CSS Grid bracket
- `overflow-x: auto` for smaller screens

## Bracket Grid (CSS Grid Approach)

6 columns, one per round:

| Column | Round | Matchups |
|--------|-------|----------|
| 1 | Round of 64 | 32 |
| 2 | Round of 32 | 16 |
| 3 | Sweet 16 | 8 |
| 4 | Elite 8 | 4 |
| 5 | Final Four | 2 |
| 6 | Championship | 1 |

Each column ~200px wide (~1200px total). Matchup cards vertically centered relative to their two feeder matchups from the previous round.

Round labels appear at the top of each column.

## Matchup Card Design

- Compact card: `border border-gray-300 rounded-lg`
- Two teams stacked vertically with thin divider
- Winner: `bg-[#E31C79]/10` tint, `font-semibold text-[#E31C79]`
- Loser: `text-gray-500`, normal weight
- Unpicked: "TBD" in `text-gray-400 italic`

### Connector Lines
- CSS `::before`/`::after` pseudo-elements with `border-gray-300`
- Connect right edge of matchup pair to left edge of next-round matchup

## Data Flow

1. Page loads with `bracketId` from React Router URL params
2. Calls `GET /api/brackets/:bracketId` on NestJS API
3. API reads `brackets/{bracketId}` from Firestore via Admin SDK
4. Returns document wrapped in `ApiResponse<BracketDocument>`
5. Frontend reconstructs bracket tree using `buildBracketTree(teams, picks)`

### Bracket Reconstruction

Pure utility function: `buildBracketTree(teams: string[], picks: Record<string, string>): Round[]`

- Round 1 matchups derived from `teams` array (index 0 vs 1, 2 vs 3, etc.)
- Subsequent rounds derived by looking up picks from previous round winners

## Component Architecture

```
ViewBracketPage          -- route component, data fetching
├── BracketHeader        -- magenta header bar with bracket name
└── BracketGrid          -- scrollable container + grid layout
    └── BracketRound[]   -- one column per round with label
        └── MatchupCard[] -- individual matchup display
```

All components in `apps/web/src/`. Uses `cn()` utility from `libs/ui` for class merging.

## Shared Types

Added to `libs/shared-types`:

```typescript
interface BracketDocument {
  bracketName: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  picks: Record<string, string>;
  teams: string[];
}

interface Matchup {
  id: string;
  teamA: string | null;
  teamB: string | null;
  winner: string | null;
}

interface Round {
  label: string;
  matchups: Matchup[];
}
```

## Error Handling

- **Network failure**: Error message with "Try Again" button
- **404 / Not found**: "Bracket not found" message with "Back to Home" link
- **Partial bracket**: Render available picks, show "TBD" for unpicked slots
- **Empty picks**: Show all 64 teams in Round 1, all subsequent rounds show "TBD"

## Styling

- Primary accent: `#E31C79` (Movable Ink Brand Magenta)
- Matchup borders: `border-gray-300`
- Connector lines: `border-gray-300`
- Winner highlight: `bg-[#E31C79]/10` + `text-[#E31C79]`
- Typography: System defaults from Tailwind, clean modern feel
