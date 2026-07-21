"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";
import { skillAbbrevToLabelKey } from "@/lib/dashboard/competency-analysis";
import { useTranslation } from "@/components/providers/locale-provider";

const PRIORITY_STYLES = {
  high: "border-error/30 bg-error-container/20 text-error",
  medium: "border-tertiary/30 bg-tertiary-container/20 text-tertiary",
  low: "border-outline-variant bg-surface-container-low text-on-surface-variant",
} as const;

export function SkillGapsCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-lg h-64 animate-pulse bg-surface-container" />
    );
  }

  const gaps = data?.skillGaps ?? [];
  const hasGaps = gaps.length > 0;

  return (
    <div className="glass-panel rounded-2xl p-lg">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-md mb-lg">
        <div>
          <h3 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-on-surface">
            {t("dashboardCards.skillGapsTitle")}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            {t("dashboardCards.skillGapsDesc")}
          </p>
        </div>
        {data?.weakestSkill && data.weakestSkillGap > 0 ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-md py-sm shrink-0">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {t("dashboardCards.prioritySkill")}
            </p>
            <p className="font-label-md text-label-md text-primary font-bold">
              {t(`skills.${skillAbbrevToLabelKey(data.weakestSkill)}`)}
            </p>
          </div>
        ) : null}
      </div>

      {!hasGaps ? (
        <EmptyState
          icon="insights"
          title={t("dashboardCards.noSkillGapsTitle")}
          description={t("dashboardCards.noSkillGapsDesc")}
          action={
            <Button asChild size="sm">
              <Link href="/series">{t("dashboardCards.startSeries")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {gaps.map((gap) => (
            <div
              key={gap.subject}
              className={cn(
                "rounded-xl border p-md",
                PRIORITY_STYLES[gap.priority]
              )}
            >
              <div className="flex items-center justify-between gap-sm mb-sm">
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    {gap.subject} — {t(`skills.${skillAbbrevToLabelKey(gap.subject)}`)}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {t("dashboardCards.attemptsCount", { n: gap.attemptsCount })}
                  </p>
                </div>
                <span className="font-label-sm text-label-sm font-bold uppercase">
                  {gap.priority === "high"
                    ? t("dashboardCards.priorityHigh")
                    : gap.priority === "medium"
                      ? t("dashboardCards.priorityMedium")
                      : t("dashboardCards.priorityLow")}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-sm">
                {t("dashboardCards.gapToTarget", {
                  score: gap.score,
                  target: gap.target,
                  gap: gap.gap,
                })}
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/series">{t("dashboardCards.trainSkill")}</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
