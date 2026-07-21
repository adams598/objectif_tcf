"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { ExamTab } from "@/lib/pricing/constants";
import { getExamTypeFromTab, getExamLabel } from "@/lib/preparation/constants";
import { getDemoSeriesGroups } from "@/lib/preparation/demo-series";
import type { PublicSeriesGroup } from "@/lib/preparation/demo-series";
import { SeriesListView } from "./series-list-view";

interface PreparationSeriesPageProps {
  examTab: ExamTab;
}

export function PreparationSeriesPage({ examTab }: PreparationSeriesPageProps) {
  const examType = getExamTypeFromTab(examTab);

  const { data, isLoading } = useQuery({
    queryKey: ["series-public", examType],
    queryFn: () =>
      fetchJson<{ groups: PublicSeriesGroup[]; series: unknown[] }>(
        `/api/series/public?examType=${examType}`
      ),
  });

  const groups =
    data?.groups && data.groups.length > 0
      ? data.groups
      : getDemoSeriesGroups(examTab);

  const isDemo = !data?.groups?.length;

  if (isLoading) {
    return (
      <div className="max-w-container-max mx-auto px-md py-2xl">
        <div className="h-8 w-64 bg-surface-container rounded-lg animate-pulse mb-xl mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 bg-surface-container rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <SeriesListView
      examTab={examTab}
      examLabel={getExamLabel(examTab)}
      groups={groups}
      isDemo={isDemo}
    />
  );
}
