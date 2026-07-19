import type { AssistantLead, AssistantProfile } from "@/lib/assistant/lead-search";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/constants";
import { fuzzyFind } from "./fuzzy";

export type IntentResult =
  | { kind: "unknown" }
  | { kind: "reply"; text: string; widgetKey?: string }
  | { kind: "command_call"; leadId: string; leadName: string }
  | { kind: "command_note"; leadId: string; leadName: string; note: string }
  | { kind: "command_move"; leadId: string; leadName: string; toStage: Stage }
  | { kind: "command_todo"; text: string }
  | { kind: "command_broadcast"; message: string }
  | { kind: "widget"; widgetKey: string; text: string };

const consultantMap: Array<[RegExp, string, string]> = [
  [/\b(agenda|today|schedule)\b/i, "agenda", "Here is today's agenda."],
  [/\b(expir|warning|deadline)\b/i, "expiry", "Live expiry warnings for your leads:"],
  [/\b(stagnant|inactive)\b/i, "stagnant", "These leads haven't been touched in 7+ days:"],
  [/\b(goal|target|progress)\b/i, "goal", "Here is your personal goal tracker."],
  [/\bnotifications?\b/i, "notifications", "Your notification feed:"],
  [/\b(links|resources)\b/i, "links", "Team links library:"],
  [
    /\b(report|weekly report|my activity)\b/i,
    "personal_report",
    "Here's a quick look at your month — full breakdown on the Reports page:",
  ],
  [/\b(rank|leaderboard|position)\b/i, "leaderboard_personal", "Here's where you stand:"],
  [
    /\b(shift|manning|booth)\b/i,
    "manning_personal",
    "Manning and booth duty live on the Schedule page:",
  ],
];

const managerMap: Array<[RegExp, string, string]> = [
  [/\b(idle|team guard|consultants)\b/i, "team_guard", "Team Guard: consultants inactive > 72h."],
  [/\b(bottleneck|documentation|lag)\b/i, "bottleneck", "Documentation bottleneck alerts:"],
  [/\b(goal|pace|projection)\b/i, "goal_pace", "Team goal pace calculator:"],
  [/\b(reversion|request|inbox)\b/i, "reversion_inbox", "Pending stage reversion requests:"],
  [/\b(projects|calculations)\b/i, "projects_admin", "Project management (admin):"],
  [/\b(links|library)\b/i, "links_admin", "Team links library (admin):"],
  [
    /\b(report|weekly summary|performance)\b/i,
    "team_report",
    "Here's the team snapshot — full breakdown on the Reports page:",
  ],
  [/\b(rank|leaderboard)\b/i, "leaderboard_team", "Here's the current standing:"],
  [/\b(shift|manning|booth)\b/i, "manning_team", "The manning roster lives on the Schedule page:"],
  [/\bnotifications?\b/i, "notifications", "Your notification feed:"],
];

export function parseIntent(
  input: string,
  role: "manager" | "superadmin" | "property_consultant",
  authorizedLeads: AssistantLead[],
): IntentResult {
  const raw = input.trim();
  if (!raw) return { kind: "unknown" };
  const lower = raw.toLowerCase();
  const isManager = role !== "property_consultant";

  // --- Commands ---
  // broadcast (manager only)
  if (isManager) {
    const m = raw.match(/^broadcast\s+(.+)$/i);
    if (m) return { kind: "command_broadcast", message: m[1].trim() };
  }
  // todo
  const todo = raw.match(/^\/?todo\s+(.+)$/i);
  if (todo) return { kind: "command_todo", text: todo[1].trim() };

  // add note to X: text
  const note = raw.match(/^(?:\/)?add\s+note\s+to\s+(.+?):\s*(.+)$/i);
  if (note) {
    const [, nameQ, text] = note;
    const [lead] = fuzzyFind(authorizedLeads, nameQ, (l) => l.full_name, 1);
    if (lead)
      return { kind: "command_note", leadId: lead.id, leadName: lead.full_name, note: text };
    return {
      kind: "reply",
      text: `I couldn't find a lead matching "${nameQ}" in your authorized list.`,
    };
  }

  // move X to STAGE
  const move = raw.match(/^(?:\/)?move\s+(.+?)\s+to\s+(.+)$/i);
  if (move) {
    const [, nameQ, stageQ] = move;
    const stageKey = STAGES.find(
      (s) =>
        s.toLowerCase() === stageQ.trim().toLowerCase() ||
        STAGE_LABELS[s].toLowerCase() === stageQ.trim().toLowerCase(),
    );
    if (!stageKey) {
      return {
        kind: "reply",
        text: `Unknown stage "${stageQ}". Try: ${STAGES.map((s) => STAGE_LABELS[s]).join(", ")}.`,
      };
    }
    const [lead] = fuzzyFind(authorizedLeads, nameQ, (l) => l.full_name, 1);
    if (!lead) return { kind: "reply", text: `Couldn't find lead "${nameQ}".` };
    return { kind: "command_move", leadId: lead.id, leadName: lead.full_name, toStage: stageKey };
  }

  // call X
  const call = raw.match(/^(?:\/)?call\s+(.+)$/i);
  if (call) {
    const nameQ = call[1].trim();
    const [lead] = fuzzyFind(authorizedLeads, nameQ, (l) => l.full_name, 1);
    if (!lead) return { kind: "reply", text: `Couldn't find lead "${nameQ}".` };
    return { kind: "command_call", leadId: lead.id, leadName: lead.full_name };
  }

  // --- Keyword widget map ---
  const map = isManager ? [...managerMap, ...consultantMap] : consultantMap;
  for (const [re, key, prefix] of map) {
    if (re.test(lower)) {
      return { kind: "widget", widgetKey: key, text: prefix };
    }
  }
  return { kind: "unknown" };
}

export function suggestionChips(role: "manager" | "superadmin" | "property_consultant"): string[] {
  return role === "property_consultant"
    ? [
        "What's on my agenda today?",
        "Any expiring leads?",
        "Show my stagnant leads",
        "How's my goal progress?",
        "My rank",
        "Team links",
      ]
    : [
        "Any idle consultants?",
        "Show documentation bottlenecks",
        "Team goal pace",
        "Pending reversions",
        "Team performance report",
        "Full leaderboard",
      ];
}

/** Build the morning briefing text from live counts. */
export function buildBriefing(params: {
  name: string;
  role: "manager" | "superadmin" | "property_consultant";
  trippings: number;
  expiring: number;
  stagnant: number;
  goalPct: number;
  pendingSales: number;
  idleConsultants: number;
  reversions: number;
  teamGoalPct: number;
}): string {
  const g = greetingWord();
  if (params.role === "property_consultant") {
    return `${g}, ${params.name}! Today you have ${params.trippings} trippings scheduled, ${params.expiring} expiring reservations, and ${params.stagnant} stagnant leads. You are at ${params.goalPct}% of your monthly sales target. Let's get to work!`;
  }
  return `${g}, Manager ${params.name}! Today the team has ${params.pendingSales} closed sales pending verification, ${params.idleConsultants} idle consultants, and ${params.reversions} active reversion requests. The monthly team goal is at ${params.teamGoalPct}% pace. What would you like to review?`;
}

export function greetingWord(): string {
  const h = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    hour12: false,
    timeZone: "Asia/Manila",
  }).format(new Date());
  const hh = parseInt(h, 10);
  if (hh < 12) return "Good morning";
  if (hh < 18) return "Good afternoon";
  return "Good evening";
}

export function buildLeadEntityRefs(leads: AssistantLead[]) {
  return leads.map((l) => ({ id: l.id, name: l.full_name, type: "lead" as const }));
}
export function buildAgentEntityRefs(profiles: AssistantProfile[]) {
  return profiles.map((p) => ({
    id: p.id,
    name: p.display_name ?? "Unknown",
    type: "agent" as const,
  }));
}
