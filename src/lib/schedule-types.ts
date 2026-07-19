export type AppointmentType = string;

export const APPOINTMENT_TYPES: AppointmentType[] = [
  "client_tripping",
  "online_presentation",
  "actual_presentation",
  "manning_duty",
  "booth_duty",
];

export const CLIENT_APPOINTMENT_TYPES: AppointmentType[] = [
  "client_tripping",
  "online_presentation",
  "actual_presentation",
];

export const PUBLIC_APPOINTMENT_TYPES: AppointmentType[] = ["manning_duty", "booth_duty"];

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  client_tripping: "Client Tripping",
  online_presentation: "Online Presentation",
  actual_presentation: "Actual Presentation",
  manning_duty: "Manning Duty",
  booth_duty: "Booth Duty",
};

// Data-visualization tokens — used ONLY inside schedule components.
// Values resolve via tokens.css so each theme gets a tuned variant.
export const APPOINTMENT_TYPE_COLORS: Record<string, string> = {
  client_tripping: "var(--color-event-tripping)",
  online_presentation: "var(--color-event-online)",
  actual_presentation: "var(--color-event-presentation)",
  manning_duty: "var(--color-event-duty)",
  booth_duty: "var(--color-event-duty)",
};

export function isClientAppointment(t: string): boolean {
  return CLIENT_APPOINTMENT_TYPES.includes(t);
}
export function isPublicAppointment(t: string): boolean {
  return PUBLIC_APPOINTMENT_TYPES.includes(t);
}
