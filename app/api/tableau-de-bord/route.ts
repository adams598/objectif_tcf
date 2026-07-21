import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import {
  DASHBOARD_SKILLS,
  SKILL_ABBREV,
  getStartOfDay,
  getStartOfWeek,
  nclcLevelToNumber,
} from "@/lib/dashboard/stats";
import { computeDaysUntil } from "@/lib/user/exam-date";
import { getLatestActiveSubscription } from "@/lib/subscriptions/access";
import {
  buildSkillGaps,
  computeCompetenciesFromAttempts,
  countAttemptsBySkill,
  mergeCompetencyScores,
} from "@/lib/dashboard/competency-analysis";

const TARGET_NCLC = 9;

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const weekStart = getStartOfWeek();
    const todayStart = getStartOfDay();

    const [
      user,
      settings,
      progressRecords,
      inProgressAttempt,
      weekAttempts,
      todayAttempts,
      weekDayAttempts,
      activeSubscription,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          targetExamDate: true,
          targetCountry: true,
          currentStreak: true,
          totalStudyTime: true,
        },
      }),
      prisma.userSettings.findUnique({
        where: { userId },
        select: { dailyGoalMinutes: true },
      }),
      prisma.progress.findMany({ where: { userId } }),
      prisma.attempt.findFirst({
        where: { userId, status: "IN_PROGRESS" },
        orderBy: { updatedAt: "desc" },
        include: {
          series: {
            select: { id: true, title: true, description: true, skill: true },
          },
        },
      }),
      prisma.attempt.findMany({
        where: {
          userId,
          status: "COMPLETED",
          completedAt: { gte: weekStart },
        },
        select: {
          id: true,
          score: true,
          completedAt: true,
          series: { select: { skill: true } },
        },
      }),
      prisma.attempt.findMany({
        where: {
          userId,
          status: "COMPLETED",
          completedAt: { gte: todayStart },
        },
        select: { durationSec: true },
      }),
      prisma.attempt.findMany({
        where: {
          userId,
          status: "COMPLETED",
          completedAt: { gte: weekStart },
        },
        select: { completedAt: true },
      }),
      getLatestActiveSubscription(userId),
    ]);

    const progressByAbbrev = Object.fromEntries(
      progressRecords.map((record) => [
        SKILL_ABBREV[record.skill],
        nclcLevelToNumber(record.nclcLevel),
      ])
    ) as Record<string, number>;

    const progressCompetencies = DASHBOARD_SKILLS.map((subject) => ({
      subject,
      score: progressByAbbrev[subject] ?? 0,
      target: TARGET_NCLC,
    }));

    const attemptCompetencies = await computeCompetenciesFromAttempts(
      userId,
      TARGET_NCLC
    );
    const competencies = mergeCompetencyScores(
      progressCompetencies,
      attemptCompetencies
    );
    const attemptsBySkill = await countAttemptsBySkill(userId);
    const skillGaps = buildSkillGaps(competencies, attemptsBySkill);

    const scores = competencies.map((item) => item.score).filter((s) => s > 0);
    const globalNclc =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10
        : 0;

    const progressPercent =
      globalNclc > 0
        ? Math.min(100, Math.round((globalNclc / TARGET_NCLC) * 100))
        : 0;

    const goalMinutes = settings?.dailyGoalMinutes ?? 30;
    const currentMinutes = todayAttempts.reduce(
      (sum, attempt) => sum + Math.floor((attempt.durationSec ?? 0) / 60),
      0
    );

    const completedWeekDays = new Set<number>();
    for (const attempt of weekDayAttempts) {
      if (!attempt.completedAt) continue;
      const dayIndex = (attempt.completedAt.getDay() + 6) % 7;
      completedWeekDays.add(dayIndex);
    }

    const skillImprovements: Record<string, number> = {};
    for (const attempt of weekAttempts) {
      if (attempt.score == null) continue;
      const abbrev = SKILL_ABBREV[attempt.series.skill];
      skillImprovements[abbrev] = (skillImprovements[abbrev] ?? 0) + attempt.score;
    }

    let topSkill: string | null = null;
    let topSkillPoints = 0;
    for (const [skill, points] of Object.entries(skillImprovements)) {
      if (points > topSkillPoints) {
        topSkill = skill;
        topSkillPoints = points;
      }
    }

    const effectiveExamDate =
      user?.targetExamDate ?? activeSubscription?.currentPeriodEnd ?? null;

    const daysLeft = effectiveExamDate
      ? computeDaysUntil(effectiveExamDate)
      : null;

    let weakestSkill: string | null = null;
    let weakestSkillGap = 0;
    for (const gap of skillGaps) {
      if (gap.gap > weakestSkillGap) {
        weakestSkill = gap.subject;
        weakestSkillGap = gap.gap;
      }
    }

    return successResponse({
      competencies,
      skillGaps,
      weakestSkill,
      weakestSkillGap,
      globalNclc,
      progressPercent,
      targetNclc: TARGET_NCLC,
      exam: {
        targetExamDate: effectiveExamDate?.toISOString() ?? null,
        targetCountry: user?.targetCountry ?? null,
        daysLeft,
        hasExamDate: Boolean(effectiveExamDate),
        examType: activeSubscription?.examType ?? "TCF_CANADA",
      },
      dailyGoal: {
        currentMinutes,
        goalMinutes,
        currentStreak: user?.currentStreak ?? 0,
        completedWeekDays: Array.from(completedWeekDays),
      },
      weeklyReport: {
        sessionsCompleted: weekAttempts.length,
        topSkill,
        topSkillPoints: topSkillPoints > 0 ? Math.round(topSkillPoints) : 0,
        weakestSkill,
        weakestSkillGap: weakestSkillGap > 0 ? weakestSkillGap : 0,
      },
      inProgressAttempt: inProgressAttempt
        ? {
            id: inProgressAttempt.id,
            seriesId: inProgressAttempt.series.id,
            title: inProgressAttempt.series.title,
            description: inProgressAttempt.series.description,
            skill: SKILL_ABBREV[inProgressAttempt.series.skill],
          }
        : null,
      hasActivity:
        weekAttempts.length > 0 ||
        todayAttempts.length > 0 ||
        inProgressAttempt !== null ||
        globalNclc > 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
