import { useEffect, useState } from "react";
import {
  Calendar,
  Bot,
  Trophy,
  BellRing,
  BarChart3,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Feature-discovery carousel — C5 (consultant daily toolkit) and M6 (manager
 * command center) share this construction (§4 C5, §5 M6). Swipe on mobile via
 * embla, arrows on desktop; viewing all cards earns the XP but Continue is
 * never gated (§4 C5 UI note — the parent enables Continue immediately).
 */
export interface ToolCard {
  icon: LucideIcon;
  title: string;
  blurb: string;
  preview: React.ReactNode;
}

export const CONSULTANT_TOOLS: ToolCard[] = [
  {
    icon: Calendar,
    title: "Schedule",
    blurb: "Book trippings and presentations — your week at a glance.",
    preview: <SchedulePreview />,
  },
  {
    icon: Bot,
    title: "Assistant",
    blurb: "Ask anything about your pipeline in plain language.",
    preview: <AssistantPreview />,
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    blurb: "See where you stand on the team this month.",
    preview: <LeaderboardPreview />,
  },
];

export const MANAGER_TOOLS: ToolCard[] = [
  {
    icon: BellRing,
    title: "Pending Actions",
    blurb: "Closed-sale verifications and escalations land here first.",
    preview: <PendingActionsPreview />,
  },
  {
    icon: BarChart3,
    title: "Reports",
    blurb: "Team performance, sources, and revenue — exportable.",
    preview: <ReportsPreview />,
  },
  {
    icon: Megaphone,
    title: "Broadcasts",
    blurb: "Announce to the whole team; everyone acknowledges on screen.",
    preview: <BroadcastPreview />,
  },
];

export function StepToolsCarousel({
  title,
  subtitle,
  cards,
  onViewedAll,
}: {
  title: string;
  subtitle: string;
  cards: ToolCard[];
  onViewedAll: () => void;
}) {
  const isMobile = !useMediaQuery("(min-width: 640px)");
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setCurrent(idx);
      setSeen((prev) => {
        const next = new Set(prev).add(idx);
        return next;
      });
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (seen.size === cards.length) onViewedAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-md)] sm:p-6">
      <h2 className="text-center text-[22px] font-bold text-[var(--color-text)] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1 text-center text-sm text-[var(--color-text-secondary)]">{subtitle}</p>

      <Carousel setApi={setApi} className="mt-6" opts={{ align: "start" }}>
        <CarouselContent>
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <CarouselItem key={card.title}>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-semibold text-[var(--color-text)]">{card.title}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{card.blurb}</div>
                    </div>
                  </div>
                  <div className="mt-4">{card.preview}</div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {!isMobile && (
          <>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </>
        )}
      </Carousel>

      {/* Dots — primary color fill transition (§4 C5). */}
      <div className="mt-4 flex justify-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to card ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-2 rounded-full transition-tenacious",
              i === current ? "w-5 bg-[var(--color-primary)]" : "w-2 bg-[var(--color-border)]",
            )}
          />
        ))}
      </div>
      {isMobile && (
        <p className="mt-2 text-center text-xs text-[var(--color-text-placeholder)]">
          Swipe to explore
        </p>
      )}
    </div>
  );
}

// ─── Mini-previews (mocked, anonymized — §4 C5 / §5 M6) ──────────────────────

function SchedulePreview() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="flex items-end justify-between gap-1">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          {i === 2 ? (
            <span className="w-full truncate rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-1 py-1 text-center text-[9px] font-semibold text-[var(--color-primary-foreground)]">
              Tripping
            </span>
          ) : (
            <span className="h-[22px] w-full rounded-[var(--radius-sm)] bg-[var(--color-background)]" />
          )}
          <span className="text-[10px] text-[var(--color-text-secondary)]">{d}</span>
        </div>
      ))}
    </div>
  );
}

function AssistantPreview() {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-background)] p-3">
      <span className="text-xs text-[var(--color-text-secondary)]">Try asking:</span>
      <p className="mt-1 rounded-[var(--radius-sm)] bg-[var(--color-primary-light)] px-3 py-2 text-sm font-medium text-[var(--color-primary-hover)]">
        "Summarize my stagnant leads"
      </p>
    </div>
  );
}

function LeaderboardPreview() {
  return (
    <div className="flex items-end justify-center gap-2">
      {[
        { h: 34, place: "2nd" },
        { h: 48, place: "1st" },
        { h: 26, place: "3rd" },
      ].map((bar) => (
        <div key={bar.place} className="flex w-14 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
            {bar.place}
          </span>
          <div
            className={cn(
              "w-full rounded-t-[var(--radius-sm)]",
              bar.place === "1st" ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]",
            )}
            style={{ height: bar.h }}
          />
        </div>
      ))}
    </div>
  );
}

function PendingActionsPreview() {
  return (
    <div className="space-y-1.5">
      {["Closed sale awaiting verification", "Reservation expiry escalated"].map((t) => (
        <div
          key={t}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-text)]"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-warning)]" />
          {t}
        </div>
      ))}
    </div>
  );
}

function ReportsPreview() {
  return (
    <div className="flex items-end justify-between gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-background)] p-3">
      {[30, 45, 28, 52, 38, 60].map((h, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-t-[2px]",
            i === 5 ? "bg-[var(--color-primary)]" : "bg-[var(--color-primary-light)]",
          )}
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

function BroadcastPreview() {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-background)] p-3">
      <p className="text-sm font-medium text-[var(--color-text)]">📣 Team huddle at 9 AM</p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
        Your team sees this full-screen and taps to acknowledge.
      </p>
    </div>
  );
}
