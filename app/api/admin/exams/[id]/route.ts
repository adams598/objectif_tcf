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

const updateExamSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  type: z
    .enum(["TCF_CANADA", "TEF_CANADA", "IELTS", "DELF", "DALF", "TOEFL", "AUTRE"])
    .optional(),
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

    const exam = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        series: {
          where: { deletedAt: null },
          orderBy: [{ order: "asc" }, { skill: "asc" }],
          select: {
            id: true,
            title: true,
            skill: true,
            order: true,
            isPublished: true,
            isFree: true,
            _count: { select: { questions: true } },
          },
        },
        _count: { select: { series: true } },
      },
    });

    if (!exam) return notFoundResponse("Examen");
    return successResponse(exam);
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
    const parsed = updateExamSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return notFoundResponse("Examen");

    const exam = await prisma.exam.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { series: true } } },
    });

    return successResponse(exam);
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

    const existing = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { series: true } } },
    });
    if (!existing) return notFoundResponse("Examen");

    await prisma.exam.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
