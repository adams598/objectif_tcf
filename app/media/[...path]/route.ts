import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getUploadsRoot } from "@/lib/media/blob-storage";

const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path ?? [];
  if (segments.length === 0) {
    return new NextResponse("Introuvable", { status: 404 });
  }
  if (segments.some((part) => part === ".." || part.includes("/") || part.includes("\\"))) {
    return new NextResponse("Chemin invalide", { status: 400 });
  }

  const root = path.resolve(getUploadsRoot());
  const filePath = path.resolve(root, ...segments);
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    return new NextResponse("Chemin invalide", { status: 400 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return new NextResponse("Introuvable", { status: 404 });
    }
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentTypeFor(filePath),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(info.size),
      },
    });
  } catch {
    return new NextResponse("Introuvable", { status: 404 });
  }
}
