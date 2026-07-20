# Accessibility

Target: WCAG 2.1 AA. The team works on phones in the field — accessibility
failures are usability failures here.

## Contrast

- Body text ≥ 4.5:1, large text and UI icons ≥ 3:1. The dark palette in
  `src/styles/tokens.css` is annotated with measured ratios — keep that
  practice when adding tokens.
- `--color-text-subtle` in dark mode is 3.6:1 — decorative use only, never
  for information-bearing text.
- Chip fg/bg pairs must stay ≥ 4.5:1 (the dark-mode chip palette was tuned
  for this).

## Never color alone

Status must be readable without color: chips carry text labels
(`StageBadge`), alerts carry icons + text. Don't add a red/green-only
indicator.

## Keyboard & focus

- Everything interactive must be reachable and operable by keyboard. Use
  Radix primitives (`src/components/ui/`) — they handle focus trapping,
  arrow-key menus, and escape-to-close.
- Focus is globally visible: `:focus-visible` gets a 2px primary outline
  (`src/styles.css`). Never suppress it; never replace `focus-visible` with
  `focus`.
- Dialogs/slide-overs return focus to the trigger on close (Radix default —
  don't break it with manual focus calls).

## Semantics

- Real `<button>`/`<a>` elements, not clickable divs.
- Form controls get a `<Label>`; icon-only buttons get `aria-label` (see the
  stage selector's `aria-label="Stage selector"` pattern).
- Images that are decorative use `alt=""`; meaningful ones get real alt text.
- Toasts (sonner) announce politely; don't use them for information that must
  persist.

## Motion & preferences

- `prefers-reduced-motion: reduce` globally disables animation
  (`src/styles.css`) — never convey meaning through motion alone, and don't
  add animations that bypass the global rule.
- Countdown/urgency states must also be visible statically (color + label),
  not only via pulsing.

## Touch

- Minimum target 44×44px (Tenacious button default). Small icon buttons need
  padding to reach it.

## Auditing

`scripts/a11y-audit.mjs` runs axe-core over every route in both roles against
a running dev server (`http://localhost:8080`), writing JSON + console
summaries to `docs/a11y/`. Requires Playwright and
`A11Y_CONSULTANT_EMAIL/PASSWORD` or `A11Y_MANAGER_EMAIL/PASSWORD` env vars.
Run it after significant UI changes.
