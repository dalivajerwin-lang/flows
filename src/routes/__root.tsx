import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/app-shell";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-[var(--color-text)]">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-[var(--color-text)]">Page not found</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">This page didn't load</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Something went wrong. Try again or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      {
        name: "theme-color",
        content: "#069494",
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: "#0f1417",
        media: "(prefers-color-scheme: dark)",
      },
      { title: "Dashboard — Tenacious CRM" },
      {
        name: "description",
        content:
          "Mobile-first CRM for property consultants and managers on the Team Tenacious real-estate team.",
      },
      { property: "og:title", content: "Dashboard — Tenacious CRM" },
      {
        property: "og:description",
        content:
          "Mobile-first CRM for property consultants and managers on the Team Tenacious real-estate team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dashboard — Tenacious CRM" },
      {
        name: "twitter:description",
        content:
          "Mobile-first CRM for property consultants and managers on the Team Tenacious real-estate team.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fe37f646-682f-458a-b2ea-f1ab481d7bb8/id-preview-26cf77ba--1ee43fcb-7149-4137-8161-d5dceb43095f.lovable.app-1784265506273.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fe37f646-682f-458a-b2ea-f1ab481d7bb8/id-preview-26cf77ba--1ee43fcb-7149-4137-8161-d5dceb43095f.lovable.app-1784265506273.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/icons/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Runs synchronously in <head> before styles paint — prevents flash of wrong
// theme. Reads the persisted setting, resolves "system" via matchMedia, and
// sets the .dark class + data-theme on <html>.
const THEME_INIT_SCRIPT = `(function(){try{var t="system";var raw=localStorage.getItem("tenacious.settings.v1");if(raw){var s=JSON.parse(raw);if(s.theme==="light"||s.theme==="dark")t=s.theme}var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.dataset.theme=d?"dark":"light"}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    // PWA installability: Chrome/Edge (esp. Android) require a registered
    // service worker before firing `beforeinstallprompt`. sw.js is a no-op
    // network passthrough — no caching.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the app works fine without it; only install is affected.
      });
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
