# Tenacious CRM — Onboarding Experience Design

> **Status:** Design specification — not yet implemented.
> **Scope:** First-run onboarding for newly created accounts, with separate journeys for **Managers** and **Property Consultants**.
> **Grounding:** Every route, component, field, and token referenced in this document exists in the codebase today unless explicitly marked **NEW**.

---

## Table of Contents

1. [Principles & Design Direction](#1-principles--design-direction)
2. [Architecture Overview](#2-architecture-overview)
3. [Shared Gamification Mechanics](#3-shared-gamification-mechanics)
4. [Consultant Journey (6 steps)](#4-consultant-journey)
5. [Manager Journey (7 steps)](#5-manager-journey)
6. [Micro-interactions & Animation Inventory](#6-micro-interactions--animation-inventory)
7. [Drop-off Reduction](#7-drop-off-reduction)
8. [Mobile UX](#8-mobile-ux)
9. [Wow Moments](#9-wow-moments)
10. [First-Day Activation Strategy](#10-first-day-activation-strategy)
11. [Benchmark Practices Applied](#11-benchmark-practices-applied)
12. [Implementation Appendix](#12-implementation-appendix)

---

## 1. Principles & Design Direction

Five rules govern every screen in this spec:

| # | Principle | What it means here |
|---|-----------|--------------------|
| 1 | **One decision per screen** | Each step asks the user to do exactly one thing. No screen has two competing CTAs. (Notion, Linear) |
| 2 | **Do, don't read** | Every step performs a *real* action against the real database — the photo they upload is their real avatar; the lead they add is a real lead. Zero throwaway "tutorial" artifacts. (Stripe's "make a real API call" onboarding) |
| 3 | **Always skippable, never lost** | Every step has a quiet "Skip for now" escape. Progress persists in the database per step, so closing the tab mid-flow resumes exactly where they left off — on any device. |
| 4 | **Premium restraint** | Gamification is felt, not shouted: a progress ring, XP that accumulates silently, badges that pop once and live in the profile. No mascots, no sounds. Confetti exactly once, at the end. |
| 5 | **Motion with meaning** | Every animation communicates state change (arriving, completing, celebrating). All motion is opacity/transform only, ≤400ms, on the existing `cubic-bezier(0.4, 0, 0.2, 1)` curve, and fully disabled under `prefers-reduced-motion` (the global rule in `src/styles.css` already handles this). |

**Visual language** — inherited entirely from the existing token system (`src/styles/tokens.css`):

- Canvas: `--color-background` (#ffffff) with a soft radial teal glow (`rgba(6,148,148,0.06)`) behind the active card — same technique as the splash screen glow in `splash-screen.tsx`.
- Primary: `--color-primary` (#069494 teal) for CTAs and progress; `--color-primary-light` (#d9f3f3) for selected states.
- Cards: `--radius-lg` (16px), `--shadow-md`.
- Type: Inter (already loaded in `__root.tsx`); step titles 22–28px bold, body 14–15px `--color-text-secondary`.
- Dark accent moments (welcome + completion screens) borrow the splash screen's `--color-sidebar` (#111827) full-bleed background so onboarding opens and closes with the same "native app" feel the splash already established.

---

## 2. Architecture Overview

### 2.1 Trigger & routing

```
login succeeds (auth-store.login)
  └─ profile.onboarding is null OR onboarding.completedAt == null AND skippedAt == null
       └─ redirect → /onboarding          (NEW route, full-screen, no chrome)
            └─ role === 'manager' | 'superadmin'  → Manager journey
            └─ role === 'property_consultant'     → Consultant journey
  └─ otherwise → / (dashboard, unchanged)
```

- **Detection:** `profiles.last_login_at === null` is already set only on first login (`auth-store.ts:121-126`), but it is *consumed* by that same login call — so the durable signal is the **NEW** `profiles.onboarding` jsonb column (§12.1). `onboarding IS NULL` ⇒ never started.
- **Route:** **NEW** `src/routes/onboarding.tsx` with `beforeLoad: requireAuth` (from `src/lib/route-guards.ts`). Rendered chrome-less the same way `/login` is: add `/onboarding` to the standalone-rendering branch in `AppShell` (`app-shell.tsx`) — but *not* to `PUBLIC_PATHS`, since it requires auth. A dedicated check (`path === "/onboarding"` renders bare children after the auth gate) keeps it protected but shell-free.
- **Completion / skip:** both write to `profiles.onboarding` and navigate to `/`. A skipped flow leaves `completedAt: null`, which powers the resume nudge (§7).

### 2.2 Onboarding state schema

Stored in **NEW** `profiles.onboarding` (jsonb, nullable — null means "never started"):

```jsonc
{
  "version": 1,                      // future-proof re-onboarding on major releases
  "role": "property_consultant",     // journey snapshot (role changes don't restart flow)
  "steps": {                         // per-step status: null | "done" | "skipped"
    "welcome":        "done",
    "profile":        "done",
    "pipeline_tour":  "skipped",
    "first_lead":     null,
    "daily_tools":    null,
    "finish":         null
  },
  "xp": 45,                          // accumulated onboarding XP (max 100)
  "badges": ["face_forward"],        // earned badge ids
  "startedAt":   "2026-07-18T02:11:00Z",
  "completedAt": null,
  "skippedAt":   null
}
```

Writes go through the existing `db.from("profiles").update(...)` pattern used by `profile.tsx:99-115`; RLS policy `profiles_update_own` already permits self-updates. A thin **NEW** `src/stores/onboarding-store.ts` (Zustand, mirroring `auth-store.ts` conventions) owns reads/writes and optimistic local state so step transitions never wait on the network.

### 2.3 Screen chrome (shared shell)

Every step renders inside one **NEW** `OnboardingShell` component:

```
┌──────────────────────────────────────────────┐
│  ◉◉◉○○○   Step 3 of 6              Skip ▸   │   ← progress dots + quiet skip
│                                              │
│              ╭────────────────╮              │
│              │   step canvas  │              │   ← one card, one decision
│              │  (illustration │              │
│              │   + action)    │              │
│              ╰────────────────╯              │
│                                              │
│   [ Back ]                    [ Continue ]   │   ← Continue = TenaciousButton primary
│         ═══════════════▓▓▓▓░░░░░             │   ← Progress bar (existing Progress)
│                  45 XP · 45%                 │
└──────────────────────────────────────────────┘
```

- Progress bar: existing `Progress` (`src/components/ui/progress.tsx`) — its transform-based fill animates smoothly for free.
- Continue: `TenaciousButton` primary (has the `active:scale-[0.97]` press micro-interaction built in).
- Steps animate in with the existing `anim-rise` utility, staggered children exactly like `splash-screen.tsx` (150/250/400ms delays).

---

## 3. Shared Gamification Mechanics

Balanced: visible enough to motivate, quiet enough for a professional real-estate team.

### 3.1 XP model (100 XP = complete)

| Journey | Step | XP |
|---------|------|----|
| Both | Welcome | 10 |
| Both | Profile complete | 25 |
| Consultant | Pipeline tour | 15 |
| Consultant | First lead added | 30 |
| Consultant | Daily tools tour | 10 |
| Manager | Workspace config | 20 |
| Manager | Team invited | 25 |
| Manager | Permissions review | 10 |
| Manager | Management tour | 10 |
| Both | Finish | 10 |

XP appears as a small counter under the progress bar (`45 XP · 45%`) and ticks upward with a 300ms count-up when a step completes. Skipped steps earn 0 XP but still advance progress — completion is never gated on XP.

### 3.2 Badges

Earned once, announced with a badge-pop toast (§6), permanently visible on `/profile` (a **NEW** small badge row under the avatar card).

| Badge id | Name | Earned by | Journey |
|----------|------|-----------|---------|
| `face_forward` | **Face Forward** | Uploading a profile photo | Both |
| `first_blood` | **First Client** | Adding first real lead | Consultant |
| `pipeline_pro` | **Pipeline Pro** | Completing the pipeline tour | Consultant |
| `squad_assembled` | **Squad Assembled** | Sending first team invite | Manager |
| `goal_setter` | **Goal Setter** | Setting the team monthly goal | Manager |
| `day_one` | **Day One** | Finishing onboarding | Both |

Badge visual: 40px circle, `--color-primary-light` fill, teal line icon (lucide, matching `nav-config.ts` icon set), `--radius-pill`.

### 3.3 Celebrations

- **Step complete:** the step's checkmark draws itself (SVG stroke-dashoffset, 250ms) and the progress bar fills with a slight overshoot. Quiet.
- **Milestone (first lead / first invite):** badge-pop toast via existing `sonner` `toast.success` with custom JSX — badge scales 0→1.1→1.
- **Finish:** full-screen confetti (§6.4) + XP total + badge recap. Once, ever.

### 3.4 Encouragement copy

Shown under the progress bar from step 3 onward, rotating by progress:

- 40–60%: "Halfway there — this is the fun part."
- 61–85%: "Almost done. Your CRM is taking shape."
- 86–99%: "One more step. Make it count."

Tone: Stripe-like — short, confident, zero exclamation marks until the finish screen.

---

## 4. Consultant Journey

Six steps, ~4 minutes total. Every artifact created is real.

### Step C1 — Welcome (10 XP)

| | |
|---|---|
| **Purpose** | Emotional arrival. Confirm identity, set expectations ("4 minutes, 5 things"), establish the premium tone. |
| **Screen** | Full-bleed dark (#111827, matching splash). App icon scales in (reuse `splash-icon-in` keyframe). Headline: **"Welcome to Team Tenacious, {first name}."** — the name comes from `profile.display_name`, pre-filled by their manager's registration token, which makes the first screen feel personally prepared *for them*. Subline: "You're set up as a **Property Consultant**. Let's get you selling in about 4 minutes." Five small step chips preview the journey. |
| **UI** | Single CTA: "Let's go" (`TenaciousButton` primary, large). No skip on this screen — it *is* one tap. |
| **Animation** | Icon pop → headline rise → chips stagger in left-to-right (60ms apart) → CTA rises last. Total choreography ≤1.2s. |
| **Empty/success** | N/A — cannot fail. Tap transitions dark→light with a crossfade wipe into Step C2. |

### Step C2 — Complete your profile (25 XP)

| | |
|---|---|
| **Purpose** | Highest-value data capture while motivation peaks: photo, phone, CRF link. These power real features (avatar everywhere, `tel:` links on leads, the CRF workflow stage). |
| **Screen** | Card with a large tappable avatar circle (reuses the exact upload affordance from `profile.tsx` — camera overlay on hover, spinner while uploading, and the hardened `uploadAvatarImage("avatars", file)` path). Below: phone input (`TenaciousInput`, `+63` placeholder per existing profile page) and CRF link input with helper text reused from `profile.tsx` ("Your clients will be directed here during the CRF workflow stage"). |
| **UI** | Photo is the hero (96px circle center-top). Fields save on Continue via the same `profiles.update` call the profile page uses. CRF link marked "optional — you can add this later" so it never blocks. |
| **Animation** | On photo upload success: avatar ring flashes teal (`box-shadow` pulse, 400ms) and **Face Forward** badge pops. Progress bar jumps +25 with count-up. |
| **Empty state** | Avatar circle shows their initials (existing `initials()` from `src/lib/format.ts`) with a gentle 2s breathing glow inviting the tap. |
| **Success state** | Their real face, everywhere, immediately — the top-right of the shell now shows their avatar for the rest of the flow. Small moment, big ownership. |

### Step C3 — How money moves: the pipeline (15 XP)

| | |
|---|---|
| **Purpose** | Teach the 5-stage sales workflow — the app's core mental model — interactively, not with a wall of text. |
| **Screen** | An animated horizontal pipeline of the real stages from `STAGE_LABELS` (`src/lib/constants.ts`): **New Lead → CRF → Reserved → Documentation → Closed Sale**. A glowing "client chip" sits on stage 1. The user **drags (or taps) the chip through each stage**; each arrival flips a compact info card explaining that stage in one sentence + its timer rule (e.g. CRF/Reserved expiry timers, which the app really enforces via `StageTimersBanner`). |
| **UI** | Stage colors from the existing chip system (`status-chip.tsx` variants). Mobile: tap-to-advance instead of drag. A "why this matters" footnote: "Leads that stall get flagged on your dashboard — keep them moving." |
| **Animation** | Chip slides between stages with a spring-ish two-keyframe ease; the reached stage's dot fills and its label bolds. When the chip lands on **Closed Sale**, a brief coin-burst of 5 teal particles + **Pipeline Pro** badge. |
| **Empty/success** | N/A interactive — success is the chip reaching the end. Skipping marks the step `"skipped"` and shows the same content later via a "Replay tour" link on the workflow page (§10). |

### Step C4 — Add your first client (30 XP) — *the activation moment*

| | |
|---|---|
| **Purpose** | The single action most correlated with retention: a real lead in their real pipeline. This is the step everything else builds toward. |
| **Screen** | Headline: "Add your first client." Two paths: **(a) "Add a real client"** — opens the existing `AddLeadDialog` (`src/components/leads/add-lead-dialog.tsx`) inside the flow, unchanged; **(b) "I don't have one yet"** — creates a clearly-labeled practice lead named "Sample Client (practice)" they're told to delete later, so nobody is blocked. |
| **UI** | Path (a) is visually dominant (primary card); path (b) is a ghost-styled secondary card. After the dialog saves, the flow shows the new lead rendered as a real `LeadListCards` card — "This is how {lead name} appears in your pipeline." |
| **Animation** | On save: the lead card materializes with `anim-rise`, then a **milestone celebration** — the card gets a one-time teal shimmer sweep and **First Client** badge pops with the biggest toast of the journey. XP +30 count-up. |
| **Empty state** | The two-path chooser *is* the empty state — there is no dead end. |
| **Success state** | Their pipeline is no longer empty; the dashboard "Getting started" checklist (existing) will already show step 2 complete when they land. |

### Step C5 — Your daily toolkit (10 XP)

| | |
|---|---|
| **Purpose** | Discovery of the three daily-use surfaces beyond leads: **Schedule**, **Assistant**, **Leaderboard**. |
| **Screen** | Three swipeable cards (existing `Carousel`/embla, with dots): each card = icon (from `nav-config.ts`), one-line value prop, and a real mini-preview: Schedule shows a mock week strip with a tripping chip; Assistant shows one example prompt ("Summarize my stagnant leads"); Leaderboard shows an anonymized podium. |
| **UI** | Swipe on mobile, arrows on desktop (built into `Carousel`). "Continue" activates after the last card *or* immediately via skip — never trap the user in a carousel. |
| **Animation** | Card content parallax-fades on swipe (embla scroll progress → opacity). Dots use the primary color fill transition. |
| **Empty/success** | N/A — informational. Viewing all three cards earns the XP. |

### Step C6 — Finish: "You're ready." (10 XP)

| | |
|---|---|
| **Purpose** | Celebrate, recap, and hand off momentum into the dashboard with a next action already loaded. |
| **Screen** | Dark full-bleed again (bookending C1). Confetti burst (§6.4). "**You're ready, {first name}.**" XP total rolls up to 100. Earned badges line up with staggered pops. **Day One** badge awarded. Below: a "Your first day" mini-checklist preview (§10). |
| **UI** | Single CTA: "Open my dashboard". On tap, `completedAt` is written and the dashboard reveals via blur-to-focus (§9). |
| **Animation** | Confetti (2.5s, CSS-only) → XP count-up → badges pop 120ms apart → CTA rises. Reduced-motion: static success card with all elements visible instantly. |

---

## 5. Manager Journey

Seven steps, ~6 minutes. Focused on configuration and team activation — a manager's success metric is *their team* getting in.

### Step M1 — Welcome (10 XP)

Same construction as C1. Copy differs: "You're set up as a **Manager**. Let's build your workspace — about 6 minutes." Step chips preview the 6 remaining steps. Purpose: arrival + orientation.

### Step M2 — Set up your workspace (20 XP)

| | |
|---|---|
| **Purpose** | Essential business configuration: the team monthly goal and a projects sanity-check — the two inputs that make the dashboard meaningful on day one. |
| **Screen** | Two stacked cards. **Card 1 — Team goal:** currency input (₱, formatted like the existing `Intl.NumberFormat("en-PH")` usage in `profile.tsx`) with three tappable suggestion chips (e.g. ₱5M / ₱10M / ₱20M). Writes to the same team-goal storage the dashboard's editable Team Goal section uses. **Card 2 — Projects:** read-only list of current `projects` (via existing `useProjects()` hook) with a note: "Projects are managed in Settings → you can refine these anytime." |
| **UI** | Goal is required-ish (defaultable), projects card is informational. **Goal Setter** badge on goal save. |
| **Animation** | Selecting a suggestion chip fills the input with a count-up to the amount. Card 2 list items stagger in. |
| **Empty state** | Zero projects → the card becomes a gentle prompt: "No projects yet — add your first in Settings after onboarding" with a deep-link that's remembered in the first-day checklist (§10). |

### Step M3 — Complete your profile (25 XP)

Identical construction to C2 (photo + phone; no CRF link — that field is consultant-only, exactly as `profile.tsx` already gates it). **Face Forward** badge available. Purpose: managers appear across the app (broadcasts, team page) — their face builds trust for the team they're about to invite.

### Step M4 — Invite your team (25 XP) — *the manager activation moment*

| | |
|---|---|
| **Purpose** | The manager equivalent of "first lead": at least one consultant invited. Team size is the #1 predictor of workspace stickiness. |
| **Screen** | Reuses the real registration-token flow from `team.tsx`: inputs for display name, agent number, role → generates the `/register?token=…` link. The new part is presentation: each generated invite renders as a "team card" with the invitee's initials avatar and a copy-link button; cards accumulate in a horizontal row that visibly *builds the team*. |
| **UI** | "Copy invite link" uses clipboard API with a "Copied ✓" morph on the button (300ms). A share-sheet button on mobile (`navigator.share`) since invites are typically sent via Viber/Messenger in this team's workflow. "Invite another" resets the mini-form inline. |
| **Animation** | Each new team card slides into the row from the form with a settle bounce. First invite triggers **Squad Assembled** badge + milestone toast. |
| **Empty state** | Row shows one ghosted placeholder card ("Your first consultant") until an invite exists. |
| **Success state** | The row of cards *is* the success state — "2 invites ready to send." Post-onboarding, invite acceptance surfaces as a notification (§10). |

### Step M5 — Who can do what (10 XP)

| | |
|---|---|
| **Purpose** | Permissions confidence in 30 seconds — managers need to trust the system before inviting people into it. |
| **Screen** | A compact two-column comparison table: **Consultants** vs **Managers**, 5 rows of real rules drawn from the actual RLS/UI behavior: lead visibility (own vs all), lead assignment, internal notes, reports scope, broadcast rights. Not editable — this is an explainer, matching the fixed role model in the schema. |
| **UI** | Rows reveal on scroll/tap with check/dash icons (`StatusChip` success/inactive variants). One-line footer: "Roles are fixed per account and set when you invite someone." |
| **Animation** | Rows stagger-rise 60ms apart. |
| **Empty/success** | N/A — informational. |

### Step M6 — Your command center (10 XP)

Carousel (same construction as C5) of the three manager surfaces: **Pending Actions** (closed-sale verification, escalations — the real dashboard block), **Reports** (team performance preview), **Broadcasts** (announcement composer preview with a note about the acknowledgment overlay their team will see). Purpose: daily-management feature discovery.

### Step M7 — Finish: "Your workspace is live." (10 XP)

Same construction as C6. Recap adds a team line: "2 invites ready — you'll be notified when they join." **Day One** badge. CTA: "Open my dashboard" → blur-to-focus reveal.

---

## 6. Micro-interactions & Animation Inventory

All CSS-only (no new animation library — consistent with the codebase's splash-screen approach). New keyframes live in one **NEW** `src/components/onboarding/onboarding.css` (or a `<style>` block per the `splash-screen.tsx` precedent).

### 6.1 Existing utilities to reuse verbatim

| Utility | Source | Used for |
|---|---|---|
| `transition-tenacious` (180ms) | `src/styles.css` | All hover/focus/color changes |
| `anim-rise` / `tenacious-rise` | `src/styles.css` | Step content entrances |
| `splash-icon-in`, `splash-glow` | `splash-screen.tsx` | Welcome/finish screens |
| `tenacious-modal-in`, `tenacious-sheet-in` | `responsive-dialog.tsx` | Embedded dialogs (AddLeadDialog) |
| `active:scale-[0.97]` | `tenacious-button.tsx` | Every button press |
| Progress fill transform | `progress.tsx` | XP/progress bar |

### 6.2 New micro-interactions

| Interaction | Spec |
|---|---|
| **Step transition** | Outgoing card: opacity 1→0 + translateX(0→-24px), 180ms. Incoming: opacity 0→1 + translateX(24px→0), 220ms, 60ms overlap. Back reverses direction. |
| **Checkmark draw** | SVG path, `stroke-dashoffset` full→0, 250ms ease-out, teal stroke. |
| **XP count-up** | JS rAF tween, 300ms, tabular-nums to prevent layout shift. |
| **Badge pop** | scale 0→1.12→1 (two keyframes, 320ms), simultaneous opacity 0→1. |
| **Avatar success pulse** | `box-shadow: 0 0 0 0 → 0 0 0 8px rgba(6,148,148,0.25) → 0` , 400ms. |
| **Copy-button morph** | Label crossfades to "Copied ✓", background flashes `--color-success-soft-bg`, reverts after 1.5s. |
| **Suggestion-chip fill** | Chip press → input value counts up to target over 250ms. |
| **Input focus** | Existing focus ring + a 1px scale-y grow of the underline accent, 180ms. |

### 6.3 Choreography rules

- Stagger children 60–150ms; never animate more than 5 elements per screen.
- Nothing animates on user *input* latency paths (typing, dialog open) — only on transitions and successes.
- Every keyframe pair is opacity/transform only (compositor-friendly; matches the codebase's stated rule).

### 6.4 Confetti spec (finish screens only)

- ~60 particles: absolutely-positioned 6–10px rects/circles in 4 colors (`#069494`, `#d9f3f3`, `#d97706`, `#ffffff`), spawned across the top 20% of the viewport.
- Each particle: `translateY(-10vh → 110vh)` + `rotate(0 → 540deg)` + slight `translateX` drift, duration 1.8–2.6s randomized via inline `animation-delay`/`animation-duration`, `both` fill, then the container unmounts (2.8s timer).
- Pure CSS keyframes + one-time DOM render — no canvas, no library.
- `prefers-reduced-motion: reduce`: confetti never renders; the finish card appears fully composed instantly (global kill rule in `styles.css` already covers the rest).

---

## 7. Drop-off Reduction

| Tactic | Design |
|---|---|
| **Per-step persistence** | Every step completion writes `steps.{id}` to `profiles.onboarding` immediately (optimistic UI, background write). Closing the tab at step 4 resumes at step 4 — on any device, because state is in the database, not localStorage. |
| **Skip is honest** | "Skip for now" (top-right, quiet ghost style) skips *one step*. "Finish later" (in the skip menu) exits the whole flow, sets `skippedAt`, and promises — and delivers — a way back. |
| **The way back** | Dashboard shows a dismissable resume banner: progress ring + "Finish setting up — 2 steps left (~90 seconds)". Tapping resumes at the first incomplete step. Banner extends the existing "Getting started" checklist area on the empty dashboard rather than adding a new surface. |
| **Time honesty** | Welcome screens state total time ("about 4 minutes"); the resume banner states *remaining* time. Each step is designed to a ≤90-second budget. |
| **Optional is labeled** | CRF link, practice-lead path, projects review — anything non-essential says "optional" inline so users never stall on uncertainty. |
| **No dead ends** | Every empty state has a forward path (practice lead, "add projects later" deep-link, ghost invite card). |
| **Front-load value** | The two highest-XP steps (profile 25, first lead 30 / invites 25) sit at positions 2 and 4 — users hit >50% progress while motivation is highest, and sunk-progress carries them home. |
| **Never re-trigger** | `completedAt` (or `skippedAt` + banner dismissal) permanently silences the flow. Re-onboarding only via the `version` field on a deliberate future release. |

---

## 8. Mobile UX

The team is mobile-first (per the app's meta description and existing `useMediaQuery` patterns), so onboarding is designed phone-first and adapted up to desktop.

- **Layout:** single-column, step card fills width with 16px gutters; CTA docked in the bottom thumb zone with `env(safe-area-inset-bottom)` padding (viewport-fit=cover is already set in `__root.tsx`).
- **Targets:** all interactive elements ≥44px (the existing `form-controls.tsx` inputs already enforce 44px min-height).
- **Gestures:** carousel steps (C5/M6) swipe natively via embla; the pipeline tour (C3) uses tap-to-advance on touch instead of drag. No gesture is ever the *only* path — buttons always exist.
- **Embedded dialogs:** `AddLeadDialog` and the invite form already render as bottom sheets on <640px via `ResponsiveDialog` — reused unchanged.
- **Keyboard:** inputs scroll into view above the keyboard; the docked CTA hides while the keyboard is open to avoid overlap (visualViewport listener).
- **Performance:** each step is a lazy chunk; welcome screen assets are just the existing app icon — first paint of onboarding costs no more than the splash screen does today.
- **Desktop adaptation:** card max-width 560px centered (matching `ResponsiveDialog` "form" size), keyboard navigation: `Enter` = Continue, `Esc` = skip menu, arrow keys in carousels (already supported by `Carousel`).

---

## 9. Wow Moments

Ranked by effort-to-delight ratio:

1. **The prepared welcome.** The first screen greets them by name and role *before they've typed anything* — because their manager's invite token pre-created it. Copy leans in: "Your manager already set up your seat." Feels like walking into an office with your nameplate on the desk.
2. **Your face, immediately everywhere.** The moment the avatar uploads in step 2, it appears in the shell header and every subsequent screen. Instant ownership.
3. **The living pipeline.** Money visibly *moves* through the real 5-stage pipeline under the user's finger — the app's entire mental model taught in one 20-second interaction.
4. **The team that builds itself.** (Manager) Each invite becomes a card sliding into a growing team row — configuration reframed as construction.
5. **Blur-to-focus dashboard reveal.** After the finish CTA, the real dashboard renders behind a `blur(12px)` + slight scale-down overlay that resolves to sharp over 500ms — "here's what you just built" as a single cinematic beat.
6. **The first-lead shimmer.** Their first real lead card gets a one-time teal shimmer sweep — the pipeline is alive now.

---

## 10. First-Day Activation Strategy

Onboarding ends; activation begins. The goal: one meaningful return action within 24 hours.

### 10.1 Post-onboarding checklist (dashboard widget)

Extends the existing "Getting started" empty-state checklist on the dashboard into a persistent (dismissable) **"Your first day"** card with role-specific items:

- **Consultant:** ① Schedule your first tripping or presentation (→ lead slide-over's schedule action — note: consultants book these themselves; managers can't create them, per the current schedule rules) ② Set a follow-up reminder on your lead ③ Explore the Assistant with one prompt.
- **Manager:** ① Send your invite links (if generated but unsent) ② Add your first project in Settings (if none) ③ Post a welcome broadcast to the team.

Each completed item ticks with the checkmark-draw animation. Completing all three: a final quiet toast — "Day one: done. See you tomorrow." (Streak *seed*, not a streak system — momentum without obligation.)

### 10.2 Manager activation loop

When an invited consultant completes registration, the manager gets a real notification (existing notifications system): "{name} just joined your team 🎉 — 1 of 2 invites accepted." Each acceptance is a re-engagement pull *and* social proof that the workspace is coming alive. The team page invite list (existing) shows pending/accepted status.

### 10.3 Re-entry nudges (restrained)

- Resume banner (§7) for incomplete onboarding — the only persistent nudge.
- Replay entry points: "Replay pipeline tour" link on the workflow page; "View my badges" on the profile page. No emails, no push, no guilt mechanics — consistent with the app's professional tone.

---

## 11. Benchmark Practices Applied

| Company | Practice borrowed | Where it lands here |
|---|---|---|
| **Duolingo** | XP + streak psychology — *with restraint*: progress loss aversion drives completion, but no daily-guilt mechanics | XP model (§3.1), sunk-progress front-loading (§7), streak *seed* not streak *system* (§10.1) |
| **Notion** | Progressive disclosure; onboarding artifacts are real workspace objects | One-decision-per-screen; real lead / real invites / real goal — zero tutorial throwaways (§1 rule 2) |
| **Linear** | Speed as the feature; keyboard-first; opinionated single path | ≤90s step budget, Enter-to-continue, no branching settings maze (§7, §8) |
| **Stripe** | "Do the real thing" onboarding; terse confident copy | First lead uses the production `AddLeadDialog`; encouragement copy tone (§3.4) |
| **Airbnb** | Emotional arrival moments; empty states that invite rather than apologize | Dark welcome/finish bookends (§4 C1/C6); breathing-glow avatar empty state (§4 C2) |
| **Apple** | Choreographed reveals; motion as continuity | Splash-consistent dark bookends, blur-to-focus dashboard reveal (§9.5) |
| **Unique to Tenacious** | Onboarding teaches the *actual* expiry-timer pipeline the team lives by; invites match the team's real Viber/Messenger sharing workflow; ₱ goal-setting with PH-market suggestion chips | §4 C3, §5 M4, §5 M2 |

---

## 12. Implementation Appendix

*(For the future build — nothing here is implemented yet.)*

### 12.1 Migration sketch — `supabase/migrations/014_onboarding_state.sql`

```sql
-- Onboarding progress, per user. Null = never started.
alter table public.profiles add column if not exists onboarding jsonb;

-- No new RLS needed: profiles_update_own already lets users write their own
-- row, and profiles_read_authenticated covers reads. Managers can observe
-- team onboarding completion through the existing profile read policy.
```

### 12.2 Component inventory

| Component | Status | Notes |
|---|---|---|
| `src/routes/onboarding.tsx` | **NEW** | `beforeLoad: requireAuth`; role-switches journey |
| `AppShell` standalone branch | **EDIT** | render `/onboarding` bare (post-auth, no chrome) |
| `src/stores/onboarding-store.ts` | **NEW** | Zustand; optimistic step state; db writes |
| `OnboardingShell` (progress, XP, skip) | **NEW** | `src/components/onboarding/` |
| Step components (C1–C6, M1–M7; shared Welcome/Profile/Finish) | **NEW** | ~8 files after sharing |
| Confetti + new keyframes | **NEW** | CSS-only, one file |
| Badge row on `/profile` | **EDIT** | small addition under avatar card |
| Resume banner + first-day checklist | **EDIT** | extends existing dashboard getting-started block |
| `AddLeadDialog`, `Progress`, `Carousel`, `TenaciousButton`, `TenaciousInput`, `ResponsiveDialog`, avatar upload (`uploadAvatarImage`), invite-token flow | **REUSE** | unchanged |

### 12.3 Analytics events (client-side, for completion tuning)

`onboarding_started`, `onboarding_step_completed {step, xp, ms_on_step}`, `onboarding_step_skipped {step}`, `onboarding_abandoned {last_step}`, `onboarding_completed {total_ms, xp}`, `onboarding_resumed {from_step}`, `first_day_item_completed {item}`. Even without a vendor, logging to a `onboarding_events` table (or reusing the audit-log pattern) enables funnel analysis of drop-off per step.

### 12.4 Rollout

1. Ship behind a `system_settings` flag (`onboarding_enabled`) — the table and its read policy already exist.
2. Dogfood: superadmin resets own `onboarding` to null, runs both journeys (role-switch via a temp test account for consultant flow).
3. Enable for new registrations only (existing users all have `onboarding = null` too — gate additionally on `created_at > <ship date>` at first to avoid surprising the current team, then decide whether to invite existing users via the resume banner).
4. Watch step-level drop-off for two weeks; the ≤90s budget and skip rates tell you which step to cut or split.

---

*End of design document.*
