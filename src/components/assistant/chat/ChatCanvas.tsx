import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAssistantStore, type ChatMessage } from "@/stores/assistant-store";
import { useVisibleLeads } from "@/stores/leads-store";
import { useProfiles } from "@/hooks/use-profiles";
import { useProjects } from "@/hooks/use-projects";
import {
  parseIntent,
  suggestionChips,
  buildBriefing,
  buildLeadEntityRefs,
  buildAgentEntityRefs,
} from "@/lib/assistant/intent";
import { scanEntities, type EntityRef } from "@/lib/assistant/entities";
import { fuzzyFind } from "@/lib/assistant/fuzzy";
import {
  findAssistantLeadMatches,
  formatLeadDetails,
  formatLeadSuggestions,
  getAssistantLeadLookupQuery,
  getAssistantVisibleLeads,
  isLeadSelectionReply,
} from "@/lib/assistant/lead-search";
import { addNote } from "@/stores/leads-store";
import {
  selectPriorityItems,
  selectVerifiedSalesValue,
  selectPendingSales,
} from "@/lib/dashboard-selectors";
import { compactPeso } from "@/lib/format-currency";
import { selectLeaderboard } from "@/lib/reports/selectors";
import { monthPeriod } from "@/lib/reports/time-filter";
import { ChatBubble } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";
import { InputRow } from "./InputRow";
import { EntityPopover } from "./EntityPopover";
import { STAGE_LABELS, type Stage } from "@/lib/constants";
import { transitionLead } from "@/stores/pipeline-store";
import { notifyMany } from "@/lib/notify";
import { db as supa } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { AssistantAvatar } from "./AssistantAvatar";
import { cn } from "@/lib/utils";

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Intents whose full view is a real page, not a chat panel. The reply carries
 * a one-line summary (added in send()) plus a navigation button — the
 * assistant routes, the page owns the data.
 */
const PAGE_LINK_WIDGETS: Record<string, { to: string; label: string }> = {
  personal_report: { to: "/reports", label: "Open Reports" },
  team_report: { to: "/reports", label: "Open Reports" },
  leaderboard_personal: { to: "/leaderboard", label: "Open Leaderboard" },
  leaderboard_team: { to: "/leaderboard", label: "Open Leaderboard" },
  manning_personal: { to: "/schedule", label: "Open Schedule" },
  manning_team: { to: "/schedule", label: "Open Schedule" },
};

export function ChatCanvas() {
  const profile = useCurrentProfile();
  const isManager = isManagerish(profile?.role ?? null);
  const role = profile?.role ?? "property_consultant";
  const { db, isLoading: dbLoading } = useDashboardData();
  // Pending stage-reversion count for the morning briefing (managers only).
  const { data: pendingReversions = 0 } = useQuery({
    queryKey: ["stage_reversion_requests", "pending-count"],
    enabled: isManager,
    queryFn: async () => {
      const { count, error } = await supa
        .from("stage_reversion_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });
  const { leads: realLeads } = useVisibleLeads();
  const { data: realProfiles = [] } = useProfiles();
  const { data: realProjects = [] } = useProjects();
  const messagesMap = useAssistantStore((s) => s.messages);
  const messages = profile ? (messagesMap[profile.id] ?? []) : [];
  const pushMessage = useAssistantStore((s) => s.pushMessage);
  const upsertBriefing = useAssistantStore((s) => s.upsertBriefing);
  const briefingShownAt = useAssistantStore((s) => s.briefingShownAt);
  const markBriefingShown = useAssistantStore((s) => s.markBriefingShown);
  const addTodo = useAssistantStore((s) => s.addTodo);

  const [thinking, setThinking] = useState(false);
  const [popover, setPopover] = useState<{
    type: "lead" | "agent";
    id: string;
    rect: DOMRect;
  } | null>(null);
  const [widgetStates, setWidgetStates] = useState<
    Record<string, { step: "reason" | "confirm" | "processing" | "done" }>
  >({});

  const authorizedLeads = useMemo(() => {
    return getAssistantVisibleLeads({ leads: realLeads, profile });
  }, [realLeads, profile]);

  const entityRefs: EntityRef[] = useMemo(() => {
    const leadRefs = buildLeadEntityRefs(authorizedLeads);
    const agentRefs = isManager
      ? buildAgentEntityRefs(
          db.profiles.filter((p) => p.role === "property_consultant" && p.is_active),
        )
      : [];
    return [...leadRefs, ...agentRefs];
  }, [authorizedLeads, db.profiles, isManager]);

  const priorityAlert = useMemo(() => {
    if (!profile) return false;
    const priority = selectPriorityItems(db, { kind: "consultant", userId: profile.id });
    const hasUrgent = priority.some(
      (p) => p.kind === "reservation_expiring" || p.kind === "crf_expiring",
    );
    if (hasUrgent) return true;
    if (isManager) {
      return selectPendingSales(db).length > 0;
    }
    return false;
  }, [db, profile, isManager]);

  // Daily briefing — at most once per calendar day per user (persisted), and
  // refreshed on a new login (sign-out purges briefingShownAt). Delivered via
  // upsertBriefing, which REPLACES the previous briefing bubble in place, so a
  // re-fire can never stack duplicate greetings in the saved thread. All other
  // AI output only ever happens in response to the user (send()).
  useEffect(() => {
    if (!profile || dbLoading) return;
    const last = briefingShownAt[profile.id];
    if (last && new Date(last).toDateString() === new Date().toDateString()) return;

    const priority = selectPriorityItems(db, { kind: "consultant", userId: profile.id });
    const trippings = db.appointments.filter(
      (a) =>
        a.consultant_id === profile.id &&
        a.appointment_type === "client_tripping" &&
        new Date(a.starts_at).toDateString() === new Date().toDateString(),
    ).length;
    const expiring = priority.filter(
      (p) => p.kind === "reservation_expiring" || p.kind === "crf_expiring",
    ).length;
    const stagnant = priority.filter((p) => p.kind === "stagnant").length;
    const verified = selectVerifiedSalesValue(db, { kind: "consultant", userId: profile.id });
    const teamVerified = selectVerifiedSalesValue(db, { kind: "team" });
    const target = profile.personal_monthly_target || 1;
    const teamGoal = db.team_goals[0]?.target_amount || 1;
    const goalPct = Math.round((verified / target) * 100);
    const teamGoalPct = Math.round((teamVerified / teamGoal) * 100);
    const pendingSales = selectPendingSales(db).length;
    const idleConsultants = db.profiles.filter(
      (p) =>
        p.is_active &&
        p.role === "property_consultant" &&
        (!p.last_login_at || Date.now() - new Date(p.last_login_at).getTime() > 72 * 3_600_000),
    ).length;
    const reversions = pendingReversions;

    const text = buildBriefing({
      name: profile.display_name.split(" ")[0],
      role,
      trippings,
      expiring,
      stagnant,
      goalPct: Math.min(goalPct, 999),
      pendingSales,
      idleConsultants,
      reversions,
      teamGoalPct: Math.min(teamGoalPct, 999),
    });
    upsertBriefing(profile.id, {
      id: uid(),
      role: "ai",
      text,
      createdAt: Date.now(),
      entityIds: { leads: [], agents: [] },
    });
    markBriefingShown(profile.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, dbLoading]);

  const send = async (text: string) => {
    if (!profile || !text.trim()) return;
    pushMessage(profile.id, { id: uid(), role: "user", text, createdAt: Date.now() });
    setThinking(true);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 400));
    let replyText = "";
    let widget: ChatMessage["widget"];

    const latestAiMessage = [...messages].reverse().find((m) => m.role === "ai");
    const selectedIndex = isLeadSelectionReply(text);
    if (selectedIndex && latestAiMessage?.meta?.leadSuggestionIds) {
      const leadId = latestAiMessage.meta.leadSuggestionIds[selectedIndex - 1];
      const lead = authorizedLeads.find((l) => l.id === leadId);
      const replyText = lead
        ? formatLeadDetails(lead, realProjects, realProfiles, isManager)
        : "I could not find a matching client in your accessible leads.";
      const segments = scanEntities(replyText, entityRefs);
      setThinking(false);
      pushMessage(profile.id, {
        id: uid(),
        role: "ai",
        text: replyText,
        createdAt: Date.now(),
        entityIds: {
          leads: segments
            .filter((s) => s.kind === "chip" && s.type === "lead")
            .map((s) => (s as { id: string }).id),
          agents: segments
            .filter((s) => s.kind === "chip" && s.type === "agent")
            .map((s) => (s as { id: string }).id),
        },
      });
      return;
    }

    const lookupQuery = getAssistantLeadLookupQuery(text);
    if (lookupQuery) {
      const matches = findAssistantLeadMatches(authorizedLeads, lookupQuery, 5);
      let replyText = "";
      let meta: ChatMessage["meta"];

      if (matches.length === 0) {
        replyText = "I could not find a matching client in your accessible leads.";
      } else if (matches.length === 1 || matches[0].reason === "exact") {
        replyText = formatLeadDetails(matches[0].lead, realProjects, realProfiles, isManager);
      } else {
        replyText = formatLeadSuggestions(matches, realProjects, realProfiles, isManager);
        meta = { leadSuggestionIds: matches.map((match) => match.lead.id) };
        widget = { kind: "lead_suggestions", leadIds: matches.map((match) => match.lead.id) };
      }

      const segments = scanEntities(replyText, entityRefs);
      setThinking(false);
      pushMessage(profile.id, {
        id: uid(),
        role: "ai",
        text: replyText,
        createdAt: Date.now(),
        entityIds: {
          leads: segments
            .filter((s) => s.kind === "chip" && s.type === "lead")
            .map((s) => (s as { id: string }).id),
          agents: segments
            .filter((s) => s.kind === "chip" && s.type === "agent")
            .map((s) => (s as { id: string }).id),
        },
        meta,
      });
      return;
    }

    const intent = parseIntent(text, role, authorizedLeads);

    switch (intent.kind) {
      case "unknown":
        replyText = "I specialized in CRM data...";
        widget = { kind: "panel", panelKey: "fallback_routing" };
        break;
      case "reply":
        replyText = intent.text;
        break;
      case "widget": {
        // Page-routed intents: these have no chat panel — answer with a live
        // one-liner and a button to the page that owns the full view.
        const pageLink = PAGE_LINK_WIDGETS[intent.widgetKey];
        if (pageLink) {
          replyText = intent.text;
          if (intent.widgetKey === "personal_report") {
            const verified = selectVerifiedSalesValue(db, {
              kind: "consultant",
              userId: profile.id,
            });
            const target = profile.personal_monthly_target || 0;
            replyText += target
              ? ` You're at ${compactPeso(verified)} verified this month — ${Math.min(Math.round((verified / target) * 100), 999)}% of your ${compactPeso(target)} target.`
              : ` You're at ${compactPeso(verified)} verified this month.`;
          } else if (intent.widgetKey === "team_report") {
            const teamVerified = selectVerifiedSalesValue(db, { kind: "team" });
            const pending = selectPendingSales(db).length;
            replyText += ` Team is at ${compactPeso(teamVerified)} verified this month, with ${pending} sale(s) pending verification.`;
          } else if (intent.widgetKey === "leaderboard_personal") {
            const rows = selectLeaderboard(db, monthPeriod());
            const mine = rows.find((r) => r.consultant.id === profile.id);
            replyText = mine
              ? `You're #${mine.rank} of ${rows.length} this month with ${compactPeso(mine.closedValue)} in verified sales.`
              : "No verified sales on the board for you yet this month — the full standings are one tap away.";
          } else if (intent.widgetKey === "leaderboard_team") {
            const rows = selectLeaderboard(db, monthPeriod());
            const top = rows.find((r) => r.closedValue > 0);
            replyText = top
              ? `🥇 ${top.consultant.display_name} leads this month with ${compactPeso(top.closedValue)} verified across ${rows.length} consultant(s).`
              : "No verified sales on the board yet this month.";
          }
          widget = { kind: "page_link", to: pageLink.to, label: pageLink.label };
          break;
        }
        replyText = intent.text || " ";
        widget = { kind: "panel", panelKey: intent.widgetKey };
        break;
      }
      case "command_todo":
        addTodo(profile.id, intent.text);
        replyText = `✅ Added to your todo list: "${intent.text}".`;
        break;
      case "command_call": {
        const lead = authorizedLeads.find((l) => l.id === intent.leadId);
        if (!lead?.contact_number) {
          replyText = `${intent.leadName} has no contact number on record.`;
          break;
        }
        window.location.href = `tel:${lead.contact_number}`;
        // Actually log the call on the lead's record — same table the schedule
        // and pipeline flows write activities to.
        const { error: callErr } = await supa.from("audit_trail").insert({
          lead_id: lead.id,
          actor_id: profile.id,
          type: "call_logged",
          summary: `Called ${lead.full_name} via assistant`,
          meta: { source: "assistant", contact_number: lead.contact_number },
        });
        replyText = callErr
          ? `📞 Calling ${intent.leadName} — but the call activity could not be logged. Please add a note manually.`
          : `📞 Calling ${intent.leadName} — logged a call activity on their record.`;
        break;
      }
      case "command_note": {
        const [lead] = authorizedLeads.filter((l) => l.id === intent.leadId);
        if (lead) {
          addNote(lead.id, intent.note, false);
          replyText = `📝 Note added to ${intent.leadName}: "${intent.note}".`;
        } else {
          replyText = `Couldn't add note — lead not found.`;
        }
        break;
      }
      case "command_move":
        widget = { kind: "stage_transition", leadId: intent.leadId, toStage: intent.toStage };
        replyText = `Confirm moving ${intent.leadName} to ${STAGE_LABELS[intent.toStage as Stage]}:`;
        break;
      case "command_broadcast": {
        if (!isManager) {
          replyText = "Only managers can send broadcasts.";
          break;
        }
        // Real Supabase path — same flow as the Broadcast Composer, so the
        // full-screen overlay and notification feed fire for every consultant.
        const { data: bc, error: bcErr } = await supa
          .from("broadcasts")
          .insert({
            sender_id: profile.id,
            message: intent.message,
            image_url: null,
            link_url: null,
            file_name: null,
            file_url: null,
            file_size: null,
          })
          .select()
          .maybeSingle();
        if (bcErr || !bc) {
          replyText = "⚠️ Broadcast failed to send. Please try again.";
          break;
        }
        const { data: consultantRows = [] } = await supa
          .from("profiles")
          .select("id")
          .eq("role", "property_consultant")
          .eq("is_active", true);
        const consultantIds = (consultantRows as { id: string }[]).map((c) => c.id);
        await notifyMany(consultantIds, "broadcast", {
          title: "New broadcast",
          body: `${profile.display_name}: ${intent.message.slice(0, 80)}`,
          deep_link_path: "/",
          meta: { broadcast_id: bc.id },
        });
        queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
        toast.success(`Broadcast sent to ${consultantIds.length} consultant(s).`);
        replyText = `📢 Broadcast sent to ${consultantIds.length} consultant(s). They'll acknowledge on their next screen.`;
        break;
      }
    }
    const segments = scanEntities(replyText, entityRefs);
    const entityIds = {
      leads: segments
        .filter((s) => s.kind === "chip" && s.type === "lead")
        .map((s) => (s as { id: string }).id),
      agents: segments
        .filter((s) => s.kind === "chip" && s.type === "agent")
        .map((s) => (s as { id: string }).id),
    };
    setThinking(false);
    pushMessage(profile.id, {
      id: uid(),
      role: "ai",
      text: replyText,
      createdAt: Date.now(),
      widget,
      entityIds,
    });
  };

  const handleTransition = async (
    msgId: string,
    leadId: string,
    toStage: string,
    reason: string,
  ) => {
    if (!profile) return;
    setWidgetStates((s) => ({ ...s, [msgId]: { step: "processing" } }));
    try {
      const result = await transitionLead(
        leadId,
        toStage as Stage,
        { cancellation_reason: reason },
        { id: profile.id, role: profile.role },
      );
      if (result.ok) {
        toast.success(`Moved to ${STAGE_LABELS[toStage as Stage]}`);
      } else {
        toast.error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to transition lead");
    } finally {
      setWidgetStates((s) => ({ ...s, [msgId]: { step: "done" } }));
    }
  };

  const chipMatch = (query: string) => fuzzyFind(authorizedLeads, query, (l) => l.full_name, 5);

  useEffect(() => {
    const onScroll = () => setPopover(null);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, []);

  // Single delegated click listener for the entire chat surface.
  const onDelegatedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case "entity": {
        const type = el.dataset.entityType as "lead" | "agent";
        const id = el.dataset.entityId!;
        setPopover({ type, id, rect: el.getBoundingClientRect() });
        break;
      }
      case "speak": {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        const msg = messages.find((m) => m.id === el.dataset.msgId);
        if (!msg) return;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg.text));
        break;
      }
      case "chip": {
        const text = el.dataset.text;
        if (text) send(text);
        break;
      }
      case "widget-continue": {
        const msgId = el.dataset.msgId!;
        const reasonEl = document.getElementById(
          el.dataset.reasonId!,
        ) as HTMLTextAreaElement | null;
        if (!reasonEl || reasonEl.value.trim().length < 5) return;
        setWidgetStates((s) => ({ ...s, [msgId]: { step: "confirm" } }));
        break;
      }
      case "widget-confirm-transition": {
        const msgId = el.dataset.msgId!;
        const leadId = el.dataset.leadId!;
        const toStage = el.dataset.toStage!;
        const reasonEl = document.getElementById(
          el.dataset.reasonId!,
        ) as HTMLTextAreaElement | null;
        handleTransition(msgId, leadId, toStage, reasonEl?.value ?? "");
        break;
      }
      case "lead-suggestion-select": {
        if (!profile) return;
        const leadId = el.dataset.leadId!;
        const lead = authorizedLeads.find((l) => l.id === leadId);
        const replyText = lead
          ? formatLeadDetails(lead, realProjects, realProfiles, isManager)
          : "I could not find a matching client in your accessible leads.";
        const segments = scanEntities(replyText, entityRefs);
        pushMessage(profile.id, {
          id: uid(),
          role: "ai",
          text: replyText,
          createdAt: Date.now(),
          entityIds: {
            leads: segments
              .filter((s) => s.kind === "chip" && s.type === "lead")
              .map((s) => (s as { id: string }).id),
            agents: segments
              .filter((s) => s.kind === "chip" && s.type === "agent")
              .map((s) => (s as { id: string }).id),
          },
        });
        break;
      }
    }
  };

  return (
    <div
      className="relative flex h-full flex-col bg-[var(--color-background)]"
      onClick={onDelegatedClick}
    >
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-background)] px-4 py-2.5 flex items-center gap-3 shadow-xs z-10 shrink-0">
        <AssistantAvatar priorityAlert={priorityAlert} />
        <div>
          <div className="text-sm font-bold text-[var(--color-text-strong)] flex items-center gap-1.5 leading-none">
            Tenacious AI
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full inline-block",
                priorityAlert
                  ? "bg-[var(--color-error)] animate-pulse"
                  : "bg-[var(--color-success)]",
              )}
            />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)] mt-0.5">
            {priorityAlert ? "Needs attention" : "Ready to assist"}
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 bg-[var(--color-surface-subtle)] space-y-3.5"
        id="chat-thread"
      >
        {/* Static welcome — rendered, never stored, so it can't duplicate. */}
        <div className="flex w-full mb-1 justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-xs border border-[var(--color-border-subtle)] bg-[var(--color-background)] px-4 py-3 text-sm leading-relaxed text-[var(--color-text-strong)] shadow-xs">
            👋 Welcome back! Ask me anything about your team, sales, or CRM data.
          </div>
        </div>
        {messages.map((m, i) => (
          <ChatBubble
            key={m.id}
            message={m}
            entityRefs={entityRefs}
            // Animate only messages that were just created — persisted history
            // must render statically on page load, or every visit looks like
            // the assistant is "sending" its last message again.
            typewriter={
              m.role === "ai" && i === messages.length - 1 && Date.now() - m.createdAt < 5000
            }
            widgetState={widgetStates[m.id]}
          />
        ))}
        {thinking && <TypingIndicator />}
      </div>

      <SuggestionChips role={role} />
      <InputRow onSubmit={send} onQueryPeople={chipMatch} />

      {popover && (
        <EntityPopover
          type={popover.type}
          id={popover.id}
          anchorRect={popover.rect}
          onDismiss={() => setPopover(null)}
        />
      )}
    </div>
  );
}

function SuggestionChips({ role }: { role: "manager" | "superadmin" | "property_consultant" }) {
  const chips = suggestionChips(role);
  return (
    <div className="scrollbar-hide overflow-x-auto border-t border-[var(--color-border-subtle)] px-3 py-2">
      <div className="flex gap-2">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            data-action="chip"
            data-text={c}
            className="shrink-0 rounded-full border border-[var(--color-border-muted)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-text-softer)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// Re-export so pending-sales value can be shown in widgets that import ChatCanvas
export { compactPeso };
