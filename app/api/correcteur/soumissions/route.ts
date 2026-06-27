import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";

const submitCorrectionSchema = z.object({
  answerId: z.string().uuid(),
  studentId: z.string().uuid(),
  score: z.number().min(0).max(100),
  rubric: z.record(z.string(), z.number()),
  feedback: z.string().min(1),
});

/** GET: liste des réponses EE/EO en attente de correction */
export async function GET(_req: NextRequest) {
  try {
    await requireRole("CORRECTOR");

    const answers = await prisma.answer.findMany({
      where: {
        textResponse: { not: null },
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
    return serverErrorResponse(error);
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
        rubric,
        feedback,
        status: "COMPLETED",
        correctedAt: new Date(),
      },
    });

    return successResponse(correction);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
