# Load Submitted Bracket on Edit Page

## Problem

After submitting a bracket, navigating back to `/brackets/edit` shows a blank bracket. The user's submitted picks are lost from the editing UI.

## Goal

When a user visits `/brackets/edit` and has already submitted a bracket, pre-populate the editor with their submitted picks. Allow them to modify and re-submit.

## Design

### API: New Endpoint — `GET /brackets/mine`

- Auth-guarded via `AuthGuard`
- Queries `brackets` collection where `userId == currentUser.uid`
- Returns `ApiResponse<BracketDocument>` (200) or `ApiResponse` with 404 error
- Added to `BracketsController` and `BracketsService`

**Service method:** `findByUserId(uid: string): Promise<BracketDocument | null>`
- Firestore query: `brackets` where `userId == uid`, limit 1

### API: Update Submit — Upsert Semantics

Change `submitBracket` in `BracketsService` to check if the user already has a bracket:
- Use `findByUserId()` to look up existing bracket
- If found: update the existing document's `picks` and `updatedAt` using the existing document ID
- If not found: create a new document (current behavior)
- Return the document ID in both cases

This prevents duplicate bracket documents when re-submitting. One bracket per user is assumed.

### Frontend: New API Function

Add `fetchMyBracket()` to `bracket-api.ts`:
- Calls `GET /brackets/mine`
- Returns `Promise<ApiResponse<BracketDocument>>`

### Frontend: Update `useBracket` Hook

- Add `useEffect` on mount to call `fetchMyBracket()`
- If a bracket exists, convert stored picks and set as initial state
- Add `isLoading: boolean` state (returned from hook) to prevent empty bracket flash
- If the fetch fails (network/auth error), fall back to empty picks and log the error — don't block the user from creating a new bracket
- Handle 404 gracefully: no bracket exists yet, use empty picks
- `isSubmitted` stays `false` when loading existing picks — only set `true` after a new submission triggers navigation

### Frontend: Update `BracketEditorContent`

- Show loading indicator while `isLoading` is true
- No other changes — the editor works the same whether picks came from a fetch or user interaction

## Type Conversion

Firestore stores picks as `Record<string, string>`. The editor uses `BracketPicks = Record<string, number | null>`. Conversion happens in the `useBracket` hook when loading existing picks:
- Parse each string value with `Number(value)`
- If the result is `NaN`, treat as `null`
- Missing keys from `createEmptyPicks()` remain `null`

## Files Changed

1. `apps/api/src/brackets/brackets.controller.ts` — add `GET /brackets/mine`
2. `apps/api/src/brackets/brackets.service.ts` — add `findByUserId()`, update `submitBracket()` to upsert
3. `apps/web/src/features/bracket/api/bracket-api.ts` — add `fetchMyBracket()`
4. `apps/web/src/features/bracket/model/use-bracket.ts` — load existing bracket on mount, add `isLoading`
5. `apps/web/src/features/bracket/ui/bracket-editor-page.tsx` — handle loading state
