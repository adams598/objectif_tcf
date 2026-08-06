import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Recalcule totalPoints pour toutes les séries (corrige l'écart après soft-delete). */
async function main() {
  const series = await prisma.examSeries.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, order: true, skill: true, totalPoints: true },
  });

  let fixed = 0;
  for (const s of series) {
    const aggregate = await prisma.question.aggregate({
      where: { seriesId: s.id, deletedAt: null },
      _sum: { points: true },
    });
    const next = aggregate._sum.points ?? 0;
    if (next !== s.totalPoints) {
      await prisma.examSeries.update({
        where: { id: s.id },
        data: { totalPoints: next },
      });
      const active = await prisma.question.count({
        where: { seriesId: s.id, deletedAt: null },
      });
      const deleted = await prisma.question.count({
        where: { seriesId: s.id, deletedAt: { not: null } },
      });
      console.log(
        `✓ ${s.id} (${s.title}) totalPoints ${s.totalPoints} → ${next} | actives=${active} soft-deleted=${deleted}`
      );
      fixed += 1;
    }
  }

  console.log(fixed === 0 ? "Rien à corriger." : `${fixed} série(s) corrigée(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
