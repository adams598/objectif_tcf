import {
  getBlobStorageBackend,
  uploadWithBlobOrLocal,
} from "@/lib/media/blob-storage";
import {
  contentMediaBlobPathname,
  contentMediaSubdir,
  validateContentMediaFile,
  type ContentMediaKind,
} from "@/lib/media/content-media-types";

export type { ContentMediaKind };
export {
  validateContentMediaFile,
  contentMediaBlobPathname,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "@/lib/media/content-media-types";

/** Upload serveur (local / petits fichiers). Éviter sur Vercel pour > ~4 Mo. */
export async function uploadContentMedia(
  file: File,
  kind: Exclude<ContentMediaKind, "video">
): Promise<string> {
  const validationError = validateContentMediaFile(file, kind);
  if (validationError) throw new Error(validationError);

  const buffer = Buffer.from(await file.arrayBuffer());
  const pathname = contentMediaBlobPathname(kind, file);
  const filename = pathname.split("/").pop()!;
  const subdir = contentMediaSubdir(kind);

  return uploadWithBlobOrLocal({
    blobPathname: pathname,
    localSubdir: subdir,
    localFilename: filename,
    buffer,
    contentType: file.type,
  });
}

export function getContentMediaStorageBackend() {
  return getBlobStorageBackend();
}
