import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Link } from "lucide-react";
import { useAuth, useCurrentProfile } from "@/stores/auth-store";
import { db } from "@/lib/supabase";
import { uploadAvatarImage } from "@/lib/storage-helper";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { initials } from "@/lib/format";
import { useOnboarding } from "@/stores/onboarding-store";
import { announceBadge } from "./onboarding-bits";
import { cn } from "@/lib/utils";

/**
 * Complete your profile — C2 / M3. Photo is the hero; (consultant-only)
 * CRF link below. Reuses the exact avatar upload affordance and profiles.update
 * pattern from profile.tsx. Fields save on Continue via saveProfileFields,
 * which the parent route calls before advancing.
 */
export function StepProfile({
  crfLink,
  setCrfLink,
}: {
  crfLink: string;
  setCrfLink: (v: string) => void;
}) {
  const profile = useCurrentProfile();
  const awardBadge = useOnboarding((s) => s.awardBadge);
  const [uploading, setUploading] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  useEffect(() => {
    if (profile) {
      setCrfLink(profile.crf_link || "");
    }
    // Prefill once on mount; local edits own the state afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) return null;
  const isConsultant = profile.role === "property_consultant";

  async function handlePhotoUpload(file: File | null) {
    if (!file || !profile) return;
    setUploading(true);
    try {
      const signedUrl = await uploadAvatarImage("avatars", file);
      const { data: updatedProfile, error } = await db
        .from("profiles")
        .update({ profile_photo_url: signedUrl, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
        .select()
        .maybeSingle();
      if (error || !updatedProfile)
        throw new Error(error?.message || "Failed to update profile picture");
      useAuth.setState({ profile: updatedProfile });
      setJustUploaded(true);
      // Face Forward badge pops on upload success (§4 C2).
      if (awardBadge("face_forward")) announceBadge("face_forward");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload profile picture.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-md)] sm:p-6">
      <h2 className="text-center text-[22px] font-bold text-[var(--color-text)] sm:text-2xl">
        Put a face to the name
      </h2>
      <p className="mt-1 text-center text-sm text-[var(--color-text-secondary)]">
        {isConsultant
          ? "Your photo appears on every lead you own — clients and teammates see it."
          : "Your face builds trust for the team you're about to invite."}
      </p>

      {/* Photo hero — 96px circle center-top (§4 C2). */}
      <div className="mt-6 flex justify-center">
        <label
          className={cn(
            "group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-hover)] ring-4 ring-white shadow-md transition-tenacious hover:brightness-95",
            !profile.profile_photo_url && !uploading && "onb-breathe",
            justUploaded && "onb-avatar-pulse",
          )}
        >
          {profile.profile_photo_url ? (
            <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold">{initials(profile.display_name)}</span>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-tenacious group-hover:bg-black/40 group-hover:opacity-100">
              <Camera className="h-6 w-6" />
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => handlePhotoUpload(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--color-text-secondary)]">
        {profile.profile_photo_url ? "Looking sharp." : "Tap to add your photo"}
      </p>

      <div className="mt-6 space-y-4">
        {isConsultant && (
          <Field
            label="CRF Link (optional — you can add this later)"
            htmlFor="onb-crf"
            helper="Your clients will be directed here during the CRF workflow stage."
          >
            <div className="relative">
              <Link className="absolute left-3 top-3.5 h-4 w-4 text-[var(--color-text-placeholder)]" />
              <TenaciousInput
                id="onb-crf"
                type="url"
                value={crfLink}
                onChange={(e) => setCrfLink(e.target.value)}
                placeholder="https://docs.google.com/forms/..."
                className="pl-9"
              />
            </div>
          </Field>
        )}
      </div>
    </div>
  );
}

/** Persist CRF (consultants) on Continue — same call profile.tsx uses. */
export async function saveProfileFields(crfLink: string): Promise<void> {
  const profile = useAuth.getState().profile;
  if (!profile) return;
  // Managers have nothing to persist on this step (photo saves on upload).
  if (profile.role !== "property_consultant") return;
  const { data: updatedProfile, error } = await db
    .from("profiles")
    .update({
      crf_link: crfLink.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select()
    .maybeSingle();
  if (error || !updatedProfile) throw new Error(error?.message || "Failed to save profile");
  useAuth.setState({ profile: updatedProfile });
}
