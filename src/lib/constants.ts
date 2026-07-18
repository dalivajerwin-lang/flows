export const COMPANY_TIMEZONE = "Asia/Manila";
export const CURRENCY_SYMBOL = "₱";

export const STAGES = [
  "new_lead",
  "crf",
  "reserved",
  "documentation",
  "closed_sale",
  "cancelled",
  "archived",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  new_lead: "New Lead",
  crf: "CRF Active",
  reserved: "Reserved",
  documentation: "Documentation",
  closed_sale: "Closed Sale",
  cancelled: "Cancelled",
  archived: "Archived",
};

// Business rules
export const CRF_VALIDITY_DAYS = 30;
export const CRF_WARNING_DAYS = 3;
export const RESERVATION_VALIDITY_HOURS = 24;
export const ESCALATION_HOURS = 4;
export const STAGNANT_LEAD_DAYS = 7;
export const UNDO_GRACE_MINUTES = 10;
export const SESSION_TIMEOUT_DAYS = 14;
export const NOTIFICATION_BADGE_MAX = 9;

export type Role = "superadmin" | "manager" | "property_consultant";
