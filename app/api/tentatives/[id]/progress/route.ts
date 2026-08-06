import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

/**
 * Sauvegarde intermédiaire d'une tentative en cours pour permettre la reprise
 * après une déconnexion ou un rafraîchissement de page.
 *
 * - `answers` : sélections QCM par questionId → choiceId
 * - `textResponses` : productions écrites par questionId
 * - `currentOrder` : question / tâche courante (1-based)
 * - `elapsedSec` : temps écoulé côté client depuis le début de l'examen
 */
const progressSchema = z.object({
  answers: z.record(z.string()).optional(),
  textResponses: z.record(z.string()).optional(),
  currentOrder: z.number().int().min(0).optional(),
  elapsedSec: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const parsed = progressSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        seriesId: true,
      },
    });

    if (!attempt) return notFoundResponse("Tentative introuvable");
    if (attempt.userId !== user.userId) return forbiddenResponse();
    if (attempt.status !== "IN_PROGRESS") {
      return validationErrorResponse({
        status: ["La tentative n'est plus en cours"],
      });
    }

    const { answers, textResponses, currentOrder, elapsedSec } = parsed.data;

    // Récupérer les questions valides de la série pour filtrer les upserts
    const questions = await prisma.question.findMany({
      where: { seriesId: attempt.seriesId, deletedAt: null },
      select: { id: true },
    });
    const validIds = new Set(questions.map((q) => q.id));

    const upserts: Promise<unknown>[] = [];

    if (answers) {
      for (const [questionId, choiceId] of Object.entries(answers)) {
        if (!validIds.has(questionId)) continue;
        if (!choiceId) {
          upserts.push(
            prisma.answer
              .deleteMany({ where: { attemptId: id, questionId } })
              .catch(() => null)
          );
          continue;
        }
        upserts.push(
          prisma.answer.upsert({
            where: { attemptId_questionId: { attemptId: id, questionId } },
            create: {
              attemptId: id,
              questionId,
              userId: user.userId,
              choiceId,
            },
            update: { choiceId, textResponse: null, audioUrl: null },
          })
        );
      }
    }

    if (textResponses) {
      for (const [questionId, text] of Object.entries(textResponses)) {
        if (!validIds.has(questionId)) continue;
        const trimmed = text ?? "";
        upserts.push(
          prisma.answer.upsert({
            where: { attemptId_questionId: { attemptId: id, questionId } },
            create: {
              attemptId: id,
              questionId,
              userId: user.userId,
              textResponse: trimmed,
            },
            update: { textResponse: trimmed, choiceId: null },
          })
        );
      }
    }

    if (upserts.length > 0) {
      await Promise.all(upserts);
    }

    if (currentOrder !== undefined || elapsedSec !== undefined) {
      await prisma.attempt.update({
        where: { id },
        data: {
          ...(currentOrder !== undefined ? { currentOrder } : {}),
          ...(elapsedSec !== undefined ? { elapsedSec } : {}),
        },
      });
    }

    return successResponse({ saved: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
