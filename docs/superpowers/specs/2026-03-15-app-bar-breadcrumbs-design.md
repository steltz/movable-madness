# App Bar with Breadcrumbs — Design Spec

## Overview

Add a persistent app bar across all authenticated routes with breadcrumb navigation, a theme toggle, and a sign out button. Unauthenticated pages (sign-in, public bracket view) have no app bar.

## Architecture

### Layout Route Wrapper

Introduce an `AppLayout` component that wraps authenticated routes using React Router's layout route pattern. `AppLayout` renders the `AppBar` component above an `<Outlet />`.

The `AppBar` inside `AppLayout` conditionally renders based on auth state — if the user is not authenticated, the bar is hidden and only `<Outlet />` renders. This handles the HomePage's dual-mode behavior: unauthenticated users see the join form without an app bar, authenticated users see the dashboard with the app bar.

Route tree restructuring:

```
<Routes>
  {/* No app bar */}
  <Route path="/sign-in" element={<SignInPage />} />
  <Route path="/brackets/:bracketId" element={<ViewBracketPage />} />

  {/* App bar shown (when authenticated) */}
  <Route element={<AppLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/brackets" element={<BracketsDirectoryPage />} />
    <Route path="/brackets/edit" element={<BracketProtectedRoute><BracketEditorPage /></BracketProtectedRoute>} />
    <Route path="/brackets/login" element={<Navigate to="/" replace />} />
    <Route path="/brackets/dashboard" element={<Navigate to="/" replace />} />
    <Route path="/admin" element={<ProtectedRoute><AdminHomePage /></ProtectedRoute>} />
    <Route path="/admin/settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
  </Route>

  {/* 404 - no app bar, uses existing inline JSX */}
  <Route path="*" element={/* existing inline 404 JSX */} />
</Routes>
```

Auth checking stays on individual routes via `ProtectedRoute` / `BracketProtectedRoute`.

### Components

**`AppLayout`** (`apps/web/src/app/layouts/app-layout.tsx`)
- Checks `useAuthContext()` for `isAuthenticated`
- If authenticated: renders `<AppBar />` + `<Outlet />`
- If not authenticated or loading: renders only `<Outlet />` (no app bar)

**`AppBar`** (`apps/web/src/features/app-bar/app-bar.tsx`)
- Single-row layout: logo + breadcrumbs on left, actions on right
- Left side: "Movable Madness" text (links to `/`), then breadcrumb segments separated by `/`
- Right side: theme toggle button (sun/moon icon) + sign out button
- Dark background with magenta (#E31C79) bottom border accent
- Uses shadcn `Breadcrumb` component from `libs/ui`
- Uses `useTheme()` from existing ThemeProvider for toggle — two-state toggle cycling between `light` and `dark` (ignores `system`)
- Uses `signOut` imported from `features/auth` (not from auth context)
- After sign out, navigates to `/sign-in`

### Breadcrumb Mapping

Breadcrumbs are derived from URL path segments using a static label map:

| Path | Breadcrumbs shown |
|---|---|
| `/` | Home |
| `/brackets` | Home / Brackets |
| `/brackets/edit` | Home / Brackets / Edit Bracket |
| `/admin` | Home / Admin |
| `/admin/settings` | Home / Admin / Settings |

- All segments except the last are clickable `<Link>` elements
- The last segment (current page) is plain text, visually distinct (white vs grey)

### Cleanup

Remove redundant per-page navigation that the app bar replaces:
- HomePage Dashboard component: remove the entire `<header>` element (app name + sign out button). Remove the `min-h-screen` wrapper since `AppLayout` now controls the page chrome.
- AccountSettingsPage: remove back link to `/admin` and sign out button
- AdminHomePage: keep the link to `/admin/settings` — breadcrumbs only show the path to the current page, not forward navigation to child routes

### New Dependencies

- Install shadcn `Breadcrumb` component into `libs/ui`

## Styling

- Sticky positioning: `sticky top-0 z-50` so it stays visible on scroll
- Height/padding: `h-14 px-6` (56px tall, horizontal padding)
- Background: dark (`bg-card` or similar dark surface token)
- Bottom border: 2px solid #E31C79 (brand magenta)
- App name: magenta text, bold, links to home
- Breadcrumb separators: `/` in muted color
- Ancestor segments: muted/grey, clickable
- Current segment: white/foreground, non-clickable
- Theme toggle: icon button (sun/moon)
- Sign out: ghost/outline button style
- Responsive: on screens below `sm`, collapse breadcrumbs to show only the current page segment

## Visibility Rules

- **Shown:** All routes inside the `AppLayout` wrapper, only when user is authenticated
- **Hidden:** `/sign-in`, `/brackets/:bracketId`, 404 page, unauthenticated users on `/`
