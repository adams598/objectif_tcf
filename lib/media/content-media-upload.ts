import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";

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
            folder: `objectif-tcf/content/${kind}`,
            public_id: fileId,
            resource_type: kind === "audio" ? "video" : "image",
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

  const ext = extensionForFile(kind, file.type);
  const subdir = kind === "audio" ? "audio" : "images";
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "content", subdir);
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${fileId}.${ext}`;
  await writeFile(path.join(uploadsDir, filename), buffer);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/uploads/content/${subdir}/${filename}`;
}
