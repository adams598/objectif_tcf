import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { put } from "@vercel/blob";
import { isLocalDevelopment, isVercelRuntime } from "@/lib/env/runtime";

export type StorageBackend = "vercel-blob" | "disk" | "local" | "none";

export function isVercelBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function getUploadsRoot(): string {
  if (process.env.UPLOADS_DIR?.trim()) {
    return path.resolve(process.env.UPLOADS_DIR.trim());
  }
  if (!isVercelRuntime() && process.env.NODE_ENV === "production") {
    return path.join(os.homedir(), "objectif-tcf-media");
  }
  return path.join(process.cwd(), "public", "uploads");
}

export function isDiskStorageEnabled(): boolean {
  if (isVercelBlobConfigured()) return false;
  if (process.env.UPLOADS_DIR?.trim()) return true;
  return !isVercelRuntime();
}

export function blobStorageRequiredMessage(): string {
  if (isVercelRuntime()) {
    return "Vercel Blob requis : ajoutez BLOB_READ_WRITE_TOKEN dans Vercel → Settings → Environment Variables (Storage → Blob).";
  }
  return "Stockage disque indisponible : définissez UPLOADS_DIR (ex. /home/USER/objectif-tcf-media).";
}

export async function uploadBufferToVercelBlob(
  pathname: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function uploadToLocalPublicDir(
  subdir: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/uploads/${subdir}/${filename}`;
}

async function uploadToPersistentDisk(
  subdir: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const destDir = path.join(getUploadsRoot(), subdir);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, filename), buffer);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/media/${subdir}/${filename}`;
}

/** Blob sur Vercel ; disque Hostinger/VPS (hors dossier de déploiement) ; public/uploads en local. */
export async function uploadWithBlobOrLocal(options: {
  blobPathname: string;
  localSubdir: string;
  localFilename: string;
  buffer: Buffer;
  contentType: string;
  cacheBustQuery?: string;
}): Promise<string> {
  if (isVercelBlobConfigured()) {
    const url = await uploadBufferToVercelBlob(
      options.blobPathname,
      options.buffer,
      options.contentType
    );
    return options.cacheBustQuery ? `${url}?v=${options.cacheBustQuery}` : url;
  }

  if (isLocalDevelopment() && !process.env.UPLOADS_DIR?.trim()) {
    const url = await uploadToLocalPublicDir(
      options.localSubdir,
      options.localFilename,
      options.buffer
    );
    return options.cacheBustQuery
      ? `${url}?v=${options.cacheBustQuery}`
      : url;
  }

  if (isDiskStorageEnabled()) {
    const url = await uploadToPersistentDisk(
      options.localSubdir,
      options.localFilename,
      options.buffer
    );
    return options.cacheBustQuery
      ? `${url}?v=${options.cacheBustQuery}`
      : url;
  }

  throw new Error(blobStorageRequiredMessage());
}

export function getBlobStorageBackend(): StorageBackend {
  if (isVercelBlobConfigured()) return "vercel-blob";
  if (process.env.UPLOADS_DIR?.trim()) return "disk";
  if (!isVercelRuntime() && process.env.NODE_ENV === "production") return "disk";
  if (isLocalDevelopment()) return "local";
  return "none";
}
