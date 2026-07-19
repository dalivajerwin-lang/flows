import { cn } from "@/lib/utils";

export function TenaciousSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface)]",
        className,
      )}
    />
  );
}

export function CardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <TenaciousSkeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <TenaciousSkeleton className="h-3 w-2/3" />
        <TenaciousSkeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3">
      <TenaciousSkeleton className="h-3 w-32" />
      <TenaciousSkeleton className="h-3 w-24" />
      <TenaciousSkeleton className="h-3 w-16" />
      <TenaciousSkeleton className="ml-auto h-6 w-20 rounded-full" />
    </div>
  );
}

export function ThreeRowSkeleton({ variant = "card" }: { variant?: "card" | "table" }) {
  const Row = variant === "card" ? CardRowSkeleton : TableRowSkeleton;
  return (
    <div className="space-y-2">
      <Row />
      <Row />
      <Row />
    </div>
  );
}
