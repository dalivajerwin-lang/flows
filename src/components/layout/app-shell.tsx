import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth, useCurrentProfile } from "@/stores/auth-store";
import { useNotifications, useRealtimeNotifications } from "@/hooks/use-notifications";
import { useRealtimeBroadcasts, useRealtimeAcknowledgments } from "@/hooks/use-broadcasts";
import { useSettings } from "@/stores/settings-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTicker } from "@/stores/ticker-store";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { FabMenu } from "./fab-menu";
import { SplashScreen } from "./splash-screen";
import { NotificationToaster } from "./notification-toaster";
import { NetworkBanner } from "./network-banner";
import { PushPermissionPrompt } from "./push-permission-prompt";
import { BroadcastOverlay } from "@/components/broadcast/broadcast-overlay";
import { bottomNavFor, managerOnlyPaths, sidebarFor } from "./nav-config";
import { cn } from "@/lib/utils";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/leads": "Leads",
  "/workflow": "Workflow",
  "/schedule": "Schedule",
  "/assistant": "Assistant",
  "/team": "Team",
  "/reports": "Reports",
  "/leaderboard": "Leaderboard",
  "/projects": "Projects Computation",
  "/profile": "My Profile",
  "/settings": "Settings",
};

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const hydrate = useAuth((s) => s.hydrate);
  const hydrated = useAuth((s) => s.hydrated);
  const userId = useAuth((s) => s.userId);
  const hydrateSettings = useSettings((s) => s.hydrate);
  const profile = useCurrentProfile();
  const { data: notifications = [] } = useNotifications(userId);
  const isMobile = !useMediaQuery("(min-width: 640px)");
  const [fabOpen, setFabOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);
  const startTicker = useTicker((s) => s.start);
  // pg_cron fires sweep_expiries_cron() server-side every minute — no client sweep needed.

  // ── Realtime subscriptions ──────────────────────────────────────────────
  // These hooks create Supabase postgres_changes channels and invalidate
  // the React Query cache on each INSERT, making the UI live without polling.
  useRealtimeNotifications(userId ?? null);
  useRealtimeBroadcasts();
  useRealtimeAcknowledgments(userId ?? null);
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    hydrate();
    hydrateSettings();
    startTicker();
    // One-time cleanup: the legacy local mock DB is gone — purge its stale data.
    window.localStorage.removeItem("tenacious.db.v4");
    window.localStorage.removeItem("tenacious.db.v4_corrupt");
    // One-time cleanup: the app is online-only now. Unregister any previously
    // installed service worker, delete its caches, and purge offline-queue
    // localStorage so no stale authenticated data survives on the device.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
    if ("caches" in window) {
      window.caches
        .keys()
        .then((keys) => keys.forEach((k) => window.caches.delete(k)))
        .catch(() => {});
    }
    window.localStorage.removeItem("tenacious.offline.queue.v1");
    window.localStorage.removeItem("tenacious.offline.conflicts.v1");
    window.localStorage.removeItem("tenacious.offline.forced.v1");
    const warm = window.sessionStorage.getItem("tenacious.warm");
    if (!warm) {
      setShowSplash(true);
      const t = setTimeout(() => {
        window.sessionStorage.setItem("tenacious.warm", "1");
        setShowSplash(false);
      }, 1700);
      return () => clearTimeout(t);
    }
  }, [hydrate, hydrateSettings, startTicker]);

  const path = location.pathname;
  const isPublic = PUBLIC_PATHS.has(path);

  // Auth redirects
  useEffect(() => {
    if (!hydrated) return;
    if (!userId && !isPublic) {
      navigate({ to: "/login" });
    } else if (userId && path === "/login") {
      navigate({ to: "/" });
    }
  }, [hydrated, userId, isPublic, path, navigate]);

  // Role guard
  useEffect(() => {
    if (!hydrated || !profile) return;
    if (managerOnlyPaths.has(path) && profile.role === "property_consultant") {
      toast("You don't have access to that page.");
      navigate({ to: "/" });
    }
  }, [hydrated, profile, path, navigate]);

  // Before hydration completes on the client, render nothing for protected
  // paths (their content must never flash unauthenticated — the SSR pass and
  // first client paint both land here). Public routes render as-is to match
  // SSR output exactly.
  if (!mounted || (!isPublic && !hydrated)) {
    return isPublic ? <>{children}</> : <AuthGate />;
  }

  if (showSplash) return <SplashScreen />;

  // Public routes render standalone.
  if (isPublic) {
    return <>{children}</>;
  }

  // Hydration finished with no session/profile on a protected path: the
  // redirect effect above is about to navigate to /login — show the gate,
  // never the protected content.
  if (!profile) {
    return <AuthGate />;
  }

  const unreadCount = notifications.filter((n) => n.user_id === profile.id && !n.is_read).length;
  const sidebarItems = sidebarFor(profile.role);
  const bottomItems = bottomNavFor(profile.role);
  const isMobileAssistant = isMobile && path === "/assistant";
  const title = PAGE_TITLES[path] ?? "";

  return (
    <div className="min-h-screen bg-(--color-background)">
      <NetworkBanner />
      <Sidebar
        items={sidebarItems}
        unreadCount={unreadCount}
        onQuickActions={() => setFabOpen(true)}
      />
      <div className={cn("flex min-h-screen flex-col transition-tenacious", "sm:pl-16 lg:pl-60")}>
        {!isMobileAssistant && <TopBar title={title} />}
        <main
          className={cn(
            "flex-1 transition-all",
            isMobileAssistant
              ? "pb-0 pt-0 px-0 h-[100dvh] flex flex-col"
              : "pb-24 sm:pb-8 pt-4 sm:pt-6 px-4 sm:px-6 mx-auto w-full max-w-full sm:max-w-[720px] lg:max-w-[960px] xl:max-w-[1200px] 2xl:max-w-[1280px]",
          )}
        >
          {children}
        </main>
      </div>
      {isMobile && !isMobileAssistant && (
        <BottomNav
          items={bottomItems}
          onFabClick={() => setFabOpen(true)}
          unreadCount={unreadCount}
        />
      )}
      <FabMenu open={fabOpen} onOpenChange={setFabOpen} role={profile.role} />
      <NotificationToaster />
      <BroadcastOverlay />
      <PushPermissionPrompt />
    </div>
  );
}

/**
 * Neutral full-screen placeholder shown on protected paths while auth state
 * is unknown (SSR pass / pre-hydration) or absent (redirecting to /login).
 * Deliberately renders no route content so nothing leaks unauthenticated.
 */
function AuthGate() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
    </div>
  );
}
