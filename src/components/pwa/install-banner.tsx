import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { getSessionCount, isIOSSafari, isStandalone } from "@/lib/pwa/env";

const DISMISS_KEY = "tenacious.pwa.install-dismissed-until";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Install prompt. Shows after the user's SECOND session, with a 14-day
 * dismissal. On iOS Safari (no beforeinstallprompt), shows an instruction
 * variant. Hidden entirely when already installed.
 */
export function InstallBanner() {
  const [bipEvent, setBipEvent] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    const dismissed = Number(window.localStorage.getItem(DISMISS_KEY) ?? "0");
    if (dismissed && dismissed > Date.now()) return;

    const sessions = getSessionCount();
    if (sessions < 2) return;

    if (isIOSSafari()) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 24 * 60 * 60 * 1000));
    }
    setVisible(false);
  };

  const install = async () => {
    if (isIOSSafari()) {
      setShowIOSSheet(true);
      return;
    }
    if (!bipEvent) return;
    await bipEvent.prompt();
    await bipEvent.userChoice;
    setBipEvent(null);
    setVisible(false);
  };

  if (!visible && !showIOSSheet) return null;

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-label="Install Tenacious"
          className="fixed inset-x-3 z-40 mx-auto flex max-w-[560px] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-md)] sm:right-6 sm:left-auto"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
        >
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white">
            <Download size={18} />
          </div>
          <div className="min-w-0 flex-1 text-sm text-[var(--color-text)]">
            Install Tenacious on your home screen for quick access.
          </div>
          <button
            onClick={install}
            className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showIOSSheet && (
        <IOSInstallSheet
          onClose={() => {
            setShowIOSSheet(false);
            dismiss();
          }}
        />
      )}
    </>
  );
}

export function IOSInstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] rounded-t-[var(--radius-lg)] bg-white p-5 sm:rounded-[var(--radius-lg)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Add to Home Screen</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 hover:bg-[var(--color-surface)]"
          >
            <X size={16} />
          </button>
        </div>
        <ol className="space-y-3 text-sm text-[var(--color-text)]">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
              1
            </span>
            <span>
              Tap the <strong>Share</strong> icon
              <span
                aria-hidden
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded border border-[var(--color-border)] align-middle text-[10px]"
              >
                ↑
              </span>
              &nbsp;at the bottom of Safari.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
              2
            </span>
            <span>
              Scroll and tap <strong>Add to Home Screen</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
              3
            </span>
            <span>
              Tap <strong>Add</strong> in the top-right corner.
            </span>
          </li>
        </ol>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
