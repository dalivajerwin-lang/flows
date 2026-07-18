import { supabase } from "./supabase";

/**
 * crypto.randomUUID is only defined in secure contexts (HTTPS / localhost).
 * When the app is served over a LAN IP or plain HTTP (common on mobile test
 * devices), fall back to a v4 UUID built from crypto.getRandomValues, which
 * works everywhere.
 */
function randomUUID(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Uploads a file to a Supabase storage bucket and returns a signed URL.
 *
 * @param bucket - Storage bucket name ("profile-photos" or "broadcast-media")
 * @param folder - Folder prefix (e.g. "leads", "users", "broadcasts")
 * @param file - The HTML File object to upload
 * @param expiresSeconds - Signed URL expiration time (defaults to 1 year = 31,536,000 seconds)
 */
export async function uploadAndGetSignedUrl(
  bucket: string,
  folder: string,
  file: File,
  expiresSeconds = 31536000,
): Promise<string> {
  // Generate a unique path: folder/random-uuid-filename
  const ext = file.name.split(".").pop();
  const filename = `${randomUUID()}.${ext}`;
  const filePath = `${folder}/${filename}`;

  // 1. Upload file to bucket
  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 2. Generate signed URL
  const { data, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresSeconds);

  if (signError || !data?.signedUrl) {
    throw new Error(
      `Failed to generate signed URL: ${signError?.message || "No signed URL returned"}`,
    );
  }

  return data.signedUrl;
}
