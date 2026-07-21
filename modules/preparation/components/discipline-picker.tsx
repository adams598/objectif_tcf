"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import type { ExamTab } from "@/lib/pricing/constants";
import {
  DISCIPLINES,
  SKILL_TO_DISCIPLINE,
} from "@/lib/preparation/constants";
import type { PublicSeriesGroup } from "@/lib/preparation/demo-series";
import type { Skill } from "@prisma/client";
import { useTranslation } from "@/components/providers/locale-provider";

interface DisciplinePickerProps {
  examTab: ExamTab;
  examLabel: string;
  group: PublicSeriesGroup;
}

export function DisciplinePicker({
  examTab,
  examLabel,
  group,
}: DisciplinePickerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = useState<{
    seriesId: string;
    skill: Skill;
  } | null>(null);

  const disciplineBySkill = Object.fromEntries(
    group.disciplines.map((d) => [d.skill, d])
  );

  const pendingDiscipline = pending
    ? SKILL_TO_DISCIPLINE[pending.skill]
    : null;

  const handleConfirm = () => {
    if (!pending) return;
    router.push(`/preparation/examen/${pending.seriesId}?examen=${examTab}`);
  };

  const formatUnit = (questionCount: number | null | undefined, fallback: string) => {
    if (questionCount == null) return fallback;
    return questionCount <= 5
      ? t("discipline.tasksCount", { n: questionCount })
      : t("discipline.questionsCount", { n: questionCount });
  };

  return (
    <div className="max-w-container-max mx-auto px-md md:px-lg py-xl md:py-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2xl"
      >
        <Link
          href={`/preparation/${examTab}`}
          className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-sm text-label-sm mb-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("preparation.backToSeries")}
        </Link>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-md">
          {group.title} — {examLabel}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          {t("preparation.chooseDisciplineStart")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md max-w-5xl mx-auto">
        {DISCIPLINES.map((discipline, i) => {
          const entry = disciplineBySkill[discipline.skill];
          const isLocked = !entry?.isFree;
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
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    isLocked
                      ? "bg-surface-container text-on-surface-variant"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-[26px]">
                    {discipline.icon}
                  </span>
                </div>
                {isLocked && (
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                    lock
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
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {group.isFree && (
        <p className="text-center mt-xl font-label-sm text-label-sm text-on-surface-variant">
          {t("auth.noAccount")}{" "}
          <Link href="/inscription" className="text-primary font-bold hover:underline">
            {t("preparation.signupLink")}
          </Link>{" "}
          {t("preparation.signupSaveSuffix")}
        </p>
      )}

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
                        exam: examLabel,
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
