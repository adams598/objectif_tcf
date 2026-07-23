import { randomUUID } from "crypto";
import { uploadWithBlobOrLocal } from "@/lib/media/blob-storage";

const ALLOWED_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
]);

const MAX_ORAL_BYTES = 15 * 1024 * 1024;

function extensionForMime(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

export function validateOralRecordingFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type) && !file.type.startsWith("audio/")) {
    return "Format audio non supporté.";
  }
  if (file.size > MAX_ORAL_BYTES) {
    return "L'enregistrement ne doit pas dépasser 15 Mo.";
  }
  return null;
}

export async function uploadOralRecording(
  userId: string,
  seriesId: string,
  questionId: string,
  file: File
): Promise<string> {
  const validationError = validateOralRecordingFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extensionForMime(file.type);
  const fileId = `${userId}_${seriesId}_${questionId}_${randomUUID().slice(0, 8)}`;
  const filename = `${fileId}.${ext}`;

  return uploadWithBlobOrLocal({
    blobPathname: `oral-recordings/${filename}`,
    localSubdir: "oral-recordings",
    localFilename: filename,
    buffer,
    contentType: file.type,
  });
}
