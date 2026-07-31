import { randomUUID } from "crypto";

export const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

export function validateVideoFile(file: File): string | null {
  if (!VIDEO_MIME.has(file.type)) {
    return "Format vidéo non supporté (MP4, WebM, MOV).";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "La vidéo ne doit pas dépasser 150 Mo.";
  }
  return null;
}

export function videoBlobPathname(file: File): string {
  const ext =
    file.type.includes("webm")
      ? "webm"
      : file.type.includes("quicktime") || file.type.includes("m4v")
        ? "mov"
        : "mp4";
  return `content/video/${randomUUID()}.${ext}`;
}

export function isBlobVideoUrl(url: string): boolean {
  return (
    url.includes(".public.blob.vercel-storage.com") ||
    url.includes("/uploads/content/video/")
  );
}

export function isEmbeddableVideoUrl(url: string): boolean {
  return (
    /youtube\.com|youtu\.be|vimeo\.com/i.test(url) && !isBlobVideoUrl(url)
  );
}
