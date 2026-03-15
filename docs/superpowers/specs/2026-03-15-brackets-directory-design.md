# Submitted Brackets Directory — Design Spec

## Overview

A public-facing directory screen at `/brackets` that lists all participants in the Movable Madness bracket challenge. Displays bracket names and submission status in a branded table with real-time updates from Firestore.

## Data Model

### Firestore Structure

```
users/{uid}/brackets/{bracketId}
```

### BracketEntry Interface

```typescript
interface BracketEntry {
  bracketName: string;
  status: 'in_progress' | 'submitted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

The `bracketName` field serves as the participant's display identity in the directory. Users choose this name when creating their bracket entry — it is the only identifying information shown in the table. No separate user lookup is needed.

Location: `libs/shared-types/src/lib/bracket.ts`

### Firestore Index

Collection group index required for querying all brackets across users:

- Collection group: `brackets`
- Fields: `createdAt` DESC

Create `firestore.indexes.json` if it does not exist.

### Firestore Rules

Add to the existing `firestore.rules` file as a new top-level match block:

```
match /{path=**}/brackets/{bracketId} {
  allow read: if true;  // Public directory
}
```

Write rules are out of scope — handled by the agent building the bracket entry screen.

## Data Fetching

Real-time Firestore `collectionGroup("brackets")` listener using `onSnapshot`. This is allowed per project rules (CLAUDE.md exception for real-time listeners).

The existing Firebase config at `apps/web/src/shared/config/firebase.ts` only initializes `firebase/auth`. The `useBrackets` hook requires a Firestore instance, so `getFirestore()` must be added to the Firebase config and exported.

### useBrackets Hook

```typescript
function useBrackets(): {
  entries: BracketEntry[];
  loading: boolean;
  error: string | null;
}
```

- Sets up `onSnapshot` listener on mount, cleans up on unmount
- Fetches all bracket documents across all users (no `.where()` filter — both `in_progress` and `submitted` statuses are displayed)
- Query ordered by `createdAt` descending (newest first)
- Returns loading state while listener initializes
- Returns error string if listener fails

## Visual Design

### Style: Bold & Branded

- **Header bar**: Magenta gradient (`#E31C79` to `#c4156a`), white title text "Submitted Brackets", participant count in muted white
- **Top border**: 4px solid `#E31C79`
- **Container**: Rounded corners (12px), drop shadow (`0 4px 6px rgba(0,0,0,0.07)`)
- **Column headers**: Uppercase, small font, pink background (`#fdf2f8`), dark pink text (`#831843`), 2px pink bottom border
- **Alternating rows**: White / pink-tinted (`#fdf2f8`)
- **Bracket name column**: Semi-bold text, dark color
- **Status column**: Icon + text, no pill badge
  - Submitted: Green checkmark + "Picks Submitted" (`#166534`)
  - In Progress: Open circle + "In Progress" (`#92400e`)
- **Font**: Inter (system-ui fallback), 14px body, consistent with app design system

### Dark Mode

- Magenta gradient header: unchanged (brand element)
- Alternating rows: `zinc-900` (`#18181b`) / `zinc-800` (`#27272a`)
- Text: `zinc-100` (`#f4f4f5`) for readability
- Status colors:
  - Submitted: `emerald-400` (`#34d399`) text on dark background
  - In Progress: `amber-400` (`#fbbf24`) text on dark background
- Column headers: `zinc-800` background, `pink-300` (`#f9a8d4`) text
- Drop shadow: increased opacity for visibility on dark backgrounds

### Responsive

- Table is full-width within a max-width container
- On small screens: horizontal scroll on the table container
- Sticky header row for scrollable lists

## Component Architecture

### File Structure

```
libs/shared-types/src/lib/bracket.ts          — BracketEntry interface + type exports
libs/ui/src/components/table.tsx               — Reusable Table/TableHeader/TableBody/TableRow/TableCell components
apps/web/src/app/pages/brackets/
  ├── brackets-directory-page.tsx              — Page component, route target
  ├── brackets-table.tsx                       — Branded presentational table
  └── use-brackets.ts                          — Firestore collectionGroup listener hook
```

### Component Responsibilities

**Table (libs/ui)**: Generic, unstyled table primitives following shadcn patterns (forwardRef, cn utility, Tailwind classes). Reusable across the app.

**BracketsTable**: Receives `entries: BracketEntry[]` as props. Applies all branded styling — magenta header, alternating rows, status formatting. Pure presentational, no data fetching.

**BracketsDirectoryPage**: Wires `useBrackets()` hook to `BracketsTable`. Handles loading, empty, and error states. Registered at `/brackets` route.

**useBrackets**: Encapsulates Firestore `collectionGroup` listener setup/teardown. Returns `{ entries, loading, error }`.

## UI States

### Loading

Skeleton rows matching the table layout:
- Magenta gradient header renders immediately
- Column headers render immediately
- Body rows show pulsing placeholder bars in both columns: bracket name (wider bar, ~60% width) and status (narrower bar, ~30% width)
- Alternating row colors applied to skeleton rows (same white/pink pattern)
- 5 skeleton rows displayed

### Empty

- Magenta header and column headers visible
- Single centered row spanning both columns: "No brackets yet — be the first to enter!"
- Keeps branded container intact so page doesn't look broken

### Error

- `Alert` component from `libs/ui` rendered above the table container
- Destructive variant: "Unable to load brackets. Please try again later."
- Table not rendered when in error state

## Routing

- Path: `/brackets`
- Public route (no authentication required)
- Added to `apps/web/src/app/app.tsx` alongside existing routes

## Dependencies

### New

- None — uses existing Firebase Web SDK, Tailwind, and libs/ui infrastructure

### Existing (already in project)

- `firebase` (Web SDK for `onSnapshot`)
- `tailwindcss`
- `lucide-react` (for status icons)
- `libs/ui` components (`Alert`, new `Table`)
- `libs/shared-types` (for `BracketEntry` type)

## Out of Scope

- Bracket write operations (entry screen — another agent)
- Authentication flow (another agent)
- Pagination (demo app, ~64 entries max)
- Search/filter functionality
- Sorting controls
- Click-through to view individual bracket picks
