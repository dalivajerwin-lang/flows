import { APPOINTMENT_TYPE_COLORS, APPOINTMENT_TYPE_LABELS } from "@/lib/schedule-types";

const LEGEND: Array<[keyof typeof APPOINTMENT_TYPE_COLORS, string]> = [
  ["client_tripping", "Client Tripping"],
  ["online_presentation", "Online Presentation"],
  ["actual_presentation", "Actual Presentation"],
  ["manning_duty", "Manning / Booth Duty"],
];

export function ColorLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-text-secondary)]">
      <span className="font-medium text-[var(--color-text)]">Legend:</span>
      {LEGEND.map(([type, label]) => (
        <span key={type} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: APPOINTMENT_TYPE_COLORS[type] }}
          />
          {label ?? APPOINTMENT_TYPE_LABELS[type]}
        </span>
      ))}
    </div>
  );
}
