import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { uploadAvatar } from "@/lib/media/avatar-upload";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File) || file.size === 0) {
      return validationErrorResponse({
        avatar: ["Veuillez sélectionner une image."],
      });
    }

    const avatarUrl = await uploadAvatar(session.userId, file);

    await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl },
    });

    return successResponse({ avatarUrl }, "Photo de profil mise à jour");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message.includes("Format")) {
      return validationErrorResponse({ avatar: [error.message] });
    }
    if (error instanceof Error && error.message.includes("2 Mo")) {
      return validationErrorResponse({ avatar: [error.message] });
    }
    return serverErrorResponse(error);
  }
}
