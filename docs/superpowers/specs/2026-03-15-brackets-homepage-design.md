# Brackets Homepage Design

## Overview

Make the root route (`/`) the main entry point for the brackets experience. The homepage conditionally renders based on auth state: unauthenticated visitors see the bracket login form, authenticated bracket players see the dashboard. The old `/brackets/login` and `/brackets/dashboard` routes redirect to `/`.

## Architecture

### Unified Homepage Component

A single `HomePage` component at `pages/home/home-page.tsx` replaces the current dev-style homepage. It checks auth state via `useAuthContext` and renders:

- **Loading** — spinner/loading text while auth initializes
- **Unauthenticated or non-anonymous authenticated (admin)** — bracket login form (name entry + "Join Tournament" button + browser warning). Admins who visit `/` see the same login form as unauthenticated users — the homepage is exclusively for the bracket player flow. Admin functionality remains at `/admin`.
- **Authenticated bracket player (anonymous auth)** — dashboard with welcome message, "Edit My Bracket" card, "View Submitted Brackets" card, sign out button in header

Both views share the Movable Madness branding and pink/white design language from the existing pages.

### Login Form Logic

Consolidated from `BracketLoginPage`:
- User enters bracket name (max 50 chars, trimmed)
- On submit: `signInAnonymously()` → `POST /brackets/join` → re-render as dashboard
- Shows validation errors inline
- Browser session warning displayed below the form
- **Race condition guard:** A `submitting` state flag must prevent premature re-render to the dashboard view during the join flow. When `submitting` is true, the component stays on the login form even if `isAuthenticated` flips to true (because `signInAnonymously()` fires `onAuthStateChanged` before the `POST /brackets/join` API call completes). Without this guard, the user would see the dashboard before their bracket name is saved.

### Dashboard Logic

Consolidated from `BracketDashboardPage`:
- Header with Movable Madness branding and Sign Out button
- Welcome message with bracket name
- Two action cards linking to `/brackets/edit` and `/brackets`
- Sign out calls `signOut()` which clears Firebase auth state. The auth provider's `onAuthStateChanged` listener resets all auth context values (including `bracketName`) to their defaults, causing the homepage to re-render as the login form. No explicit navigation is needed.

## Routing Changes

| Route | Before | After |
|---|---|---|
| `/` | Dev homepage (API health check) | Unified brackets homepage |
| `/brackets/login` | Login form | `<Navigate to="/" replace />` |
| `/brackets/dashboard` | Dashboard (protected) | `<Navigate to="/" replace />` |
| `/sign-in` | Admin sign-in | No change |
| `/admin` | Admin dashboard | No change |
| `/admin/settings` | Account settings | No change |
| `/brackets/edit` | Bracket editor (protected) | No change |
| `/brackets` | Directory | No change |
| `/brackets/:bracketId` | View bracket | No change |

### Internal Navigation Updates

All references to `/brackets/login` and `/brackets/dashboard` must be updated to `/`:

| File | Line | Change |
|---|---|---|
| `apps/web/src/app/app.tsx` | `BracketProtectedRoute` | Redirect target: `/brackets/login` → `/` |
| `apps/web/src/app/app.tsx` | Route definitions | Remove old `/brackets/login` and `/brackets/dashboard` routes, add redirects |
| `apps/web/src/features/bracket/ui/bracket-editor-page.tsx` | Line 11 | `<Navigate to="/brackets/dashboard" replace />` → `<Navigate to="/" replace />` |

## Files Changed

| File | Action |
|---|---|
| `apps/web/src/pages/home/home-page.tsx` | Create — new unified homepage |
| `apps/web/src/app/app.tsx` | Modify — update routes, add redirects, remove old inline `HomePage`, update `BracketProtectedRoute` redirect |
| `apps/web/src/features/bracket/ui/bracket-editor-page.tsx` | Modify — update redirect from `/brackets/dashboard` to `/` |
| `apps/web/src/pages/bracket/login/bracket-login-page.tsx` | Delete — logic moves to homepage |
| `apps/web/src/pages/bracket/login/bracket-login-page.spec.tsx` | Delete — test coverage moves to homepage tests |
| `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx` | Delete — logic moves to homepage |
| `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.spec.tsx` | Delete — test coverage moves to homepage tests |

No barrel/index files exist in the login or dashboard directories. The directories can be removed entirely.

## Edge Cases

- **Admin visits `/`**: Sees the bracket login form. Admin flow is entirely separate at `/sign-in` → `/admin`.
- **Admin hits `/brackets/edit`**: `BracketProtectedRoute` checks `!isAnonymous` and redirects to `/`. This is correct — admins shouldn't access bracket-player-only pages.
- **User refreshes during join flow**: The `submitting` flag is component state, so a refresh resets it. If Firebase auth succeeded but the API call didn't complete, the user lands on the dashboard without a bracket name and can try again from the editor.

## What Stays the Same

- Admin flow (`/sign-in` → `/admin`) — unchanged
- `BracketProtectedRoute` guard — still protects `/brackets/edit`, redirect target updated to `/`
- `ProtectedRoute` guard — unchanged
- Brackets directory and view pages — unchanged
- Design language (pink accent `#E31C79`, white cards, shadows) — carried over
- Auth context and Firebase anonymous auth — unchanged
- `signOut()` function — unchanged, already resets auth context via `onAuthStateChanged`

## Out of Scope

- Admin flow changes
- New features or UI additions
- Bracket editor or directory changes
- API changes
