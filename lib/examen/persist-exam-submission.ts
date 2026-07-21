import type { NCLCLevel, Skill } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { nclcLevelToNumber } from "@/lib/dashboard/stats";
import { createNotification } from "@/lib/notifications/create-notification";

function toNclcEnum(level: number): NCLCLevel {
  const clamped = Math.min(12, Math.max(1, Math.round(level)));
  return `NCLC_${clamped}` as NCLCLevel;
}

export interface PersistAnswerInput {
  questionId: string;
  choiceId?: string;
  textResponse?: string;
  audioUrl?: string;
  isCorrect?: boolean;
}

export async function persistExamSubmission(params: {
  userId: string;
  seriesId: string;
  skill: Skill;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  nclcLevel: number;
  durationSeconds: number;
  answers?: PersistAnswerInput[];
  humanCorrectionRequested?: boolean;
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

  if (params.answers?.length) {
    await prisma.answer.createMany({
      data: params.answers.map((a) => ({
        attemptId: attempt.id,
        questionId: a.questionId,
        userId: params.userId,
        choiceId: a.choiceId ?? null,
        textResponse: a.textResponse ?? null,
        audioUrl: a.audioUrl ?? null,
        isCorrect: a.isCorrect ?? null,
      })),
    });
  }

  await prisma.result.create({
    data: {
      attemptId: attempt.id,
      globalScore: params.percentage,
      nclcLevel: toNclcEnum(params.nclcLevel),
      ...(params.skill === "COMPREHENSION_ORALE" && { scoreCorale: params.percentage }),
      ...(params.skill === "COMPREHENSION_ECRITE" && { scoreCecrit: params.percentage }),
      ...(params.skill === "EXPRESSION_ECRITE" && { scoreEecrit: params.percentage }),
      ...(params.skill === "EXPRESSION_ORALE" && { scoreEoral: params.percentage }),
    },
  });

  const existing = await prisma.progress.findUnique({
    where: { userId_skill: { userId: params.userId, skill: params.skill } },
  });

  const previousNclc = nclcLevelToNumber(existing?.nclcLevel);
  const blendedNclc =
    previousNclc > 0
      ? Math.round(((previousNclc + params.nclcLevel) / 2) * 10) / 10
      : params.nclcLevel;

  await prisma.progress.upsert({
    where: { userId_skill: { userId: params.userId, skill: params.skill } },
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { lastStudyDate: true, currentStreak: true, longestStreak: true },
  });

  let newStreak = 1;
  if (user?.lastStudyDate) {
    const last = new Date(user.lastStudyDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000);
    if (diffDays === 0) newStreak = user.currentStreak || 1;
    else if (diffDays === 1) newStreak = (user.currentStreak || 0) + 1;
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      totalStudyTime: {
        increment: Math.max(1, Math.floor(params.durationSeconds / 60)),
      },
      lastStudyDate: new Date(),
      currentStreak: newStreak,
      longestStreak: Math.max(user?.longestStreak ?? 0, newStreak),
    },
  });

  await createNotification({
    userId: params.userId,
    type: "EXAM_RESULT",
    title: "Résultat d'examen disponible",
    message: `Vous avez obtenu ${Math.round(params.percentage)}% (NCLC ${Math.round(params.nclcLevel)}).`,
    data: { attemptId: attempt.id, seriesId: params.seriesId },
  });

  if (params.humanCorrectionRequested) {
    await createNotification({
      userId: params.userId,
      type: "SYSTEM",
      title: "Correction humaine en cours",
      message:
        "Votre production a été transmise à un correcteur. Vous serez notifié dès que la correction sera disponible.",
      data: { attemptId: attempt.id },
    });
  }

  return attempt;
}
