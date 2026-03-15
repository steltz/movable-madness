# View Bracket Screen — Design Spec

## Overview

A read-only screen that visualizes a user's submitted 64-team bracket picks. Accessible via a public shareable link at `/brackets/:bracketId`. Fetches the saved bracket from Firestore through the NestJS API and displays it in a classic horizontal bracket layout.

## Scope

Full vertical slice: shared types, NestJS API endpoint, React UI components, and bracket derivation logic. Built as a self-contained feature that merges cleanly alongside other agents' work in separate worktrees.

## Data Model

### Firestore Collection: `brackets/{bracketId}`

```typescript
interface BracketDocument {
  id?: string;                     // Firestore document ID (added by API, not stored in doc)
  bracketName: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  teams: string[];                 // 64 teams in bracket matchup order (adjacent pairs = R1 matchups)
  picks: Record<string, string>;   // "R1_M1" → "Duke"
}
```

The `teams[]` array is pre-ordered for bracket matchups: adjacent pairs represent actual first-round pairings (e.g., index 0 vs index 1 = 1-seed vs 16-seed). The array is **not** in pure seed order — it is arranged so that `teams[2k]` vs `teams[2k+1]` gives the correct R1 matchup. The `id` field is not stored in Firestore; the API adds it from the document ID when returning the response.

### Pick Key Convention

Keys follow the pattern `R{round}_M{matchup}` where round is 1-6 and matchup is 1-based within that round.

| Round | Name           | Matchups | Keys              |
|-------|----------------|----------|-------------------|
| 1     | Round of 64    | 32       | R1_M1 – R1_M32    |
| 2     | Round of 32    | 16       | R2_M1 – R2_M16    |
| 3     | Sweet 16       | 8        | R3_M1 – R3_M8     |
| 4     | Elite 8        | 4        | R4_M1 – R4_M4     |
| 5     | Final Four     | 2        | R5_M1 – R5_M2     |
| 6     | Championship   | 1        | R6_M1             |

### Shared Types Location

`libs/shared-types/src/lib/bracket.ts` — exports `BracketDocument` and `Matchup`. Must also be re-exported from `libs/shared-types/src/index.ts` barrel file.

```typescript
interface Matchup {
  key: string;              // "R1_M1"
  topTeam: string | null;
  bottomTeam: string | null;
  winner: string | null;
  topSeed?: number;
  bottomSeed?: number;
}
```

## API

### `GET /brackets/:bracketId`

- **Auth:** None required (public endpoint)
- **Response:** `ApiResponse<BracketDocument>`
- **404:** `{ success: false, error: { code: "BRACKET_NOT_FOUND", message: "Bracket not found" }, timestamp }`
- **Location:** `apps/api/src/brackets/` (module, controller, service)
- **Swagger:** `@ApiTags('brackets')`, `@ApiOperation`, `@ApiResponse` decorators

### Module Registration

Add `BracketsModule` to `AppModule.imports` in `apps/api/src/app/app.module.ts`.

### Service Implementation

- Imports `getFirestore` directly from `firebase-admin/firestore` (works because the auth module initializes the Firebase app at startup)
- Calls `getFirestore().collection('brackets').doc(bracketId).get()`
- Adds the document ID as `id` to the returned data
- Returns `ApiResponse<BracketDocument>` with success wrapper, or returns a 404 error response manually (does not throw `NotFoundException`, to match the `ApiResponse` format consistently)

### Error Response

The controller constructs error responses manually to match the `ApiResponse` shape rather than relying on NestJS default exception formatting:

```typescript
{ success: false, error: { code: "BRACKET_NOT_FOUND", message: "Bracket not found" }, timestamp }
```

## Component Architecture

### Component Tree

```
ViewBracketPage (route: /brackets/:bracketId)
  ├── BracketHeader (name, date, share button)
  └── BracketGrid (horizontally scrollable container)
       └── BracketRound (x6, one per round)
            └── MatchupCard (xN per round: 32, 16, 8, 4, 2, 1)
```

### File Locations

- **Page:** `apps/web/src/pages/brackets/view/ViewBracketPage.tsx`
- **Components:** `apps/web/src/features/brackets/components/`
  - `BracketHeader.tsx`
  - `BracketGrid.tsx`
  - `BracketRound.tsx`
  - `MatchupCard.tsx`
- **Utility:** `apps/web/src/features/brackets/utils/derive-bracket-matchups.ts`
- **API client:** `apps/web/src/features/brackets/api/brackets-api.ts`

### Data Flow

1. `ViewBracketPage` extracts `bracketId` from URL params via React Router
2. Fetches `GET /api/brackets/:bracketId` using the shared API client
3. Passes bracket name and date to `BracketHeader`
4. Passes teams and picks to `BracketGrid`
5. `BracketGrid` calls `deriveBracketMatchups(teams, picks)` to get structured round data
6. Renders 6 `BracketRound` columns, each with its matchup cards

## Bracket Derivation Logic

### `deriveBracketMatchups(teams: string[], picks: Record<string, string>): Matchup[][]`

Pure function. Outer array = rounds (6), inner array = matchups per round.

### Round 1 Seeding

The `teams[]` array is pre-ordered for bracket matchups — adjacent pairs are actual first-round pairings. Round 1 matchups:
- M1: teams[0] vs teams[1]
- M2: teams[2] vs teams[3]
- M(k): teams[2k-2] vs teams[2k-1]

Seed numbers are encoded in the array ordering convention: odd-indexed positions within each group of matchups follow standard tournament seeding (1v16, 8v9, 5v12, 4v13, etc.). The seed for each team is derived from its index position: for index `i`, seed = a lookup based on the standard 64-team bracket seed ordering. The utility function includes a constant mapping of array index to seed number.

### Later Rounds

For round N > 1, matchup M(k) draws from the winners of the two parent matchups in round N-1:
- Top team = winner of R(N-1)_M(2k-1)
- Bottom team = winner of R(N-1)_M(2k)

If either parent pick is missing, the corresponding slot is `null` (renders as "TBD").

### Seed Tracking

Seeds are only directly available in Round 1. For later rounds, look up the winner in the original `teams[]` array to recover their seed number.

## Visual Design

### Header

- Background: Brand Magenta `#E31C79`
- White text: bracket name (bold, large) and submission date (smaller, slightly transparent)
- Share link button (white semi-transparent background) — copies the current page URL to clipboard on click, shows a brief "Copied!" tooltip

### Bracket Grid

- Horizontally scrollable container with `overflow-x: auto`
- 6 round columns, each with a magenta round label
- Each subsequent round is offset vertically to suggest bracket narrowing
- Minimum width ~1100px to prevent column collapse
- Mobile: horizontal scroll only — no special mobile layout. Desktop-first for this demo app

### Matchup Cards

- White background, `1px solid #d1d5db` border, `border-radius: 6px`
- Two team rows separated by a thin border
- Winner row: team name in dark text with magenta checkmark
- Loser row: grayed out text (`#9ca3af`)
- Seed numbers displayed as small gray text before team name
- Unpicked matchups: "TBD" in gray italic, dashed border style

### Championship

- Matchup card gets a `2px solid #E31C79` border
- Below it: a "Champion" callout box with magenta dashed border and pink background (`#fdf2f8`)

## Error States

- **Loading:** Show 4 skeleton matchup columns with 2-3 placeholder cards each, using Tailwind `animate-pulse`
- **Bracket not found (404):** Centered message using the existing `Alert` component from `libs/ui`
- **Network error:** Error alert with retry suggestion

## Route Registration

Add to React Router config in `apps/web/src/app/app.tsx`:

```
/brackets/:bracketId → ViewBracketPage (public, no auth required)
```

## Testing Strategy

- **Unit tests:** `deriveBracketMatchups` utility — full bracket, partial picks, empty picks, edge cases
- **Component tests:** `MatchupCard` renders winner/loser/TBD states correctly
- **Integration:** `ViewBracketPage` fetches and renders a bracket (mock API response)

## Seed Script

`tools/scripts/seed-bracket.ts` — a new script (to be created) that creates a test bracket document (`test-bracket-1`) in Firestore with 64 sample teams and a mix of completed and incomplete picks for visual testing. Follows the pattern of the existing `tools/scripts/seed-admin.ts`.
