/** Helpers partagés client/serveur pour uploads médias (sans imports Node). */

export type ContentMediaKind = "image" | "audio" | "video";

export const IMAGE_MIME_LIST = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const AUDIO_MIME_LIST = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
] as const;

export const VIDEO_MIME_LIST = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

const IMAGE_MIME = new Set<string>(IMAGE_MIME_LIST);
const AUDIO_MIME = new Set<string>(AUDIO_MIME_LIST);
const VIDEO_MIME = new Set<string>(VIDEO_MIME_LIST);

function extensionForFile(kind: ContentMediaKind, mime: string): string {
  if (kind === "audio") {
    if (mime.includes("wav")) return "wav";
    if (mime.includes("webm")) return "webm";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("mp4")) return "m4a";
    return "mp3";
  }
  if (kind === "video") {
    if (mime.includes("webm")) return "webm";
    if (mime.includes("quicktime") || mime.includes("m4v")) return "mov";
    return "mp4";
  }
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function contentMediaSubdir(kind: ContentMediaKind): string {
  if (kind === "audio") return "content/audio";
  if (kind === "video") return "content/video";
  return "content/images";
}

export function contentMediaBlobPathname(
  kind: ContentMediaKind,
  file: File
): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${contentMediaSubdir(kind)}/${id}.${extensionForFile(kind, file.type)}`;
}

export function validateContentMediaFile(
  file: File,
  kind: ContentMediaKind
): string | null {
  const allowed =
    kind === "audio" ? AUDIO_MIME : kind === "video" ? VIDEO_MIME : IMAGE_MIME;
  const maxBytes =
    kind === "audio"
      ? MAX_AUDIO_BYTES
      : kind === "video"
        ? MAX_VIDEO_BYTES
        : MAX_IMAGE_BYTES;

  if (!allowed.has(file.type)) {
    if (kind === "audio") {
      return "Format audio non supporté (MP3, WAV, WebM, OGG).";
    }
    if (kind === "video") {
      return "Format vidéo non supporté (MP4, WebM, MOV).";
    }
    return "Format image non supporté (JPEG, PNG, WebP, GIF).";
  }
  if (file.size > maxBytes) {
    if (kind === "audio") {
      return "L'audio ne doit pas dépasser 25 Mo.";
    }
    if (kind === "video") {
      return "La vidéo ne doit pas dépasser 150 Mo.";
    }
    return "L'image ne doit pas dépasser 5 Mo.";
  }
  return null;
}

export function maxBytesLabel(kind: ContentMediaKind): string {
  if (kind === "audio") return "25 Mo";
  if (kind === "video") return "150 Mo";
  return "5 Mo";
}
