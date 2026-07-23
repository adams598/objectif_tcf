import { unlink } from "fs/promises";
import path from "path";
import { uploadWithBlobOrLocal } from "@/lib/media/blob-storage";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Format non supporté. Utilisez JPEG, PNG ou WebP.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "L'image ne doit pas dépasser 2 Mo.";
  }
  return null;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extensionForMime(file.type);
  const filename = `${userId}.${ext}`;

  await deleteLocalAvatar(userId);

  return uploadWithBlobOrLocal({
    blobPathname: `avatars/${filename}`,
    localSubdir: "avatars",
    localFilename: filename,
    buffer,
    contentType: file.type,
    cacheBustQuery: String(Date.now()),
  });
}

export async function deleteLocalAvatar(userId: string): Promise<void> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    try {
      await unlink(path.join(uploadsDir, `${userId}.${ext}`));
    } catch {
      // fichier absent
    }
  }
}
