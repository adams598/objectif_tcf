"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/providers/locale-provider";
import { fetchJson } from "@/lib/api/fetch-json";
import {
  AdminAnalyticsCharts,
  type AdminAnalyticsData,
} from "@/modules/admin/components/admin-analytics-charts";
import {
  AdminAnalyticsFilters,
  buildAnalyticsQueryParams,
  defaultAnalyticsFilters,
  type AnalyticsFilterOptions,
  type AnalyticsFilterState,
} from "@/modules/admin/components/admin-analytics-filters";

type AnalyticsResponse = AdminAnalyticsData & {
  filters: Record<string, unknown>;
  filterOptions: AnalyticsFilterOptions;
};

const FALLBACK_OPTIONS: AnalyticsFilterOptions = {
  countries: [],
  paymentMethods: [],
  genders: [],
  hasGenderData: false,
  hasAgeData: false,
  years: [new Date().getFullYear()],
  currentYear: new Date().getFullYear(),
};

export function AdminDashboard() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AnalyticsFilterState>(() =>
    defaultAnalyticsFilters(new Date().getFullYear())
  );

  const queryParams = useMemo(
    () => buildAnalyticsQueryParams(filters),
    [filters]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-analytics", queryParams.toString()],
    queryFn: () =>
      fetchJson<AnalyticsResponse>(
        `/api/admin/analytics?${queryParams.toString()}`
      ),
  });

  const filterOptions = data?.filterOptions ?? FALLBACK_OPTIONS;

  const patchFilters = (patch: Partial<AnalyticsFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="flex flex-col gap-xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          {t("admin.overviewTitle")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("admin.overviewSubtitle")}
        </p>
      </motion.div>

      <AdminAnalyticsFilters
        filters={filters}
        options={filterOptions}
        onChange={patchFilters}
      />

      {isLoading ? (
        <div className="p-xl text-center text-on-surface-variant animate-pulse">
          {t("admin.overviewLoading")}
        </div>
      ) : isError ? (
        <div className="p-xl text-center text-error rounded-2xl border border-error/30 bg-error/5">
          {t("admin.overviewError")}
          {error instanceof Error ? ` : ${error.message}` : ""}
        </div>
      ) : data ? (
        <AdminAnalyticsCharts data={data} />
      ) : null}
    </div>
  );
}
