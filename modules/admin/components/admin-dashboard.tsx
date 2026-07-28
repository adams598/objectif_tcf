"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchJson } from "@/lib/api/fetch-json";
import { AdminSystemStatusPanel } from "@/modules/admin/components/admin-system-status-panel";
import {
  AdminAnalyticsCharts,
  type AdminAnalyticsData,
} from "@/modules/admin/components/admin-analytics-charts";
import { ALL_EXAM_TYPES, EXAM_TYPE_LABELS } from "@/lib/exams/catalog";

export function AdminDashboard() {
  const [examType, setExamType] = useState<string>("ALL");
  const [months, setMonths] = useState(6);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-analytics", examType, months],
    queryFn: () => {
      const params = new URLSearchParams({ months: String(months) });
      if (examType !== "ALL") params.set("examType", examType);
      return fetchJson<AdminAnalyticsData & { filters: { examType: string | null; months: number } }>(
        `/api/admin/analytics?${params}`
      );
    },
  });

  return (
    <div className="flex flex-col gap-xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          Vue d&apos;ensemble
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Statistiques utilisateurs, abonnements, examens et paiements
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-sm">
        <select
          className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
        >
          <option value="ALL">Tous les examens</option>
          {ALL_EXAM_TYPES.map((type) => (
            <option key={type} value={type}>
              {EXAM_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value, 10))}
        >
          <option value={3}>3 derniers mois</option>
          <option value={6}>6 derniers mois</option>
          <option value={12}>12 derniers mois</option>
        </select>
      </div>

      <AdminSystemStatusPanel />

      {isLoading ? (
        <div className="p-xl text-center text-on-surface-variant animate-pulse">
          Chargement des statistiques…
        </div>
      ) : isError ? (
        <div className="p-xl text-center text-error rounded-2xl border border-error/30 bg-error/5">
          Impossible de charger les statistiques
          {error instanceof Error ? ` : ${error.message}` : ""}
        </div>
      ) : data ? (
        <AdminAnalyticsCharts data={data} />
      ) : null}
    </div>
  );
}
