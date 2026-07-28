import type { ExamType, SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  FREE: "Gratuit",
  STARTER: "Essentiel",
  PRO: "Pro",
  ELITE: "Premium",
};

export type ExamSubscriptionStats = {
  totalActive: number;
  free: number;
  paid: number;
  byPlan: Record<SubscriptionPlan, number>;
};

export function emptyExamStats(): ExamSubscriptionStats {
  return {
    totalActive: 0,
    free: 0,
    paid: 0,
    byPlan: { FREE: 0, STARTER: 0, PRO: 0, ELITE: 0 },
  };
}

export function buildStatsFromRows(
  rows: Array<{ examType: ExamType; plan: SubscriptionPlan; count: number }>
): Map<ExamType, ExamSubscriptionStats> {
  const map = new Map<ExamType, ExamSubscriptionStats>();

  for (const row of rows) {
    const current = map.get(row.examType) ?? emptyExamStats();
    current.byPlan[row.plan] += row.count;
    current.totalActive += row.count;
    if (row.plan === "FREE") current.free += row.count;
    else current.paid += row.count;
    map.set(row.examType, current);
  }

  return map;
}

export async function fetchActiveSubscriptionStatsByExamType(): Promise<
  Map<ExamType, ExamSubscriptionStats>
> {
  const now = new Date();
  const grouped = await prisma.subscription.groupBy({
    by: ["examType", "plan"],
    where: { status: "ACTIVE", currentPeriodEnd: { gt: now } },
    _count: { _all: true },
  });

  return buildStatsFromRows(
    grouped.map((g) => ({
      examType: g.examType,
      plan: g.plan,
      count: g._count._all,
    }))
  );
}

export type AnalyticsFilters = {
  examType?: ExamType | null;
  months?: number;
};

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function fetchAdminAnalytics(filters: AnalyticsFilters = {}) {
  const months = filters.months ?? 6;
  const since = monthsAgo(months);
  const now = new Date();
  const examTypeFilter = filters.examType ?? undefined;

  const userWhere = {
    deletedAt: null,
    ...(examTypeFilter
      ? {
          subscriptions: {
            some: { examType: examTypeFilter, status: "ACTIVE" as const },
          },
        }
      : {}),
  };

  const subscriptionWhere = {
    status: "ACTIVE" as const,
    currentPeriodEnd: { gt: now },
    ...(examTypeFilter ? { examType: examTypeFilter } : {}),
  };

  const paymentWhere = {
    status: "SUCCEEDED" as const,
    paidAt: { gte: since },
    ...(examTypeFilter ? { examType: examTypeFilter } : {}),
  };

  const attemptWhere = {
    startedAt: { gte: since },
    ...(examTypeFilter
      ? { series: { exam: { type: examTypeFilter, deletedAt: null } } }
      : {}),
  };

  const [
    totalUsers,
    newUsersInPeriod,
    activeSessions,
    subscriptionsByPlan,
    subscriptionsByExamType,
    registrationsRaw,
    paymentsInPeriod,
    attemptsRaw,
    paymentsByMethod,
    paymentsByProvider,
    totalAttempts,
    completedAttempts,
    revenueTotals,
    exams,
    subStatsMap,
  ] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.user.count({ where: { ...userWhere, createdAt: { gte: since } } }),
    prisma.session.count({
      where: {
        expiresAt: { gt: now },
        isRevoked: false,
        user: userWhere,
      },
    }),
    prisma.subscription.groupBy({
      by: ["plan"],
      where: subscriptionWhere,
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by: ["examType", "plan"],
      where: subscriptionWhere,
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.payment.findMany({
      where: paymentWhere,
      select: { paidAt: true, amount: true, currency: true },
    }),
    prisma.attempt.findMany({
      where: attemptWhere,
      select: { startedAt: true },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: paymentWhere,
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ["provider"],
      where: paymentWhere,
      _count: { _all: true },
    }),
    prisma.attempt.count({ where: attemptWhere }),
    prisma.attempt.count({
      where: { ...attemptWhere, status: "COMPLETED" },
    }),
    prisma.payment.groupBy({
      by: ["currency"],
      where: paymentWhere,
      _sum: { amount: true },
    }),
    prisma.exam.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: "desc" }, { type: "asc" }, { title: "asc" }],
      include: { _count: { select: { series: true } } },
    }),
    fetchActiveSubscriptionStatsByExamType(),
  ]);

  const freeSubs = subscriptionsByPlan
    .filter((s) => s.plan === "FREE")
    .reduce((n, s) => n + s._count._all, 0);
  const paidSubs = subscriptionsByPlan
    .filter((s) => s.plan !== "FREE")
    .reduce((n, s) => n + s._count._all, 0);

  const byExamTypeMap = buildStatsFromRows(
    subscriptionsByExamType.map((r) => ({
      examType: r.examType,
      plan: r.plan,
      count: r._count._all,
    }))
  );

  const registrationsByMonth = new Map<string, number>();
  for (const u of registrationsRaw) {
    const key = monthKey(u.createdAt);
    registrationsByMonth.set(key, (registrationsByMonth.get(key) ?? 0) + 1);
  }

  const revenueByMonth = new Map<
    string,
    { xaf: number; usd: number; eur: number; xof: number }
  >();
  for (const p of paymentsInPeriod) {
    if (!p.paidAt) continue;
    const key = monthKey(p.paidAt);
    const entry = revenueByMonth.get(key) ?? { xaf: 0, usd: 0, eur: 0, xof: 0 };
    if (p.currency === "XAF") entry.xaf += p.amount;
    else if (p.currency === "USD") entry.usd += p.amount;
    else if (p.currency === "EUR") entry.eur += p.amount;
    else if (p.currency === "XOF") entry.xof += p.amount;
    revenueByMonth.set(key, entry);
  }

  const attemptsByMonth = new Map<string, number>();
  for (const a of attemptsRaw) {
    const key = monthKey(a.startedAt);
    attemptsByMonth.set(key, (attemptsByMonth.get(key) ?? 0) + 1);
  }

  const sortMonths = (entries: [string, unknown][]) =>
    entries.sort(([a], [b]) => a.localeCompare(b));

  return {
    filters: { examType: examTypeFilter ?? null, months },
    overview: {
      totalUsers,
      newUsersInPeriod,
      activeUsers: activeSessions,
      totalSubscriptions: freeSubs + paidSubs,
      freeSubscriptions: freeSubs,
      paidSubscriptions: paidSubs,
      totalAttempts,
      completedAttempts,
      conversionRate:
        totalUsers > 0 ? Math.round((paidSubs / totalUsers) * 1000) / 10 : 0,
    },
    subscriptionsByPlan: subscriptionsByPlan.map((s) => ({
      plan: s.plan,
      label: PLAN_LABELS[s.plan],
      count: s._count._all,
    })),
    subscriptionsByExamType: Array.from(byExamTypeMap.entries()).map(
      ([examType, stats]) => ({
        examType,
        totalActive: stats.totalActive,
        free: stats.free,
        paid: stats.paid,
        byPlan: Object.entries(stats.byPlan)
          .filter(([, count]) => count > 0)
          .map(([plan, count]) => ({
            plan,
            label: PLAN_LABELS[plan as SubscriptionPlan],
            count,
          })),
      })
    ),
    registrationsByMonth: sortMonths(
      Array.from(registrationsByMonth.entries())
    ).map(([month, count]) => ({ month, count: count as number })),
    revenueByMonth: sortMonths(Array.from(revenueByMonth.entries())).map(
      ([month, amounts]) => ({
        month,
        ...(amounts as { xaf: number; usd: number; eur: number; xof: number }),
      })
    ),
    attemptsByMonth: sortMonths(Array.from(attemptsByMonth.entries())).map(
      ([month, count]) => ({ month, count: count as number })
    ),
    paymentsByMethod: paymentsByMethod.map((p) => ({
      method: p.method ?? "UNKNOWN",
      count: p._count._all,
    })),
    paymentsByProvider: paymentsByProvider.map((p) => ({
      provider: p.provider ?? "MOCK",
      count: p._count._all,
    })),
    revenueTotals: revenueTotals.map((r) => ({
      currency: r.currency,
      amount: r._sum.amount ?? 0,
    })),
    exams: exams.map((exam) => {
      const stats = subStatsMap.get(exam.type) ?? emptyExamStats();
      return {
        id: exam.id,
        title: exam.title,
        type: exam.type,
        isActive: exam.isActive,
        seriesCount: exam._count.series,
        subscriptions: {
          totalActive: stats.totalActive,
          free: stats.free,
          paid: stats.paid,
          byPlan: Object.entries(stats.byPlan)
            .filter(([, count]) => count > 0)
            .map(([plan, count]) => ({
              plan,
              label: PLAN_LABELS[plan as SubscriptionPlan],
              count,
            })),
        },
      };
    }),
  };
}
