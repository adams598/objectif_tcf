import { prisma } from "@/lib/db/prisma";

/** Empêche le seed d'écraser les questions d'une série modifiée par l'admin. */
export async function markSeriesAsCustomContent(seriesId: string): Promise<void> {
  await prisma.examSeries.updateMany({
    where: { id: seriesId, isCustomContent: false },
    data: { isCustomContent: true },
  });
}
