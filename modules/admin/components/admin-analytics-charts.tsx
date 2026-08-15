"use client";

import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
import { useTranslation } from "@/components/providers/locale-provider";
import { dateLocaleTag, type AppLocale } from "@/lib/i18n/locales";

export type AdminAnalyticsData = {
  overview: {
    totalUsers: number;
    newUsersInPeriod: number;
    activeUsers: number;
    totalSubscriptions: number;
    freeSubscriptions: number;
    paidSubscriptions: number;
    totalAttempts: number;
    completedAttempts: number;
    conversionRate: number;
  };
  subscriptionsByPlan: Array<{ plan: string; label: string; count: number }>;
  subscriptionsByExamType: Array<{
    examType: string;
    totalActive: number;
    free: number;
    paid: number;
    byPlan: Array<{ plan: string; label: string; count: number }>;
  }>;
  registrationsByMonth: Array<{ month: string; count: number }>;
  revenueByMonth: Array<{
    month: string;
    xaf: number;
    usd: number;
    eur: number;
    xof: number;
  }>;
  attemptsByMonth: Array<{ month: string; count: number }>;
  completedAttemptsByMonth: Array<{ month: string; count: number }>;
  paymentsByMethod: Array<{ method: string; count: number }>;
  paymentsByProvider: Array<{ provider: string; count: number }>;
  revenueTotals: Array<{
    currency: string;
    amount: number;
    amountXaf: number;
  }>;
};

const CHART_COLORS = [
  "#6750a4",
  "#7d5260",
  "#386a20",
  "#006a6a",
  "#8b5000",
  "#4a4458",
  "#625b71",
  "#006e1c",
];

const TOOLTIP_STYLE = {
  backgroundColor: "var(--inverse-surface, #1c1b1f)",
  border: "none",
  borderRadius: "8px",
  color: "var(--inverse-on-surface, #e6e1e5)",
  fontSize: "12px",
};

function paymentMethodLabel(
  method: string,
  t: (key: string) => string
): string {
  switch (method) {
    case "CARD":
      return t("admin.analyticsCardBank");
    case "MOBILE_MONEY":
      return t("admin.analyticsMobileMoney");
    case "MOBILE_MONEY_MTN":
      return "MTN MoMo";
    case "MOBILE_MONEY_ORANGE":
      return "Orange Money";
    case "MOBILE_MONEY_AIRTEL":
      return "Airtel";
    case "MOBILE_MONEY_WAVE":
      return "Wave";
    case "MOBILE_MONEY_MOOV":
      return "Moov";
    case "PAYPAL":
      return "PayPal";
    case "GOOGLE_PAY":
      return "Google Pay";
    case "BANK_TRANSFER":
      return t("admin.methodTransfer");
    case "SEPA":
      return "SEPA";
    case "UNKNOWN":
      return t("admin.analyticsUnknown");
    default:
      return method;
  }
}

function providerLabel(provider: string, t: (key: string) => string): string {
  switch (provider) {
    case "STRIPE":
      return "Stripe";
    case "PAWAPAY":
      return "pawaPay";
    case "CINETPAY":
      return "CinetPay";
    case "FLUTTERWAVE":
      return "Flutterwave";
    case "PAYPAL":
      return "PayPal";
    case "MOCK":
      return t("admin.analyticsMock");
    default:
      return provider;
  }
}

function formatMonthLabel(key: string, locale: AppLocale) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString(dateLocaleTag(locale), {
    month: "short",
    year: "2-digit",
  });
}

function formatAmount(value: number, locale: AppLocale, currency?: string) {
  const tag = dateLocaleTag(locale);
  if (currency && /^[A-Z]{3}$/i.test(currency)) {
    try {
      return new Intl.NumberFormat(tag, {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      // Devise non reconnue par Intl — repli numérique
    }
  }
  return value.toLocaleString(tag);
}

function formatRevenueLegend(
  currency: string,
  nativeAmount: number,
  amountXaf: number,
  locale: AppLocale
): string {
  const native = formatAmount(nativeAmount, locale, currency);
  if (currency === "XAF") return native;
  return `${native} (~${formatAmount(amountXaf, locale, "XAF")})`;
}

function withLabels<T extends { month: string }>(rows: T[] = [], locale: AppLocale) {
  return rows.map((r) => ({ ...r, label: formatMonthLabel(r.month, locale) }));
}

function normalizeAnalyticsData(raw: AdminAnalyticsData): AdminAnalyticsData {
  return {
    overview: {
      totalUsers: raw.overview?.totalUsers ?? 0,
      newUsersInPeriod: raw.overview?.newUsersInPeriod ?? 0,
      activeUsers: raw.overview?.activeUsers ?? 0,
      totalSubscriptions: raw.overview?.totalSubscriptions ?? 0,
      freeSubscriptions: raw.overview?.freeSubscriptions ?? 0,
      paidSubscriptions: raw.overview?.paidSubscriptions ?? 0,
      totalAttempts: raw.overview?.totalAttempts ?? 0,
      completedAttempts: raw.overview?.completedAttempts ?? 0,
      conversionRate: raw.overview?.conversionRate ?? 0,
    },
    subscriptionsByPlan: raw.subscriptionsByPlan ?? [],
    subscriptionsByExamType: raw.subscriptionsByExamType ?? [],
    registrationsByMonth: raw.registrationsByMonth ?? [],
    revenueByMonth: raw.revenueByMonth ?? [],
    attemptsByMonth: raw.attemptsByMonth ?? [],
    completedAttemptsByMonth: raw.completedAttemptsByMonth ?? [],
    paymentsByMethod: raw.paymentsByMethod ?? [],
    paymentsByProvider: raw.paymentsByProvider ?? [],
    revenueTotals: (raw.revenueTotals ?? []).map((r) => ({
      currency: r.currency,
      amount: r.amount ?? 0,
      amountXaf: r.amountXaf ?? r.amount ?? 0,
    })),
  };
}

function toNamedPieData(
  items: Array<{ name: string; value: number }>,
  emptyLabel: string
) {
  const filtered = items.filter((i) => i.value > 0);
  if (filtered.length === 0) {
    return [{ name: emptyLabel, value: 1, isEmpty: true }];
  }
  return filtered;
}

export function AdminAnalyticsCharts({ data: rawData }: { data: AdminAnalyticsData }) {
  const { t, locale } = useTranslation();
  const data = useMemo(() => normalizeAnalyticsData(rawData), [rawData]);

  const registrations = useMemo(
    () => withLabels(data.registrationsByMonth, locale),
    [data.registrationsByMonth, locale]
  );
  const revenue = useMemo(
    () => withLabels(data.revenueByMonth, locale),
    [data.revenueByMonth, locale]
  );
  const attempts = useMemo(
    () => withLabels(data.attemptsByMonth, locale),
    [data.attemptsByMonth, locale]
  );
  const completedAttempts = useMemo(
    () => withLabels(data.completedAttemptsByMonth, locale),
    [data.completedAttemptsByMonth, locale]
  );

  const activityTrend = useMemo(
    () =>
      registrations.map((r, i) => ({
        label: r.label,
        inscriptions: r.count,
        tentatives: attempts[i]?.count ?? 0,
        completees: completedAttempts[i]?.count ?? 0,
      })),
    [registrations, attempts, completedAttempts]
  );

  const examSubs = useMemo(
    () =>
      data.subscriptionsByExamType.map((e) => ({
        name:
          e.examType === "AUTRE"
            ? t("admin.analyticsExamOther")
            : EXAM_TYPE_LABELS[e.examType as keyof typeof EXAM_TYPE_LABELS] ??
              e.examType,
        gratuit: e.free,
        payant: e.paid,
        total: e.totalActive,
      })),
    [data.subscriptionsByExamType, t]
  );

  const planPie = useMemo(
    () =>
      toNamedPieData(
        data.subscriptionsByPlan.map((p) => ({
          name:
            p.plan === "FREE"
              ? t("common.free")
              : p.plan === "STARTER"
                ? t("admin.analyticsPlanStarter")
                : p.plan === "PRO"
                  ? t("admin.analyticsPlanPro")
                  : p.plan === "ELITE"
                    ? t("admin.analyticsPlanElite")
                    : p.label,
          value: p.count,
        })),
        t("admin.analyticsNoData")
      ),
    [data.subscriptionsByPlan, t]
  );

  const freePaidPie = useMemo(
    () =>
      toNamedPieData(
        [
          { name: t("common.free"), value: data.overview.freeSubscriptions },
          {
            name: t("admin.analyticsPaid"),
            value: data.overview.paidSubscriptions,
          },
        ],
        t("admin.analyticsNoData")
      ),
    [data.overview.freeSubscriptions, data.overview.paidSubscriptions, t]
  );

  const methodPie = useMemo(
    () =>
      toNamedPieData(
        data.paymentsByMethod.map((p) => ({
          name: paymentMethodLabel(p.method, t),
          value: p.count,
        })),
        t("admin.analyticsNoPayments")
      ),
    [data.paymentsByMethod, t]
  );

  const providerPie = useMemo(
    () =>
      toNamedPieData(
        data.paymentsByProvider.map((p) => ({
          name: providerLabel(p.provider, t),
          value: p.count,
        })),
        t("admin.analyticsNoPayments")
      ),
    [data.paymentsByProvider, t]
  );

  const currencyPie = useMemo(() => {
    const items = data.revenueTotals
      .filter((r) => r.amountXaf > 0)
      .map((r) => ({
        name: r.currency,
        value: r.amountXaf,
        legendLabel: formatRevenueLegend(
          r.currency,
          r.amount,
          r.amountXaf,
          locale
        ),
      }));

    if (items.length === 0) {
      return [
        { name: t("admin.analyticsNoRevenue"), value: 1, isEmpty: true },
      ];
    }
    return items;
  }, [data.revenueTotals, locale, t]);

  const attemptCompletionPie = useMemo(() => {
    const incomplete = Math.max(
      0,
      data.overview.totalAttempts - data.overview.completedAttempts
    );
    return toNamedPieData(
      [
        {
          name: t("admin.analyticsCompleted"),
          value: data.overview.completedAttempts,
        },
        { name: t("admin.analyticsInProgress"), value: incomplete },
      ],
      t("admin.analyticsNoData")
    );
  }, [
    data.overview.totalAttempts,
    data.overview.completedAttempts,
    t,
  ]);

  const completionRate =
    data.overview.totalAttempts > 0
      ? Math.round(
          (data.overview.completedAttempts / data.overview.totalAttempts) *
            1000
        ) / 10
      : 0;

  const radarExamData = useMemo(
    () =>
      examSubs.map((e) => ({
        subject: e.name.length > 12 ? `${e.name.slice(0, 10)}…` : e.name,
        abonnements: e.total,
      })),
    [examSubs]
  );

  const kpis = [
    {
      label: t("admin.analyticsKpiUsers"),
      value: data.overview.totalUsers,
      sub: t("admin.analyticsKpiUsersSub", {
        n: data.overview.activeUsers,
      }),
      accent: CHART_COLORS[0],
    },
    {
      label: t("admin.analyticsKpiSubs"),
      value: data.overview.totalSubscriptions,
      sub: t("admin.analyticsKpiSubsSub", {
        free: data.overview.freeSubscriptions,
        paid: data.overview.paidSubscriptions,
      }),
      accent: CHART_COLORS[1],
    },
    {
      label: t("admin.analyticsKpiNew"),
      value: data.overview.newUsersInPeriod,
      sub: t("admin.analyticsKpiNewSub", {
        rate: data.overview.conversionRate,
      }),
      accent: CHART_COLORS[2],
    },
    {
      label: t("admin.analyticsKpiAttempts"),
      value: data.overview.totalAttempts,
      sub: t("admin.analyticsKpiAttemptsSub", {
        n: data.overview.completedAttempts,
        rate: completionRate,
      }),
      accent: CHART_COLORS[3],
    },
  ];

  return (
    <div className="flex flex-col gap-xl">
      <AnalyticsSection
        title={t("admin.analyticsSectionKpis")}
        description={t("admin.analyticsSectionKpisDesc")}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-surface rounded-2xl p-lg border border-outline-variant relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                style={{ backgroundColor: kpi.accent }}
              />
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {kpi.label}
              </p>
              <p className="font-display-md text-[26px] font-bold text-on-surface mt-xs">
                {kpi.value.toLocaleString(dateLocaleTag(locale))}
              </p>
              <p className="font-label-sm text-[11px] text-on-surface-variant mt-xs">
                {kpi.sub}
              </p>
            </div>
          ))}
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title={t("admin.analyticsSectionTime")}
        description={t("admin.analyticsSectionTimeDesc")}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg">
          <ChartCard
            title={t("admin.analyticsRegistrations")}
            subtitle={t("admin.analyticsAreaCurve")}
          >
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name={t("admin.analyticsRegistrations")}
                  stroke={CHART_COLORS[0]}
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsCombined")}
            subtitle={t("admin.analyticsCombinedSub")}
          >
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="inscriptions"
                  name={t("admin.analyticsRegistrations")}
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="tentatives"
                  name={t("admin.analyticsAttempts")}
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="completees"
                  name={t("admin.analyticsCompleted")}
                  stroke={CHART_COLORS[3]}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsMonthlyRevenue")}
            subtitle={t("admin.analyticsGroupedBars")}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="xaf"
                  name="XAF"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="usd"
                  name="USD"
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="eur"
                  name="EUR"
                  fill={CHART_COLORS[4]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsRevenueXaf")}
            subtitle={t("admin.analyticsTrendLine")}
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => formatAmount(Number(v), locale, "XAF")}
                />
                <Line
                  type="monotone"
                  dataKey="xaf"
                  name="XAF"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: CHART_COLORS[0] }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title={t("admin.analyticsSectionSubs")}
        description={t("admin.analyticsSectionSubsDesc")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          <ChartCard title={t("admin.analyticsByPlan")} subtitle={t("admin.analyticsDonut")}>
            <DonutChart data={planPie} height={240} />
            <PieLegend data={planPie} />
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsFreeVsPaid")}
            subtitle={t("admin.analyticsDonut")}
          >
            <DonutChart
              data={freePaidPie}
              height={240}
              colors={["#9ca3af", CHART_COLORS[0]]}
            />
            <PieLegend data={freePaidPie} />
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsByExamType")}
            subtitle={t("admin.analyticsRadar")}
          >
            {radarExamData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarExamData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e6e0e9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Radar
                    name={t("admin.analyticsSubscriptions")}
                    dataKey="abonnements"
                    stroke={CHART_COLORS[0]}
                    fill={CHART_COLORS[0]}
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage />
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg mt-lg">
          <ChartCard
            title={t("admin.analyticsSubsByExam")}
            subtitle={t("admin.analyticsStackedBars")}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={examSubs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="gratuit"
                  name={t("common.free")}
                  stackId="a"
                  fill="#9ca3af"
                />
                <Bar
                  dataKey="payant"
                  name={t("admin.analyticsPaid")}
                  stackId="a"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsVolumeByExam")}
            subtitle={t("admin.analyticsHorizontalBars")}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={examSubs} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  width={90}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="total"
                  name={t("admin.analyticsTotalActive")}
                  fill={CHART_COLORS[3]}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title={t("admin.analyticsSectionPayments")}
        description={t("admin.analyticsSectionPaymentsDesc")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-lg">
          <ChartCard
            title={t("admin.analyticsByCurrency")}
            subtitle={t("admin.analyticsDonutXaf")}
          >
            <DonutChart
              data={currencyPie}
              height={200}
              tooltipFormatter={(value, name) => [
                formatAmount(Number(value), locale, "XAF"),
                t("admin.analyticsEquivXaf", { name: String(name) }),
              ]}
            />
            <PieLegend data={currencyPie} showPercent />
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsByMethod")}
            subtitle={t("admin.analyticsDonut")}
          >
            <DonutChart data={methodPie} height={200} />
            <PieLegend data={methodPie} />
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsByProvider")}
            subtitle={t("admin.analyticsDonut")}
          >
            <DonutChart data={providerPie} height={200} />
            <PieLegend data={providerPie} />
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsCompletionRate")}
            subtitle={t("admin.analyticsRadialGauge")}
          >
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="90%"
                barSize={14}
                data={[
                  {
                    name: t("admin.analyticsCompletion"),
                    value: completionRate,
                    fill: CHART_COLORS[0],
                  },
                ]}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background={{ fill: "#e6e0e9" }}
                  dataKey="value"
                  cornerRadius={8}
                />
                <text
                  x="50%"
                  y="52%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-on-surface font-bold"
                  style={{ fontSize: 28 }}
                >
                  {completionRate}%
                </text>
                <text
                  x="50%"
                  y="68%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-on-surface-variant"
                  style={{ fontSize: 11 }}
                >
                  {t("admin.analyticsAttemptsCompleted")}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title={t("admin.analyticsSectionExams")}
        description={t("admin.analyticsSectionExamsDesc")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          <ChartCard
            title={t("admin.analyticsMonthlyAttempts")}
            subtitle={t("admin.analyticsAreaCurve")}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={attempts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name={t("admin.analyticsAttempts")}
                  stroke={CHART_COLORS[2]}
                  fill={CHART_COLORS[2]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsMonthlyCompletions")}
            subtitle={t("admin.analyticsCurve")}
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={completedAttempts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t("admin.analyticsCompleted")}
                  stroke={CHART_COLORS[3]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t("admin.analyticsAttemptStatus")}
            subtitle={t("admin.analyticsDiskPeriod")}
          >
            <DonutChart
              data={attemptCompletionPie}
              height={200}
              colors={[CHART_COLORS[2], "#d1d5db"]}
            />
            <PieLegend data={attemptCompletionPie} />
          </ChartCard>
        </div>
      </AnalyticsSection>
    </div>
  );
}

function AnalyticsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-lg">
      <div className="border-b border-outline-variant pb-md">
        <h2 className="font-headline-lg text-[18px] font-bold text-on-surface">
          {title}
        </h2>
        <p className="font-body-sm text-[13px] text-on-surface-variant mt-xs">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function EmptyChartMessage() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-[200px] text-on-surface-variant font-label-sm">
      {t("admin.analyticsNoDataPeriod")}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm flex flex-col">
      <div className="mb-md">
        <h3 className="font-headline-lg text-[15px] font-bold text-on-surface">
          {title}
        </h3>
        {subtitle && (
          <p className="font-label-sm text-[11px] text-on-surface-variant mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

type PieDatum = {
  name: string;
  value: number;
  isEmpty?: boolean;
  legendLabel?: string;
};

function DonutChart({
  data,
  height = 220,
  colors = CHART_COLORS,
  tooltipFormatter,
}: {
  data: PieDatum[];
  height?: number;
  colors?: string[];
  tooltipFormatter?: (
    value: number,
    name: string
  ) => [string, string];
}) {
  const isEmpty = data.length === 1 && data[0]?.isEmpty;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={isEmpty ? 0 : 3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={
                isEmpty ? "#e6e0e9" : colors[index % colors.length]
              }
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={
            tooltipFormatter
              ? (value, name) =>
                  tooltipFormatter(Number(value), String(name ?? ""))
              : undefined
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PieLegend({
  data,
  formatValue,
  showPercent = true,
}: {
  data: PieDatum[];
  formatValue?: (value: number, name: string) => string;
  showPercent?: boolean;
}) {
  const { locale } = useTranslation();
  const tag = dateLocaleTag(locale);
  const isEmpty = data.length === 1 && data[0]?.isEmpty;
  const total = isEmpty ? 0 : data.reduce((s, d) => s + d.value, 0);

  return (
    <ul className="mt-sm space-y-1">
      {data.map((item, i) => {
        const pct =
          total > 0 ? Math.round((item.value / total) * 100) : 0;
        const display =
          isEmpty || item.isEmpty
            ? "—"
            : item.legendLabel
              ? showPercent
                ? `${item.legendLabel} (${pct}%)`
                : item.legendLabel
              : formatValue
                ? formatValue(item.value, item.name)
                : showPercent
                  ? `${item.value.toLocaleString(tag)} (${pct}%)`
                  : item.value.toLocaleString(tag);
        return (
          <li
            key={item.name}
            className="flex items-center justify-between font-label-sm text-[12px]"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isEmpty
                    ? "#e6e0e9"
                    : CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <span className="truncate text-on-surface">{item.name}</span>
            </span>
            <span className="text-on-surface-variant shrink-0 ml-2">
              {display}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
