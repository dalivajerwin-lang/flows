import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useAuth, useCurrentProfile } from "@/stores/auth-store";
import { db } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/** The 10 bundled generic avatars (public/avatar). Paths are same-origin, so
 * they render anywhere profile_photo_url is used, exactly like uploads. */
export const GENERIC_AVATARS = Array.from(
  { length: 10 },
  (_, i) => `/avatar/avatar-${String(i + 1).padStart(2, "0")}.svg`,
);

export function isGenericAvatar(url: string | null | undefined): boolean {
  return !!url && url.startsWith("/avatar/");
}

/**
 * Generic avatar picker — the no-photo path. Uploading a real photo is
 * optional (managers and consultants alike), so this offers 10 bundled
 * avatars as tap-to-apply choices. Selecting one persists to
 * profiles.profile_photo_url via the same self-update pattern as uploads.
 */
export function GenericAvatarPicker({ onSelected }: { onSelected?: (url: string) => void }) {
  const profile = useCurrentProfile();
  const [savingUrl, setSavingUrl] = useState<string | null>(null);

  if (!profile) return null;
  const current = profile.profile_photo_url;

  async function pick(url: string) {
    if (!profile || savingUrl) return;
    setSavingUrl(url);
    try {
      const { data: updatedProfile, error } = await db
        .from("profiles")
        .update({ profile_photo_url: url, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
        .select()
        .maybeSingle();
      if (error || !updatedProfile) throw new Error(error?.message || "Failed to set avatar");
      useAuth.setState({ profile: updatedProfile });
      onSelected?.(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to set avatar.");
    } finally {
      setSavingUrl(null);
    }
  }

  return (
    <div>
      <p className="text-center text-xs text-[var(--color-text-secondary)]">
        No photo handy? Pick an avatar instead:
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {GENERIC_AVATARS.map((url) => {
          const selected = current === url;
          return (
            <button
              key={url}
              type="button"
              aria-label={`Use generic avatar ${url.slice(-6, -4)}`}
              aria-pressed={selected}
              disabled={savingUrl != null}
              onClick={() => pick(url)}
              className={cn(
                "relative h-11 w-11 overflow-hidden rounded-full ring-2 transition-tenacious hover:scale-105 active:scale-95 disabled:opacity-60",
                selected
                  ? "ring-[var(--color-primary)]"
                  : "ring-transparent hover:ring-[var(--color-primary-light)]",
                savingUrl === url && "animate-pulse",
              )}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              {selected && (
                <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
