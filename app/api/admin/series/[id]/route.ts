import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  durationMin: z.number().int().min(1).max(180).optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  isFree: z.boolean().optional(),
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
        _count: { select: { questions: true, attempts: true } },
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

    const series = await prisma.examSeries.update({
      where: { id },
      data: parsed.data,
    });

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
