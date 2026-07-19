import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/stores/auth-store";

const SEEN_KEY_PREFIX = "tenacious.push-prompt-seen.";

/**
 * Soft pre-prompt shown once after first login. Only the "Enable" tap triggers
 * the native permission dialog. Denials are respected — never re-prompt.
 * Backs the in-app desktop notifications fired by lib/notify.ts.
 */
export function PushPermissionPrompt() {
  const userId = useAuth((s) => s.userId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return; // granted or denied → never show
    const key = SEEN_KEY_PREFIX + userId;
    if (window.localStorage.getItem(key)) return;
    // Small delay so it doesn't collide with login toast.
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [userId]);

  const dismiss = () => {
    if (userId && typeof window !== "undefined") {
      window.localStorage.setItem(SEEN_KEY_PREFIX + userId, "1");
    }
    setVisible(false);
  };

  const enable = async () => {
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Enable notifications"
      className="fixed inset-x-3 z-40 mx-auto flex max-w-[520px] gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-md)] sm:right-6 sm:left-auto"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
        <Bell size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--color-text)]">
          Get alerts for expiring reservations and new assignments while the app is open.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={enable}
            className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
          >
            Enable Notifications
          </button>
          <button
            onClick={dismiss}
            className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface)]"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="self-start rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
      >
        <X size={14} />
      </button>
    </div>
  );
}
