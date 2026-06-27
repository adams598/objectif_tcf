"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const registrationData = [
  { month: "Août", users: 420 },
  { month: "Sep", users: 680 },
  { month: "Oct", users: 890 },
  { month: "Nov", users: 1120 },
  { month: "Déc", users: 940 },
  { month: "Jan", users: 1350 },
];

const revenueData = [
  { month: "Août", revenue: 8400 },
  { month: "Sep", revenue: 13600 },
  { month: "Oct", revenue: 17800 },
  { month: "Nov", revenue: 22400 },
  { month: "Déc", revenue: 18800 },
  { month: "Jan", revenue: 27000 },
];

const recentUsers = [
  { name: "Amina Sow", country: "🇨🇮", plan: "Premium", date: "Aujourd'hui", nclc: "NCLC 8" },
  { name: "Karim Benali", country: "🇲🇦", plan: "Essentiel", date: "Hier", nclc: "NCLC 7" },
  { name: "Sophie Martin", country: "🇫🇷", plan: "Premium", date: "Hier", nclc: "NCLC 9" },
  { name: "Jean-Pierre K.", country: "🇭🇹", plan: "Gratuit", date: "Il y a 2j", nclc: "NCLC 6" },
  { name: "Fatima Z.", country: "🇸🇳", plan: "Premium", date: "Il y a 3j", nclc: "NCLC 10" },
];

const kpiCards = [
  {
    label: "Utilisateurs actifs",
    value: "12 847",
    delta: "+18%",
    positive: true,
    icon: "group",
  },
  {
    label: "Revenus mensuels",
    value: "27 000 $",
    delta: "+23%",
    positive: true,
    icon: "payments",
  },
  {
    label: "Taux de conversion",
    value: "3.4%",
    delta: "-0.2%",
    positive: false,
    icon: "trending_up",
  },
  {
    label: "Abonnés Premium",
    value: "4 231",
    delta: "+31%",
    positive: true,
    icon: "workspace_premium",
  },
];

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          Vue d&apos;ensemble
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Tableau de bord administrateur · Données en temps réel
        </p>
      </motion.div>

      {/* KPI Cards */}
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
              <span
                className={`font-label-sm text-label-sm px-sm py-xs rounded-full ${
                  kpi.positive
                    ? "bg-success-container text-success"
                    : "bg-error-container text-error"
                }`}
              >
                {kpi.delta}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
        >
          <h2 className="font-headline-lg text-[18px] font-bold text-on-surface mb-sm">
            Inscriptions mensuelles
          </h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-lg">
            Nouveaux utilisateurs / mois
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={registrationData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6750a4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6750a4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#494551", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#494551", fontSize: 11 }} axisLine={false} tickLine={false} />
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
          transition={{ delay: 0.25 }}
          className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
        >
          <h2 className="font-headline-lg text-[18px] font-bold text-on-surface mb-sm">
            Revenus mensuels (CAD)
          </h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-lg">
            Chiffre d&apos;affaires mensuel
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e0e9" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#494551", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#494551", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#6750a4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Plan distribution + Recent users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Plan distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
        >
          <h2 className="font-headline-lg text-[18px] font-bold text-on-surface mb-lg">
            Plans d&apos;abonnement
          </h2>
          <div className="space-y-md">
            {[
              { plan: "Premium", count: 4231, pct: 33, color: "primary" },
              { plan: "Essentiel", count: 5842, pct: 45, color: "secondary" },
              { plan: "Gratuit", count: 2774, pct: 22, color: "tertiary" },
            ].map((item) => (
              <div key={item.plan}>
                <div className="flex justify-between mb-1">
                  <span className="font-label-md text-label-md text-on-surface">
                    {item.plan}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {item.count.toLocaleString()} ({item.pct}%)
                  </span>
                </div>
                <Progress
                  value={item.pct}
                  fillColor={
                    item.color === "primary"
                      ? "primary"
                      : item.color === "secondary"
                      ? "primary"
                      : "success"
                  }
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent users */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
        >
          <h2 className="font-headline-lg text-[18px] font-bold text-on-surface mb-lg">
            Inscriptions récentes
          </h2>
          <div className="space-y-sm">
            {recentUsers.map((user, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-md rounded-xl border border-outline-variant hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-md">
                  <Avatar name={user.name} size="sm" />
                  <div>
                    <p className="font-label-md text-label-md font-semibold text-on-surface">
                      {user.name} {user.country}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {user.date} · {user.nclc}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    user.plan === "Premium"
                      ? "primary"
                      : user.plan === "Essentiel"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {user.plan}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
