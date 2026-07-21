import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Camera,
  Save,
  Loader2,
  Target,
  Link,
  Mail,
  User,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { useAuth, useCurrentProfile } from "@/stores/auth-store";
import { db } from "@/lib/supabase";
import { uploadAvatarImage } from "@/lib/storage-helper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";
import { initials } from "@/lib/format";
import { parseOnboarding, BADGES } from "@/lib/onboarding-config";
import { BadgeCircle } from "@/components/onboarding/onboarding-bits";
import { GenericAvatarPicker } from "@/components/profile/generic-avatar-picker";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "My Profile — Tenacious CRM" }] }),
  component: ProfilePage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

function ProfilePage() {
  const profile = useCurrentProfile();
  const [displayName, setDisplayName] = useState("");
  const [crfLink, setCrfLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setCrfLink(profile.crf_link || "");
    }
  }, [profile]);

  if (!profile) return null;
  const currentProfile = profile;

  const roleLabels: Record<string, string> = {
    superadmin: "Super Administrator",
    manager: "Manager",
    property_consultant: "Property Consultant",
  };

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const signedUrl = await uploadAvatarImage("avatars", file);

      // Save to database
      const { data: updatedProfile, error } = await db
        .from("profiles")
        .update({
          profile_photo_url: signedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentProfile.id)
        .select()
        .maybeSingle();

      if (error || !updatedProfile)
        throw new Error(error?.message || "Failed to update profile picture");

      // Update Zustand state
      useAuth.setState({ profile: updatedProfile });
      toast.success("Profile picture updated successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload profile picture.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (displayName.trim().length < 3) {
      toast.error("Display name must be at least 3 characters.");
      return;
    }

    setSaving(true);
    try {
      const { data: updatedProfile, error } = await db
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          crf_link: crfLink.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentProfile.id)
        .select()
        .maybeSingle();

      if (error || !updatedProfile) throw new Error(error?.message || "Failed to update profile");

      // Update Zustand state
      useAuth.setState({ profile: updatedProfile });
      toast.success("Profile changes saved.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="mb-4 hidden sm:block">
        <h1 className="text-[22px] font-semibold sm:text-3xl">My Profile</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Avatar Upload & Quick info */}
        <Card className="md:col-span-1 border-[var(--color-border)]">
          <CardHeader className="items-center text-center">
            <div className="relative group">
              <label className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-hover)] ring-4 ring-white shadow-md transition-tenacious hover:brightness-95">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">{initials(profile.display_name)}</span>
                )}
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 group-hover:bg-black/40 group-hover:opacity-100 transition-tenacious text-white">
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
            <CardTitle className="mt-4 text-lg font-bold">{profile.display_name}</CardTitle>
            <CardDescription className="text-sm font-medium text-[var(--color-text-secondary)]">
              {roleLabels[profile.role] || profile.role}
            </CardDescription>
            {/* Uploading a photo is optional — generic avatars as a fallback. */}
            <div className="mt-3 w-full">
              <GenericAvatarPicker
                onSelected={() => toast.success("Avatar updated successfully.")}
              />
            </div>
            <ProfileBadgeRow onboarding={(profile as { onboarding?: unknown }).onboarding} />
          </CardHeader>
          <CardContent className="border-t border-[var(--color-border)] pt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Mail className="h-4 w-4" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Shield className="h-4 w-4" />
              <span>Agent ID: {profile.agent_number}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <BadgeCheck className="h-4 w-4 text-green-500" />
              <span>Status: Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Details Form */}
        <Card className="md:col-span-2 border-[var(--color-border)]">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal info, contact details and links.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-placeholder)]" />
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9 border-[var(--color-border)] focus-visible:ring-[var(--color-primary)]"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>System Role</Label>
                <Input
                  disabled
                  value={roleLabels[profile.role] || profile.role}
                  className="bg-[var(--color-surface)] border-[var(--color-border)] opacity-80"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Agent Number</Label>
                <Input
                  disabled
                  value={profile.agent_number}
                  className="bg-[var(--color-surface)] border-[var(--color-border)] opacity-80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crf-link">Customer Relations Form (CRF) Link</Label>
              <div className="relative">
                <Link className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-placeholder)]" />
                <Input
                  id="crf-link"
                  type="url"
                  value={crfLink}
                  onChange={(e) => setCrfLink(e.target.value)}
                  className="pl-9 border-[var(--color-border)] focus-visible:ring-[var(--color-primary)]"
                  placeholder="https://docs.google.com/forms/..."
                />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Your clients will be directed here during the CRF workflow stage.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Personal Monthly Target</Label>
              <div className="relative">
                <Target className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-placeholder)]" />
                <Input
                  disabled
                  value={new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                    maximumFractionDigits: 0,
                  }).format(profile.personal_monthly_target)}
                  className="pl-9 bg-[var(--color-surface)] border-[var(--color-border)] opacity-80"
                />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Target is managed by your administration team.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-foreground)] gap-2 font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Onboarding badges earned by this user (§3.2) — small row under the avatar card. */
function ProfileBadgeRow({ onboarding }: { onboarding: unknown }) {
  const state = parseOnboarding(onboarding);
  if (!state || state.badges.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {state.badges
        .filter((id) => BADGES[id])
        .map((id) => (
          <span
            key={id}
            className="flex flex-col items-center gap-1"
            title={BADGES[id].description}
          >
            <BadgeCircle badgeId={id} />
            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
              {BADGES[id].name}
            </span>
          </span>
        ))}
    </div>
  );
}
