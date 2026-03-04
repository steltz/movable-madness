# Login & Dashboard Screens Design

## Overview

Build the Login screen and Dashboard screen for "Movable Madness" — a 64-team bracket demo app for Movable Ink. Users authenticate anonymously with a bracket name, then land on a dashboard with navigation to bracket editing and viewing.

## Decisions

- **Auth approach:** Parallel paths — anonymous auth for bracket users, existing email/password for admin
- **Data writes:** All Firestore writes go through the NestJS API (per project guidelines)
- **Data model:** Separate `bracketUsers/{uid}` collection (isolated from admin `/users/{uid}`)
- **Routes:** Login at `/` (root), Dashboard at `/dashboard`
- **Architecture:** Extend existing AuthProvider (single auth source of truth)
- **Navigation buttons:** Link to real routes (`/bracket/edit`, `/brackets`) — other agents build those pages

## Data Model

New Firestore collection `bracketUsers/{uid}`:

```typescript
interface BracketUserDocument {
  uid: string;
  bracketName: string;
  createdAt: Timestamp;
}
```

Separate from existing `/users/{uid}` used for admin accounts.

## Auth Flow

1. User enters bracket name on `/` (Login screen)
2. Frontend calls `signInAnonymously()` from Firebase Auth SDK
3. Firebase returns an anonymous user with a `uid`
4. Frontend calls `POST /api/bracket-users` with `{ bracketName }` (auth token in header)
5. API verifies the Firebase token, creates a `bracketUsers/{uid}` document in Firestore
6. AuthProvider detects the anonymous auth state change, fetches the bracket user profile
7. Frontend redirects to `/dashboard`

Returning users: If the browser already has an anonymous session, `onAuthStateChanged` fires immediately. The provider fetches their existing bracket profile and redirects to dashboard.

## AuthProvider Changes

Extend `AuthContextValue`:

```typescript
interface AuthContextValue {
  user: AuthUser | null;                    // existing admin user
  firebaseUser: User | null;               // existing firebase user
  bracketUser: BracketUserDocument | null;  // NEW
  loading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;                     // NEW
}
```

The `onAuthStateChanged` handler checks `firebaseUser.isAnonymous`. If anonymous, it fetches the bracket profile from the API (`GET /api/bracket-users/me`) instead of extracting roles from token claims.

## API Endpoints (NestJS)

New `BracketUsersController` with two endpoints:

- **`POST /api/bracket-users`** — Create bracket user profile. Body: `{ bracketName: string }`. Requires valid Firebase auth token. Creates `bracketUsers/{uid}` document.
- **`GET /api/bracket-users/me`** — Get current bracket user profile. Returns the `bracketUsers/{uid}` document for the authenticated user.

Both endpoints accept anonymous Firebase tokens (no role-based guards).

## Frontend Components

### New files
- `pages/login/login-page.tsx` — Bracket login screen (root `/` route)
- `pages/dashboard/dashboard-page.tsx` — Dashboard with greeting + nav cards
- `features/bracket-auth/api/bracket-auth.ts` — `signInAnonymously()` wrapper
- `features/bracket-auth/api/bracket-users-api.ts` — API client for bracket user CRUD

### Modified files
- `app/app.tsx` — Update routes: `/` -> LoginPage, `/dashboard` -> DashboardPage
- `app/providers/auth-provider.tsx` — Add `bracketUser` and `isAnonymous` to context

## Styling

- **Font:** Inter (Google Fonts)
- **Primary button:** Brand Magenta `#E31C79`, hover darkens to ~`#C91869`
- **Background:** Light gray (`bg-gray-50`)
- **Cards:** White, `shadow-md`, Brand Magenta top border (`border-t-4`)
- **Warning text:** Small muted text below login form about same-browser requirement

Brand Magenta added as a custom Tailwind color. Inter font loaded in HTML head.

## Routes

```
/              -> LoginPage (public, redirects to /dashboard if authenticated)
/dashboard     -> DashboardPage (protected, requires auth)
/bracket/edit  -> placeholder (built by another agent)
/brackets      -> placeholder (built by another agent)
/sign-in       -> existing admin sign-in (unchanged)
/admin/*       -> existing admin pages (unchanged)
```
