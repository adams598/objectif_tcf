import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications/create-notification";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const submitCorrectionSchema = z.object({
  answerId: z.string().uuid(),
  studentId: z.string().uuid(),
  score: z.number().min(0).max(100),
  rubric: z.record(z.string(), z.number()),
  feedback: z.string().min(1),
});

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

/** GET: liste des réponses EE/EO en attente de correction */
export async function GET(_req: NextRequest) {
  try {
    await requireRole("CORRECTOR", "ADMIN", "SUPER_ADMIN");

    const answers = await prisma.answer.findMany({
      where: {
        OR: [{ textResponse: { not: null } }, { audioUrl: { not: null } }],
        correction: null,
        attempt: {
          status: "COMPLETED",
          series: { skill: { in: ["EXPRESSION_ECRITE", "EXPRESSION_ORALE"] } },
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        attempt: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            series: { select: { title: true, skill: true } },
          },
        },
        question: { select: { content: true, type: true } },
        correction: { select: { id: true, score: true, status: true } },
      },
    });

    return successResponse(answers);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

/** POST: soumettre une correction */
export async function POST(req: NextRequest) {
  try {
    const corrector = await requireRole("CORRECTOR");
    const body = await req.json();

    const parsed = submitCorrectionSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { answerId, studentId, score, rubric, feedback } = parsed.data;

    const correction = await prisma.correction.create({
      data: {
        answerId,
        correctorId: corrector.userId,
        studentId,
        score,
        maxScore: 100,
        rubric,
        feedback,
        status: "COMPLETED",
        correctedAt: new Date(),
      },
    });

    await createNotification({
      userId: studentId,
      type: "CORRECTION_DONE",
      title: "Correction disponible",
      message: `Votre production a été corrigée. Score : ${score}/100.`,
      data: { correctionId: correction.id, answerId },
    });

    return successResponse(correction);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
