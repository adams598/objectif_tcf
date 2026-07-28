import type {
  ExamType,
  Gender,
  Prisma,
  SubscriptionPlan,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  type AnalyticsFilters,
  buildDateRangeFilter,
  buildUserDemographicWhere,
  monthKey,
  resolveAnalyticsPeriod,
} from "@/lib/admin/analytics-period";
import { sumNativeAndXaf } from "@/lib/admin/payment-currency";

export {
  type AnalyticsFilters,
  type AnalyticsPeriodType,
} from "@/lib/admin/analytics-period";
export { periodStart, buildMonthKeys } from "@/lib/admin/analytics-period";

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  FREE: "Gratuit",
  STARTER: "Essentiel",
  PRO: "Pro",
  ELITE: "Premium",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Homme",
  FEMALE: "Femme",
  OTHER: "Autre",
  UNSPECIFIED: "Non renseigné",
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

function fillCountSeries(
  monthKeys: string[],
  data: Map<string, number>
): Array<{ month: string; count: number }> {
  return monthKeys.map((month) => ({
    month,
    count: data.get(month) ?? 0,
  }));
}

function fillRevenueSeries(
  monthKeys: string[],
  data: Map<string, { xaf: number; usd: number; eur: number; xof: number }>
): Array<{ month: string; xaf: number; usd: number; eur: number; xof: number }> {
  return monthKeys.map((month) => ({
    month,
    ...(data.get(month) ?? { xaf: 0, usd: 0, eur: 0, xof: 0 }),
  }));
}

async function fetchFilterOptions() {
  const now = new Date();
  const [
    countryRows,
    methodRows,
    genderRows,
    usersWithBirthDate,
    oldestUser,
    oldestPayment,
    oldestAttempt,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, country: { not: null } },
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
    prisma.payment.findMany({
      where: { status: "SUCCEEDED", method: { not: null } },
      distinct: ["method"],
      select: { method: true },
      orderBy: { method: "asc" },
    }),
    prisma.user.groupBy({
      by: ["gender"],
      where: { deletedAt: null, gender: { not: null } },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { deletedAt: null, birthDate: { not: null } },
    }),
    prisma.user.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.payment.findFirst({
      where: { status: "SUCCEEDED", paidAt: { not: null } },
      orderBy: { paidAt: "asc" },
      select: { paidAt: true },
    }),
    prisma.attempt.findFirst({
      orderBy: { startedAt: "asc" },
      select: { startedAt: true },
    }),
  ]);

  const yearsFromData = [
    oldestUser?.createdAt,
    oldestPayment?.paidAt,
    oldestAttempt?.startedAt,
  ]
    .filter((d): d is Date => d != null)
    .map((d) => d.getFullYear());

  const oldestYear =
    yearsFromData.length > 0
      ? Math.min(...yearsFromData)
      : now.getFullYear();
  const years: number[] = [];
  for (let y = now.getFullYear(); y >= oldestYear; y--) {
    years.push(y);
  }

  const gendersWithData = genderRows.filter(
    (g) => g.gender && g.gender !== "UNSPECIFIED" && g._count._all > 0
  );

  return {
    countries: countryRows.map((c) => c.country!).filter(Boolean),
    paymentMethods: methodRows.map((m) => m.method!).filter(Boolean),
    genders: gendersWithData.map((g) => g.gender!),
    hasGenderData: gendersWithData.length > 0,
    hasAgeData: usersWithBirthDate > 0,
    years,
    oldestYear,
    currentYear: now.getFullYear(),
  };
}

function buildUserWhere(
  filters: AnalyticsFilters,
  since: Date,
  until: Date
): Prisma.UserWhereInput {
  const examTypeFilter = filters.examType ?? undefined;
  const paymentMethod = filters.paymentMethod ?? undefined;

  return {
    ...buildUserDemographicWhere(filters),
    ...(examTypeFilter
      ? {
          subscriptions: {
            some: { examType: examTypeFilter, status: "ACTIVE" as const },
          },
        }
      : {}),
    ...(paymentMethod
      ? {
          payments: {
            some: {
              status: "SUCCEEDED" as const,
              method: paymentMethod,
              paidAt: buildDateRangeFilter(since, until),
            },
          },
        }
      : {}),
  };
}

export async function fetchAdminAnalytics(filters: AnalyticsFilters = {}) {
  const period = resolveAnalyticsPeriod(filters);
  const { since, until, monthKeys } = period;
  const now = new Date();
  const examTypeFilter = filters.examType ?? undefined;
  const paymentMethod = filters.paymentMethod ?? undefined;

  const userWhere = buildUserWhere(filters, since, until);

  const subscriptionWhere: Prisma.SubscriptionWhereInput = {
    status: "ACTIVE" as const,
    currentPeriodEnd: { gt: now },
    user: userWhere,
    ...(examTypeFilter ? { examType: examTypeFilter } : {}),
  };

  const paymentWhere: Prisma.PaymentWhereInput = {
    status: "SUCCEEDED" as const,
    paidAt: buildDateRangeFilter(since, until),
    user: userWhere,
    ...(examTypeFilter ? { examType: examTypeFilter } : {}),
    ...(paymentMethod ? { method: paymentMethod } : {}),
  };

  const attemptWhere: Prisma.AttemptWhereInput = {
    startedAt: buildDateRangeFilter(since, until),
    user: userWhere,
    ...(examTypeFilter
      ? { series: { exam: { type: examTypeFilter, deletedAt: null } } }
      : {}),
  };

  const [
    totalUsers,
    newUsersInPeriod,
    activeUsersWithSession,
    subscriptionsByPlan,
    subscriptionsByExamType,
    registrationsRaw,
    paymentsInPeriod,
    attemptsRaw,
    completedAttemptsRaw,
    paymentsByMethod,
    paymentsByProvider,
    totalAttempts,
    completedAttempts,
    exams,
    subStatsMap,
    filterOptions,
  ] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.user.count({
      where: { ...userWhere, createdAt: buildDateRangeFilter(since, until) },
    }),
    prisma.user.count({
      where: {
        ...userWhere,
        sessions: {
          some: { expiresAt: { gt: now }, isRevoked: false },
        },
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
      where: {
        ...userWhere,
        createdAt: buildDateRangeFilter(since, until),
      },
      select: { createdAt: true },
    }),
    prisma.payment.findMany({
      where: paymentWhere,
      select: { paidAt: true, amount: true, currency: true, amountXaf: true },
    }),
    prisma.attempt.findMany({
      where: attemptWhere,
      select: { startedAt: true },
    }),
    prisma.attempt.findMany({
      where: {
        ...attemptWhere,
        status: "COMPLETED",
        completedAt: buildDateRangeFilter(since, until),
      },
      select: { completedAt: true },
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
    prisma.exam.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: "desc" }, { type: "asc" }, { title: "asc" }],
      include: { _count: { select: { series: true } } },
    }),
    fetchActiveSubscriptionStatsByExamType(),
    fetchFilterOptions(),
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

  const completedAttemptsByMonth = new Map<string, number>();
  for (const a of completedAttemptsRaw) {
    if (!a.completedAt) continue;
    const key = monthKey(a.completedAt);
    completedAttemptsByMonth.set(
      key,
      (completedAttemptsByMonth.get(key) ?? 0) + 1
    );
  }

  const revenueTotals = sumNativeAndXaf(paymentsInPeriod);

  return {
    filters: {
      examType: examTypeFilter ?? null,
      periodType: period.periodType,
      months: filters.months ?? 6,
      year: filters.year ?? null,
      month: filters.month ?? null,
      monthPairStart: filters.monthPairStart ?? null,
      country: filters.country ?? null,
      paymentMethod: paymentMethod ?? null,
      gender: filters.gender ?? null,
      ageMin: filters.ageMin ?? null,
      ageMax: filters.ageMax ?? null,
      ageExact: filters.ageExact ?? null,
      periodStart: since.toISOString(),
      periodEnd: until.toISOString(),
      monthKeys,
    },
    filterOptions,
    overview: {
      totalUsers,
      newUsersInPeriod,
      activeUsers: activeUsersWithSession,
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
    registrationsByMonth: fillCountSeries(monthKeys, registrationsByMonth),
    revenueByMonth: fillRevenueSeries(monthKeys, revenueByMonth),
    attemptsByMonth: fillCountSeries(monthKeys, attemptsByMonth),
    completedAttemptsByMonth: fillCountSeries(
      monthKeys,
      completedAttemptsByMonth
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
      amount: r.amount,
      amountXaf: r.amountXaf,
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
