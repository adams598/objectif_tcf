import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import {
  errorResponse,
  forbiddenResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { isVercelBlobConfigured } from "@/lib/media/blob-storage";

const VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
];

const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function POST(request: Request) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    if (!isVercelBlobConfigured()) {
      return errorResponse(
        "Vercel Blob requis pour les vidéos (BLOB_READ_WRITE_TOKEN)",
        503
      );
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("content/video/")) {
          throw new Error("Chemin vidéo invalide");
        }

        return {
          allowedContentTypes: VIDEO_CONTENT_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ scope: "admin-content-video" }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
