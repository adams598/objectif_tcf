"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ExamTab } from "@/lib/pricing/constants";
import type { SeriesGroup } from "@/lib/series/build-series-groups";
import { DISCIPLINES } from "@/lib/preparation/constants";
import { useTranslation } from "@/components/providers/locale-provider";

const skillAbbrev: Record<string, string> = {
  COMPREHENSION_ORALE: "CO",
  COMPREHENSION_ECRITE: "CE",
  EXPRESSION_ECRITE: "EE",
  EXPRESSION_ORALE: "EO",
};

interface SeriesGroupCardProps {
  group: SeriesGroup;
  examTab: ExamTab;
  index: number;
  highlightSkill?: string;
}

export function SeriesGroupCard({
  group,
  examTab,
  index,
  highlightSkill,
}: SeriesGroupCardProps) {
  const { t } = useTranslation();
  const locked = group.isLocked;
  const href = locked
    ? `/offres?examen=${examTab}`
    : `/series/${examTab}/${group.order}`;

  const progress =
    group.disciplines.length > 0
      ? (group.completedDisciplines / group.disciplines.length) * 100
      : 0;

  return (
    <Link href={href} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className={cn(
          "relative rounded-2xl border overflow-hidden transition-all duration-200",
          locked
            ? "bg-surface border-outline-variant hover:border-primary/40 hover:shadow-violet-sm"
            : "bg-surface border-outline-variant shadow-violet-sm hover:shadow-violet-md hover:-translate-y-0.5 hover:border-primary/30"
        )}
      >
        <div
          className={cn(
            "h-1.5",
            locked ? "bg-on-surface-variant/30" : "bg-gradient-primary"
          )}
        />

        <div className="p-lg">
          <div className="flex items-start justify-between mb-md">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                locked
                  ? "bg-surface-container text-on-surface-variant"
                  : "bg-primary/10 text-primary"
              )}
            >
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
            <div className="flex flex-wrap gap-xs justify-end">
              {group.isFree && !locked && (
                <Badge variant="outline">{t("common.free")}</Badge>
              )}
              {locked && (
                <Badge variant="outline">
                  <span className="material-symbols-outlined text-[14px] mr-1">
                    lock
                  </span>
                  {t("common.premium")}
                </Badge>
              )}
              {group.completedDisciplines === group.disciplines.length &&
                group.disciplines.length > 0 && (
                  <Badge variant="success">{t("common.completed")}</Badge>
                )}
            </div>
          </div>

          <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs">
            {group.title}
          </h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">
            {t("series.disciplines")} ·{" "}
            {locked ? t("series.subscriptionRequired") : t("series.freeAccess")}
          </p>

          <div className="grid grid-cols-2 gap-xs mb-md">
            {DISCIPLINES.map((discipline) => {
              const entry = group.disciplines.find(
                (d) => d.skill === discipline.skill
              );
              const abbrev = skillAbbrev[discipline.skill] ?? "?";
              const isHighlighted =
                !highlightSkill || highlightSkill === abbrev;
              const done = entry?.completed;

              return (
                <div
                  key={discipline.skill}
                  className={cn(
                    "flex items-center gap-xs rounded-lg px-sm py-xs font-label-sm text-label-sm",
                    !isHighlighted && "opacity-40",
                    done
                      ? "bg-success-container/50 text-success"
                      : locked
                        ? "bg-surface-container text-on-surface-variant"
                        : "bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {done ? "check_circle" : discipline.icon}
                  </span>
                  <span className="truncate">{abbrev}</span>
                </div>
              );
            })}
          </div>

          {!locked && progress > 0 && (
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">
              {t("series.disciplinesProgress", {
                done: group.completedDisciplines,
                total: group.disciplines.length,
              })}
            </p>
          )}

          <div
            className={cn(
              "flex items-center gap-xs font-label-sm text-label-sm font-medium",
              locked ? "text-primary" : "text-primary group-hover:underline"
            )}
          >
            {locked ? (
              <>
                <span className="material-symbols-outlined text-[18px]">lock</span>
                {t("series.subscribeToAccess")}
              </>
            ) : (
              <>
                {t("series.chooseDiscipline")}
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
