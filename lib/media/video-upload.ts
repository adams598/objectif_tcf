import {
  MAX_VIDEO_BYTES,
  VIDEO_MIME_LIST,
  contentMediaBlobPathname,
  validateContentMediaFile,
} from "@/lib/media/content-media-types";

export const VIDEO_MIME = new Set<string>(VIDEO_MIME_LIST);
export { MAX_VIDEO_BYTES };

export function validateVideoFile(file: File): string | null {
  return validateContentMediaFile(file, "video");
}

export function videoBlobPathname(file: File): string {
  return contentMediaBlobPathname("video", file);
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
