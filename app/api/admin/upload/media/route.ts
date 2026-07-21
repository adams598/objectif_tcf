import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import {
  uploadContentMedia,
  type ContentMediaKind,
} from "@/lib/media/content-media-upload";
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

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const formData = await req.formData();
    const file = formData.get("file");
    const kindRaw = formData.get("kind");

    if (!(file instanceof File)) {
      return errorResponse("Fichier requis", 400);
    }

    const kind = kindRaw === "audio" ? "audio" : kindRaw === "image" ? "image" : null;
    if (!kind) {
      return errorResponse("Type média invalide (image ou audio)", 400);
    }

    const url = await uploadContentMedia(file, kind as ContentMediaKind);

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
