import { prisma } from "@/lib/db/prisma";

/** Compte uniquement les questions non soft-supprimées (Prisma filtered relation count). */
export const activeQuestionsCountSelect = {
  where: { deletedAt: null },
} as const;

export const activeQuestionsWhere = { deletedAt: null } as const;

/** Recalcule totalPoints à partir des questions actives. */
export async function recalculateSeriesTotalPoints(seriesId: string) {
  const aggregate = await prisma.question.aggregate({
    where: { seriesId, deletedAt: null },
    _sum: { points: true },
  });

  return prisma.examSeries.update({
    where: { id: seriesId },
    data: { totalPoints: aggregate._sum.points ?? 0 },
  });
}
