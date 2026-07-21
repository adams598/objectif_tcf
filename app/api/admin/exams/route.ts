import { NextRequest } from "next/server";
import { z } from "zod";
import type { ExamType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { slugifyExamId } from "@/lib/exams/catalog";
import {
  successResponse,
  createdResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const examTypeSchema = z.enum([
  "TCF_CANADA",
  "TEF_CANADA",
  "IELTS",
  "DELF",
  "DALF",
  "TOEFL",
  "AUTRE",
]);

const createExamSchema = z.object({
  id: z.string().min(2).max(64).optional(),
  type: examTypeSchema,
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
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

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const includeInactive =
      new URL(req.url).searchParams.get("includeInactive") === "true";

    const exams = await prisma.exam.findMany({
      where: includeInactive ? { deletedAt: null } : { deletedAt: null, isActive: true },
      orderBy: [{ type: "asc" }, { title: "asc" }],
      include: {
        _count: { select: { series: true } },
      },
    });

    return successResponse(exams);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const parsed = createExamSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const examId =
      parsed.data.id?.trim() ||
      `${slugifyExamId(parsed.data.title)}-${Date.now().toString(36)}`;

    const existing = await prisma.exam.findUnique({ where: { id: examId } });
    if (existing) {
      return validationErrorResponse({ id: ["Cet identifiant existe déjà"] });
    }

    const exam = await prisma.$transaction(async (tx) => {
      const created = await tx.exam.create({
        data: {
          id: examId,
          type: parsed.data.type,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          isActive: parsed.data.isActive,
        },
        include: { _count: { select: { series: true } } },
      });

      await tx.examPricingConfig.upsert({
        where: { examType: parsed.data.type as ExamType },
        create: {
          examType: parsed.data.type as ExamType,
          pricePerDayXaf: 1000,
          pricePerDayUsd: 2,
          pricePerDayXof: 1250,
          isActive: true,
        },
        update: {},
      });

      return created;
    });

    return createdResponse(exam);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
