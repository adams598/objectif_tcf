"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Progress } from "@/components/ui/progress";
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
  paymentsByMethod: Array<{ method: string; count: number }>;
  paymentsByProvider: Array<{ provider: string; count: number }>;
};

function formatMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export function AdminAnalyticsCharts({ data }: { data: AdminAnalyticsData }) {
  const planTotal = data.subscriptionsByPlan.reduce((a, p) => a + p.count, 0);

  const registrations = data.registrationsByMonth.map((r) => ({
    ...r,
    label: formatMonthLabel(r.month),
  }));

  const revenue = data.revenueByMonth.map((r) => ({
    ...r,
    label: formatMonthLabel(r.month),
  }));

  const attempts = data.attemptsByMonth.map((a) => ({
    ...a,
    label: formatMonthLabel(a.month),
  }));

  const examSubs = data.subscriptionsByExamType.map((e) => ({
    name: EXAM_TYPE_LABELS[e.examType as keyof typeof EXAM_TYPE_LABELS] ?? e.examType,
    gratuit: e.free,
    payant: e.paid,
  }));

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {[
          {
            label: "Utilisateurs",
            value: data.overview.totalUsers,
            sub: `${data.overview.activeUsers} actifs`,
          },
          {
            label: "Abonnements actifs",
            value: data.overview.totalSubscriptions,
            sub: `${data.overview.freeSubscriptions} gratuits · ${data.overview.paidSubscriptions} payants`,
          },
          {
            label: "Nouveaux (période)",
            value: data.overview.newUsersInPeriod,
            sub: `Conversion ${data.overview.conversionRate}%`,
          },
          {
            label: "Tentatives",
            value: data.overview.totalAttempts,
            sub: `${data.overview.completedAttempts} complétées`,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface rounded-2xl p-lg border border-outline-variant"
          >
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <ChartCard title="Inscriptions">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={registrations.length ? registrations : [{ label: "—", count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="Inscriptions" stroke="#6750a4" fill="#6750a4" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenus (période)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenue.length ? revenue : [{ label: "—", xaf: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="xaf" name="XAF" fill="#6750a4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="usd" name="USD" fill="#7d5260" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tentatives d'examen">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={attempts.length ? attempts : [{ label: "—", count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="Tentatives" stroke="#386a20" fill="#386a20" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Abonnements par type d'examen">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={examSubs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="gratuit" name="Gratuit" stackId="a" fill="#9ca3af" />
              <Bar dataKey="payant" name="Payant" stackId="a" fill="#6750a4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <ChartCard title="Plans d'abonnement">
          <div className="space-y-md mt-sm">
            {data.subscriptionsByPlan.map((item) => {
              const pct = planTotal > 0 ? Math.round((item.count / planTotal) * 100) : 0;
              return (
                <div key={item.plan}>
                  <div className="flex justify-between mb-1">
                    <span className="font-label-sm">{item.label}</span>
                    <span className="font-label-sm text-on-surface-variant">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} fillColor="primary" />
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Paiements par méthode">
          <div className="space-y-sm mt-sm">
            {data.paymentsByMethod.map((p) => (
              <div key={p.method} className="flex justify-between font-label-sm py-xs border-b border-outline-variant/50">
                <span>{p.method}</span>
                <span className="text-on-surface-variant">{p.count}</span>
              </div>
            ))}
            {data.paymentsByMethod.length === 0 && (
              <p className="text-on-surface-variant font-label-sm">Aucun paiement sur la période</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Paiements par prestataire">
          <div className="space-y-sm mt-sm">
            {data.paymentsByProvider.map((p) => (
              <div key={p.provider} className="flex justify-between font-label-sm py-xs border-b border-outline-variant/50">
                <span>{p.provider}</span>
                <span className="text-on-surface-variant">{p.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm">
      <h2 className="font-headline-lg text-[16px] font-bold text-on-surface mb-md">
        {title}
      </h2>
      {children}
    </div>
  );
}
