/**
 * Extract canonical facebook profile id/username from a URL.
 * Handles:
 *   facebook.com/john.doe
 *   m.facebook.com/john.doe
 *   facebook.com/profile.php?id=12345
 *   m.facebook.com/...?id=12345
 *   facebook.com/people/Name/12345
 * Returns lowercased canonical id, or null.
 */
export function extractFacebookCanonicalId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!host.includes("facebook.com") && !host.includes("fb.com")) return null;
  const idParam = url.searchParams.get("id");
  if (idParam) return `id:${idParam}`;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  if (parts[0].toLowerCase() === "profile.php") {
    return idParam ? `id:${idParam}` : null;
  }
  if (parts[0].toLowerCase() === "people" && parts.length >= 3) {
    return `id:${parts[2]}`;
  }
  return `user:${parts[0].toLowerCase()}`;
}
