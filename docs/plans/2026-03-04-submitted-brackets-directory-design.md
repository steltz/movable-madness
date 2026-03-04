# Submitted Brackets Directory Screen — Design

## Overview

A public-facing "Submitted Brackets" directory screen that lists all participants in the Movable Madness bracket challenge. Displays bracket names and submission status in a branded, real-time-updating table.

## Firestore Data Model

New top-level collection: `brackets`

```
/brackets/{bracketId}
  bracketName: string              // User-chosen display name (e.g., "Nick's Picks")
  userId: string                   // Firebase Auth UID
  status: "in_progress" | "submitted"
  createdAt: Timestamp
  updatedAt: Timestamp
```

- `bracketId` is an auto-generated Firestore document ID
- Other agents/screens create and update documents in this collection
- This screen only reads `bracketName` and `status`

## Approach

**Firestore real-time listener + shadcn/ui Table.** The frontend uses `onSnapshot` directly (allowed per CLAUDE.md for real-time listeners). No NestJS API endpoint needed for this read path.

## Frontend Architecture

### File Structure

```
apps/web/src/
├── features/
│   └── brackets/
│       ├── ui/
│       │   └── submitted-brackets-table.tsx   // Table component
│       ├── api/
│       │   └── use-brackets-listener.ts       // Firestore onSnapshot hook
│       └── model/
│           └── bracket.types.ts               // TypeScript types
├── pages/
│   └── brackets/
│       └── submitted-brackets-page.tsx        // Route page
```

### Components

**`useBracketsListener()` hook** — Wraps Firestore `onSnapshot` on the `brackets` collection, ordered by `createdAt` desc. Returns `{ brackets, loading, error }`. Cleans up the listener on unmount.

**`SubmittedBracketsTable`** — Presentational component. Two columns:
1. **Bracket Name** — plain text
2. **Submission Status** — Badge component ("Picks Submitted" green, "In Progress" muted)

**`SubmittedBracketsPage`** — Page wrapper with heading, loading skeleton, error state, empty state, and the table.

### New Shared Infrastructure

**Firestore initialization** — Add `getFirebaseFirestore()` to `apps/web/src/shared/config/firebase.ts` (alongside existing `getFirebaseAuth()`). Uses `getFirestore()` from `firebase/firestore`.

**shadcn/ui Table component** — Add to `libs/ui` via shadcn CLI. Exports: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`.

**shadcn/ui Skeleton component** — Add to `libs/ui` for loading states.

### Routing

Add `/brackets` route in `apps/web/src/app/app.tsx`. Public — no auth guard.

## Styling

- **Font:** Inter (ensure configured in Tailwind/CSS)
- **Table container:** `rounded-lg shadow-md overflow-hidden` with `border-t-4 border-t-[#E31C79]` (Movable Ink Brand Magenta)
- **Sticky header:** `sticky top-0 bg-background z-10` on `<thead>`
- **Alternating rows:** Even rows get `bg-muted/50`
- **Status badges:** "Picks Submitted" = green-tinted badge, "In Progress" = secondary/muted badge
- **Responsive:** `overflow-x-auto` wrapper for horizontal scroll on small screens
- **Page background:** Clean white/background with centered max-width container

## States

| State   | Behavior                                              |
|---------|-------------------------------------------------------|
| Loading | 4 skeleton rows with pulse animation                  |
| Empty   | Friendly message: "No brackets submitted yet"         |
| Error   | Error alert using existing Alert component            |
| Data    | Real-time table with alternating rows                 |

## Decisions

- **No pagination** — Demo app, unlikely to exceed ~100 entries. If needed later, add `limit()` to the Firestore query.
- **No search/filter** — Two-column table is scannable enough for a demo.
- **No sorting UI** — Default sort by `createdAt` desc (newest first).
- **Public access** — No auth required to view the directory.
