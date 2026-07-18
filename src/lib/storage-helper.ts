import { supabase } from "./supabase";

/** Allowed avatar MIME types mapped to the extension we store them under. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOAD_COOLDOWN_MS = 5000;

/** Last upload timestamp per folder — throttles rapid repeat uploads client-side. */
const lastUploadAt = new Map<string, number>();

/**
 * Sniffs the file's magic bytes to confirm it really is a JPEG, PNG or WebP —
 * the browser-reported MIME type and the filename extension are both
 * attacker-controlled, so neither is trusted on its own.
 *
 * Signatures: JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`,
 * WebP `52 49 46 46 ....  57 45 42 50` (RIFF container with WEBP tag).
 */
async function sniffImageMime(file: File): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Validates and uploads an avatar image, returning a signed URL.
 *
 * Enforced client-side (RLS + bucket limits enforce the same server-side):
 * - caller must have an authenticated session
 * - declared MIME type must be image/jpeg, image/png or image/webp
 * - magic bytes must match a real image of one of those types
 * - max 5 MB
 * - at most one upload per folder every 5 seconds
 *
 * Files are stored under `<folder>/<auth-uid>/<uuid>.<ext>` so storage RLS can
 * scope updates/deletes to the owner, with the extension derived from the
 * sniffed type — never from the user-supplied filename.
 */
export async function uploadAvatarImage(
  folder: "avatars" | "leads",
  file: File,
  expiresSeconds = 31536000,
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("You must be signed in to upload a photo.");
  }

  const last = lastUploadAt.get(folder) ?? 0;
  if (Date.now() - last < UPLOAD_COOLDOWN_MS) {
    throw new Error("Please wait a few seconds before uploading again.");
  }

  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    throw new Error("Only JPEG, PNG or WebP images are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large — maximum size is 5 MB.");
  }

  const sniffedType = await sniffImageMime(file);
  if (!sniffedType || sniffedType !== file.type) {
    throw new Error("This file doesn't look like a valid image.");
  }

  lastUploadAt.set(folder, Date.now());

  const ext = ALLOWED_IMAGE_TYPES[sniffedType];
  const filePath = `${folder}/${userId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: sniffedType,
      upsert: false,
    });
  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data, error: signError } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(filePath, expiresSeconds);
  if (signError || !data?.signedUrl) {
    throw new Error(
      `Failed to generate signed URL: ${signError?.message || "No signed URL returned"}`,
    );
  }

  return data.signedUrl;
}

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
