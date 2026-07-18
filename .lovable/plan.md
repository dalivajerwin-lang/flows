# Assistant Page — Build Plan

Scope is large. I'll ship it in one pass but break the code into small, focused files so nothing bloats. Everything reuses existing zustand stores (`leads-store`, `pipeline-store`, `schedule-store`, `auth-store`, `settings-store`) and existing dialog flows — no new business rules.

## 1. Foundation

- `src/stores/assistant-store.ts` — mode toggle (`conversational` | `console`), `consoleExpanded`, chat thread, todo list, briefing-shown-this-session flag, persisted via `zustand/middleware/persist` (localStorage key `tenacious:assistant`).
- `src/stores/links-store.ts` + `src/stores/projects-admin-store.ts` — CRUD stores for Links Library and Project Management (persisted). Seed with existing mock data if any.
- `src/stores/notifications-store.ts` — feed (unread/read, deep-link path), if not already present. Reuses existing types.
- Extend `auth-store` only if `role` isn't already exposed (Consultant vs Manager).

## 2. Route + Layout

- Rewrite `src/routes/assistant.tsx` to a thin route that renders `<AssistantPage />`.
- `src/components/assistant/AssistantPage.tsx`
  - Reads `mode` from store + viewport (`useMediaQuery('(min-width: 1024px)')`).
  - Mobile/tablet: segmented control at top, 150ms fade between `<ConsoleGrid />` and `<ChatCanvas />`.
  - Desktop: split view — left `ConsoleGrid` (2-col), right `ChatCanvas` fixed 480px. `Hide Console` toggle collapses to centered 720px chat.

## 3. Console Grid (Part A)

- `src/components/assistant/console/PanelCard.tsx` — reusable white card w/ collapsible accordion, `defaultExpanded` prop.
- Role-gated panel set:
  - Consultant: `DailyAgendaPanel`, `ExpiryWarningsPanel`, `StagnantLeadsPanel`, `GoalTrackerPanel` (imports existing dashboard tracker), `NotificationCenterPanel`, `LinksLibraryPanel` (read-only).
  - Manager: `TeamGuardPanel`, `BottleneckPanel`, `GoalPaceCalculatorPanel`, `NotificationCenterPanel`, `LinksLibraryAdminPanel`, `ProjectAdminPanel`, `ReversionInboxPanel` (move from wherever it lives), `TopPerformerPanel` (last-5-days gate w/ Asia/Manila).
- Each panel derives data from existing selectors; inline actions call existing store actions/dialogs (`openConfirmPaymentDialog`, `openExtensionDialog`, `openStageTransitionModal`, `openReversionModal`, etc.).
- Empty states as spec'd.

## 4. Chat Canvas (Part B)

- `src/components/assistant/chat/ChatCanvas.tsx` — thread + input + suggestion chips.
- Glassmorphic AI bubbles, solid `#069494` user bubbles.
- `Avatar.tsx` — 2px pulsing halo (teal idle → red when high-priority condition true).
- `TypingIndicator.tsx` — 3 dots, 150ms stagger.
- `TypewriterText.tsx` — 15ms/char streaming; auto-scroll during stream.
- Mobile: `visualViewport` listener pins input above keyboard.
- Mic: `SpeechRecognition` (feature-detect, hide otherwise). Speaker: `SpeechSynthesis` toggle per bubble.
- Slash / action-word autocomplete drop-up (fuzzy match own/authorized lead names).

## 5. Intent Engine (Part B — no external calls)

- `src/lib/assistant/intent.ts` — closed keyword map. Commands parsed first:
  - `call [name]`, `add note to [name]: [text]`, `move [name] to [stage]`, `todo [text]`, `broadcast [msg]` (manager).
- Keyword → widget map (per role) with embedded `PanelCard`s reused from Console.
- `move` runs Phase 4 transition machine INLINE (embed existing `StageTransitionModal` content as a chat widget).
- Unknown input → fallback message + role-appropriate suggestion chips.

## 6. Morning Briefing

- Fires once per session (sessionStorage flag). Role-specific template pulling live selector values, time-of-day greeting.

## 7. Inline Actions + Entity Chips

- `ChatThread` uses a single delegated click listener on `[data-action]` buttons.
- Post-typewriter (never mid-stream) pass: `scanForEntities(text, authorizedLeads, agents)` returns segments; longest-match-first, case-insensitive. Renders `<EntityChip type="lead|agent" id=… />`.
- `EntityPopover.tsx` — glassmorphic, scale-fade 150ms, anchor-flip logic (above by default, flip below near top, side-clamp 16px, bottom-anchored on <400px width). One at a time; dismiss on outside-tap/scroll/✕. Resolves by `data-id` at render time; shows "no longer available" fallback.

## 8. Reports (widgets)

- `PersonalActivityReport` + `TeamActivityReport` widgets w/ Export PDF (window.print of the widget only via a print CSS scope) and Copy (markdown table via `navigator.clipboard`).

## 9. Wiring & Polish

- Add `Assistant` link/badge to sidebar if missing; notification badge deep-links to `/assistant?panel=notifications` and auto-expands that panel + scrolls to it.
- Persist mode + todos + links + projects.
- Ensure all interactive controls ≥44×44px on mobile.

## Files created / touched (approx)

```
src/routes/assistant.tsx                       (rewrite, thin)
src/stores/assistant-store.ts                  (new)
src/stores/links-store.ts                      (new)
src/stores/projects-admin-store.ts             (new)
src/stores/notifications-store.ts              (new/extend)
src/lib/assistant/intent.ts                    (new)
src/lib/assistant/entities.ts                  (new — longest-match scanner)
src/lib/assistant/fuzzy.ts                     (new — small fuzzy matcher)
src/components/assistant/AssistantPage.tsx
src/components/assistant/SegmentedModeToggle.tsx
src/components/assistant/console/PanelCard.tsx
src/components/assistant/console/*Panel.tsx   (~13 panels)
src/components/assistant/chat/ChatCanvas.tsx
src/components/assistant/chat/ChatBubble.tsx
src/components/assistant/chat/TypingIndicator.tsx
src/components/assistant/chat/TypewriterText.tsx
src/components/assistant/chat/Avatar.tsx
src/components/assistant/chat/InputRow.tsx
src/components/assistant/chat/SuggestionChips.tsx
src/components/assistant/chat/EntityChip.tsx
src/components/assistant/chat/EntityPopover.tsx
src/components/assistant/chat/widgets/*.tsx    (report + goal + inline stage-move)
```

## Out of scope (per spec)

- Broadcast delivery system (Phase 7) — command only logs intent + shows toast.
- No external AI calls, no chart library, no image gen.

## Verification

- Typecheck the project.
- Manually poke `/assistant` on mobile viewport + desktop split.
- Confirm mode persists across reloads, briefing fires once per session, entity chips resolve to popovers, `move` command opens the stage transition flow inline.

Shall I proceed?
