import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { groupSeriesByOrder } from "@/lib/preparation/series-groups";
import { resolveExamTypeFromQuery } from "@/lib/exams/catalog";

const querySchema = z.object({
  examType: z.string().optional(),
  examen: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { examType: examTypeParam, examen } = parsed.data;
    const examType = resolveExamTypeFromQuery(examen, examTypeParam);

    if (!examType) {
      return validationErrorResponse({
        examType: ["Type d'examen invalide"],
      });
    }

    const series = await prisma.examSeries.findMany({
      where: {
        exam: { type: examType, isActive: true, deletedAt: null },
        isPublished: true,
        deletedAt: null,
      },
      orderBy: [{ order: "asc" }, { skill: "asc" }],
      select: {
        id: true,
        skill: true,
        title: true,
        durationMin: true,
        isFree: true,
        order: true,
        _count: { select: { questions: true } },
      },
    });

    const items = series.map((s) => ({
      id: s.id,
      skill: s.skill,
      title: s.title,
      durationMin: s.durationMin,
      isFree: s.isFree,
      order: s.order,
      questionCount: s._count.questions,
    }));

    return successResponse({
      groups: groupSeriesByOrder(items),
      series: items,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
