import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { uploadOralRecording } from "@/lib/media/oral-recording-upload";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await req.formData();
    const file = formData.get("file");
    const seriesId = formData.get("seriesId");
    const questionId = formData.get("questionId");

    if (!(file instanceof File)) {
      return validationErrorResponse({ file: ["Fichier audio requis"] });
    }
    if (typeof seriesId !== "string" || !seriesId) {
      return validationErrorResponse({ seriesId: ["Série requise"] });
    }
    if (typeof questionId !== "string" || !questionId) {
      return validationErrorResponse({ questionId: ["Question requise"] });
    }

    const url = await uploadOralRecording(user.userId, seriesId, questionId, file);

    return successResponse({ url });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message.includes("Format")) {
      return validationErrorResponse({ file: [error.message] });
    }
    return serverErrorResponse(error);
  }
}
