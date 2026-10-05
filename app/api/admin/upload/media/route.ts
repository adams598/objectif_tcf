import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { uploadContentMedia } from "@/lib/media/content-media-upload";
import { handleAdminBlobClientUpload } from "@/lib/media/handle-admin-blob-upload";
import { getBlobStorageBackend } from "@/lib/media/blob-storage";
import { detectMediaKindFromFile } from "@/lib/media/content-media-types";
import { isVercelRuntime } from "@/lib/env/runtime";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

export const maxDuration = 300;

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

/**
 * JSON → token Blob (Vercel)
 * FormData → disque Hostinger / local
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const contentType = req.headers.get("content-type") ?? "";
    const backend = getBlobStorageBackend();

    if (contentType.includes("application/json")) {
      return await handleAdminBlobClientUpload(req);
    }

    if (isVercelRuntime() && backend === "vercel-blob") {
      return errorResponse(
        "Sur Vercel, rechargez la page pour envoyer le fichier vers le stockage cloud.",
        400
      );
    }

    if (backend === "none") {
      return errorResponse(
        "Aucun stockage fichier configuré (disque Hostinger ou Vercel Blob).",
        503
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const kindRaw = formData.get("kind");

    if (!(file instanceof File)) {
      return errorResponse("Fichier requis", 400);
    }

    const detected = detectMediaKindFromFile(file);
    const kind =
      kindRaw === "audio" ||
      kindRaw === "image" ||
      kindRaw === "video" ||
      kindRaw === "media"
        ? kindRaw
        : detected ?? "audio";

    const url = await uploadContentMedia(file, kind);
    return successResponse({ url, kind });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Format")) {
      return errorResponse(error.message, 422);
    }
    if (error instanceof Error && error.message.includes("dépasser")) {
      return errorResponse(error.message, 422);
    }
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function GET() {
  const backend = getBlobStorageBackend();
  return NextResponse.json({
    success: true,
    data: {
      backend,
      clientUploadUrl:
        backend === "vercel-blob" ? "/api/admin/upload/blob" : "/api/admin/upload/media",
    },
  });
}
