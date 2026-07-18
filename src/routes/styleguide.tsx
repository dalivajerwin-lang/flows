import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/tenacious-button";
import { StatusChip, StageBadge } from "@/components/ui/status-chip";
import {
  Field,
  TenaciousInput,
  TenaciousSelect,
  TenaciousTextarea,
} from "@/components/ui/form-controls";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import {
  CardRowSkeleton,
  TableRowSkeleton,
  TenaciousSkeleton,
} from "@/components/ui/tenacious-skeleton";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { ResponsiveDialog, SlideOver } from "@/components/ui/responsive-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { STAGES } from "@/lib/constants";

import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";

export const Route = createFileRoute("/styleguide")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Styleguide — Tenacious CRM" }] }),
  component: Styleguide,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

const swatches: Array<[string, string]> = [
  ["primary", "#069494"],
  ["primary-hover", "#047A7A"],
  ["primary-light", "#D9F3F3"],
  ["background", "#FFFFFF"],
  ["surface", "#F9FAFB"],
  ["border", "#E5E7EB"],
  ["text", "#111827"],
  ["text-secondary", "#6B7280"],
  ["text-placeholder", "#9CA3AF"],
  ["success", "#16A34A"],
  ["warning", "#D97706"],
  ["error", "#DC2626"],
  ["sidebar", "#111827"],
];

function Styleguide() {
  const [modalOpen, setModalOpen] = useState(false);
  const [slideOpen, setSlideOpen] = useState(false);
  const target24h = new Date(Date.now() + 23 * 3600_000 + 30 * 60_000).toISOString();
  const target7d = new Date(Date.now() + 6 * 86400_000 + 4 * 3600_000).toISOString();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Styleguide</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Visual QA reference. Every color in the app must come from these tokens.
        </p>
      </header>

      <Section title="Color tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map(([name, hex]) => (
            <div
              key={name}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
            >
              <div
                className="h-14 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)]"
                style={{ background: hex }}
              />
              <div className="mt-2 text-xs font-semibold">{name}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">{hex}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale">
        <div className="space-y-2">
          <div className="text-[64px] font-extrabold leading-tight">Login hero 64/800</div>
          <div className="text-[36px] font-bold">Hero 36/700</div>
          <div className="text-[30px] font-semibold">Page title (desktop) 30/600</div>
          <div className="text-[22px] font-semibold">Page title (mobile) 22/600</div>
          <div className="text-2xl font-semibold">Section header ≥1024 24/600</div>
          <div className="text-xl font-semibold">Section header 20/600</div>
          <div className="text-base font-semibold">Card title 16/600</div>
          <div className="text-base">Body 16/400</div>
          <div className="text-sm text-[var(--color-text-secondary)]">Secondary 14/400</div>
          <div className="text-xs font-medium">Badge / timestamp 12/500</div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="warning-outline">Warning outline</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
        </div>
      </Section>

      <Section title="Status chips">
        <div className="flex flex-wrap gap-2">
          <StatusChip variant="success">Success</StatusChip>
          <StatusChip variant="warning">Warning</StatusChip>
          <StatusChip variant="critical">Critical</StatusChip>
          <StatusChip variant="info">Info</StatusChip>
          <StatusChip variant="inactive">Inactive</StatusChip>
          <StatusChip variant="brand">Brand / Teal</StatusChip>
          <StatusChip variant="violet">Violet</StatusChip>
          <StatusChip variant="archived">Archived</StatusChip>
        </div>
      </Section>

      <Section title="Stage badges">
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <StageBadge key={s} stage={s} />
          ))}
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          <Field label="Default" htmlFor="sg-a">
            <TenaciousInput id="sg-a" placeholder="Type here" />
          </Field>
          <Field label="With helper" htmlFor="sg-b" helper="Optional supporting text.">
            <TenaciousInput id="sg-b" placeholder="hello@tenacious.ph" />
          </Field>
          <Field label="Error" htmlFor="sg-c" error="This field is required.">
            <TenaciousInput id="sg-c" hasError placeholder="Required" />
          </Field>
          <Field label="Disabled" htmlFor="sg-d">
            <TenaciousInput id="sg-d" disabled defaultValue="Read only" />
          </Field>
          <Field label="Select" htmlFor="sg-e">
            <TenaciousSelect id="sg-e" defaultValue="">
              <option value="" disabled>
                Choose one
              </option>
              <option>Option A</option>
              <option>Option B</option>
            </TenaciousSelect>
          </Field>
          <Field label="Textarea" htmlFor="sg-f">
            <TenaciousTextarea id="sg-f" placeholder="Notes…" />
          </Field>
        </div>
      </Section>

      <Section title="Skeletons">
        <div className="space-y-3 max-w-2xl">
          <CardRowSkeleton />
          <TableRowSkeleton />
          <TenaciousSkeleton className="h-8 w-40" />
        </div>
      </Section>

      <Section title="Empty & error states">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white">
            <EmptyState
              headline="No leads yet"
              description="Once a lead is added, it'll show up here."
              actionLabel="Add a client"
              onAction={() => toast("Coming in a later phase")}
            />
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white">
            <ErrorState message="We couldn't reach the server." onRetry={() => toast("Retrying")} />
          </div>
        </div>
      </Section>

      <Section title="Countdown timer (shared ticker)">
        <div className="flex flex-wrap items-center gap-3">
          <CountdownTimer target={target24h} />
          <span className="text-sm text-[var(--color-text-secondary)]">— 24h reservation</span>
          <CountdownTimer target={target7d} />
          <span className="text-sm text-[var(--color-text-secondary)]">— multi-day (CRF)</span>
        </div>
      </Section>

      <Section title="Modal / bottom sheet & slide-over">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal / sheet
          </Button>
          <Button variant="secondary" onClick={() => setSlideOpen(true)}>
            Open slide-over (desktop)
          </Button>
          <Button variant="ghost" onClick={() => toast.success("Saved successfully")}>
            Show toast
          </Button>
        </div>
        <ResponsiveDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Confirm action"
          description="Bottom sheet on mobile, centered modal on ≥ 640px."
          size="confirm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </div>
        </ResponsiveDialog>
        <SlideOver open={slideOpen} onOpenChange={setSlideOpen} title="Slide-over shell">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Empty shell — lead details land here in a later phase.
          </p>
        </SlideOver>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">{title}</h2>
      {children}
    </section>
  );
}
