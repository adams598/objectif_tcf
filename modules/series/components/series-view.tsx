"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import type { ExamType } from "@prisma/client";
import type { SeriesGroup } from "@/lib/series/build-series-groups";
import { EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
import { getDemoSeriesGroups } from "@/lib/preparation/demo-series";
import { demoGroupsToSeriesGroups } from "@/lib/series/demo-groups";
import { SeriesGroupCard } from "./series-group-card";
import { useTranslation } from "@/components/providers/locale-provider";

interface PublicExam {
  id: string;
  type: ExamType;
  title: string;
  slug: string;
  typeLabel: string;
}

type SkillFilter = "CO" | "CE" | "EE" | "EO" | "Tous";

interface Entitlement {
  examType: ExamType;
  expiresAt: string;
  plan: string;
}

const filters: SkillFilter[] = ["Tous", "CO", "CE", "EE", "EO"];

const skillToFilterAbbrev: Record<string, SkillFilter | undefined> = {
  COMPREHENSION_ORALE: "CO",
  COMPREHENSION_ECRITE: "CE",
  EXPRESSION_ECRITE: "EE",
  EXPRESSION_ORALE: "EO",
};

export function SeriesView() {
  const { t } = useTranslation();
  const [activeExamSlug, setActiveExamSlug] = useState("tcf");
  const [activeFilter, setActiveFilter] = useState<SkillFilter>("Tous");
  const [search, setSearch] = useState("");

  const examsQuery = useQuery({
    queryKey: ["public-exams"],
    queryFn: () => fetchJson<PublicExam[]>("/api/exams"),
  });

  const examTabs = useMemo(() => {
    const seen = new Set<ExamType>();
    return (examsQuery.data ?? []).filter((exam) => {
      if (seen.has(exam.type)) return false;
      seen.add(exam.type);
      return true;
    });
  }, [examsQuery.data]);

  useEffect(() => {
    if (examTabs.length > 0 && !examTabs.some((e) => e.slug === activeExamSlug)) {
      setActiveExamSlug(examTabs[0].slug);
    }
  }, [examTabs, activeExamSlug]);

  const activeExamType =
    examTabs.find((e) => e.slug === activeExamSlug)?.type ?? "TCF_CANADA";

  const { data, isLoading } = useQuery({
    queryKey: ["series", activeExamSlug],
    queryFn: () =>
      fetchJson<{
        groups: SeriesGroup[];
        entitlements: Entitlement[];
        skillReadiness?: Record<string, number>;
      }>(`/api/series?examen=${activeExamSlug}`),
  });

  const skillReadiness = data?.skillReadiness;

  const groups = useMemo(() => {
    if (data?.groups && data.groups.length > 0) {
      return data.groups;
    }
    return demoGroupsToSeriesGroups(getDemoSeriesGroups(activeExamSlug as "tcf"));
  }, [data?.groups, activeExamSlug]);

  const hasEntitlementForTab = useMemo(
    () => (data?.entitlements ?? []).some((e) => e.examType === activeExamType),
    [data?.entitlements, activeExamType]
  );

  const freeGroups = groups.filter((g) => g.isFree);
  const premiumGroups = groups.filter((g) => !g.isFree);

  const filterGroup = (group: SeriesGroup) => {
    const matchSearch =
      !search || group.title.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === "Tous") return true;
    return group.disciplines.some(
      (d) => skillToFilterAbbrev[d.skill] === activeFilter
    );
  };

  const filteredFree = freeGroups.filter(filterGroup);
  const filteredPremium = premiumGroups.filter(filterGroup);
  const totalGroups = groups.length;
  const completedGroups = groups.filter(
    (g) =>
      g.disciplines.length > 0 &&
      g.completedDisciplines === g.disciplines.length
  ).length;

  const activeExamLabel =
    examTabs.find((e) => e.slug === activeExamSlug)?.typeLabel ??
    EXAM_TYPE_LABELS[activeExamType];

  const skillLabels: Record<SkillFilter, string> = {
    Tous: t("common.all"),
    CO: t("series.skillCo"),
    CE: t("series.skillCe"),
    EE: t("series.skillEe"),
    EO: t("series.skillEo"),
  };

  return (
    <div className="flex flex-col gap-xl min-w-0 w-full max-w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-md min-w-0"
      >
        <div className="min-w-0">
          <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
            {t("series.title")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant break-words">
            {t("series.completed", { done: completedGroups, total: totalGroups })} ·{" "}
            {t("series.freeCount", { count: freeGroups.length })} ·{" "}
            {t("series.premiumCount", { count: premiumGroups.length })}
          </p>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-sm min-w-0">
        {(examTabs.length > 0
          ? examTabs
          : [
              { slug: "tcf", typeLabel: "TCF Canada", type: "TCF_CANADA" as ExamType },
              { slug: "tef", typeLabel: "TEF Canada", type: "TEF_CANADA" as ExamType },
              { slug: "ielts", typeLabel: "IELTS", type: "IELTS" as ExamType },
            ]
        ).map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActiveExamSlug(tab.slug)}
            className={cn(
              "px-md sm:px-lg py-sm rounded-full font-label-md text-label-md border transition-all max-w-full",
              activeExamSlug === tab.slug
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant text-on-surface-variant hover:border-primary"
            )}
          >
            {tab.typeLabel}
          </button>
        ))}
      </div>

      {!hasEntitlementForTab && premiumGroups.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-md py-sm flex flex-col sm:flex-row sm:items-center justify-between gap-sm min-w-0">
          <p className="font-body-md text-body-md text-on-surface break-words min-w-0">
            {t("series.subscribeBanner", {
              free: freeGroups.length,
              exam: activeExamLabel,
            })}
          </p>
          <Button asChild size="sm" className="shrink-0 w-full sm:w-auto">
            <Link href={`/offres?examen=${activeExamSlug}`}>{t("series.viewOffers")}</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-md min-w-0">
        <div className="flex items-center gap-sm bg-surface border border-outline-variant rounded-xl px-md py-sm w-full min-w-0">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
            search
          </span>
          <input
            className="flex-1 min-w-0 outline-none bg-transparent font-body-md text-body-md placeholder:text-on-surface-variant/50"
            placeholder={t("series.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-sm min-w-0">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-md py-xs rounded-full font-label-sm text-label-sm transition-all max-w-full",
                activeFilter === f
                  ? "bg-primary text-on-primary shadow-violet-sm"
                  : "bg-surface border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
              )}
            >
              <span className="sm:hidden">{f === "Tous" ? skillLabels.Tous : f}</span>
              <span className="hidden sm:inline">{skillLabels[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface rounded-2xl border border-outline-variant h-72 animate-pulse"
            />
          ))}
        </div>
      ) : filteredFree.length === 0 && filteredPremium.length === 0 ? (
        <EmptyState
          icon="library_books"
          title={t("series.noResults")}
          description={t("series.noResultsDesc")}
        />
      ) : (
        <div className="flex flex-col gap-2xl">
          {filteredFree.length > 0 && (
            <section className="min-w-0">
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mb-md flex items-center gap-sm min-w-0">
                <span className="material-symbols-outlined text-primary shrink-0">
                  lock_open
                </span>
                {t("series.freeSection")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md min-w-0">
                {filteredFree.map((group, i) => (
                  <SeriesGroupCard
                    key={group.order}
                    group={group}
                    examTab={activeExamSlug as "tcf"}
                    index={i}
                    highlightSkill={
                      activeFilter === "Tous" ? undefined : activeFilter
                    }
                    skillReadiness={skillReadiness}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredPremium.length > 0 && (
            <section className="min-w-0">
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-on-surface-variant shrink-0">
                  workspace_premium
                </span>
                {t("series.premiumSection")}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg break-words">
                {t("series.premiumHint")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md min-w-0">
                {filteredPremium.map((group, i) => (
                  <SeriesGroupCard
                    key={group.order}
                    group={group}
                    examTab={activeExamSlug as "tcf"}
                    index={i}
                    highlightSkill={
                      activeFilter === "Tous" ? undefined : activeFilter
                    }
                    skillReadiness={skillReadiness}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
