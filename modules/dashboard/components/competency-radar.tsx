"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";
import { useTranslation } from "@/components/providers/locale-provider";

const CompetencyRadarChart = dynamic(
  () =>
    import("./competency-radar-chart").then((mod) => mod.CompetencyRadarChart),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full animate-pulse bg-surface-container rounded-xl" />
    ),
  }
);

const SKILL_KEY_MAP: Record<string, "co" | "ce" | "ee" | "eo"> = {
  CO: "co",
  CE: "ce",
  EE: "ee",
  EO: "eo",
};

export function CompetencyRadar() {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-lg h-80 animate-pulse bg-surface-container" />
    );
  }

  const competencies = data?.competencies ?? [];
  const globalNclc = data?.globalNclc ?? 0;
  const progressPercent = data?.progressPercent ?? 0;
  const targetNclc = data?.targetNclc ?? 9;
  const hasScores = competencies.some((item) => item.score > 0);

  const skillLabel = (subject: string) => {
    const key = SKILL_KEY_MAP[subject];
    return key ? t(`skills.${key}`) : subject;
  };

  return (
    <div className="glass-panel rounded-2xl p-lg flex flex-col lg:flex-row gap-xl items-center relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-container opacity-20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 w-full flex flex-col gap-md z-10">
        <h3 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-on-surface">
          {t("dashboardCards.competencyProfile")}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("dashboardCards.competencyDesc", { nclc: targetNclc })}
        </p>

        <div className="flex items-end gap-sm mt-md">
          <span className="font-display-lg text-display-lg text-primary leading-none">
            {hasScores ? globalNclc : "—"}
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-widest">
            {t("dashboardCards.globalNclc")}
          </span>
        </div>

        <div className="mt-sm">
          <Progress
            value={progressPercent}
            showLabel
            label={t("dashboardCards.progressTowardNclc", { nclc: targetNclc })}
            size="default"
          />
        </div>

        {!hasScores ? (
          <EmptyState
            icon="radar"
            title={t("dashboardCards.noCompetency")}
            description={t("dashboardCards.noCompetencyDesc")}
            className="mt-md py-lg"
          />
        ) : (
          <div className="grid grid-cols-2 gap-sm mt-md">
            {competencies.map((item) => (
              <div
                key={item.subject}
                className="bg-surface rounded-xl p-sm border border-outline-variant/50"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {item.subject}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    {item.score > 0 ? `${item.score}/12` : "—"}
                  </span>
                </div>
                <p className="font-label-sm text-[10px] text-on-surface-variant">
                  {skillLabel(item.subject)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-[280px] aspect-square relative z-10 bg-surface rounded-xl p-md border border-outline-variant shadow-sm flex items-center justify-center">
        {hasScores ? (
          <CompetencyRadarChart
            competencies={competencies}
            notEvaluatedLabel={t("dashboardCards.notEvaluated")}
            currentLevelLabel={t("dashboardCards.currentLevel")}
            targetLabel={t("dashboardCards.target")}
          />
        ) : (
          <div className="text-center px-md">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">
              radar
            </span>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
              {t("dashboardCards.chartAfterFirstEval")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
