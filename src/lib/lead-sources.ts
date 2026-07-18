export const LEAD_SOURCES = [
  "social_media",
  "walk_in",
  "flyers",
  "ads",
  "referral",
  "personal_network",
  "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  social_media: "Social Media",
  walk_in: "Walk-in",
  flyers: "Flyers",
  ads: "Ads",
  referral: "Referral",
  personal_network: "Personal Network",
  other: "Other",
};

export const UNIT_TYPES = ["studio", "1br", "2br", "3br"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  studio: "Studio",
  "1br": "1BR",
  "2br": "2BR",
  "3br": "3BR",
};
