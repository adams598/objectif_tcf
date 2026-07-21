"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { DashboardStats } from "@/lib/dashboard/types";

export const DASHBOARD_STATS_QUERY_KEY = ["dashboard-stats"] as const;

export function useDashboardStats<T = DashboardStats>(
  select?: (data: DashboardStats) => T
) {
  return useQuery({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: () => fetchJson<DashboardStats>("/api/tableau-de-bord"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    select,
  });
}
