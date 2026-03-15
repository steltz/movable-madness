# Bracket Login & Dashboard Design

## Overview

Two new screens for the "Movable Madness" bracket tournament app: a Login screen where users enter a bracket name and join anonymously, and a Dashboard screen that greets them and provides navigation to bracket features. These coexist alongside the existing admin auth system.

## Architecture

**Approach:** Extend the existing `AuthProvider` to handle Firebase Anonymous Authentication alongside the current email/password flow. Bracket data lives in a separate Firestore collection (`bracketEntries`) to avoid touching the admin `/users` collection.

**Key decisions:**
- Data writes go through the NestJS API (per CLAUDE.md)
- Bracket name reads use a Firestore real-time listener (allowed per CLAUDE.md exception)
- Anonymous users are detected via `firebaseUser.isAnonymous`
- Separate `bracketEntries/{uid}` collection with its own Firestore rules

## Data Model

### Firestore Collection: `bracketEntries/{uid}`

```typescript
interface BracketEntryDocument {
  bracketName: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

- Document ID matches the anonymous user's Firebase UID
- One entry per anonymous user
- `bracketName` must be 1-50 characters, trimmed, no leading/trailing whitespace

### Firestore Rules

```
match /bracketEntries/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
}
```

Read-only for authenticated users on their own doc. All writes go through the NestJS API via Firebase Admin SDK (no client-side writes).

## API

### `POST /api/brackets/join`

- **Auth:** Required (Bearer token from anonymous sign-in)
- **Body:** `{ bracketName: string }`
- **Validation:** `bracketName` must be 1-50 characters after trimming; reject empty/whitespace-only
- **Action:** Creates or updates `bracketEntries/{uid}` doc in Firestore via Admin SDK
- **Response:** `{ bracketName: string, createdAt: string, updatedAt?: string }`
- **Status codes:** `201` on creation, `200` on update
- On update, `createdAt` reflects the original creation time; `updatedAt` reflects the current time

### Backend files

```
apps/api/src/brackets/
  brackets.module.ts
  brackets.controller.ts
  brackets.service.ts
```

The `BracketsModule` is registered in the main `AppModule` and imports `AuthModule` for access to `FirebaseAdminService` and `AuthGuard`. The controller has a single `POST /api/brackets/join` endpoint protected by the existing `AuthGuard`. The service uses Firebase Admin SDK to write to Firestore.

## Auth & Roles

### New Role: `bracket_user`

Add `BRACKET_USER: 'bracket_user'` to the `Roles` const in `libs/auth/src/lib/types/roles.ts`. This ensures anonymous bracket users are not assigned the `admin` role.

### `FirebaseAdminService.extractUser()` Changes (Server-side)

The existing `extractUser()` method defaults `role` to `'admin'` when no custom claim is set. Update this fallback:
- If `decodedToken.firebase.sign_in_provider === 'anonymous'`, set role to `'bracket_user'`
- Otherwise keep existing behavior (default to `'admin'` or whatever the claim says)

### `AuthProvider` Role Fallback Changes (Client-side)

The existing `auth-provider.tsx` falls back to `'viewer'` when no role claim exists. This role does not exist in the `Roles` const. Update this fallback:
- If `fbUser.isAnonymous`, set role to `'bracket_user'`
- Otherwise, fall back to `'admin'` (or whatever the claim says)
- Remove the `'viewer'` fallback entirely

### `AuthUser` Type Changes

Make `email` optional on `AuthUser` to accommodate anonymous users who have no email:

```typescript
interface AuthUser {
  uid: string;
  email?: string;
  role: Role;
}
```

### Admin Route Protection

The existing `ProtectedRoute` component checks `isAuthenticated` only. After extending the `AuthProvider`, anonymous bracket users will also be `isAuthenticated`. Update admin routes (`/admin/*`) to use an `AdminProtectedRoute` that checks both `isAuthenticated && !isAnonymous` to prevent anonymous users from accessing admin pages.

### CASL Ability Updates

Add rules for `bracket_user` role in `ability.factory.ts`. Bracket users should have no admin permissions — they can only interact with their own bracket entry via the API.

## Auth Flow

### AuthProvider Changes

Extend `AuthContextValue` with:
- `bracketName: string | null` — loaded from Firestore for anonymous users
- `isAnonymous: boolean` — derived from `firebaseUser.isAnonymous`

When `onAuthStateChanged` fires for an anonymous user:
- Set `isAnonymous: true`
- Set `email` to `undefined` (anonymous users have no email)
- Set `role` to `'bracket_user'`
- Attach a Firestore real-time listener on `bracketEntries/{uid}` to load `bracketName`

When `onAuthStateChanged` fires for a non-anonymous user:
- Existing behavior unchanged
- Set `isAnonymous: false`

### Login Flow

1. User visits `/bracket/login`
2. Enters bracket name, clicks "Join Tournament"
3. Frontend validates: bracket name is 1-50 characters, not empty/whitespace-only
4. Frontend calls `signInAnonymously(auth)` from Firebase SDK
5. On success, frontend calls `POST /api/brackets/join` with Bearer token and `{ bracketName }`
6. API creates `bracketEntries/{uid}` doc
7. Frontend redirects to `/bracket/dashboard`

### Returning Users

- Anonymous user opens the app in the same browser — Firebase restores the session automatically
- `AuthProvider` detects the anonymous user, loads `bracketName` via real-time listener
- If user is on `/bracket/login` and already authenticated as anonymous, redirect to `/bracket/dashboard`

### Sign Out

- Dashboard "Sign Out" link calls Firebase `signOut()` and redirects to `/bracket/login`

## Routing

### New routes in `app.tsx`

| Route | Component | Access |
|---|---|---|
| `/bracket/login` | `BracketLoginPage` | Public (redirects to `/bracket/dashboard` if already authenticated as anonymous) |
| `/bracket/dashboard` | `BracketDashboardPage` | Protected by `BracketProtectedRoute` (redirects to `/bracket/login` if not authenticated or not anonymous) |

### Route Guards

**`BracketProtectedRoute`:** A new route guard component that checks `isAuthenticated && isAnonymous`. If not met, redirects to `/bracket/login`. This is separate from the existing `ProtectedRoute` which guards admin routes.

**`AdminProtectedRoute`:** Rename/update the existing `ProtectedRoute` to also check `!isAnonymous`, preventing anonymous bracket users from accessing `/admin/*` routes.

### Cross-auth navigation

- Admin users (email/password) navigating to `/bracket/login`: the page does not redirect them (they are not anonymous), so they see the login form. This is acceptable — admins are not bracket users.
- Admin users navigating to `/bracket/dashboard`: `BracketProtectedRoute` checks `isAnonymous` which is `false` for admin users, so they are redirected to `/bracket/login`. No circular redirect.

### Dashboard navigation links

| Button | Destination |
|---|---|
| Edit My Bracket | `/bracket/edit` |
| View Submitted Brackets | `/brackets` |

These routes are built by other agents. We just wire up the navigation links.

## UI Design

### Login Screen (`/bracket/login`)

- **Layout:** Centered white card on light gray (#f5f5f5) background
- **Header:** Basketball icon, "Movable Madness" title, subtitle "Enter your bracket name to get started"
- **Input:** Single "Bracket Name" text field with placeholder (e.g., "Nick's Final Four")
- **Button:** Full-width Brand Magenta (#E31C79) "Join Tournament" button, darkens slightly on hover
- **Warning:** Yellow banner with warning icon: "You must use the same browser to return to your picks. Your session is tied to this browser only."
- **Typography:** Inter font, clean spacing
- **No navigation chrome** — single-purpose screen
- **Error states:** Display inline error if bracket name is empty or exceeds 50 characters

### Dashboard Screen (`/bracket/dashboard`)

- **Top bar:** White bar with app logo (basketball + "Movable Madness") and magenta "Sign Out" link
- **Welcome header:** Centered "Welcome, {bracketName}!" with wave emoji, subtitle "What would you like to do?"
- **Action cards:** Two stacked white cards with:
  - 3px Brand Magenta (#E31C79) top border
  - Left icon in light pink (#FDE8F1) rounded square
  - Title + description text
  - Right arrow affordance
  - Subtle drop shadow (`0 2px 12px rgba(0,0,0,0.06)`)
- **Card 1:** "Edit My Bracket" — pencil icon, "Make your picks for all 64 teams", links to `/bracket/edit`
- **Card 2:** "View Submitted Brackets" — chart icon, "See how others filled out their brackets", links to `/brackets`
- **Background:** Light gray (#f5f5f5)
- **Max content width:** ~640px, centered

### Styling Approach

- Uses existing shadcn/ui components from `libs/ui` (Button, Card, Input, Label)
- Tailwind CSS for layout and custom styling
- Brand colors added as Tailwind theme extensions or applied inline
- Inter font (already available as system-ui fallback, add explicit import)

## File Structure

```
apps/web/src/pages/bracket/
  login/bracket-login-page.tsx
  dashboard/bracket-dashboard-page.tsx

apps/api/src/brackets/
  brackets.module.ts
  brackets.controller.ts
  brackets.service.ts
```

## Testing

- Unit tests for the `BracketsService` (Firestore write logic)
- Unit tests for the `BracketsController` (endpoint validation, auth)
- Component tests for `BracketLoginPage` (form validation, submit flow)
- Component tests for `BracketDashboardPage` (renders bracket name, navigation links)

## Out of Scope

- The bracket editing experience (`/bracket/edit`) — built by another agent
- The submitted brackets view (`/brackets`) — built by another agent
- The 64-team bracket data structure and seeding
- Admin management of tournaments
