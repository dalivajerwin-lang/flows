import { useMemo, useState } from "react";
import {
  STAGE_LABELS,
  CRF_VALIDITY_DAYS,
  RESERVATION_VALIDITY_HOURS,
  type Stage,
} from "@/lib/constants";
import { StatusChip, type ChipVariant } from "@/components/ui/status-chip";
import { useOnboarding } from "@/stores/onboarding-store";
import { announceBadge } from "./onboarding-bits";
import { cn } from "@/lib/utils";

/**
 * How money moves — C3. The real 5-stage pipeline from STAGE_LABELS; the user
 * taps the glowing client chip through each stage. Each arrival flips an info
 * card with that stage's one-sentence rule (real timer rules the app enforces).
 * Tap-to-advance everywhere (drag is never the only path, §8).
 */
const TOUR_STAGES: Stage[] = ["new_lead", "crf", "reserved", "documentation", "closed_sale"];

const STAGE_CHIP: Record<string, ChipVariant> = {
  new_lead: "info",
  crf: "brand",
  reserved: "violet",
  documentation: "warning",
  closed_sale: "success",
};

const STAGE_BLURBS: Record<string, string> = {
  new_lead: "Every client starts here — captured with a source, project, and contact number.",
  crf: `The client fills out your Customer Relations Form. CRF validity runs ${CRF_VALIDITY_DAYS} days — the app counts it down for you.`,
  reserved: `A unit is on hold. Reservations expire after ${RESERVATION_VALIDITY_HOURS} hours unless extended — you'll see a live timer.`,
  documentation: "Paperwork phase — requirements, payments, and buyer details get completed here.",
  closed_sale: "Sold! Your manager verifies the sale and it counts toward your monthly target.",
};

export function StepPipelineTour({ onReachedEnd }: { onReachedEnd: () => void }) {
  const awardBadge = useOnboarding((s) => s.awardBadge);
  const [pos, setPos] = useState(0);
  const [burst, setBurst] = useState(false);
  const atEnd = pos === TOUR_STAGES.length - 1;

  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return { x: Math.cos(angle) * 34, y: Math.sin(angle) * 34 };
      }),
    [],
  );

  const advance = () => {
    if (atEnd) return;
    const next = pos + 1;
    setPos(next);
    if (next === TOUR_STAGES.length - 1) {
      // Coin-burst of 5 teal particles + Pipeline Pro (§4 C3).
      setBurst(true);
      if (awardBadge("pipeline_pro")) announceBadge("pipeline_pro");
      onReachedEnd();
    }
  };

  const stage = TOUR_STAGES[pos];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
      <h2 className="text-center text-[22px] font-bold text-[var(--color-text)] sm:text-2xl">
        How money moves
      </h2>
      <p className="mt-1 text-center text-sm text-[var(--color-text-secondary)]">
        Tap the client chip to move it through your real pipeline.
      </p>

      {/* Horizontal pipeline track */}
      <div className="mt-8">
        <div className="relative">
          <div className="absolute left-3 right-3 top-[9px] h-0.5 bg-[var(--color-border)]" />
          <div
            className="absolute left-3 top-[9px] h-0.5 bg-[var(--color-primary)] transition-[width] duration-400"
            style={{ width: `calc((100% - 24px) * ${pos / (TOUR_STAGES.length - 1)})` }}
          />
          <div className="relative flex justify-between">
            {TOUR_STAGES.map((s, i) => (
              <div key={s} className="flex w-14 flex-col items-center sm:w-20">
                <span
                  className={cn(
                    "z-10 h-5 w-5 rounded-full border-2 bg-white transition-tenacious",
                    i <= pos
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                      : "border-[var(--color-border)]",
                  )}
                />
                <span
                  className={cn(
                    "mt-2 text-center text-[10px] leading-tight transition-tenacious sm:text-[11px]",
                    i === pos
                      ? "font-bold text-[var(--color-text)]"
                      : "font-medium text-[var(--color-text-secondary)]",
                  )}
                >
                  {STAGE_LABELS[s]}
                </span>
              </div>
            ))}
          </div>

          {/* The glowing client chip */}
          <button
            type="button"
            onClick={advance}
            disabled={atEnd}
            aria-label={atEnd ? "Pipeline complete" : "Advance client to next stage"}
            className={cn(
              "onb-chip-slide absolute -top-9 z-20 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_0_0_5px_rgba(6,148,148,0.2)]",
              !atEnd && "cursor-pointer active:scale-[0.9]",
            )}
            style={{ left: `calc(12px + (100% - 24px) * ${pos / (TOUR_STAGES.length - 1)})` }}
          >
            <span className="text-xs">👤</span>
            {burst &&
              particles.map((p, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="onb-coin absolute h-2 w-2 rounded-full bg-[var(--color-primary)]"
                  style={{
                    ["--burst-x" as string]: `${p.x}px`,
                    ["--burst-y" as string]: `${p.y}px`,
                  }}
                />
              ))}
          </button>
        </div>

        {/* Stage info card flips on each arrival */}
        <div
          key={stage}
          className="onb-step-in mt-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <StatusChip variant={STAGE_CHIP[stage]}>{STAGE_LABELS[stage]}</StatusChip>
          <p className="mt-2 text-sm text-[var(--color-text)]">{STAGE_BLURBS[stage]}</p>
        </div>

        {!atEnd ? (
          <button
            type="button"
            onClick={advance}
            className="mt-4 w-full rounded-[var(--radius-sm)] border border-dashed border-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-tenacious hover:bg-[var(--color-primary-light)] active:scale-[0.98]"
          >
            Move to {STAGE_LABELS[TOUR_STAGES[pos + 1]]} →
          </button>
        ) : (
          <p className="mt-4 text-center text-sm font-semibold text-[var(--color-success)]">
            💰 Closed! That's the whole journey.
          </p>
        )}

        <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
          Leads that stall get flagged on your dashboard — keep them moving.
        </p>
      </div>
    </div>
  );
}
