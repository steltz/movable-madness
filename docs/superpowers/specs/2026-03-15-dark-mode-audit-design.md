# Dark Mode Audit & Fix

Audit all pages and components for dark mode compatibility, replacing hardcoded colors with semantic CSS custom properties.

## Context

The app already has dark mode infrastructure in place:

- `ThemeProvider` supporting `light`, `dark`, and `system` modes
- Blocking script in `index.html` to prevent flash of wrong theme
- CSS custom properties in oklch color space with light/dark values
- `@custom-variant dark` configured in Tailwind v4
- `colorScheme` set on the root element for native browser controls

The problem: several pages use hardcoded color values (`bg-white`, `bg-[#f5f5f5]`, `text-gray-900`, etc.) that don't adapt to dark mode, making those pages unusable when the system theme is dark.

## Approach

Extend the existing CSS token palette with a small number of new custom properties, then replace all hardcoded colors across 10 component files with semantic token classes.

### Decision: Brand color stays identical in both modes

The brand pink `#E31C79` remains the same in light and dark mode — no softening or lightening.

### Decision: Semantic tokens over utility pairs

All hardcoded colors map to CSS custom properties rather than `dark:` utility pairs. This keeps theming centralized in `styles.css`.

### Rule: Remove redundant `dark:` overrides

When a hardcoded color is replaced with a semantic token, remove any corresponding `dark:` override on the same element, since the token handles both modes. For example, `bg-white dark:bg-zinc-900` becomes just `bg-card`.

### Rule: `text-white` on brand backgrounds becomes `text-brand-foreground`

For consistency, any `text-white` used on a `bg-brand` or brand gradient background should use `text-brand-foreground` instead. This applies across all files.

## New CSS Custom Properties

### Brand tokens

| Token | Light value | Dark value | Purpose |
|-------|------------|------------|---------|
| `--brand` | oklch(0.56 0.24 350) | oklch(0.56 0.24 350) | Brand pink #E31C79, same both modes |
| `--brand-foreground` | oklch(1 0 0) | oklch(1 0 0) | White text on brand backgrounds |
| `--brand-muted` | oklch(0.94 0.03 340) | oklch(0.25 0.04 340) | Tinted backgrounds: icon boxes, row alternates, skeletons |
| `--brand-muted-foreground` | oklch(0.35 0.12 350) | oklch(0.78 0.1 340) | Text on brand-muted backgrounds (table headers) |

### Warning tokens

| Token | Light value | Dark value | Purpose |
|-------|------------|------------|---------|
| `--warning` | oklch(0.97 0.03 90) | oklch(0.25 0.04 85) | Warning/notice backgrounds |
| `--warning-foreground` | oklch(0.48 0.08 85) | oklch(0.78 0.1 85) | Text on warning backgrounds |

### Tailwind registration

All 6 new tokens are registered in the `@theme inline` block so Tailwind generates utility classes: `bg-brand`, `text-brand`, `bg-brand-muted`, `text-brand-muted-foreground`, `bg-warning`, `text-warning-foreground`.

## Files Modified

### 1. `apps/web/src/styles.css`

Add the 6 new custom properties to `:root` and `.dark` blocks. Register them in `@theme inline`.

### 2. `apps/web/src/pages/bracket/dashboard/bracket-dashboard-page.tsx`

| Current | Replacement |
|---------|------------|
| `bg-[#f5f5f5]` | `bg-muted` |
| `bg-white` (header + cards) | `bg-card` |
| `border-gray-200` | `border-border` |
| `text-gray-900` | `text-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-300` (arrow) | `text-muted-foreground` |
| `bg-[#FDE8F1]` (icon boxes) | `bg-brand-muted` |
| `text-[#E31C79]` / `hover:text-[#c8186b]` | `text-brand` / `hover:text-brand` |
| `border-t-[#E31C79]` | `border-t-brand` |
| `shadow-[0_2px_12px_rgba(0,0,0,0.06)]` | `shadow-md dark:shadow-lg dark:shadow-black/20` |
| `hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]` | `hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/25` |

### 3. `apps/web/src/pages/bracket/login/bracket-login-page.tsx`

| Current | Replacement |
|---------|------------|
| `bg-[#f5f5f5]` | `bg-muted` |
| `bg-white` (card) | `bg-card` |
| `text-gray-900` | `text-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `dark:text-gray-900` on Input | Remove (inherits foreground from context) |
| `bg-[#E31C79]` / `hover:bg-[#c8186b]` (button) | `bg-brand hover:bg-brand/90` |
| `text-white` (on brand button) | `text-brand-foreground` |
| `bg-[#FFF8E1]` (warning box) | `bg-warning` |
| `text-[#7a6520]` | `text-warning-foreground` |
| `text-red-600` (error) | `text-destructive` |
| `shadow-[0_4px_24px_rgba(0,0,0,0.08)]` | `shadow-lg dark:shadow-xl dark:shadow-black/20` |

### 4. `apps/web/src/pages/brackets/view/ViewBracketPage.tsx`

| Current | Replacement |
|---------|------------|
| `bg-gray-50` (all 3 occurrences: page bg, error page, loading page) | `bg-background` |
| `bg-gray-200` (skeleton bars) | `bg-muted` |
| `bg-pink-200` / `bg-pink-300` (skeleton header) | `bg-brand-muted` |
| `text-[#E31C79]` / `hover:text-[#c4166a]` (retry link) | `text-brand hover:text-brand` |
| `text-gray-500` / `hover:text-gray-700` (home link) | `text-muted-foreground hover:text-foreground` |

### 5. `apps/web/src/features/brackets/components/MatchupCard.tsx`

| Current | Replacement |
|---------|------------|
| `bg-white` | `bg-card` |
| `text-gray-400` (TBD, seed, loser text) | `text-muted-foreground` |
| `border-gray-200` (row dividers) | `border-border` (preserve `border-dashed` style) |
| `border-gray-300` (card borders) | `border-border` (preserve `border-dashed` on empty matchups) |
| `border-[#E31C79]` (championship border) | `border-brand` |
| `text-[#E31C79]` (winner checkmark) | `text-brand` |

### 6. `apps/web/src/features/brackets/components/BracketGrid.tsx`

| Current | Replacement |
|---------|------------|
| `text-gray-400` (champion label) | `text-muted-foreground` |
| `border-[#E31C79]` (champion with pick) | `border-brand` |
| `bg-pink-50` (champion bg with pick) | `bg-brand-muted` |
| `text-[#E31C79]` (champion text with pick) | `text-brand` |
| `border-gray-300` (champion TBD border) | `border-border` |
| `bg-gray-50` (champion TBD bg) | `bg-muted` |
| `text-gray-400` (champion TBD text) | `text-muted-foreground` |

### 7. `apps/web/src/features/brackets/components/BracketRound.tsx`

| Current | Replacement |
|---------|------------|
| `text-[#E31C79]` (round name) | `text-brand` |

### 8. `apps/web/src/features/brackets/components/BracketHeader.tsx`

| Current | Replacement |
|---------|------------|
| `bg-[#E31C79]` | `bg-brand` |
| `text-white` | `text-brand-foreground` |

Note: `bg-white/20` and `hover:bg-white/30` on the share button are intentionally left as-is — semi-transparent white overlays on the brand background work correctly in both modes.

### 9. `apps/web/src/features/bracket/ui/team-slot.tsx`

| Current | Replacement |
|---------|------------|
| `border-[#E31C79]` (selected state) | `border-brand` |
| `bg-[#E31C79]/10` (selected state) | `bg-brand/10` |

The rest of this file already uses semantic tokens (`border-border/40`, `text-muted-foreground`, `bg-card`, `text-foreground`).

### 10. `apps/web/src/features/bracket/ui/submit-footer.tsx`

| Current | Replacement |
|---------|------------|
| `bg-[#E31C79]` | `bg-brand` |
| `text-white` | `text-brand-foreground` |

Note: `disabled:opacity-50` on the submit button is preserved as-is — standard Tailwind utility that works in both modes.

### 11. `apps/web/src/pages/brackets/brackets-table.tsx`

**General replacements:**

| Current | Replacement |
|---------|------------|
| `border-t-[#E31C79]` | `border-t-brand` |
| `from-[#E31C79] to-[#c4156a]` | `from-brand to-brand/85` |
| `text-white` (on brand gradient header) | `text-brand-foreground` |
| `text-white/70` (participant count) | `text-brand-foreground/70` |
| `text-[#831843] dark:text-pink-300` | `text-brand-muted-foreground` (remove `dark:text-pink-300`) |
| `bg-pink-200 dark:bg-zinc-700` (skeleton) | `bg-brand-muted` (remove `dark:bg-zinc-700`) |

**Table header row:** `border-b-pink-200 bg-[#fdf2f8] hover:bg-[#fdf2f8] dark:border-b-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-800` becomes `border-b-brand-muted bg-brand-muted hover:bg-brand-muted` (remove all `dark:` overrides).

**Row alternation strategy:**

| Row type | Current | Replacement |
|----------|---------|------------|
| Even skeleton rows | `bg-white dark:bg-zinc-900` | `bg-card` |
| Odd skeleton rows | `bg-[#fdf2f8] dark:bg-zinc-800` | `bg-brand-muted` |
| Even data rows | `bg-white hover:bg-pink-50/50 dark:bg-zinc-900 dark:hover:bg-zinc-900/80` | `bg-card hover:bg-brand-muted/50` |
| Odd data rows | `bg-[#fdf2f8] hover:bg-pink-100/50 dark:bg-zinc-800 dark:hover:bg-zinc-800/80` | `bg-brand-muted hover:bg-brand-muted/80` |

All `dark:` overrides on rows are removed — the tokens handle both modes.

## Unchanged

- `ThemeProvider` and `index.html` blocking script — infrastructure is solid
- Admin pages (`admin-home-page.tsx`, `account-settings-page.tsx`) — already use semantic tokens
- Sign-in page and form — already use semantic tokens
- Shared UI components (`libs/ui`) — already use semantic tokens
- Bracket editor components (`matchup.tsx`, `bracket-round.tsx`, `bracket-grid.tsx`, `bracket-editor-page.tsx`) — already use semantic tokens
- Status colors in brackets-table (`text-[#166534] dark:text-emerald-400`, `text-[#92400e] dark:text-amber-400`) — already have explicit dark variants, left as utility pairs

## Scope

- 11 files modified total (1 CSS + 10 components)
- 6 new CSS custom properties
- No new components or structural changes
- No changes to the theme provider or dark mode infrastructure
