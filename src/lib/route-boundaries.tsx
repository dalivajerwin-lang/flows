import { Link, useRouter } from "@tanstack/react-router";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";

/** Standard per-route error boundary. Retries via invalidate() + reset(). */
export function RouteErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  if (typeof console !== "undefined") console.error(error);
  return (
    <div className="py-8">
      <ErrorState
        message={error.message || "This page didn't load. Try again or head back home."}
        onRetry={() => {
          router.invalidate();
          reset();
        }}
      />
      <div className="mt-4 flex justify-center">
        <Link to="/" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}

/** Standard per-route not-found boundary. */
export function RouteNotFoundBoundary() {
  return (
    <div className="py-8">
      <EmptyState
        headline="Not found"
        description="We couldn't find what you were looking for on this page."
      />
      <div className="mt-4 flex justify-center">
        <Link to="/" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
