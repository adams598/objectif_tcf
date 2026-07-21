"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { fetchJson } from "@/lib/api/fetch-json";
import type { ExamTab } from "@/lib/pricing/constants";
import { getExamTypeFromTab, getExamLabel } from "@/lib/preparation/constants";
import {
  getDemoSeriesGroups,
  type PublicSeriesGroup,
} from "@/lib/preparation/demo-series";
import { DisciplinePicker } from "./discipline-picker";

interface PreparationDisciplinePageProps {
  examTab: ExamTab;
  groupOrder: number;
}

export function PreparationDisciplinePage({
  examTab,
  groupOrder,
}: PreparationDisciplinePageProps) {
  const examType = getExamTypeFromTab(examTab);

  const { data, isLoading } = useQuery({
    queryKey: ["series-public", examType],
    queryFn: () =>
      fetchJson<{ groups: PublicSeriesGroup[] }>(
        `/api/series/public?examType=${examType}`
      ),
  });

  const groups =
    data?.groups && data.groups.length > 0
      ? data.groups
      : getDemoSeriesGroups(examTab);

  const group = groups.find((g) => g.order === groupOrder);

  if (!isLoading && !group) {
    notFound();
  }

  if (isLoading || !group) {
    return (
      <div className="max-w-container-max mx-auto px-md py-2xl">
        <div className="h-8 w-96 bg-surface-container rounded-lg animate-pulse mb-xl mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md max-w-5xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-surface-container rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!group.isFree) {
    notFound();
  }

  return (
    <DisciplinePicker
      examTab={examTab}
      examLabel={getExamLabel(examTab)}
      group={group}
    />
  );
}
