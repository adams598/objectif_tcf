import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import {
  AUDIO_MIME_LIST,
  IMAGE_MIME_LIST,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  VIDEO_MIME_LIST,
} from "@/lib/media/content-media-types";
import {
  blobStorageRequiredMessage,
  isVercelBlobConfigured,
} from "@/lib/media/blob-storage";
import { errorResponse } from "@/lib/utils/api-response";

export async function handleAdminBlobClientUpload(
  request: Request
): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return errorResponse(
      "Cet endpoint n'accepte que JSON (token Blob). N'envoyez pas le fichier ici.",
      415
    );
  }

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
          // Liste large + types courants (Windows envoie parfois un mime atypique)
          allowedContentTypes: [
            ...AUDIO_MIME_LIST,
            "application/octet-stream",
          ],
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
          allowedContentTypes: [
            ...VIDEO_MIME_LIST,
            "application/octet-stream",
          ],
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
