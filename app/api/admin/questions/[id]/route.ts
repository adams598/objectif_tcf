import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { markSeriesAsCustomContent } from "@/lib/admin/series-content";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const choiceSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1),
  isCorrect: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

const updateSchema = z.object({
  type: z
    .enum([
      "QCM",
      "TRUE_FALSE",
      "TEXT_INPUT",
      "AUDIO",
      "WRITING_TASK",
      "SPEAKING_TASK",
    ])
    .optional(),
  content: z.string().min(1).optional(),
  instruction: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  order: z.number().int().min(1).optional(),
  points: z.number().int().min(1).optional(),
  audioUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  choices: z.array(choiceSchema).optional(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: { choices: true },
    });
    if (!existing) return notFoundResponse("Question introuvable");

    const { choices, ...questionData } = parsed.data;

    const question = await prisma.$transaction(async (tx) => {
      if (choices) {
        await tx.choice.deleteMany({ where: { questionId: id } });
        await tx.choice.createMany({
          data: choices.map((c, i) => ({
            questionId: id,
            content: c.content,
            isCorrect: c.isCorrect,
            order: c.order ?? i,
          })),
        });
      }

      return tx.question.update({
        where: { id },
        data: questionData,
        include: { choices: { orderBy: { order: "asc" } } },
      });
    });

    await markSeriesAsCustomContent(existing.seriesId);

    return successResponse(question);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const existing = await prisma.question.findFirst({
      where: { id, deletedAt: null },
      select: { seriesId: true },
    });
    if (!existing) return notFoundResponse("Question introuvable");

    await prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await markSeriesAsCustomContent(existing.seriesId);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
