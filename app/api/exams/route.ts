import { prisma } from "@/lib/db/prisma";
import { examTypeToSlug, EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
import { successResponse, serverErrorResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ type: "asc" }, { title: "asc" }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        _count: { select: { series: true } },
      },
    });

    return successResponse(
      exams.map((exam) => ({
        ...exam,
        slug: examTypeToSlug(exam.type),
        typeLabel: EXAM_TYPE_LABELS[exam.type],
      }))
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
