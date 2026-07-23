import { randomUUID } from "crypto";
import {
  getBlobStorageBackend,
  uploadWithBlobOrLocal,
} from "@/lib/media/blob-storage";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const AUDIO_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export type ContentMediaKind = "image" | "audio";

function extensionForFile(kind: ContentMediaKind, mime: string): string {
  if (kind === "audio") {
    if (mime.includes("wav")) return "wav";
    if (mime.includes("webm")) return "webm";
    if (mime.includes("ogg")) return "ogg";
    return "mp3";
  }
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function validateContentMediaFile(
  file: File,
  kind: ContentMediaKind
): string | null {
  const allowed = kind === "audio" ? AUDIO_MIME : IMAGE_MIME;
  const maxBytes = kind === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;

  if (!allowed.has(file.type)) {
    return kind === "audio"
      ? "Format audio non supporté (MP3, WAV, WebM, OGG)."
      : "Format image non supporté (JPEG, PNG, WebP, GIF).";
  }
  if (file.size > maxBytes) {
    return kind === "audio"
      ? "L'audio ne doit pas dépasser 15 Mo."
      : "L'image ne doit pas dépasser 5 Mo.";
  }
  return null;
}

export async function uploadContentMedia(
  file: File,
  kind: ContentMediaKind
): Promise<string> {
  const validationError = validateContentMediaFile(file, kind);
  if (validationError) throw new Error(validationError);

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = randomUUID();
  const ext = extensionForFile(kind, file.type);
  const subdir = kind === "audio" ? "content/audio" : "content/images";

  return uploadWithBlobOrLocal({
    blobPathname: `${subdir}/${fileId}.${ext}`,
    localSubdir: subdir,
    localFilename: `${fileId}.${ext}`,
    buffer,
    contentType: file.type,
  });
}

export function getContentMediaStorageBackend() {
  return getBlobStorageBackend();
}
