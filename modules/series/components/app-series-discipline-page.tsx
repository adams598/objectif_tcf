"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchJson } from "@/lib/api/fetch-json";
import type { ExamTab } from "@/lib/pricing/constants";
import {
  DISCIPLINES,
  getExamLabel,
  SKILL_TO_DISCIPLINE,
} from "@/lib/preparation/constants";
import { getDemoSeriesGroups } from "@/lib/preparation/demo-series";
import { demoGroupsToSeriesGroups } from "@/lib/series/demo-groups";
import type { SeriesGroup } from "@/lib/series/build-series-groups";
import type { Skill } from "@prisma/client";
import { useTranslation } from "@/components/providers/locale-provider";

interface AppSeriesDisciplinePageProps {
  examTab: ExamTab;
  groupOrder: number;
}

export function AppSeriesDisciplinePage({
  examTab,
  groupOrder,
}: AppSeriesDisciplinePageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = useState<{
    seriesId: string;
    skill: Skill;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["series", examTab],
    queryFn: () =>
      fetchJson<{ groups: SeriesGroup[] }>(
        `/api/series?examen=${examTab}`
      ),
  });

  const groups =
    data?.groups && data.groups.length > 0
      ? data.groups
      : demoGroupsToSeriesGroups(getDemoSeriesGroups(examTab));

  const group = groups.find((g) => g.order === groupOrder);

  useEffect(() => {
    if (!isLoading && group?.isLocked) {
      router.replace(`/offres?examen=${examTab}`);
    }
  }, [isLoading, group?.isLocked, examTab, router]);

  const disciplineBySkill = Object.fromEntries(
    (group?.disciplines ?? []).map((d) => [d.skill, d])
  );

  const pendingDiscipline = pending
    ? SKILL_TO_DISCIPLINE[pending.skill]
    : null;

  const handleConfirm = () => {
    if (!pending) return;
    router.push(`/examen/serie/${pending.seriesId}`);
  };

  const formatUnit = (questionCount: number | null | undefined, fallback: string) => {
    if (questionCount == null) return fallback;
    return questionCount <= 5
      ? t("discipline.tasksCount", { n: questionCount })
      : t("discipline.questionsCount", { n: questionCount });
  };

  if (!isLoading && !group) {
    return (
      <div className="flex flex-col items-center gap-md py-2xl">
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("preparation.seriesNotFound")}
        </p>
        <Button asChild>
          <Link href="/series">{t("preparation.backToSeries")}</Link>
        </Button>
      </div>
    );
  }

  if (group?.isLocked) {
    return (
      <div className="py-2xl text-center font-body-md text-body-md text-on-surface-variant">
        {t("preparation.redirectOffers")}
      </div>
    );
  }

  if (isLoading || !group) {
    return (
      <div className="py-2xl">
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

  return (
    <div className="flex flex-col gap-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          href="/series"
          className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-sm text-label-sm mb-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("discipline.backSeries")}
        </Link>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-md">
          {group.title} — {getExamLabel(examTab)}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          {t("discipline.chooseForSeries")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md max-w-5xl">
        {DISCIPLINES.map((discipline, i) => {
          const entry = disciplineBySkill[discipline.skill];
          const isLocked = entry?.isLocked ?? true;
          const duration = entry?.durationMin ?? discipline.durationMin;
          const unit = formatUnit(entry?.questionCount, discipline.unitLabel);

          return (
            <motion.button
              key={discipline.skill}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              disabled={isLocked || !entry}
              onClick={() =>
                entry &&
                setPending({ seriesId: entry.seriesId, skill: discipline.skill })
              }
              className={cn(
                "text-left rounded-2xl border p-lg transition-all duration-200 flex flex-col gap-md",
                isLocked || !entry
                  ? "bg-surface-container-low border-outline-variant opacity-60 cursor-not-allowed"
                  : "bg-surface border-outline-variant shadow-violet-sm hover:shadow-violet-md hover:-translate-y-0.5 hover:border-primary/40"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[26px]">
                    {discipline.icon}
                  </span>
                </div>
                {entry?.completed && (
                  <span className="material-symbols-outlined text-success text-[20px]">
                    check_circle
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-sm">
                  {discipline.label}
                </h3>
                <div className="flex flex-col gap-xs font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">
                      schedule
                    </span>
                    {t("discipline.minutes", { n: duration })}
                  </span>
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">
                      quiz
                    </span>
                    {unit}
                  </span>
                  {entry?.score !== undefined && (
                    <span className="text-primary font-bold">
                      {t("discipline.bestScore", { score: entry.score })}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("preparation.startTestTitle")}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-md pt-sm">
                {pendingDiscipline && (
                  <>
                    <p>
                      {t("preparation.startTestDesc", {
                        discipline: pendingDiscipline.label,
                        exam: getExamLabel(examTab),
                        min: pendingDiscipline.durationMin,
                      })}
                    </p>
                    <p className="font-label-sm text-label-sm">
                      {pendingDiscipline.description}
                    </p>
                    <p className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wide">
                      {t("preparation.startTestConfirm")}
                    </p>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {t("discipline.cancel")}
            </Button>
            <Button onClick={handleConfirm}>
              {t("discipline.startExam")}
              <span className="material-symbols-outlined text-[18px]">
                play_arrow
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
