# Design System Setup — Design Document

## Goal

Set up a design system using shadcn/ui, Tailwind CSS v4, and Radix primitives. Migrate all existing UI components from inline styles to the new design system with configurable light/dark theming.

## Architecture

Create a new `libs/ui` Nx library (`@workspace/ui`) containing shadcn/ui components built on Radix primitives and styled with Tailwind CSS v4. The web app imports from this library. Theme is controlled via CSS variables on `:root` and `.dark`, with a React context for toggling.

```
libs/ui/
├── src/
│   ├── components/        # shadcn/ui components (Button, Input, Card, etc.)
│   ├── lib/
│   │   └── utils.ts       # cn() helper (clsx + tailwind-merge)
│   └── index.ts           # barrel exports
apps/web/
├── src/
│   ├── app/
│   │   └── providers/
│   │       └── theme-provider.tsx   # light/dark toggle context
│   └── styles.css                   # Tailwind imports + CSS theme variables
```

## Theme System

- CSS variables defined in `apps/web/src/styles.css` using shadcn/ui's standard HSL variable scheme (`--background`, `--foreground`, `--primary`, `--card`, etc.)
- `:root` block for light theme, `.dark` block for dark theme
- `ThemeProvider` context in `apps/web` that toggles `.dark` class on `<html>`, persists to `localStorage`, detects system preference via `prefers-color-scheme`

## Components

Minimal set based on current page needs:

| Component | Used By |
|-----------|---------|
| Button | SignInForm, AdminHomePage, AccountSettingsPage |
| Input | SignInForm |
| Label | SignInForm |
| Card (+Header, Content, Title, Description) | AdminHomePage, AccountSettingsPage |
| Alert | SignInForm (errors), AppErrorBoundary |
| Badge | AdminHomePage (role display) |

## Component Migration

- **SignInForm** — Button, Input, Label, Alert for errors
- **SignInPage** — Tailwind layout classes
- **AdminHomePage** — Card, Badge for role, Button for actions
- **AccountSettingsPage** — Card for profile info, Button for sign-out, Badge for role
- **HomePage** — Card, Button
- **AppErrorBoundary** — Alert for error display

## Tailwind CSS v4 Setup

- Install `tailwindcss`, `@tailwindcss/vite`
- Configure via Vite plugin in `apps/web/vite.config.mts`
- Global CSS uses `@import "tailwindcss"` (v4 syntax)
- `tailwind-merge` + `clsx` for `cn()` utility in libs/ui

## Path Aliases

Add to `tsconfig.base.json`:
```
"@workspace/ui/*": ["libs/ui/src/components/*"]
"@workspace/ui": ["libs/ui/src/index.ts"]
```

## Tech Stack

- Tailwind CSS v4 (CSS-first config, `@tailwindcss/vite` plugin)
- shadcn/ui (component primitives)
- Radix UI primitives (underlying accessible components)
- clsx + tailwind-merge (class merging utility)
- React 19 context (theme provider)
