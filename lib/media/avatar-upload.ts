import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

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
            folder: "objectif-tcf/avatars",
            public_id: userId,
            overwrite: true,
            resource_type: "image",
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
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadsDir, { recursive: true });

  await deleteLocalAvatar(userId);

  const filename = `${userId}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  await writeFile(filepath, buffer);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/uploads/avatars/${filename}?v=${Date.now()}`;
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
