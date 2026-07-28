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
  revenueTotals: Array<{ currency: string; amount: number }>;
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

const METHOD_LABELS: Record<string, string> = {
  CARD: "Carte bancaire",
  MOBILE_MONEY: "Mobile money",
  MOBILE_MONEY_MTN: "MTN",
  MOBILE_MONEY_ORANGE: "Orange Money",
  MOBILE_MONEY_AIRTEL: "Airtel",
  MOBILE_MONEY_WAVE: "Wave",
  MOBILE_MONEY_MOOV: "Moov",
  PAYPAL: "PayPal",
  GOOGLE_PAY: "Google Pay",
  BANK_TRANSFER: "Virement",
  SEPA: "SEPA",
  UNKNOWN: "Inconnu",
};

const PROVIDER_LABELS: Record<string, string> = {
  STRIPE: "Stripe",
  PAWAPAY: "pawaPay",
  CINETPAY: "CinetPay",
  FLUTTERWAVE: "Flutterwave",
  PAYPAL: "PayPal",
  MOCK: "Simulation",
};

function formatMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function formatAmount(value: number, currency?: string) {
  if (currency && /^[A-Z]{3}$/i.test(currency)) {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      // Devise non reconnue par Intl — repli numérique
    }
  }
  return value.toLocaleString("fr-FR");
}

function withLabels<T extends { month: string }>(rows: T[] = []) {
  return rows.map((r) => ({ ...r, label: formatMonthLabel(r.month) }));
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
    revenueTotals: raw.revenueTotals ?? [],
  };
}

function toNamedPieData(
  items: Array<{ name: string; value: number }>,
  emptyLabel = "Aucune donnée"
) {
  const filtered = items.filter((i) => i.value > 0);
  if (filtered.length === 0) {
    return [{ name: emptyLabel, value: 1, isEmpty: true }];
  }
  return filtered;
}

export function AdminAnalyticsCharts({ data: rawData }: { data: AdminAnalyticsData }) {
  const data = useMemo(() => normalizeAnalyticsData(rawData), [rawData]);

  const registrations = useMemo(
    () => withLabels(data.registrationsByMonth),
    [data.registrationsByMonth]
  );
  const revenue = useMemo(
    () => withLabels(data.revenueByMonth),
    [data.revenueByMonth]
  );
  const attempts = useMemo(
    () => withLabels(data.attemptsByMonth),
    [data.attemptsByMonth]
  );
  const completedAttempts = useMemo(
    () => withLabels(data.completedAttemptsByMonth),
    [data.completedAttemptsByMonth]
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
          EXAM_TYPE_LABELS[e.examType as keyof typeof EXAM_TYPE_LABELS] ??
          e.examType,
        gratuit: e.free,
        payant: e.paid,
        total: e.totalActive,
      })),
    [data.subscriptionsByExamType]
  );

  const planPie = useMemo(
    () =>
      toNamedPieData(
        data.subscriptionsByPlan.map((p) => ({
          name: p.label,
          value: p.count,
        }))
      ),
    [data.subscriptionsByPlan]
  );

  const freePaidPie = useMemo(
    () =>
      toNamedPieData([
        { name: "Gratuit", value: data.overview.freeSubscriptions },
        { name: "Payant", value: data.overview.paidSubscriptions },
      ]),
    [data.overview.freeSubscriptions, data.overview.paidSubscriptions]
  );

  const methodPie = useMemo(
    () =>
      toNamedPieData(
        data.paymentsByMethod.map((p) => ({
          name: METHOD_LABELS[p.method] ?? p.method,
          value: p.count,
        })),
        "Aucun paiement"
      ),
    [data.paymentsByMethod]
  );

  const providerPie = useMemo(
    () =>
      toNamedPieData(
        data.paymentsByProvider.map((p) => ({
          name: PROVIDER_LABELS[p.provider] ?? p.provider,
          value: p.count,
        })),
        "Aucun paiement"
      ),
    [data.paymentsByProvider]
  );

  const currencyPie = useMemo(
    () =>
      toNamedPieData(
        data.revenueTotals.map((r) => ({
          name: r.currency,
          value: r.amount,
        })),
        "Aucun revenu"
      ),
    [data.revenueTotals]
  );

  const attemptCompletionPie = useMemo(() => {
    const incomplete = Math.max(
      0,
      data.overview.totalAttempts - data.overview.completedAttempts
    );
    return toNamedPieData([
      { name: "Complétées", value: data.overview.completedAttempts },
      { name: "En cours / abandonnées", value: incomplete },
    ]);
  }, [data.overview.totalAttempts, data.overview.completedAttempts]);

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
      label: "Utilisateurs",
      value: data.overview.totalUsers,
      sub: `${data.overview.activeUsers} actifs`,
      accent: CHART_COLORS[0],
    },
    {
      label: "Abonnements actifs",
      value: data.overview.totalSubscriptions,
      sub: `${data.overview.freeSubscriptions} gratuits · ${data.overview.paidSubscriptions} payants`,
      accent: CHART_COLORS[1],
    },
    {
      label: "Nouveaux (période)",
      value: data.overview.newUsersInPeriod,
      sub: `Conversion ${data.overview.conversionRate}%`,
      accent: CHART_COLORS[2],
    },
    {
      label: "Tentatives",
      value: data.overview.totalAttempts,
      sub: `${data.overview.completedAttempts} complétées (${completionRate}%)`,
      accent: CHART_COLORS[3],
    },
  ];

  return (
    <div className="flex flex-col gap-xl">
      <AnalyticsSection
        title="Indicateurs clés"
        description="Synthèse instantanée de l'activité sur la période filtrée"
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
                {kpi.value.toLocaleString("fr-FR")}
              </p>
              <p className="font-label-sm text-[11px] text-on-surface-variant mt-xs">
                {kpi.sub}
              </p>
            </div>
          ))}
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Évolution temporelle"
        description="Tendances mois par mois — toutes les périodes sont affichées, y compris sans activité"
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg">
          <ChartCard title="Inscriptions" subtitle="Courbe aire">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Inscriptions"
                  stroke={CHART_COLORS[0]}
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Activité combinée"
            subtitle="Courbes superposées — inscriptions, tentatives, complétions"
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
                  name="Inscriptions"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="tentatives"
                  name="Tentatives"
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="completees"
                  name="Complétées"
                  stroke={CHART_COLORS[3]}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenus mensuels" subtitle="Barres groupées par devise">
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

          <ChartCard title="Revenus XAF" subtitle="Courbe de tendance">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => formatAmount(Number(v), "XAF")}
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
        title="Répartition des abonnements"
        description="Disques et barres pour visualiser la composition du parc abonnés"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          <ChartCard title="Par plan" subtitle="Donut">
            <DonutChart data={planPie} height={240} />
            <PieLegend data={planPie} />
          </ChartCard>

          <ChartCard title="Gratuit vs payant" subtitle="Donut">
            <DonutChart
              data={freePaidPie}
              height={240}
              colors={["#9ca3af", CHART_COLORS[0]]}
            />
            <PieLegend data={freePaidPie} />
          </ChartCard>

          <ChartCard title="Par type d'examen" subtitle="Radar">
            {radarExamData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarExamData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e6e0e9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Radar
                    name="Abonnements"
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
          <ChartCard title="Abonnements par examen" subtitle="Barres empilées">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={examSubs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="gratuit"
                  name="Gratuit"
                  stackId="a"
                  fill="#9ca3af"
                />
                <Bar
                  dataKey="payant"
                  name="Payant"
                  stackId="a"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Volume par examen" subtitle="Barres horizontales">
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
                  name="Total actifs"
                  fill={CHART_COLORS[3]}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Paiements & revenus"
        description="Analyse des flux financiers sur la période"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-lg">
          <ChartCard title="Par devise" subtitle="Donut — total période">
            <DonutChart data={currencyPie} height={200} />
            <PieLegend
              data={currencyPie}
              formatValue={(v, name) => formatAmount(v, name)}
            />
          </ChartCard>

          <ChartCard title="Par méthode" subtitle="Donut">
            <DonutChart data={methodPie} height={200} />
            <PieLegend data={methodPie} />
          </ChartCard>

          <ChartCard title="Par prestataire" subtitle="Donut">
            <DonutChart data={providerPie} height={200} />
            <PieLegend data={providerPie} />
          </ChartCard>

          <ChartCard title="Taux de complétion" subtitle="Jauge radiale">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="90%"
                barSize={14}
                data={[{ name: "Complétion", value: completionRate, fill: CHART_COLORS[0] }]}
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
                  tentatives complétées
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        title="Activité examens"
        description="Engagement des utilisateurs sur les séries et examens"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg">
          <ChartCard title="Tentatives mensuelles" subtitle="Courbe aire">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={attempts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Tentatives"
                  stroke={CHART_COLORS[2]}
                  fill={CHART_COLORS[2]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Complétions mensuelles" subtitle="Courbe">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={completedAttempts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Complétées"
                  stroke={CHART_COLORS[3]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Statut des tentatives" subtitle="Disque — période">
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
  return (
    <div className="flex items-center justify-center h-[200px] text-on-surface-variant font-label-sm">
      Aucune donnée sur cette période
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

type PieDatum = { name: string; value: number; isEmpty?: boolean };

function DonutChart({
  data,
  height = 220,
  colors = CHART_COLORS,
}: {
  data: PieDatum[];
  height?: number;
  colors?: string[];
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
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PieLegend({
  data,
  formatValue,
}: {
  data: PieDatum[];
  formatValue?: (value: number, name: string) => string;
}) {
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
            : formatValue
              ? formatValue(item.value, item.name)
              : `${item.value.toLocaleString("fr-FR")} (${pct}%)`;
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
