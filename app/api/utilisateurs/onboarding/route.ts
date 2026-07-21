import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { parseDateInput } from "@/lib/user/exam-date";
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

const onboardingSchema = z.object({
  immigrationObjective: z.enum([
    "RESIDENCE_PERMANENTE",
    "ETUDES",
    "TRAVAIL",
    "CITOYENNETE",
    "AUTRE",
  ]),
  currentLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  targetExamDate: z.string().min(1),
  nativeLanguage: z.string().min(1).max(20),
  targetCountry: z.string().min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();

    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { immigrationObjective, currentLevel, targetExamDate, nativeLanguage, targetCountry } =
      parsed.data;

    const examDate = parseDateInput(targetExamDate);
    if (Number.isNaN(examDate.getTime())) {
      return validationErrorResponse({
        targetExamDate: ["Date d'examen invalide"],
      });
    }

    const user = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        immigrationObjective,
        currentLevel,
        targetExamDate: examDate,
        nativeLanguage,
        targetCountry,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        onboardingCompleted: true,
        immigrationObjective: true,
        currentLevel: true,
        targetExamDate: true,
        nativeLanguage: true,
        targetCountry: true,
      },
    });

    void prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: "ONBOARDING_COMPLETED",
          entity: "User",
          entityId: user.id,
        },
      })
      .catch(console.error);

    return successResponse(user, "Profil configuré avec succès");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
