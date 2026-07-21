"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { fetchJson } from "@/lib/api/fetch-json";
import { AdminSystemStatusPanel } from "@/modules/admin/components/admin-system-status-panel";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAttempts: number;
  completedAttempts: number;
  newUsersThisMonth: number;
  premiumSubscribers: number;
  conversionRate: number;
  revenueXaf: number;
  subscriptionPlans: Array<{ plan: string; _count: { _all: number } }>;
  recentUsers: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
    subscriptions: Array<{ plan: string }>;
  }>;
  monthlyRegistrations: Array<{ month: string; users: number }>;
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratuit",
  STARTER: "Essentiel",
  PRO: "Pro",
  ELITE: "Premium",
};

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchJson<AdminStats>("/api/admin/stats"),
  });

  const kpiCards = stats
    ? [
        {
          label: "Utilisateurs",
          value: stats.totalUsers.toLocaleString("fr-FR"),
          sub: `${stats.activeUsers} actifs`,
          icon: "group",
        },
        {
          label: "Revenus (XAF)",
          value: stats.revenueXaf.toLocaleString("fr-FR"),
          sub: "Total cumulé",
          icon: "payments",
        },
        {
          label: "Taux de conversion",
          value: `${stats.conversionRate}%`,
          sub: "Abonnés Pro/Elite",
          icon: "trending_up",
        },
        {
          label: "Abonnés Premium",
          value: stats.premiumSubscribers.toLocaleString("fr-FR"),
          sub: `+${stats.newUsersThisMonth} ce mois`,
          icon: "workspace_premium",
        },
      ]
    : [];

  const planTotal =
    stats?.subscriptionPlans.reduce((a, p) => a + p._count._all, 0) ?? 0;

  const chartData =
    stats?.monthlyRegistrations.length
      ? stats.monthlyRegistrations
      : [{ month: "—", users: 0 }];

  return (
    <div className="flex flex-col gap-xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          Vue d&apos;ensemble
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Tableau de bord administrateur · Données en temps réel
        </p>
      </motion.div>

      <AdminSystemStatusPanel />

      {isLoading ? (
        <div className="p-xl text-center text-on-surface-variant animate-pulse">
          Chargement des statistiques…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
            {kpiCards.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
              >
                <div className="flex items-center justify-between mb-md">
                  <span className="material-symbols-outlined text-[24px] text-primary">
                    {kpi.icon}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {kpi.sub}
                  </span>
                </div>
                <div className="font-display-md text-[28px] font-bold text-on-surface">
                  {kpi.value}
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  {kpi.label}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
            >
              <h2 className="font-headline-lg text-[18px] font-bold text-on-surface mb-sm">
                Inscriptions (6 derniers mois)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6750a4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6750a4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
                  <XAxis dataKey="month" tick={{ fill: "#494551", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#494551", fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#6750a4"
                    strokeWidth={2}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
            >
              <h2 className="font-headline-lg text-[18px] font-bold text-on-surface mb-sm">
                Activité examens
              </h2>
              <div className="grid grid-cols-2 gap-md mt-lg">
                <div className="p-md rounded-xl bg-surface-container-low">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Tentatives totales
                  </p>
                  <p className="font-display-md text-[24px] font-bold">
                    {stats?.totalAttempts ?? 0}
                  </p>
                </div>
                <div className="p-md rounded-xl bg-surface-container-low">
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Complétées
                  </p>
                  <p className="font-display-md text-[24px] font-bold">
                    {stats?.completedAttempts ?? 0}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
            >
              <h2 className="font-headline-lg text-[18px] font-bold text-on-surface mb-lg">
                Plans d&apos;abonnement
              </h2>
              <div className="space-y-md">
                {(stats?.subscriptionPlans ?? []).map((item) => {
                  const pct =
                    planTotal > 0
                      ? Math.round((item._count._all / planTotal) * 100)
                      : 0;
                  return (
                    <div key={item.plan}>
                      <div className="flex justify-between mb-1">
                        <span className="font-label-md text-label-md text-on-surface">
                          {PLAN_LABELS[item.plan] ?? item.plan}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {item._count._all} ({pct}%)
                        </span>
                      </div>
                      <Progress value={pct} fillColor="primary" />
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
            >
              <h2 className="font-headline-lg text-[18px] font-bold text-on-surface mb-lg">
                Inscriptions récentes
              </h2>
              <div className="space-y-sm">
                {(stats?.recentUsers ?? []).map((user) => {
                  const name =
                    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    user.email;
                  const plan = user.subscriptions[0]?.plan;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-md rounded-xl border border-outline-variant"
                    >
                      <div className="flex items-center gap-md">
                        <Avatar src={user.avatarUrl ?? undefined} name={name} size="sm" />
                        <div>
                          <p className="font-label-md text-label-md font-semibold">{name}</p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={plan && plan !== "FREE" ? "primary" : "outline"}>
                        {plan ? PLAN_LABELS[plan] ?? plan : "Gratuit"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
