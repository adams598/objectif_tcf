"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ExamTab } from "@/lib/pricing/constants";
import type { PublicSeriesGroup } from "@/lib/preparation/demo-series";
import { useTranslation } from "@/components/providers/locale-provider";

interface SeriesListViewProps {
  examTab: ExamTab;
  examLabel: string;
  groups: PublicSeriesGroup[];
  isDemo?: boolean;
}

export function SeriesListView({
  examTab,
  examLabel,
  groups,
  isDemo = false,
}: SeriesListViewProps) {
  const { t } = useTranslation();
  const freeGroups = groups.filter((g) => g.isFree);
  const premiumGroups = groups.filter((g) => !g.isFree);

  return (
    <div className="max-w-container-max mx-auto px-md md:px-lg py-xl md:py-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2xl"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-sm text-label-sm mb-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t("preparation.backHome")}
        </Link>
        <p className="font-label-md text-label-md text-primary mb-sm">
          {t("preparation.freePrep")}
        </p>
        <h1 className="font-display-md text-display-md md:text-display-lg text-on-surface font-bold mb-md">
          {t("preparation.startPrep", { exam: examLabel })}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          {t("preparation.chooseSeries")}
        </p>
        {isDemo && (
          <p className="mt-md font-label-sm text-label-sm text-tertiary bg-tertiary-container inline-block px-md py-xs rounded-full">
            {t("preparation.demoMode")}
          </p>
        )}
      </motion.div>

      {freeGroups.length > 0 && (
        <section className="mb-2xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">lock_open</span>
            {t("preparation.freeSeries")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {freeGroups.map((group, i) => (
              <SeriesGroupCard
                key={group.order}
                group={group}
                examTab={examTab}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {premiumGroups.length > 0 && (
        <section>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-on-surface-variant">
              workspace_premium
            </span>
            {t("preparation.premiumSeries")}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {t("preparation.premiumDescSignup")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {premiumGroups.map((group, i) => (
              <SeriesGroupCard
                key={group.order}
                group={group}
                examTab={examTab}
                index={i}
                locked
              />
            ))}
          </div>
        </section>
      )}

      {groups.length === 0 && (
        <div className="text-center py-2xl bg-surface border border-outline-variant rounded-2xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-md">
            library_books
          </span>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {t("preparation.noSeries")}
          </p>
          <Button asChild className="mt-lg">
            <Link href="/inscription">{t("preparation.createAccountNotify")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function SeriesGroupCard({
  group,
  examTab,
  index,
  locked = false,
}: {
  group: PublicSeriesGroup;
  examTab: ExamTab;
  index: number;
  locked?: boolean;
}) {
  const { t } = useTranslation();
  const href = `/preparation/${examTab}/serie/${group.order}`;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "relative rounded-2xl border p-lg transition-all duration-200",
        locked
          ? "bg-surface-container-low border-outline-variant opacity-75 cursor-not-allowed"
          : "bg-surface border-outline-variant shadow-violet-sm hover:shadow-violet-md hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer"
      )}
    >
      {locked && (
        <span className="absolute top-md right-md material-symbols-outlined text-on-surface-variant text-[20px]">
          lock
        </span>
      )}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-md",
          locked ? "bg-surface-container text-on-surface-variant" : "bg-primary/10 text-primary"
        )}
      >
        <span className="material-symbols-outlined text-[22px]">school</span>
      </div>
      <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs">
        {group.title}
      </h3>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {t("preparation.disciplinesCount", { n: group.disciplines.length })} ·{" "}
        {locked
          ? t("preparation.subscriptionRequired")
          : group.isFree
            ? t("preparation.freeAccess")
            : t("preparation.subscriptionRequired")}
      </p>
      {!locked && (
        <div className="mt-md flex items-center gap-xs text-primary font-label-sm text-label-sm">
          <span>{t("preparation.chooseDiscipline")}</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </div>
      )}
    </motion.div>
  );

  if (locked) {
    return (
      <Link href={`/offres?examen=${examTab}`} className="block">
        {content}
      </Link>
    );
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
