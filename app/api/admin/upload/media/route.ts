import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { uploadContentMedia } from "@/lib/media/content-media-upload";
import { handleAdminBlobClientUpload } from "@/lib/media/handle-admin-blob-upload";
import { isLocalDevelopment, isVercelRuntime } from "@/lib/env/runtime";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

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
 * Compat :
 * - JSON → token Blob (même logique que /api/admin/upload/blob)
 * - FormData → local uniquement (jamais sur Vercel)
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return await handleAdminBlobClientUpload(req);
    }

    if (isVercelRuntime() || !isLocalDevelopment()) {
      return errorResponse(
        "Upload fichier via API désactivé en production (limite Vercel 4,5 Mo). Rechargez la page pour utiliser l'envoi direct cloud.",
        400
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const kindRaw = formData.get("kind");

    if (!(file instanceof File)) {
      return errorResponse("Fichier requis", 400);
    }

    if (kindRaw !== "audio" && kindRaw !== "image") {
      return errorResponse(
        "FormData local : image ou audio uniquement. Vidéo → upload Blob client.",
        400
      );
    }

    const url = await uploadContentMedia(file, kindRaw);
    return successResponse({ url, kind: kindRaw });
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
  return NextResponse.json({
    success: true,
    data: {
      clientUploadUrl: "/api/admin/upload/blob",
    },
  });
}
