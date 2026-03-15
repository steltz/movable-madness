# Routing Audit & Fix Design

## Problem

The app has several routing issues: inconsistent URL prefixes (`/bracket` vs `/brackets`), missing auth guards, silent redirects, broken navigation links, and no 404 handling.

## Changes

### 1. Standardize URL prefix to `/brackets/` (plural)

Rename all `/bracket/...` routes to `/brackets/...`:

| Old Route | New Route |
|-----------|-----------|
| `/bracket/login` | `/brackets/login` |
| `/bracket/dashboard` | `/brackets/dashboard` |
| `/bracket/edit` | `/brackets/edit` |

Update all references: `<Link to>`, `<Navigate to>`, `navigate()` calls, and `<a href>` tags.

### 2. Add auth guard to edit route

Wrap `/brackets/edit` with `BracketProtectedRoute` so only authenticated anonymous users can access it. Currently it has no guard at all.

### 3. Remove `?name=` query param dependency from BracketEditorPage

The editor currently requires `?name=` as a query parameter and silently redirects to `/` if missing. The dashboard link at `bracket-dashboard-page.tsx:47` doesn't even pass this param, so clicking "Edit My Bracket" always fails.

Fix: `BracketEditorPage` should read `bracketName` from `useAuthContext()` instead of `useSearchParams()`. The auth context already has `bracketName` populated from a Firestore real-time listener for anonymous users. Since the edit route is now behind `BracketProtectedRoute`, `bracketName` is guaranteed to be available.

### 4. Add 404 catch-all route

Add a `<Route path="*">` at the end of the route list that renders a simple "Page not found" message with a link back to home.

### 5. Replace `<a href>` with `<Link to>`

Two places use `<a href>` which causes full page reloads instead of SPA navigation:
- `app.tsx:68` — `<a href="/sign-in">` in HomePage nav
- `ViewBracketPage.tsx:82` — `<a href="/">` in error state

Replace with React Router `<Link to>`.

### 6. Fix SignInPage redirect logic

`SignInPage` currently checks `if (user)` and redirects to `/admin`. This catches anonymous bracket users too, bouncing them to admin when they try to visit `/sign-in`.

Fix: Check `if (user && !isAnonymous)` so only admin users get redirected.

## Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/app/app.tsx` | Route paths, add guard to edit, add 404, fix `<a href>` |
| `apps/web/src/features/bracket/ui/bracket-editor-page.tsx` | Use `useAuthContext()` instead of `useSearchParams()` |
| `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx` | Update link paths to `/brackets/...` |
| `apps/web/src/pages/bracket/login/bracket-login-page.tsx` | Update navigate/redirect paths to `/brackets/...` |
| `apps/web/src/pages/sign-in/sign-in-page.tsx` | Fix redirect to exclude anonymous users |
| `apps/web/src/pages/brackets/view/ViewBracketPage.tsx` | Replace `<a href>` with `<Link to>` |

## Out of Scope

- API route changes (backend is unaffected)
- Moving page component files to match new URL structure (file paths stay as-is)
- Adding new features or UI changes beyond the fixes listed
