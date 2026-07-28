import type { Prisma } from "@prisma/client";

export type AnalyticsPeriodType = "rolling" | "year" | "month" | "monthPair";

export type AnalyticsFilters = {
  examType?: import("@prisma/client").ExamType | null;
  periodType?: AnalyticsPeriodType;
  months?: number;
  year?: number | null;
  month?: number | null;
  monthPairStart?: number | null;
  country?: string | null;
  paymentMethod?: import("@prisma/client").PaymentMethod | null;
  gender?: import("@prisma/client").Gender | null;
  ageMin?: number | null;
  ageMax?: number | null;
  ageExact?: number | null;
};

export type ResolvedPeriod = {
  since: Date;
  until: Date;
  monthKeys: string[];
  periodType: AnalyticsPeriodType;
};

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function periodStart(monthCount: number): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function buildMonthKeys(monthCount: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export function buildMonthKeysForYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    monthKey(new Date(year, i, 1))
  );
}

export function resolveAnalyticsPeriod(
  filters: AnalyticsFilters
): ResolvedPeriod {
  const now = new Date();
  const periodType = filters.periodType ?? "rolling";

  if (periodType === "year" && filters.year) {
    const since = new Date(filters.year, 0, 1, 0, 0, 0, 0);
    const until = new Date(filters.year, 11, 31, 23, 59, 59, 999);
    return {
      since,
      until,
      monthKeys: buildMonthKeysForYear(filters.year),
      periodType,
    };
  }

  if (periodType === "month" && filters.year && filters.month) {
    const since = new Date(filters.year, filters.month - 1, 1, 0, 0, 0, 0);
    const until = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
    return {
      since,
      until,
      monthKeys: [monthKey(since)],
      periodType,
    };
  }

  if (
    periodType === "monthPair" &&
    filters.year &&
    filters.monthPairStart &&
    filters.monthPairStart >= 1 &&
    filters.monthPairStart <= 11
  ) {
    const startMonth = filters.monthPairStart;
    const since = new Date(filters.year, startMonth - 1, 1, 0, 0, 0, 0);
    const until = new Date(filters.year, startMonth + 1, 0, 23, 59, 59, 999);
    return {
      since,
      until,
      monthKeys: [
        monthKey(new Date(filters.year, startMonth - 1, 1)),
        monthKey(new Date(filters.year, startMonth, 1)),
      ],
      periodType,
    };
  }

  const months = filters.months ?? 6;
  return {
    since: periodStart(months),
    until: now,
    monthKeys: buildMonthKeys(months),
    periodType: "rolling",
  };
}

export function birthDateRangeForAge(
  minAge: number,
  maxAge: number,
  ref = new Date()
): Prisma.DateTimeFilter {
  const youngest = new Date(ref);
  youngest.setFullYear(youngest.getFullYear() - maxAge - 1);
  youngest.setDate(youngest.getDate() + 1);
  youngest.setHours(0, 0, 0, 0);

  const oldest = new Date(ref);
  oldest.setFullYear(oldest.getFullYear() - minAge);
  oldest.setHours(23, 59, 59, 999);

  return { gte: youngest, lte: oldest };
}

export function buildUserDemographicWhere(
  filters: AnalyticsFilters
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (filters.country) {
    where.country = filters.country;
  }

  if (filters.gender) {
    where.gender = filters.gender;
  }

  if (filters.ageExact != null && filters.ageExact >= 0) {
    where.birthDate = birthDateRangeForAge(
      filters.ageExact,
      filters.ageExact
    );
  } else if (filters.ageMin != null || filters.ageMax != null) {
    const min = filters.ageMin ?? 0;
    const max = filters.ageMax ?? 120;
    where.birthDate = birthDateRangeForAge(min, max);
  }

  return where;
}

export function buildDateRangeFilter(since: Date, until: Date) {
  return { gte: since, lte: until };
}
