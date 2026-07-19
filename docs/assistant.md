# Assistant — Usability Improvement Plan (No AI)

## 2. Make commands discoverable

The command syntax (`/todo`, `/add note to NAME: TEXT`, `/move NAME to STAGE`, `/call NAME`,
`broadcast TEXT`) is the assistant's most powerful feature and is **invisible** — nothing in
the UI teaches it.

- **`/help` command + "What can you do?" intent** — reply with the full command and intent
  list for the user's role. This is ~30 lines in `intent.ts` and doubles discoverability.
- **Slash-command palette**: `InputRow.tsx` already autocompletes _people_ after `/`, `call `,
  `note `… — extend it so that typing a bare `/` first shows the **commands** themselves
  (`/todo`, `/call`, `/move`, `/add note`) with a one-line description, then falls through to
  people autocomplete. Users learn the syntax by using it.
- **Teach in the fallback**: the "I didn't understand" response (`FallbackRoutingPanel`)
  should include 1–2 example commands ("Try `/call Maria` or `/move Juan to reserved`"),
  not only navigation buttons.
- **Morning briefing footer**: append one rotating tip ("💡 Tip: type `/todo` to jot a task").
  The briefing already fires once per session (`ChatCanvas.tsx:115`) — free real estate.

## 3. Forgiving command parsing

Commands currently require exact prefixes. Cheap wins, still zero AI:

- Accept natural variants via the same regex table: `call maria`, `note juan: talked on FB`,
  `move ana to reserved` **without** the slash. The parser already fuzzy-matches names and
  stages — only the prefixes are rigid.
- **Did-you-mean for stages**: `/move X to reserve` fails with a list of all stages. Reuse
  the existing fuzzy matcher (`fuzzy.ts`) against `STAGE_LABELS` and offer the top match as
  a confirm button: "Did you mean **Reserved**? [Yes] [Show all stages]".
- **Did-you-mean for commands**: `/tood buy load` → "Did you mean `/todo`?"

## 4. Persist what matters to Supabase

Two datasets live only in localStorage (`assistant-store.ts`, Zustand persist):

- **Team links** (`links`) — described as "team links" but each browser has its own copy; a
  manager adding a link in `LinksLibraryAdminPanel` shares it with **nobody**. This is a
  data-loss bug wearing a feature costume. Move to a `team_links` table (id, label, url,
  category, created_by) with the same RLS pattern as projects; managers write, everyone reads.
- **Todos** — per-user, so localStorage is defensible, but they vanish when the phone clears
  storage or the user switches devices. A `todos` table (user_id, text, done, created_at)
  makes `/todo` trustworthy. Do links first; todos second.

Chat **messages** staying local is fine — they're ephemeral by nature. But add a visible
**"Clear conversation"** action (menu in `AssistantPage` header); today the history grows
forever in localStorage with no way to reset it.

## 5. Deep-link the panels (assistant as the app's switchboard)

`ConsoleGrid` already has an unused `highlightPanel` prop ("kept for future panel deep-links",
`AssistantPage.tsx:96`) and a `?panel=X` query param that only half-works. Finish it:

- `?panel=expiry` → console mode, that panel **expanded and scrolled into view**, others
  collapsed. Works on desktop too, not just mobile.
- Then use it everywhere: notifications about expiring leads link to
  `/assistant?panel=expiry`; the dashboard's "3 stagnant leads" stat links to
  `/assistant?panel=stagnant`; a reversion-request notification lands the manager directly
  on `?panel=reversion_inbox`.

This turns existing panels into destinations instead of things you must know to ask for.

## 6. Badge honesty and panel signals

- The Assistant nav badge is the **notification** unread count — but tapping Assistant lands
  on **chat**, not notifications. Either land on the Notifications tab when
  `unreadCount > 0`, or show the badge count inside the chat header as a "🔔 3" chip that
  switches tabs. Right now the badge advertises something two taps away.
- **Console tab badge**: `ReversionInboxPanel` already computes a pending count; `ExpiryWarnings`
  and `TeamGuard` know their counts too. Surface a summed "needs attention" count on the
  Console tab switcher so users know to look without expanding panels.

## 7. Mobile ergonomics (most usage is mobile)

- **Chips overflow**: 6 suggestion chips render below the input (`ChatCanvas.tsx:514`) —
  on a small screen verify they horizontally scroll rather than wrap and push the input up.
  One row, scrollable, is the right shape.
- **Context-sensitive chips**: chips are static per role. Make them react to state with plain
  `if`s — if `expiring.length > 0`, the first chip becomes "⚠️ 2 expiring leads"; after
  16:00 Manila, show "Tomorrow's agenda". Rule-based ≠ static.
- **Tap-to-copy phone** in `EntityPopover` next to the masked number (managers on desktop
  can't `tel:` — copy is the useful action there).

## 8. Trim / de-risk

- **Typewriter effect**: character-by-character animation (`ChatBubble.tsx:25`) makes a
  _rule-based_ assistant feel slower than it is — the answer is already computed. Recommend
  cutting it to a simple fade-in, or capping it at ~300ms total regardless of length.
  (Reduced-motion users already skip it; that's telling.)
- **Overlapping intent regexes**: `goal|target|progress` (consultant) vs `goal|pace|projection`
  (manager) — a manager typing "goal" gets whichever pattern is checked first. Document the
  precedence in `intent.ts` and order manager-specific patterns before inherited consultant
  ones deliberately (it works today by accident of array order).
- **Voice input**: Web Speech API (`en-PH`) is Chrome-only and flaky offline. Keep it, but
  hide the mic button when `webkitSpeechRecognition` is absent instead of failing on tap.

---

## Suggested order of execution

| #   | Item                                                  | Effort | Impact                               |
| --- | ----------------------------------------------------- | ------ | ------------------------------------ |
| 1   | Route dead intents to real pages (or delete manning)  | S      | High — removes broken chips          |
| 2   | `/help` + slash-command palette + fallback examples   | S      | High — discoverability               |
| 3   | Team links → Supabase table                           | M      | High — fixes silent data-sharing bug |
| 4   | Panel deep-links (`?panel=`) + notification links     | M      | High — assistant becomes the hub     |
| 5   | Forgiving parsing (no-slash variants, did-you-mean)   | S      | Med                                  |
| 6   | Badge → notifications tab landing; console badge      | S      | Med                                  |
| 7   | Context-sensitive chips                               | S      | Med                                  |
| 8   | Todos → Supabase, clear-conversation, typewriter trim | S–M    | Low–Med                              |

Items 1, 2, and 5 touch only `intent.ts`, `ChatWidget.tsx`, and `InputRow.tsx` — no schema
changes, shippable in one pass.
