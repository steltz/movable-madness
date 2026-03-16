# Quick Pick — Randomize All Bracket Selections

## Overview

Add a "Quick Pick" button to the bracket editor header that randomizes all 63 matchup selections with a single click. Uses pure 50/50 coin-flip randomization. Confirms before replacing existing picks.

## UI Placement

- **Location**: Right side of the existing `<header>` element in `bracket-editor-page.tsx`
- **Layout change**: Header becomes a flex row — bracket name/subtitle on the left, Quick Pick button on the right
- **Button style**: shadcn `Button` with `variant="outline"`, label "🎲 Quick Pick" (emoji is decorative; use `aria-label="Quick Pick"` so screen readers skip the emoji)
- **Visibility**: Always visible while editing (hidden after submission, since the editor shows a success screen)

## Behavior

1. User clicks Quick Pick
2. If `picksCount > 0`: show an `AlertDialog` — "This will replace all your current picks. Continue?" with Cancel / Quick Pick actions
3. If `picksCount === 0`: skip confirmation, proceed immediately
4. All 63 picks are replaced instantly (no animation)
5. The bracket grid reflects the new picks; the footer counter updates to "63 of 63 picks made"

## Randomization Algorithm

A new pure function `generateRandomPicks()` in `bracket-utils.ts`:

1. Create an empty `BracketPicks` object
2. **Round 1** (32 matchups): For each matchup index 0–31, call `getFirstRoundTeams(matchIndex)` to get the two teams, randomly select one team's ID (50/50), store as `picks[R1_M{i}]`
3. **Rounds 2–6**: For each matchup, look up the two feeder matchup IDs via `getFeederMatchupIds(round, matchIndex)`, retrieve the winners from the picks object (which were just set in the previous round), randomly select one (50/50), store as `picks[R{round}_M{i}]`
4. Return the complete `BracketPicks` with all 63 entries populated

The function is pure (no side effects), takes no arguments (teams are hardcoded in `teams.ts`), and returns a `BracketPicks` object. It does not use `selectWinner` — there is no need for cascade logic since all picks are built from scratch.

## State Integration

In `use-bracket.ts`:

- Add a `quickPick()` function that calls `setPicks(generateRandomPicks())`
- Add `quickPick: () => void` to the `UseBracketReturn` interface
- Expose `quickPick` from the hook's return value alongside `selectWinner`, `submitBracket`, etc.

## Confirmation Dialog

Uses shadcn `AlertDialog` components (from `@movable-madness/ui` — must be added as a new component, see Files Changed):

- A single Quick Pick button is always rendered. Its `onClick` handler checks `picksCount`:
  - If `picksCount === 0`: calls `quickPick()` directly
  - If `picksCount > 0`: opens the `AlertDialog` programmatically (via state, e.g., `const [showConfirm, setShowConfirm] = useState(false)`)
- Dialog content: title "Replace all picks?", description "This will replace all your current picks with random selections."
- Actions: "Cancel" (closes dialog) and "Quick Pick" (calls `quickPick()` and closes)
- This avoids swapping between two different component trees for the same button

## Files Changed

| File | Change |
|------|--------|
| `libs/ui/src/components/alert-dialog.tsx` | Add shadcn AlertDialog component (new file) |
| `libs/ui/src/index.ts` | Export AlertDialog components |
| `apps/web/src/features/bracket/model/bracket-utils.ts` | Add `generateRandomPicks()` function |
| `apps/web/src/features/bracket/model/bracket-utils.test.ts` | Add tests for `generateRandomPicks()` |
| `apps/web/src/features/bracket/model/use-bracket.ts` | Add `quickPick()` to hook and `UseBracketReturn` interface |
| `apps/web/src/features/bracket/ui/bracket-editor-page.tsx` | Add Quick Pick button + AlertDialog to header |

## Testing

- `generateRandomPicks()` returns a `BracketPicks` with all 63 entries non-null
- Every pick is a valid team ID (exists in the TEAMS array)
- Round 2+ picks are consistent — each pick equals one of the two team IDs selected as winners in the two feeder matchups from the previous round
- Multiple calls produce different results (randomness check — run N times, verify not all identical)
