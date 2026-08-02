import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { uploadContentMedia } from "@/lib/media/content-media-upload";
import {
  AUDIO_MIME_LIST,
  IMAGE_MIME_LIST,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  VIDEO_MIME_LIST,
} from "@/lib/media/content-media-types";
import {
  isVercelBlobConfigured,
  blobStorageRequiredMessage,
} from "@/lib/media/blob-storage";
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
 * Upload client direct → Vercel Blob (évite la limite ~4,5 Mo des API Routes Vercel).
 * Body JSON = protocole @vercel/blob/client handleUpload.
 */
async function handleClientBlobUpload(request: Request) {
  if (!isVercelBlobConfigured()) {
    return errorResponse(blobStorageRequiredMessage(), 503);
  }

  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname) => {
      if (pathname.startsWith("content/audio/")) {
        return {
          allowedContentTypes: [...AUDIO_MIME_LIST],
          maximumSizeInBytes: MAX_AUDIO_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ scope: "admin-content-audio" }),
        };
      }
      if (pathname.startsWith("content/images/")) {
        return {
          allowedContentTypes: [...IMAGE_MIME_LIST],
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ scope: "admin-content-image" }),
        };
      }
      if (pathname.startsWith("content/video/")) {
        return {
          allowedContentTypes: [...VIDEO_MIME_LIST],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ scope: "admin-content-video" }),
        };
      }
      throw new Error("Chemin média invalide");
    },
  });

  return NextResponse.json(jsonResponse);
}

/** Fallback FormData — local / petits fichiers uniquement. */
async function handleFormDataUpload(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const kindRaw = formData.get("kind");

  if (!(file instanceof File)) {
    return errorResponse("Fichier requis", 400);
  }

  if (kindRaw !== "audio" && kindRaw !== "image") {
    return errorResponse(
      "Pour audio/image/vidéo volumineux, utilisez l'upload client Blob. FormData accepté uniquement pour image ou audio (dev local).",
      400
    );
  }
  const kind: "audio" | "image" = kindRaw;

  // Sur Vercel, refuser les gros fichiers qui déclencheraient un 413 opaque
  if (file.size > 3.5 * 1024 * 1024 && isVercelBlobConfigured()) {
    return errorResponse(
      "Fichier trop volumineux pour l'upload serveur. Réessayez : l'envoi direct Blob devrait être utilisé automatiquement.",
      413
    );
  }

  const url = await uploadContentMedia(file, kind);
  return successResponse({ url, kind });
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return await handleClientBlobUpload(req);
    }

    return await handleFormDataUpload(req);
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
