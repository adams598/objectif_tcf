import { prisma } from "@/lib/db/prisma";
import {
  DASHBOARD_SKILLS,
  SKILL_ABBREV,
  getStartOfDay,
  getStartOfWeek,
  nclcLevelToNumber,
} from "@/lib/dashboard/stats";
import {
  buildSkillGaps,
  computeCompetenciesFromAttempts,
  countAttemptsBySkill,
  mergeCompetencyScores,
} from "@/lib/dashboard/competency-analysis";
import { decryptAdminPassword } from "@/lib/auth/admin-password";

const TARGET_NCLC = 9;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export async function fetchAdminUserAnalytics(userId: string) {
  const weekStart = getStartOfWeek();
  const todayStart = getStartOfDay();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [
    user,
    settings,
    progressRecords,
    attemptCounts,
    weekAttempts,
    todayAttempts,
    recentAttempts,
    allCompletedForChart,
    payments,
    subscriptions,
  ] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        emailVerified: true,
        country: true,
        phone: true,
        gender: true,
        createdAt: true,
        currentStreak: true,
        longestStreak: true,
        totalStudyTime: true,
        lastStudyDate: true,
        targetExamDate: true,
        targetCountry: true,
        currentLevel: true,
        adminPasswordEnc: true,
      },
    }),
    prisma.userSettings.findUnique({
      where: { userId },
      select: { dailyGoalMinutes: true },
    }),
    prisma.progress.findMany({ where: { userId } }),
    prisma.attempt.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
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
        percentage: true,
        durationSec: true,
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
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 30,
      select: {
        id: true,
        score: true,
        maxScore: true,
        percentage: true,
        nclcLevel: true,
        durationSec: true,
        completedAt: true,
        series: {
          select: {
            title: true,
            skill: true,
            difficulty: true,
            examType: true,
          },
        },
        result: {
          select: {
            globalScore: true,
            nclcLevel: true,
            feedback: true,
          },
        },
      },
    }),
    prisma.attempt.findMany({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { gte: twelveMonthsAgo },
      },
      select: { completedAt: true, percentage: true },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        provider: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        plan: true,
        examType: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        autoRenew: true,
        renewalDays: true,
        offerId: true,
      },
    }),
  ]);

  if (!user) return null;

  const totalAttempts = attemptCounts.reduce((s, r) => s + r._count._all, 0);
  const completedAttempts =
    attemptCounts.find((r) => r.status === "COMPLETED")?._count._all ?? 0;
  const inProgressAttempts =
    attemptCounts.find((r) => r.status === "IN_PROGRESS")?._count._all ?? 0;

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

  const scores = competencies.map((c) => c.score).filter((s) => s > 0);
  const globalNclc =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;
  const progressPercent =
    globalNclc > 0
      ? Math.min(100, Math.round((globalNclc / TARGET_NCLC) * 100))
      : 0;

  const skillAverages: Record<string, number[]> = {};
  for (const attempt of recentAttempts) {
    const skill = attempt.series.skill;
    if (!skillAverages[skill]) skillAverages[skill] = [];
    if (attempt.percentage !== null) {
      skillAverages[skill].push(attempt.percentage);
    }
  }
  const skillStats = Object.entries(skillAverages).map(([skill, pcts]) => ({
    skill,
    average: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
    count: pcts.length,
  }));

  const months = lastNMonths(12);
  const attemptsByMonthMap = Object.fromEntries(months.map((m) => [m, 0]));
  const avgScoreByMonthMap: Record<string, number[]> = Object.fromEntries(
    months.map((m) => [m, []])
  );
  for (const a of allCompletedForChart) {
    if (!a.completedAt) continue;
    const key = monthKey(a.completedAt);
    if (key in attemptsByMonthMap) {
      attemptsByMonthMap[key] += 1;
      if (a.percentage != null) avgScoreByMonthMap[key].push(a.percentage);
    }
  }
  const activityByMonth = months.map((month) => ({
    month,
    attempts: attemptsByMonthMap[month],
    avgScore:
      avgScoreByMonthMap[month].length > 0
        ? Math.round(
            avgScoreByMonthMap[month].reduce((a, b) => a + b, 0) /
              avgScoreByMonthMap[month].length
          )
        : 0,
  }));

  const studyMinutesToday = todayAttempts.reduce(
    (sum, a) => sum + Math.floor((a.durationSec ?? 0) / 60),
    0
  );
  const studyMinutesWeek = weekAttempts.reduce(
    (sum, a) => sum + Math.floor((a.durationSec ?? 0) / 60),
    0
  );

  const avgPercentage =
    recentAttempts.filter((a) => a.percentage != null).length > 0
      ? Math.round(
          recentAttempts
            .filter((a) => a.percentage != null)
            .reduce((s, a) => s + (a.percentage ?? 0), 0) /
            recentAttempts.filter((a) => a.percentage != null).length
        )
      : null;

  const paidPayments = payments.filter((p) => p.status === "SUCCEEDED");
  const revenueByCurrency = paidPayments.reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.currency] = (acc[p.currency] ?? 0) + p.amount;
      return acc;
    },
    {}
  );

  const { adminPasswordEnc, ...profile } = user;

  return {
    profile: {
      ...profile,
      password: decryptAdminPassword(adminPasswordEnc),
      createdAt: profile.createdAt.toISOString(),
      lastStudyDate: profile.lastStudyDate?.toISOString() ?? null,
      targetExamDate: profile.targetExamDate?.toISOString() ?? null,
    },
    overview: {
      totalAttempts,
      completedAttempts,
      inProgressAttempts,
      completionRate:
        totalAttempts > 0
          ? Math.round((completedAttempts / totalAttempts) * 100)
          : 0,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalStudyMinutes: user.totalStudyTime,
      studyMinutesToday,
      studyMinutesWeek,
      dailyGoalMinutes: settings?.dailyGoalMinutes ?? 30,
      avgPercentage,
      globalNclc,
      progressPercent,
      targetNclc: TARGET_NCLC,
      activeSubscriptions: subscriptions.filter(
        (s) => s.status === "ACTIVE" && s.currentPeriodEnd > new Date()
      ).length,
      paymentsCount: payments.length,
      succeededPayments: paidPayments.length,
    },
    competencies,
    skillGaps,
    skillStats,
    activityByMonth,
    attempts: recentAttempts.map((a) => ({
      ...a,
      completedAt: a.completedAt?.toISOString() ?? null,
    })),
    subscriptions: subscriptions.map((s) => ({
      ...s,
      currentPeriodStart: s.currentPeriodStart.toISOString(),
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
    })),
    payments: payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    revenueByCurrency: Object.entries(revenueByCurrency).map(
      ([currency, amount]) => ({ currency, amount })
    ),
  };
}

export type AdminUserAnalytics = NonNullable<
  Awaited<ReturnType<typeof fetchAdminUserAnalytics>>
>;
