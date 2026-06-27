import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  createdResponse,
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";

const startSchema = z.object({
  seriesId: z.string().uuid(),
});

const submitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      choiceId: z.string().uuid().optional(),
      textContent: z.string().optional(),
    })
  ),
  durationSeconds: z.number().int().positive(),
});

/** POST: démarrer ou soumettre une tentative */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    // Submit existing attempt
    if (body.attemptId) {
      const parsed = submitSchema.safeParse(body);
      if (!parsed.success) {
        return validationErrorResponse(parsed.error.flatten().fieldErrors);
      }

      const { attemptId, answers, durationSeconds } = parsed.data;

    const attempt = await prisma.attempt.findFirst({
      where: { id: attemptId, userId: user.userId },
        include: {
          series: {
            include: { questions: { include: { choices: true } } },
          },
        },
      });

      if (!attempt) {
        return validationErrorResponse({ attemptId: ["Tentative introuvable"] });
      }

      // Auto-correct objective answers
      let correctCount = 0;
      const answerRecords: {
        questionId: string;
        userId: string;
        choiceId?: string;
        textResponse?: string;
        isCorrect: boolean;
      }[] = [];

      for (const answer of answers) {
        const question = attempt.series.questions.find(
          (q) => q.id === answer.questionId
        );
        let isCorrect = false;

        if (question && answer.choiceId) {
          const correctChoice = question.choices.find((c) => c.isCorrect);
          isCorrect = correctChoice?.id === answer.choiceId;
          if (isCorrect) correctCount++;
        }

        answerRecords.push({
          questionId: answer.questionId,
          userId: user.userId,
          choiceId: answer.choiceId,
          textResponse: answer.textContent,
          isCorrect,
        });
      }

      const totalQuestions = attempt.series.questions.length;
      const scorePercent =
        totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      const updated = await prisma.attempt.update({
        where: { id: attemptId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          score: scorePercent,
          durationSec: durationSeconds,
          answers: {
            create: answerRecords,
          },
        },
        include: { answers: true },
      });

      return successResponse({ attempt: updated, score: scorePercent, correctCount, totalQuestions });
    }

    // Start new attempt
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { seriesId } = parsed.data;

    const series = await prisma.examSeries.findFirst({
      where: { id: seriesId, deletedAt: null },
    });
    if (!series) {
      return validationErrorResponse({ seriesId: ["Série introuvable"] });
    }

    const attempt = await prisma.attempt.create({
      data: {
        userId: user.userId,
        seriesId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return createdResponse(attempt);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/** GET: historique des tentatives */
export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const attempts = await prisma.attempt.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      include: {
        series: { select: { title: true, skill: true, difficulty: true } },
        _count: { select: { answers: true } },
      },
    });

    return successResponse(attempts);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
