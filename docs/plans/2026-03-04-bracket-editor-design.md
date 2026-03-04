# Bracket Editor Screen Design

## Overview

Interactive 64-team tournament bracket editor for the Movable Madness app. Users view a pre-populated bracket, click teams to advance them round-by-round, and submit their completed picks to Firestore via the NestJS API.

## Architecture

### Component Tree

```
BracketEditorPage          — route at /bracket/:userId, reads params
├── BracketGrid            — CSS grid container, owns bracket state, horizontal scroll
│   ├── BracketRound[]     — one column per round (6 rounds per half)
│   │   └── Matchup[]      — pair of TeamSlot components for one game
│   │       └── TeamSlot   — clickable team card (seed, name, selected state)
│   └── ConnectorLines     — CSS pseudo-elements for bracket lines
└── SubmitFooter           — sticky bottom bar with progress + submit button
```

### File Structure

```
apps/web/src/features/bracket/
├── pages/
│   └── BracketEditorPage.tsx
├── components/
│   ├── BracketGrid.tsx
│   ├── BracketRound.tsx
│   ├── Matchup.tsx
│   ├── TeamSlot.tsx
│   └── SubmitFooter.tsx
├── data/
│   └── teams.ts              — hardcoded 64-team array
├── lib/
│   └── bracket-utils.ts      — matchup ID generation, advancement logic, cascade reset
└── types/
    └── bracket.ts            — local type definitions

apps/api/src/brackets/
├── brackets.module.ts
├── brackets.controller.ts    — POST /api/v1/brackets
├── brackets.service.ts       — validation + Firestore write
└── dto/
    └── create-bracket.dto.ts

libs/shared-types/src/lib/
└── bracket.ts                — shared BracketEntry, Team interfaces
```

## Data Model

### Team

```typescript
interface Team {
  id: string;       // "team-1" through "team-64"
  name: string;     // Placeholder name, e.g., "Blue Hawks"
  seed: number;     // 1-16
  region: string;   // "East" | "West" | "South" | "Midwest"
}
```

Hardcoded array of 64 teams. Array order determines Round 1 matchups: index 0 vs 1, 2 vs 3, etc.

### Picks State

```typescript
type Picks = Record<string, string>;
// Key: matchup ID in format "R{round}-M{matchup}" (e.g., "R1-M1")
// Value: winning team ID (e.g., "team-5")
```

63 total picks required (32 + 16 + 8 + 4 + 2 + 1).

### Firestore Document (collection: `brackets`)

```typescript
interface BracketEntry {
  userId: string;
  bracketName: string;
  picks: Record<string, string>;
  submittedAt: Timestamp;
}
```

## Bracket Logic

### Matchup ID Scheme

- Round 1: R1-M1 through R1-M32 (32 matchups)
- Round 2: R2-M1 through R2-M16 (16 matchups)
- Round 3: R3-M1 through R3-M8 (Sweet 16)
- Round 4: R4-M1 through R4-M4 (Elite 8)
- Round 5: R5-M1 and R5-M2 (Final Four)
- Round 6: R6-M1 (Championship)

### Advancement Rules

1. Round 1 matchups are always clickable (pre-populated from teams array).
2. Round N matchup M is populated when both feeder matchups from Round N-1 have winners: feeder matchups are R(N-1)-M(2M-1) and R(N-1)-M(2M).
3. Clicking a team sets it as the winner for that matchup.
4. Cascade reset: Changing a pick in Round N clears all downstream picks that involved the previously selected winner.

## Visual Design

### Layout

- Left-to-right horizontal bracket with champion in the center
- CSS Grid: each round is a column, team slots positioned with grid row spans
- Horizontal scrolling for overflow on narrow viewports
- Left half: 4 regions feeding toward center. Right half: mirrored.

### Color Palette

| Element | Color |
|---------|-------|
| Background | #0F0F0F (dark) |
| Card default | #1A1A1A |
| Card hover | #252525 |
| Selected/winner border | #E31C79 (Movable Ink Magenta) |
| Connector lines | #333333 |
| Text primary | #FFFFFF |
| Text secondary | #999999 |
| Submit footer bg | #E31C79 |
| Disabled state | 40% opacity |

### Team Slot

- ~180px wide, ~36px tall
- Shows seed number (dimmed) + team name
- Hover: lighter background, pointer cursor
- Selected: left border or soft tint in #E31C79
- Disabled: grayed, no pointer events

### Submit Footer

- Sticky to viewport bottom
- Solid #E31C79 background, white text
- Left: "{n}/63 picks made" progress indicator
- Right: "Submit Bracket" button
- Button disabled (reduced opacity) until 63/63 picks complete

### Typography

- Sans-serif (Inter/system default from Tailwind)
- Team names: 13-14px, medium weight
- Seed numbers: 12px, dimmed
- Round headers: 14px, uppercase, letter-spaced

## API Endpoint

### POST /api/v1/brackets

**Request:**
```json
{
  "userId": "abc123",
  "bracketName": "My Bracket",
  "picks": { "R1-M1": "team-5", "R1-M2": "team-12", "..." : "..." }
}
```

**Response:** `201 Created`
```json
{
  "id": "doc-id",
  "userId": "abc123",
  "bracketName": "My Bracket",
  "picks": { "..." : "..." },
  "submittedAt": "2026-03-04T..."
}
```

### Server-side Validation

- All 63 picks present
- Each pick references a valid team ID
- Pick consistency: a team in Round N must have won in Round N-1

### Error Handling

- Submit button shows loading spinner during API call
- Success: navigate to confirmation route or show inline success
- Failure: show error using shadcn Alert component
- Network errors: "Failed to submit bracket. Please try again."

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout orientation | Left-to-right horizontal | Classic March Madness style |
| Mobile handling | Horizontal scroll | Simplest, maintains bracket visual integrity |
| Data input | Props/route params | Component receives userId from URL, bracketName from route state |
| Layout approach | CSS Grid | Best balance of precision, maintainability, shadcn compatibility |
| Data model | Flat picks map | Simple to read/write, easy to validate |
| Validation | Require all 63 picks | Submit disabled until complete, with progress indicator |
| API scope | Full endpoint included | End-to-end functionality |
| Cascade behavior | Auto-clear downstream | Changing early pick clears dependent later picks |
