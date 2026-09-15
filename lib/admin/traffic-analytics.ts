import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type TrafficAnalytics = {
  pageViews: number;
  visitors: number;
  sessions: number;
  offerViews: number;
  signupViews: number;
  checkoutStarts: number;
  pageViewsByMonth: Array<{ month: string; count: number }>;
  topPages: Array<{ path: string; views: number; visitors: number }>;
  sources: Array<{ source: string; views: number }>;
  countries: Array<{ country: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
};

export type ProductFunnel = {
  visitors: number;
  signups: number;
  paidUsers: number;
  examStarters: number;
};

type CountRow = { count: number | bigint };
type TypedCountRow = { type: string; count: number | bigint };
type MonthRow = { month: string; count: number | bigint };
type PageRow = { path: string; views: number | bigint; visitors: number | bigint };
type NamedCountRow = { name: string | null; views: number | bigint };

function toInt(value: number | bigint | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "bigint" ? Number(value) : value;
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

const EMPTY_TRAFFIC: TrafficAnalytics = {
  pageViews: 0,
  visitors: 0,
  sessions: 0,
  offerViews: 0,
  signupViews: 0,
  checkoutStarts: 0,
  pageViewsByMonth: [],
  topPages: [],
  sources: [],
  countries: [],
  devices: [],
};

export async function fetchTrafficAnalytics(
  since: Date,
  until: Date,
  monthKeys: string[]
): Promise<TrafficAnalytics> {
  try {
    const [totals, typed, monthly, pages, sources, countries, devices] =
      await Promise.all([
        prisma.$queryRaw<Array<CountRow & { visitors: number | bigint; sessions: number | bigint }>>(
          Prisma.sql`
            SELECT
              COUNT(*)::int AS count,
              COUNT(DISTINCT "visitorHash")::int AS visitors,
              COUNT(DISTINCT "sessionId")::int AS sessions
            FROM "AnalyticsEvent"
            WHERE "createdAt" >= ${since}
              AND "createdAt" < ${until}
          `
        ),
        prisma.$queryRaw<TypedCountRow[]>(
          Prisma.sql`
            SELECT type::text AS type, COUNT(*)::int AS count
            FROM "AnalyticsEvent"
            WHERE "createdAt" >= ${since}
              AND "createdAt" < ${until}
            GROUP BY type
          `
        ),
        prisma.$queryRaw<MonthRow[]>(
          Prisma.sql`
            SELECT to_char("createdAt", 'YYYY-MM') AS month, COUNT(*)::int AS count
            FROM "AnalyticsEvent"
            WHERE "createdAt" >= ${since}
              AND "createdAt" < ${until}
            GROUP BY 1
          `
        ),
        prisma.$queryRaw<PageRow[]>(
          Prisma.sql`
            SELECT
              path,
              COUNT(*)::int AS views,
              COUNT(DISTINCT "visitorHash")::int AS visitors
            FROM "AnalyticsEvent"
            WHERE "createdAt" >= ${since}
              AND "createdAt" < ${until}
            GROUP BY path
            ORDER BY views DESC
            LIMIT 10
          `
        ),
        prisma.$queryRaw<NamedCountRow[]>(
          Prisma.sql`
            SELECT
              CASE
                WHEN "utmSource" IS NOT NULL AND "utmSource" <> '' THEN "utmSource"
                WHEN "referrer" IS NOT NULL AND "referrer" <> '' THEN "referrer"
                ELSE 'direct'
              END AS name,
              COUNT(*)::int AS views
            FROM "AnalyticsEvent"
            WHERE "createdAt" >= ${since}
              AND "createdAt" < ${until}
            GROUP BY 1
            ORDER BY views DESC
            LIMIT 12
          `
        ),
        prisma.$queryRaw<NamedCountRow[]>(
          Prisma.sql`
            SELECT COALESCE(country, 'ZZ') AS name, COUNT(*)::int AS views
            FROM "AnalyticsEvent"
            WHERE "createdAt" >= ${since}
              AND "createdAt" < ${until}
            GROUP BY 1
            ORDER BY views DESC
            LIMIT 12
          `
        ),
        prisma.$queryRaw<NamedCountRow[]>(
          Prisma.sql`
            SELECT COALESCE(device, 'desktop') AS name, COUNT(*)::int AS views
            FROM "AnalyticsEvent"
            WHERE "createdAt" >= ${since}
              AND "createdAt" < ${until}
            GROUP BY 1
            ORDER BY views DESC
          `
        ),
      ]);

    const total = totals[0];
    const byType = new Map(typed.map((row) => [row.type, toInt(row.count)]));
    const monthlyMap = new Map<string, number>();
    for (const row of monthly) {
      monthlyMap.set(row.month, toInt(row.count));
    }

    return {
      pageViews: toInt(total?.count),
      visitors: toInt(total?.visitors),
      sessions: toInt(total?.sessions),
      offerViews: byType.get("OFFER_VIEW") ?? 0,
      signupViews: byType.get("SIGNUP_VIEW") ?? 0,
      checkoutStarts: byType.get("CHECKOUT_START") ?? 0,
      pageViewsByMonth: fillCountSeries(monthKeys, monthlyMap),
      topPages: pages.map((row) => ({
        path: row.path,
        views: toInt(row.views),
        visitors: toInt(row.visitors),
      })),
      sources: sources.map((row) => ({
        source: row.name || "direct",
        views: toInt(row.views),
      })),
      countries: countries.map((row) => ({
        country: row.name || "ZZ",
        views: toInt(row.views),
      })),
      devices: devices.map((row) => ({
        device: row.name || "desktop",
        views: toInt(row.views),
      })),
    };
  } catch (error) {
    console.error("[analytics] traffic query failed:", error);
    return {
      ...EMPTY_TRAFFIC,
      pageViewsByMonth: monthKeys.map((month) => ({ month, count: 0 })),
    };
  }
}
