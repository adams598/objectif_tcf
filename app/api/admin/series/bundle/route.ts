import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  createdResponse,
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { BUNDLE_SKILLS, type BundleSkill } from "@/lib/admin/series-groups";

const createSchema = z.object({
  examId: z.string().min(1),
  title: z.string().min(2).max(200),
  isFree: z.boolean().default(false),
});

const DURATION_BY_SKILL: Record<BundleSkill, number> = {
  COMPREHENSION_ORALE: 35,
  COMPREHENSION_ECRITE: 45,
  EXPRESSION_ECRITE: 60,
  EXPRESSION_ORALE: 12,
};

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const parsed = createSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { examId, title, isFree } = parsed.data;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return validationErrorResponse({ examId: ["Examen introuvable"] });
    }

    const maxOrder = await prisma.examSeries.aggregate({
      where: { examId, deletedAt: null },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? 0) + 1;

    const created = await prisma.$transaction(
      BUNDLE_SKILLS.map((skill) =>
        prisma.examSeries.create({
          data: {
            examId,
            skill,
            title,
            description: null,
            difficulty: "B1",
            durationMin: DURATION_BY_SKILL[skill],
            order,
            isPublished: false,
            isFree,
            isCustomContent: true,
          },
          select: { id: true, skill: true },
        })
      )
    );

    return createdResponse({
      examId,
      order,
      title,
      isFree,
      isDraft: true,
      seriesIds: Object.fromEntries(created.map((s) => [s.skill, s.id])),
    });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const examId = req.nextUrl.searchParams.get("examId");
    const orderRaw = req.nextUrl.searchParams.get("order");

    if (!examId || orderRaw == null) {
      return validationErrorResponse({
        examId: ["examId et order requis"],
      });
    }

    const order = parseInt(orderRaw, 10);
    if (Number.isNaN(order)) {
      return validationErrorResponse({ order: ["order invalide"] });
    }

    await prisma.examSeries.updateMany({
      where: { examId, order, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const body = z
      .object({
        examId: z.string().min(1),
        order: z.number().int().min(0),
        title: z.string().min(2).max(200).optional(),
        isFree: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      })
      .safeParse(await req.json());

    if (!body.success) {
      return validationErrorResponse(body.error.flatten().fieldErrors);
    }

    const { examId, order, ...data } = body.data;

    await prisma.examSeries.updateMany({
      where: { examId, order, deletedAt: null },
      data,
    });

    return successResponse({ updated: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
