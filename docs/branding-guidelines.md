# Branding Guidelines

The "Tenacious" design system. Single source of truth for all visual tokens is
`src/styles/tokens.css` — **do not add colors anywhere else.**

## Brand color

Teal is the brand. Light mode:

| Token | Value | Use |
| --- | --- | --- |
| `--color-primary` | `#069494` | Primary actions, links, focus rings |
| `--color-primary-hover` | `#047a7a` | Hover state |
| `--color-primary-light` | `#d9f3f3` | Tinted backgrounds, selected states |
| `--color-primary-foreground` | `#ffffff` | Text on primary |

Dark mode is a **designed palette, not an inversion** — activated via `.dark`
on `<html>`. Primary brightens to `#22b8b8` (4.6:1 on canvas) and hover gets
*brighter*, not darker. When adding any new color, define both light and dark
values in `tokens.css`.

## Neutrals, status & data-viz

- Text scale: `--color-text-strong` → `text` → `text-secondary` →
  `text-soft/softer` → `text-subtle` (subtle is decorative-only in dark mode,
  3.6:1). Placeholders use `--color-text-placeholder`.
- Surfaces: `background` (cards/panels) vs `surface` (canvas) vs
  `surface-subtle` / `surface-muted`; dark mode uses a 4-step elevation
  ladder — elevation is carried by surface steps more than shadows.
- Status: solid `success` / `warning` / `error` for actions and icons; the
  soft palettes (`*-soft-bg` / `*-soft-fg` / `*-soft-border`) for banners and
  callouts; the chip palette (`--color-chip-*`) exclusively via `StatusChip`.
- Schedule event colors (`--color-event-*`) are data-viz tokens for the
  calendar; don't reuse them for UI chrome.

## Typography

- Font: **Inter** (`--font-family`), antialiased. No second typeface.
- Buttons are `font-semibold`; chips are `text-xs font-medium`.

## Shape & elevation

- Radii: `--radius-sm` 8px (buttons, inputs), `--radius-md` 12px (cards),
  `--radius-lg` 16px / `--radius-xl` 20px (large surfaces), `--radius-pill`
  for chips.
- Shadows: `--shadow-sm/md/lg` only. Dark mode shadows are deeper and
  subtler by design — never hand-roll a `box-shadow`.

## Components

- Buttons: the Tenacious `Button` (`src/components/ui/tenacious-button.tsx`)
  with variants `primary | secondary | ghost | success | destructive |
  warning-outline`. Pressed state is `active:scale-[0.97]`.
- Status: `StatusChip` variants `success | warning | critical | info |
  inactive | brand | violet | archived`; stages map through `StageBadge`
  (new lead = info, CRF = brand, reserved = violet, documentation = warning,
  closed sale = success).
- shadcn/Radix primitives live in `src/components/ui/`; restyle them with
  tokens rather than importing default shadcn themes.

## Hard rules

- No hex colors in components — tokens only (`var(--color-…)`).
- Every new token needs a light AND dark value, meeting the contrast bar in
  [accessibility.md](accessibility.md).
- Print (Smart Export PDF) forces the light palette — extend the `@media
  print` block in `src/styles.css` if you add tokens used in reports.
