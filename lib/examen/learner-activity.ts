import type { LanguageLevel } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { LearnerActivityStats } from "@/lib/examen/scoring";

/**
 * Enregistre l’ouverture d’une série (tentative IN_PROGRESS).
 * Retourne l’attempt courant (créé ou repris) pour permettre la reprise après déconnexion.
 */
export async function trackSeriesOpened(
  userId: string,
  seriesId: string
): Promise<{ id: string }> {
  const existing = await prisma.attempt.findFirst({
    where: { userId, seriesId, status: "IN_PROGRESS" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (existing) {
    await prisma.attempt.update({
      where: { id: existing.id },
      data: { status: "IN_PROGRESS" },
    });
    return existing;
  }

  return prisma.attempt.create({
    data: {
      userId,
      seriesId,
      status: "IN_PROGRESS",
    },
    select: { id: true },
  });
}

export async function getLearnerActivityStats(
  userId: string
): Promise<LearnerActivityStats> {
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    select: {
      seriesId: true,
      status: true,
      updatedAt: true,
      startedAt: true,
      completedAt: true,
    },
  });

  const bySeries = new Map<
    string,
    { completed: boolean; started: boolean; lastAt: Date }
  >();

  for (const a of attempts) {
    const prev = bySeries.get(a.seriesId) ?? {
      completed: false,
      started: false,
      lastAt: a.updatedAt,
    };
    if (a.status === "COMPLETED") prev.completed = true;
    if (a.status === "IN_PROGRESS" || a.status === "COMPLETED") {
      prev.started = true;
    }
    const candidate = a.updatedAt ?? a.completedAt ?? a.startedAt;
    if (candidate > prev.lastAt) prev.lastAt = candidate;
    bySeries.set(a.seriesId, prev);
  }

  let seriesCompleted = 0;
  let seriesPartial = 0;
  let lastActivityAt: Date | null = null;

  for (const info of bySeries.values()) {
    if (info.completed) seriesCompleted += 1;
    else if (info.started) seriesPartial += 1;
    if (!lastActivityAt || info.lastAt > lastActivityAt) {
      lastActivityAt = info.lastAt;
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastStudyDate: true },
  });

  return {
    seriesCompleted,
    seriesPartial,
    seriesStarted: bySeries.size,
    lastActivityAt: lastActivityAt?.toISOString() ?? null,
    lastOpenedSeriesAt:
      lastActivityAt?.toISOString() ??
      user?.lastStudyDate?.toISOString() ??
      null,
  };
}

export function cecrToLanguageLevel(cecr: string): LanguageLevel | null {
  switch (cecr) {
    case "A1":
    case "A2":
    case "B1":
    case "B2":
    case "C1":
    case "C2":
      return cecr;
    default:
      return null;
  }
}
