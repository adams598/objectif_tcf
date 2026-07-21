import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";

const ALLOWED_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
]);

const MAX_ORAL_BYTES = 15 * 1024 * 1024;

function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(
    cloudName &&
      apiKey &&
      apiSecret &&
      cloudName !== "your-cloud-name" &&
      apiKey !== "your-api-key" &&
      apiSecret !== "your-api-secret"
  );
}

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
  const publicId = `${userId}/${seriesId}/${questionId}-${randomUUID().slice(0, 8)}`;

  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "objectif-tcf/oral-recordings",
            public_id: publicId,
            resource_type: "video",
            format: extensionForMime(file.type),
          },
          (error, uploadResult) => {
            if (error || !uploadResult?.secure_url) {
              reject(error ?? new Error("Échec de l'upload Cloudinary"));
              return;
            }
            resolve({ secure_url: uploadResult.secure_url });
          }
        )
        .end(buffer);
    });

    return result.secure_url;
  }

  const ext = extensionForMime(file.type);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "oral-recordings");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${publicId.replace(/\//g, "_")}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  await writeFile(filepath, buffer);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/uploads/oral-recordings/${filename}`;
}
