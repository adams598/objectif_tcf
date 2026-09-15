import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
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
import { activeQuestionsCountSelect } from "@/lib/db/active-questions";
import { MAX_QUESTIONS_PER_CUE, sanitizeVideoCues } from "@/lib/series/video-cues";

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  durationMin: z.number().int().min(1).max(180).optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  isFree: z.boolean().optional(),
  videoUrl: z.string().max(2000).optional().nullable(),
  audioUrl: z.string().max(2000).optional().nullable(),
  videoCues: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        timeSec: z.number().min(0).max(24 * 3600),
        questionIds: z.array(z.string().min(1)).min(1).max(MAX_QUESTIONS_PER_CUE),
      })
    )
    .max(200)
    .optional()
    .nullable(),
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const series = await prisma.examSeries.findFirst({
      where: { id, deletedAt: null },
      include: {
        exam: true,
        questions: {
          where: { deletedAt: null },
          include: { choices: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            questions: activeQuestionsCountSelect,
            attempts: true,
          },
        },
      },
    });

    if (!series) return notFoundResponse("Série introuvable");
    return successResponse(series);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
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

    const existing = await prisma.examSeries.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        questions: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (!existing) return notFoundResponse("Série introuvable");

    const { videoUrl, audioUrl, videoCues, ...rest } = parsed.data;
    const data: Prisma.ExamSeriesUpdateInput = { ...rest };

    if (videoUrl !== undefined) {
      const url = videoUrl?.trim() || null;
      data.videoUrl = url;
      if (url) data.audioUrl = null;
    }

    if (audioUrl !== undefined) {
      const url = audioUrl?.trim() || null;
      data.audioUrl = url;
      if (url) data.videoUrl = null;
    }

    if (videoCues !== undefined) {
      const allowed = new Set(existing.questions.map((q) => q.id));
      data.videoCues = sanitizeVideoCues(videoCues ?? [], allowed);
    }

    const series = await prisma.examSeries.update({
      where: { id },
      data,
    });

    await markSeriesAsCustomContent(id);

    return successResponse(series);
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

    await prisma.examSeries.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
