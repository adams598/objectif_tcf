import type { NCLCLevel, Skill } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { nclcLevelToNumber } from "@/lib/dashboard/stats";

function toNclcEnum(level: number): NCLCLevel {
  const clamped = Math.min(12, Math.max(1, Math.round(level)));
  return `NCLC_${clamped}` as NCLCLevel;
}

export async function persistCompletedAttempt(params: {
  userId: string;
  seriesId: string;
  skill: Skill;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  nclcLevel: number;
  durationSeconds: number;
}) {
  const attempt = await prisma.attempt.create({
    data: {
      userId: params.userId,
      seriesId: params.seriesId,
      status: "COMPLETED",
      completedAt: new Date(),
      durationSec: params.durationSeconds,
      score: params.correctCount,
      maxScore: params.totalQuestions,
      percentage: params.percentage,
      nclcLevel: toNclcEnum(params.nclcLevel),
    },
  });

  const existing = await prisma.progress.findUnique({
    where: {
      userId_skill: { userId: params.userId, skill: params.skill },
    },
  });

  const previousNclc = nclcLevelToNumber(existing?.nclcLevel);
  const blendedNclc =
    previousNclc > 0
      ? Math.round(((previousNclc + params.nclcLevel) / 2) * 10) / 10
      : params.nclcLevel;

  await prisma.progress.upsert({
    where: {
      userId_skill: { userId: params.userId, skill: params.skill },
    },
    create: {
      userId: params.userId,
      skill: params.skill,
      level: params.percentage,
      nclcLevel: toNclcEnum(blendedNclc),
      weeklyDone: 1,
    },
    update: {
      level: params.percentage,
      nclcLevel: toNclcEnum(blendedNclc),
      weeklyDone: { increment: 1 },
    },
  });

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      totalStudyTime: { increment: Math.max(1, Math.floor(params.durationSeconds / 60)) },
    },
  });

  return attempt;
}
