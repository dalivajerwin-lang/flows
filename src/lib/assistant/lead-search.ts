import { differenceInDays, format } from "date-fns";
import { isManagerish } from "@/hooks/use-role";
import { STAGE_LABELS, type Role, type Stage } from "@/lib/constants";

export interface AssistantLead {
  id: string;
  full_name: string;
  contact_number: string;
  stage: string;
  assigned_to: string | null;
  project_id: string | null;
  source: string | null;
  deleted_at: string | null;
  facebook_url?: string | null;
  updated_at: string;
  stage_changed_at: string;
  last_activity_at: string;
}

export interface AssistantProfile {
  id: string;
  role: string;
  display_name?: string | null;
}

export interface AssistantProject {
  id: string;
  name: string;
}

export interface LeadSearchResult {
  lead: AssistantLead;
  score: number;
  reason: "exact" | "starts_with" | "contains" | "phone" | "fuzzy";
}

export function getAssistantVisibleLeads({
  leads,
  profile,
}: {
  leads: AssistantLead[];
  profile: AssistantProfile | null | undefined;
}) {
  if (!profile) return [];
  const activeLeads = leads.filter((lead) => !lead.deleted_at);
  if (isManagerish(profile.role as Role)) return activeLeads;
  return activeLeads.filter((lead) => lead.assigned_to === profile.id);
}

export function findAssistantLeadMatches(leads: AssistantLead[], query: string, limit = 5) {
  const normalizedQuery = normalizeSearchText(query);
  const digits = query.replace(/\D/g, "");
  if (!normalizedQuery && !digits) return [];

  const scored: LeadSearchResult[] = [];
  for (const lead of leads) {
    const name = normalizeSearchText(lead.full_name);
    const phone = lead.contact_number.replace(/\D/g, "");
    let score = 0;
    let reason: LeadSearchResult["reason"] = "fuzzy";

    if (normalizedQuery && name === normalizedQuery) {
      score = 1000;
      reason = "exact";
    } else if (normalizedQuery && name.startsWith(normalizedQuery)) {
      score = 850 - Math.max(0, name.length - normalizedQuery.length);
      reason = "starts_with";
    } else if (normalizedQuery && name.includes(normalizedQuery)) {
      score = 650 - name.indexOf(normalizedQuery);
      reason = "contains";
    } else if (digits.length >= 3 && phone.includes(digits)) {
      score = 600 + Math.min(digits.length, 20);
      reason = "phone";
    } else if (normalizedQuery) {
      const fuzzyScore = tokenFuzzyScore(name, normalizedQuery);
      if (fuzzyScore > 0) {
        score = fuzzyScore;
        reason = "fuzzy";
      }
    }

    if (score > 0) scored.push({ lead, score, reason });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.lead.full_name.localeCompare(b.lead.full_name))
    .slice(0, limit);
}

export function getAssistantLeadLookupQuery(input: string) {
  const raw = input.trim();
  if (!raw) return null;
  if (
    /\b(agenda|today|schedule|expir|warning|deadline|stagnant|inactive|goal|target|progress|notifications?|links|resources|report|rank|leaderboard|shift|manning|booth|idle|team guard|consultants|bottleneck|documentation|lag|pace|projection|reversion|request|inbox|projects|calculations|performance)\b/i.test(
      raw,
    )
  ) {
    return null;
  }

  const keyword = raw.match(/^(?:show|find|open|view|details?\s+(?:of|for)?|client|lead)\s+(.+)$/i);
  if (keyword) return cleanupQuery(keyword[1]);

  if (/^[\p{L}\p{M}' .-]{2,40}$/u.test(raw) && raw.split(/\s+/).length <= 4) {
    return cleanupQuery(raw);
  }

  if (/^[+\d\s().-]{3,20}$/.test(raw)) return cleanupQuery(raw);
  return null;
}

export function isLeadSelectionReply(input: string) {
  const match = input.trim().match(/^(?:#)?([1-5])$/);
  return match ? Number(match[1]) : null;
}

export function formatLeadSuggestions(
  matches: LeadSearchResult[],
  projects: AssistantProject[],
  profiles: AssistantProfile[],
  isManager: boolean,
) {
  const lines = matches.map(({ lead }, index) => {
    const project = projects.find((p) => p.id === lead.project_id)?.name ?? "No project";
    const consultant = profiles.find((p) => p.id === lead.assigned_to)?.display_name;
    const managerSuffix = isManager && consultant ? ` · ${consultant}` : "";
    return `${index + 1}. ${lead.full_name} · ${STAGE_LABELS[lead.stage as Stage]} · ${project}${managerSuffix}`;
  });
  return `I found ${matches.length} matching clients:\n\n${lines.join("\n")}\n\nWhich one do you mean?`;
}

export function formatLeadDetails(
  lead: AssistantLead,
  projects: AssistantProject[],
  profiles: AssistantProfile[],
  isManager: boolean,
) {
  const project = projects.find((p) => p.id === lead.project_id)?.name ?? "No project";
  const consultant = profiles.find((p) => p.id === lead.assigned_to)?.display_name ?? "Unassigned";
  const daysInStage = Math.max(
    0,
    differenceInDays(Date.now(), new Date(lead.stage_changed_at).getTime()),
  );
  const lines = [
    `I found ${lead.full_name}.`,
    "",
    `Stage: ${STAGE_LABELS[lead.stage as Stage]}`,
    `Phone: ${lead.contact_number || "No phone on file"}`,
    `Project: ${project}`,
    `Source: ${lead.source || "Not set"}`,
    `Last updated: ${format(new Date(lead.updated_at), "MMM d")}`,
    `Last activity: ${format(new Date(lead.last_activity_at), "MMM d")}`,
  ];

  if (isManager) {
    lines.push(`Assigned consultant: ${consultant}`);
    lines.push(`Days in stage: ${daysInStage}`);
  }

  lines.push("");
  lines.push(`Next suggested action: ${nextSuggestedAction(lead)}`);
  return lines.join("\n");
}

function cleanupQuery(input: string) {
  return input
    .trim()
    .replace(/[?.!]+$/g, "")
    .trim();
}

function normalizeSearchText(input: string) {
  return input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenFuzzyScore(name: string, query: string) {
  const queryTokens = query.split(" ").filter(Boolean);
  const nameTokens = name.split(" ").filter(Boolean);
  if (queryTokens.length === 0) return 0;

  let score = 0;
  for (const queryToken of queryTokens) {
    const best = Math.max(...nameTokens.map((nameToken) => tokenScore(nameToken, queryToken)));
    if (best < 0.55) return 0;
    score += best;
  }
  return 300 + Math.round((score / queryTokens.length) * 100);
}

function tokenScore(nameToken: string, queryToken: string) {
  if (nameToken === queryToken) return 1;
  if (nameToken.startsWith(queryToken)) return 0.92;
  if (nameToken.includes(queryToken)) return 0.78;

  let i = 0;
  for (const char of nameToken) {
    if (char === queryToken[i]) i++;
    if (i === queryToken.length) break;
  }
  return i / queryToken.length;
}

function nextSuggestedAction(lead: AssistantLead) {
  if (lead.contact_number) return "Call the client or add a fresh follow-up note.";
  if (lead.facebook_url)
    return "Message the client on Facebook and update the phone number when available.";
  return "Open the lead and add the next contact detail or note.";
}
