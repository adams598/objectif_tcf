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
    <Link href={href} className="block group min-w-0 w-full max-w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className={cn(
          "relative rounded-2xl border overflow-hidden transition-all duration-200 w-full max-w-full",
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

        <div className="p-md sm:p-lg min-w-0">
          <div className="flex items-start justify-between gap-sm mb-md min-w-0">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                locked
                  ? "bg-surface-container text-on-surface-variant"
                  : "bg-primary/10 text-primary"
              )}
            >
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
            <div className="flex flex-wrap gap-xs justify-end min-w-0">
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

          <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs break-words">
            {group.title}
          </h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-md break-words">
            {t("series.disciplines")} ·{" "}
            {locked
              ? t("series.subscriptionRequired")
              : group.isFree
                ? t("series.freeAccess")
                : t("series.premiumAccess")}
          </p>

          <div className="grid grid-cols-2 gap-xs mb-md min-w-0">
            {DISCIPLINES.map((discipline) => {
              const entry = group.disciplines.find(
                (d) => d.skill === discipline.skill
              );
              const abbrev = skillAbbrev[discipline.skill] ?? "?";
              const isHighlighted =
                !highlightSkill || highlightSkill === abbrev;
              const done = entry?.completed;
              const partial = entry?.partial;

              return (
                <div
                  key={discipline.skill}
                  className={cn(
                    "flex items-center gap-xs rounded-lg px-sm py-xs font-label-sm text-label-sm min-w-0",
                    !isHighlighted && "opacity-40",
                    done
                      ? "bg-success-container/50 text-success"
                      : partial
                        ? "bg-tertiary-container/40 text-tertiary"
                        : locked
                          ? "bg-surface-container text-on-surface-variant"
                          : "bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">
                    {done
                      ? "check_circle"
                      : partial
                        ? "timelapse"
                        : discipline.icon}
                  </span>
                  <span className="truncate">{abbrev}</span>
                </div>
              );
            })}
          </div>

          {!locked && (progress > 0 || group.partialDisciplines > 0) && (
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs break-words">
              {t("series.disciplinesProgress", {
                done: group.completedDisciplines,
                total: group.disciplines.length,
              })}
              {group.partialDisciplines > 0
                ? ` · ${t("series.partialCount", {
                    count: group.partialDisciplines,
                  })}`
                : ""}
            </p>
          )}

          {!locked && group.lastOpenedAt && (
            <p className="font-label-sm text-[11px] text-on-surface-variant/80 mb-md break-words">
              {t("series.lastOpened", {
                date: new Date(group.lastOpenedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              })}
            </p>
          )}

          <div
            className={cn(
              "flex items-center gap-xs font-label-sm text-label-sm font-medium min-w-0",
              locked ? "text-primary" : "text-primary group-hover:underline"
            )}
          >
            {locked ? (
              <>
                <span className="material-symbols-outlined text-[18px] shrink-0">lock</span>
                <span className="break-words">{t("series.subscribeToAccess")}</span>
              </>
            ) : (
              <>
                <span className="break-words">{t("series.chooseDiscipline")}</span>
                <span className="material-symbols-outlined text-[18px] shrink-0">
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
