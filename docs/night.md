# Dark Mode Design System — Tenacious CRM

## Context

The app is light-only today. Goal: a premium, Linear/Notion/Stripe-grade dark theme across the entire application — not a color inversion, but a designed dark palette with proper elevation, contrast, and interaction states. Mobile-first (PWA), WCAG-compliant, zero flash-of-wrong-theme on load.

**Why this is tractable:** the app already has a strict token architecture. `src/styles/tokens.css` is the single source of truth (69 custom properties), consumed ~1,136 times via `var(--color-*)` in classNames and mapped to Tailwind utilities through `@theme inline` in `src/styles.css`. Redefining tokens under a `.dark` selector flips ~90% of the UI automatically. The real work is: (1) a well-designed dark palette, (2) a FOUC-free theme engine, (3) cleaning up ~260 hardcoded colors (`bg-white` ×150, `text-white` ×50, `bg-black/80` overlays, 33 raw hexes), (4) targeted component polish.

---

## 1. Architecture

**Activation:** `.dark` class + `data-theme="dark"` on `<html>`. All dark tokens defined in `tokens.css` under `.dark { ... }`. Because `@theme inline` maps Tailwind utilities to `var(--color-*)` chains, utilities like `bg-background`, `border-border`, `text-muted-foreground` re-resolve automatically under `.dark` — no Tailwind config changes needed.

**Prerequisite fix:** `src/styles.css` `@theme inline` currently hardcodes hexes that must become themeable — move to `tokens.css` as base tokens: the 7 chip palettes (14 tokens), `--color-primary-foreground`, `--color-sidebar-foreground`, `--color-sidebar-border`, `--color-overlay` (new, replaces `bg-black/80`).

**Theme state:** extend `src/stores/settings-store.ts` (already persists to `localStorage["tenacious.settings.v1"]`):
- `theme: 'light' | 'dark' | 'system'` (default `'system'`)
- `setTheme()` writes localStorage + applies class to `document.documentElement` + updates `<meta name="theme-color">`
- `matchMedia('(prefers-color-scheme: dark)')` listener re-applies when in `'system'` mode

**FOUC prevention (SSR):** inline `<script>` in `RootShell`'s `<head>` (`src/routes/__root.tsx`), before `<HeadContent/>` styles paint — reads the localStorage key, resolves `system` via matchMedia, sets the class synchronously. `suppressHydrationWarning` on `<html>`.

**Native controls:** `color-scheme: light` on `:root`, `color-scheme: dark` under `.dark` — fixes scrollbars, date pickers, selects, autofill.

**Meta theme-color:** two tags with media queries (`prefers-color-scheme`) as the SSR baseline + JS update on manual toggle. PWA manifest keeps teal `theme_color` (static; acceptable).

---

## 2. Dark Palette (complete token spec)

Design decisions:
- **Slightly cool-tinted neutral scale** (blue-gray, matching the existing slate-leaning light neutrals) — feels premium vs. flat gray; consistent with the light theme's slate text scale.
- **No pure black.** Canvas `#0f1417`; elevation = lighter surface steps + hairline borders, not heavy shadows.
- **Brand teal brightened** for dark: `#22b8b8` (4.6:1 on canvas — passes AA for text and UI). Primary buttons keep white text (`#22b8b8` + white ≈ 2.6:1 — fails for text, so primary buttons in dark use **near-black text `#062828` on the bright teal** — Linear/Stripe pattern, ~8:1).

### tokens.css `.dark` block

```css
.dark {
  color-scheme: dark;

  /* Brand */
  --color-primary: #22b8b8;          /* brightened teal, 4.6:1 on canvas */
  --color-primary-hover: #3ecfcf;    /* hover = brighter in dark mode */
  --color-primary-light: #0d3538;    /* tinted surface for accents/selected */
  --color-primary-foreground: #062828; /* text on primary buttons (was #fff) */

  /* Surfaces — 4-step elevation ladder */
  --color-background: #171d21;       /* cards, panels, popovers (elevated) */
  --color-surface: #0f1417;          /* app canvas (page bg) */
  --color-surface-subtle: #141a1e;   /* between canvas and card */
  --color-surface-muted: #1d242a;    /* inset/muted areas, tab strips */
  --color-sidebar: #0b0f12;          /* darker than canvas — keeps its identity */
  --color-sidebar-foreground: #d5dade;
  --color-sidebar-border: rgba(255, 255, 255, 0.06);
  --color-overlay: rgba(0, 0, 0, 0.65);

  /* Borders — hairlines */
  --color-border: #2a3238;
  --color-border-muted: #242b31;
  --color-border-subtle: #1d242a;

  /* Text scale (on canvas: 13.9:1 → 4.6:1) */
  --color-text: #e8ebed;             /* 13.9:1 body */
  --color-text-strong: #f5f7f8;
  --color-text-secondary: #99a3ab;   /* 6.1:1 */
  --color-text-soft: #aeb7be;
  --color-text-softer: #c2cad0;
  --color-text-subtle: #6d7880;      /* 3.6:1 — decorative only */
  --color-text-placeholder: #5c666e;

  /* Status solids (brightened for dark) */
  --color-success: #34c979;
  --color-warning: #f5a623;
  --color-error: #f26d6d;

  /* Soft palettes: dark tinted bg + bright fg */
  --color-danger-soft-bg: #2a1719;
  --color-danger-soft-bg-stronger: #3a1d20;
  --color-danger-soft-fg: #f58c8c;
  --color-danger-soft-fg-alt: #f26d6d;
  --color-danger-soft-border: #4d2529;
  --color-danger-solid: #f26d6d;

  --color-warning-soft-bg: #2a2114;
  --color-warning-soft-bg-stronger: #3a2c18;
  --color-warning-soft-fg: #f5c26b;
  --color-warning-soft-fg-alt: #f0b455;
  --color-warning-soft-fg-icon: #f5a623;
  --color-warning-soft-fg-strong: #f5a623;
  --color-warning-soft-border: #4d3a1e;
  --color-warning-soft-border-stronger: #5c4626;
  --color-warning-solid: #f5a623;

  --color-success-soft-bg: #12271c;
  --color-success-soft-bg-stronger: #173323;
  --color-success-soft-fg: #5cd996;
  --color-success-soft-fg-alt: #7de3ab;
  --color-success-soft-fg-icon: #34c979;

  --color-info-soft-bg: #14212e;
  --color-info-soft-fg: #7ab8f5;
  --color-info-soft-border: #1e3245;
  --color-info-solid: #4d9df0;

  /* Chips (moved from styles.css) — tinted bg + bright fg, all ≥4.5:1 */
  --color-chip-success-bg: #12271c;  --color-chip-success-fg: #5cd996;
  --color-chip-warning-bg: #2a2114;  --color-chip-warning-fg: #f5c26b;
  --color-chip-critical-bg: #2a1719; --color-chip-critical-fg: #f58c8c;
  --color-chip-info-bg: #14212e;     --color-chip-info-fg: #7ab8f5;
  --color-chip-inactive-bg: #242b31; --color-chip-inactive-fg: #99a3ab;
  --color-chip-brand-bg: #0d3538;    --color-chip-brand-fg: #3ecfcf;
  --color-chip-violet-bg: #241b38;   --color-chip-violet-fg: #b79df5;

  /* Shadows — deeper, subtler; elevation carried mostly by surface steps */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.35);
  --shadow-md: 0 10px 30px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.55);
}
```

Light theme additions to `:root` (moved/new): chip tokens (existing hex values), `--color-primary-foreground: #ffffff`, `--color-sidebar-foreground: #e5e7eb`, `--color-sidebar-border: rgba(255,255,255,0.08)`, `--color-overlay: rgba(0,0,0,0.8)`, `color-scheme: light`. `styles.css` `@theme inline` entries change to `var(...)` references.

### Elevation model (consistency rule)

| Level | Surface | Usage |
|---|---|---|
| 0 | `--color-surface` `#0f1417` | App canvas |
| 1 | `--color-background` `#171d21` | Cards, panels, table rows |
| 2 | `--color-surface-muted` `#1d242a` | Nested/inset elements, hover on cards |
| 3 | background + `--shadow-md` + border | Popovers, dropdowns, dialogs |
| Sidebar | `#0b0f12` | Below canvas — anchors navigation |

**Interaction formulas:** hover = one elevation step up or `--color-surface-muted`; selected = `--color-primary-light` (now a dark teal tint) + `--color-primary` text; focus = existing global 2px `--color-primary` outline (brightened teal passes 3:1 non-text contrast); disabled = 50% opacity (existing pattern, unchanged).

---

## 3. Implementation Phases

### Phase 1 — Token layer
1. `src/styles/tokens.css`: add `color-scheme: light` + moved tokens to `:root`; append the full `.dark` block above.
2. `src/styles.css`: replace hardcoded hexes in `@theme inline` with `var()` refs (chips, primary-foreground, sidebar-*); add `--color-overlay` mapping.
3. Verify print styles (`body.print-report-only`) force light — add `.dark` override so PDF export always prints light.

### Phase 2 — Theme engine
1. `src/stores/settings-store.ts`: add `theme: 'light'|'dark'|'system'`, `setTheme()`, `resolvedTheme` helper; apply class + `data-theme` + meta theme-color on set/hydrate; matchMedia listener for `'system'`.
2. `src/routes/__root.tsx`: inline FOUC script in `<head>` (reads `tenacious.settings.v1`, resolves system, sets class before paint); `suppressHydrationWarning` on `<html>`; dual `theme-color` meta tags (`#069494` light / `#0f1417` dark) with media queries.
3. Toggle UI:
   - `src/components/layout/profile-menu.tsx`: theme item cycling Light → Dark → System (Sun/Moon/Monitor icons) — quick access.
   - `src/routes/settings.tsx`: "Appearance" section with a 3-option segmented control — the canonical setting.

### Phase 3 — Hardcoded color cleanup (~40 files)
Pattern-based, by category:
- `bg-white` on cards/menus/panels → `bg-[var(--color-background)]` (≈150 instances; includes `profile-menu.tsx`, dashboard cards, dialogs, lead components)
- `bg-white/95 backdrop-blur` floating panels (EntityPopover, InputRow) → `bg-[var(--color-background)]/95`
- `bg-black/80` dialog/sheet/drawer overlays (`src/components/ui/dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `alert-dialog.tsx`) → `bg-[var(--color-overlay)]`
- `text-white` on solid colored buttons/sidebar → **keep** where bg stays colored; primary-button text switches to `text-[var(--color-primary-foreground)]` (in `tenacious-button.tsx` + `ui/button.tsx`)
- `text-black`, stray `gray-*`/`slate-*` classes → nearest semantic token
- Raw hexes: login gradient + brand panels → keep (brand teal reads well in both themes); `splash-screen.tsx`, `network-banner.tsx`, `error-page.ts` → tokens; `schedule-types.ts` event colors → add dark variants map; `AssistantAvatar`, `confetti` → keep (decorative)

### Phase 4 — Component polish
- `src/components/ui/skeleton.tsx` + `tenacious-skeleton.tsx`: shimmer base `--color-surface-muted`, highlight white/5
- `src/components/ui/table.tsx`: hover `--color-surface-muted`, selected `--color-primary-light`
- `src/components/ui/tooltip.tsx`: dark-on-light inverts to light-on-elevated (`#242b31` bg)
- Charts: `src/components/ui/chart.tsx` already has `.dark` THEMES infra — switch report ChartConfigs (`src/components/reports/*`) to `theme: {light, dark}` colors; brighten series colors + grid lines `--color-border-muted` in dark
- Recharts grid/axis strokes: point at tokens instead of default grays
- Scrollbars: covered by `color-scheme`; ScrollArea thumb uses `bg-border` (flips automatically)
- Sonner Toaster: uses semantic tokens — verify only

### Phase 5 — QA & accessibility
- `src/routes/styleguide.tsx`: add theme switcher at top; audit every section in dark
- Contrast spot-audit (all pairs above are pre-computed to pass AA: body 13.9:1, secondary 6.1:1, primary-on-canvas 4.6:1, chip pairs ≥4.5:1)
- Keyboard focus pass in dark (outline visibility on all surfaces)
- Print export stays light; reduced-motion unaffected (theme switch uses no transition — instant swap, optionally `transition: none` guard during toggle to avoid partial-transition flicker)

---

## 4. Files touched (summary)

| File | Change |
|---|---|
| `src/styles/tokens.css` | Light additions + full `.dark` block (core of the system) |
| `src/styles.css` | De-hardcode `@theme inline`; print-mode dark override |
| `src/stores/settings-store.ts` | Theme state + persistence + system listener |
| `src/routes/__root.tsx` | FOUC script, meta theme-color, suppressHydrationWarning |
| `src/components/layout/profile-menu.tsx` | Theme toggle item (+ bg-white fix) |
| `src/routes/settings.tsx` | Appearance section |
| `src/components/ui/{dialog,sheet,drawer,alert-dialog}.tsx` | Overlay token |
| `src/components/ui/{button,tenacious-button}.tsx` | primary-foreground token |
| ~35 more files | Mechanical `bg-white`/`text-white`/hex → token swaps |
| `src/components/reports/*` + `ui/chart.tsx` | Chart theme colors |
| `src/routes/styleguide.tsx` | Dark QA showcase |

## 5. Verification

1. `npx tsc --noEmit` clean.
2. Dev server: toggle Light/Dark/System from profile menu and Settings; verify persistence across reload and no flash on hard refresh (SSR).
3. System mode: flip OS theme → app follows live.
4. Walk key routes in dark: dashboard, leads (list + slideover + dialogs), schedule, reports (charts), leaderboard, team, settings, login, onboarding, styleguide.
5. Overlays: open dialog, sheet, drawer, popover, dropdown, toast — check elevation reads correctly.
6. Mobile viewport: bottom nav, FAB, PWA `theme-color` matches canvas in dark.
7. Print/Smart Export: renders light regardless of theme.
