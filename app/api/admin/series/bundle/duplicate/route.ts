import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { parseVideoCues } from "@/lib/series/video-cues";
import {
  createdResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

const duplicateSchema = z.object({
  examId: z.string().min(1),
  order: z.number().int().min(0),
  title: z.string().min(2).max(200).optional(),
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

function copyTitle(source: string, requested?: string): string {
  if (requested?.trim()) return requested.trim().slice(0, 200);
  const suffix = " (copie)";
  const base = source.trim() || "Série";
  if (base.length + suffix.length <= 200) return `${base}${suffix}`;
  return `${base.slice(0, 200 - suffix.length).trimEnd()}${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const parsed = duplicateSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { examId, order, title: requestedTitle } = parsed.data;

    const sources = await prisma.examSeries.findMany({
      where: { examId, order, deletedAt: null },
      orderBy: { skill: "asc" },
      include: {
        questions: {
          where: { deletedAt: null },
          include: { choices: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    });

    if (sources.length === 0) {
      return notFoundResponse("Série introuvable");
    }

    const maxOrder = await prisma.examSeries.aggregate({
      where: { examId, deletedAt: null },
      _max: { order: true },
    });
    const newOrder = (maxOrder._max.order ?? 0) + 1;
    const sourceTitle =
      sources.find((series) => series.title.trim())?.title ?? "Série";
    const title = copyTitle(sourceTitle, requestedTitle);

    await prisma.$transaction(
      async (tx) => {
        for (const source of sources) {
          const created = await tx.examSeries.create({
            data: {
              examId: source.examId,
              skill: source.skill,
              title,
              description: source.description,
              difficulty: source.difficulty,
              durationMin: source.durationMin,
              totalPoints: source.totalPoints,
              order: newOrder,
              isPublished: false,
              isFree: source.isFree,
              isCustomContent: true,
              audioUrl: source.audioUrl,
              videoUrl: source.videoUrl,
              imageUrl: source.imageUrl,
              createdById: admin.userId,
            },
          });

          const idMap = new Map<string, string>();

          for (const question of source.questions) {
            const copy = await tx.question.create({
              data: {
                seriesId: created.id,
                type: question.type,
                content: question.content,
                instruction: question.instruction,
                audioUrl: question.audioUrl,
                videoUrl: question.videoUrl,
                imageUrl: question.imageUrl,
                order: question.order,
                points: question.points,
                timeLimit: question.timeLimit,
                explanation: question.explanation,
                choices: {
                  create: question.choices.map((choice) => ({
                    content: choice.content,
                    isCorrect: choice.isCorrect,
                    order: choice.order,
                  })),
                },
              },
            });
            idMap.set(question.id, copy.id);
          }

          const cues = parseVideoCues(source.videoCues)
            .map((cue) => ({
              ...cue,
              questionIds: cue.questionIds
                .map((id) => idMap.get(id))
                .filter((id): id is string => Boolean(id)),
            }))
            .filter((cue) => cue.questionIds.length > 0);

          if (cues.length > 0) {
            await tx.examSeries.update({
              where: { id: created.id },
              data: { videoCues: cues as unknown as Prisma.InputJsonValue },
            });
          }
        }
      },
      { timeout: 30_000 }
    );

    return createdResponse({
      examId,
      order: newOrder,
      title,
      isDraft: true,
    });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
