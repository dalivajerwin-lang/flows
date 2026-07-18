import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Online-only app: slim persistent banner shown while the browser is offline.
 * Nothing is queued or cached — the user must reconnect to continue working.
 */
export function NetworkBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 px-3 py-1.5 text-[13px] font-medium"
      style={{ background: "var(--color-error)", color: "#fff" }}
    >
      <WifiOff size={14} aria-hidden />
      <span>
        No internet connection — Tenacious CRM requires a connection. Changes cannot be saved until
        you're back online.
      </span>
    </div>
  );
}
