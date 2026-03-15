# Bracket Editor Screen — Design Spec

## Overview

Interactive bracket editor screen for the "Movable Madness" 64-team tournament demo app. Users view a pre-populated bracket of 64 NCAA-style teams, click teams to advance them through 6 rounds, and submit their completed bracket. This screen is built in isolation — other agents handle authentication, entry flow, and the API layer.

## Constraints

- Uses shadcn/ui + Tailwind CSS + Radix UI (per project design system)
- All data writes go through the NestJS API (`POST /api/brackets`), not the Firebase Web SDK
- Assumes an anonymous Firebase Auth session already exists (established by another agent's login screen)
- Bracket name arrives via URL query param: `/bracket/edit?name=My%20Bracket`
- No `ProtectedRoute` wrapper needed — this is a public-facing route for anonymous users

## Data Model

### Team

```ts
interface Team {
  id: number;       // 1-64, unique identifier
  name: string;     // e.g. "Duke"
  seed: number;     // 1-16
  region: string;   // "East" | "West" | "South" | "Midwest"
}
```

### Bracket Picks

```ts
// Key = matchup identifier (e.g. "R1_M1" for Round 1, Matchup 1)
// Value = team ID of the selected winner, or null if not yet picked
type BracketPicks = Record<string, number | null>;
```

A 64-team single-elimination bracket has 63 total matchups:
- Round 1: 32 matchups (64 → 32 teams)
- Round 2: 16 matchups (32 → 16)
- Sweet 16: 8 matchups (16 → 8)
- Elite 8: 4 matchups (8 → 4)
- Final Four: 2 matchups (4 → 2)
- Championship: 1 matchup (2 → 1)

### Submission Payload

```ts
interface BracketSubmission {
  bracketName: string;
  picks: BracketPicks; // all 63 matchup selections
}
```

Sent to `POST /api/brackets` with the user's Firebase ID token in the `Authorization` header. The API associates the submission with the authenticated user's `uid`.

### API Contract

```
POST /api/brackets
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
Body: { bracketName: string, picks: Record<string, number | null> }
Response: ApiResponse<{ bracketId: string }>
```

## Teams Data

Hardcoded array of 64 NCAA-style teams organized into 4 regions (East, West, South, Midwest), each with 16 seeded teams (seeds 1-16). First-round matchups follow standard seeding: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15.

Stored in `features/bracket/model/teams.ts` as a constant array.

## Bracket Logic (`useBracket` hook)

### State

- `picks: BracketPicks` — all 63 matchup slots, initialized to `null`

### Core Operations

- **`selectWinner(matchupId, teamId)`** — sets the pick for that matchup. Triggers cascade clearing of any downstream picks that depended on a changed team.
- **`getMatchupTeams(matchupId)`** — for Round 1, returns the two hardcoded teams. For rounds 2+, derives the two teams from the winners of the two feeder matchups. Returns `null` for a slot if the feeder pick hasn't been made yet.
- **`isComplete`** — computed boolean, `true` when all 63 picks are non-null.
- **`submitBracket()`** — calls `POST /api/brackets` with the bracket name and picks. Disabled unless `isComplete` is true.

### Cascade Rule

When a user changes a pick in an earlier round, any downstream picks that included the previously-selected team are cleared to `null`. This forces the user to re-pick from that point forward, preventing invalid bracket states.

### Advancement Enforcement

Later-round matchup slots are derived from earlier picks. If a feeder pick is `null`, the corresponding slot in the next round shows as empty/locked. A team cannot appear in a round it hasn't been advanced to — this is enforced structurally, not by validation.

## Component Architecture

### Component Tree

```
<BracketEditorPage>
  ├── header (bracket name display)
  ├── <BracketGrid>                    — horizontally scrollable flex container
  │   ├── <BracketRound round={1}>     — vertical column of matchups
  │   │   └── <Matchup>               — two TeamSlots stacked
  │   │       ├── <TeamSlot>           — clickable team row
  │   │       └── <TeamSlot>
  │   ├── <BracketRound round={2}>
  │   ├── ... (through round 6)
  │   └── Championship
  └── <SubmitFooter>                   — sticky bottom bar
```

### Components

**`BracketEditorPage`** (`features/bracket/ui/bracket-editor-page.tsx`)
- Page-level component, route target for `/bracket/edit`
- Reads `bracketName` from URL query param
- Owns the `useBracket` hook instance
- Renders header, `BracketGrid`, and `SubmitFooter`

**`BracketGrid`** (`features/bracket/ui/bracket-grid.tsx`)
- Horizontally scrollable flex container holding all 6 rounds
- Uses `overflow-x: auto` for scrolling on smaller screens
- Each round is a flex column, vertically centered against feeder matchups

**`BracketRound`** (`features/bracket/ui/bracket-round.tsx`)
- Vertical column of `Matchup` components for one round
- Round label header (e.g. "Round 1", "Sweet 16", "Final Four")
- Matchups are spaced to visually align with their feeders from the previous round

**`Matchup`** (`features/bracket/ui/matchup.tsx`)
- Contains two `TeamSlot` components stacked vertically
- Visual separator between the two teams
- Connector line styling to link to next round

**`TeamSlot`** (`features/bracket/ui/team-slot.tsx`)
- Single clickable row showing seed number and team name
- Four visual states:
  - **Default** — dark background, light text
  - **Hover** — subtle border highlight, pointer cursor
  - **Selected/Advancing** — Movable Ink Magenta (#E31C79) border + soft background tint (`rgba(227, 28, 121, 0.12)`)
  - **Empty/Locked** — dashed border, muted text "TBD", not clickable
- Click handler calls `selectWinner` from the hook

**`SubmitFooter`** (`features/bracket/ui/submit-footer.tsx`)
- Sticky to viewport bottom (`position: sticky; bottom: 0`)
- Solid #E31C79 background
- Shows progress: "X of 63 picks made"
- Submit button, disabled until `isComplete` is true
- On submit, calls `submitBracket()` from the hook

## File Structure

### New Files

```
apps/web/src/features/bracket/
├── index.ts                          # Public exports
├── ui/
│   ├── bracket-editor-page.tsx       # Page component
│   ├── bracket-grid.tsx              # Scrollable container
│   ├── bracket-round.tsx             # Round column
│   ├── matchup.tsx                   # Two team slots
│   ├── team-slot.tsx                 # Clickable team row
│   └── submit-footer.tsx             # Sticky footer
├── model/
│   ├── use-bracket.ts                # Bracket state & logic hook
│   └── teams.ts                      # Hardcoded 64-team array
└── api/
    └── bracket-api.ts                # POST /api/brackets call
```

### Modified Files

- `apps/web/src/app/app.tsx` — add route `/bracket/edit` pointing to `BracketEditorPage`
- `libs/shared-types/src/lib/bracket.ts` — new file with `Team`, `BracketPicks`, `BracketSubmission` types (following the existing per-file pattern)
- `libs/shared-types/src/index.ts` — re-export bracket types

## Visual Design

- Clean, tech-forward aesthetic with modern sans-serif typography (system font stack via Tailwind)
- Dark theme following existing CSS variable system
- Movable Ink Brand Magenta (#E31C79) as the accent color for selections and the submit footer
- Horizontal bracket layout flowing left-to-right, traditional March Madness style
- Rounds get progressively fewer matchups, with vertical spacing increasing to maintain alignment

## Interaction Design

- Click a team to advance it — immediate visual feedback with magenta highlight
- Hover effects on all clickable team slots
- Changing an earlier pick cascades and clears dependent later picks
- Empty/locked slots in later rounds are visually distinct and not interactive
- Progress counter in the footer updates in real-time
- Submit button enables only when all 63 picks are made

## Error Handling

- **Failed submission** — if the `POST /api/brackets` call fails, show a simple inline error message above the submit button (e.g. "Failed to submit bracket. Please try again."). No retry logic.
- **Missing `name` query param** — if the `name` param is absent from the URL, redirect to `/` (the entry screen handled by another agent)
