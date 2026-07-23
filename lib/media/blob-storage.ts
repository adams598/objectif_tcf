import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { isLocalDevelopment, isVercelRuntime } from "@/lib/env/runtime";

export function isVercelBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function blobStorageRequiredMessage(): string {
  return isVercelRuntime()
    ? "Vercel Blob requis : ajoutez BLOB_READ_WRITE_TOKEN dans Vercel → Settings → Environment Variables (Storage → Blob)."
    : "Stockage cloud requis : configurez BLOB_READ_WRITE_TOKEN (Vercel Blob) pour les uploads en production.";
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

/** Blob en prod/preview ; disque local uniquement en dev sans token. */
export async function uploadWithBlobOrLocal(options: {
  blobPathname: string;
  localSubdir: string;
  localFilename: string;
  buffer: Buffer;
  contentType: string;
  cacheBustQuery?: string;
}): Promise<string> {
  if (isVercelBlobConfigured()) {
    return uploadBufferToVercelBlob(
      options.blobPathname,
      options.buffer,
      options.contentType
    );
  }

  if (isLocalDevelopment()) {
    const url = await uploadToLocalPublicDir(
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

export function getBlobStorageBackend(): "vercel-blob" | "local" | "none" {
  if (isVercelBlobConfigured()) return "vercel-blob";
  if (isLocalDevelopment()) return "local";
  return "none";
}
