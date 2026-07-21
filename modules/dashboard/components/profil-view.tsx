"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useTranslation } from "@/components/providers/locale-provider";
import { fetchJson } from "@/lib/api/fetch-json";
import {
  IMMIGRATION_LABELS,
  TARGET_COUNTRY_LABELS,
} from "@/lib/user/profile";
import { nclcLevelToNumber } from "@/lib/dashboard/stats";

interface ResultAttempt {
  id: string;
  percentage: number | null;
  nclcLevel: string | null;
  completedAt: string | null;
  durationSec: number | null;
  series: { title: string; skill: string };
}

interface ResultsResponse {
  attempts: ResultAttempt[];
  skillStats: Array<{ skill: string; average: number; count: number }>;
}

const SKILL_KEYS = [
  { skill: "COMPREHENSION_ORALE", key: "co" as const },
  { skill: "COMPREHENSION_ECRITE", key: "ce" as const },
  { skill: "EXPRESSION_ECRITE", key: "ee" as const },
  { skill: "EXPRESSION_ORALE", key: "eo" as const },
];

function formatNclc(level: string | null | undefined): string {
  if (!level) return "—";
  const n = nclcLevelToNumber(level as never);
  return n > 0 ? `NCLC ${n}` : "—";
}

export function ProfilView() {
  const { t, locale } = useTranslation();
  const { profile, displayName, avatarUrl, isLoading, currentStreak, createdAt } =
    useCurrentUser();

  const resultsQuery = useQuery({
    queryKey: ["resultats"],
    queryFn: () => fetchJson<ResultsResponse>("/api/resultats"),
  });

  const attempts = resultsQuery.data?.attempts ?? [];
  const skillStats = resultsQuery.data?.skillStats ?? [];

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString(locale, {
        month: "short",
        year: "numeric",
      })
    : null;

  const objectiveLabel = profile?.immigrationObjective
    ? IMMIGRATION_LABELS[profile.immigrationObjective]
    : null;
  const countryLabel = profile?.targetCountry
    ? TARGET_COUNTRY_LABELS[profile.targetCountry] ?? profile.targetCountry
    : null;

  const avgScore = useMemo(() => {
    if (!attempts.length) return "—";
    const sum = attempts.reduce((a, b) => a + (b.percentage ?? 0), 0);
    return `${Math.round(sum / attempts.length)}%`;
  }, [attempts]);

  const stats = [
    {
      labelKey: "profile.examsCompleted" as const,
      value: String(attempts.length),
      icon: "assignment_turned_in",
    },
    { labelKey: "profile.averageScore" as const, value: avgScore, icon: "analytics" },
    {
      labelKey: "profile.streakDays" as const,
      value: String(currentStreak),
      icon: "local_fire_department",
    },
    {
      labelKey: "profile.studyTime" as const,
      value: profile ? `${Math.floor(profile.totalStudyTime / 60)}h` : "—",
      icon: "schedule",
    },
  ];

  const skillProgress = SKILL_KEYS.map(({ skill, key }) => {
    const stat = skillStats.find((s) => s.skill === skill);
    const progress = stat ? Math.min(100, stat.average) : 0;
    const nclc = stat
      ? `NCLC ${Math.min(12, Math.max(1, Math.round(stat.average / 10)))}`
      : "—";
    return { key, progress, nclc };
  });

  const skillBadges = skillProgress
    .filter((s) => s.progress > 0)
    .map((s) => ({
      label: `${s.key.toUpperCase()} ${s.nclc}`,
      level: s.nclc,
      isPrimary: s.progress >= 70,
    }));

  return (
    <div className="flex flex-col gap-xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-primary to-primary-container rounded-2xl p-xl text-on-primary overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-lg relative z-10">
          <Avatar
            src={avatarUrl}
            name={displayName || t("profile.title")}
            size="xl"
            className="w-24 h-24 text-3xl border-4 border-on-primary/30"
          />
          <div className="flex-1">
            <h1 className="font-display-md text-[28px] font-bold text-on-primary mb-xs">
              {isLoading ? t("profile.loading") : displayName || t("profile.title")}
            </h1>
            <p className="font-body-md text-on-primary/70 mb-md">
              {objectiveLabel && countryLabel
                ? `${objectiveLabel} · ${countryLabel}`
                : objectiveLabel ?? countryLabel ?? t("profile.tagline")}
              {memberSince && ` · ${t("profile.memberSince")} ${memberSince}`}
            </p>
            {skillBadges.length > 0 && (
              <div className="flex flex-wrap gap-sm">
                {skillBadges.map((badge) => (
                  <span
                    key={badge.label}
                    className="px-sm py-xs bg-on-primary/20 text-on-primary rounded-full font-label-sm border border-on-primary/30"
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button asChild variant="secondary" size="default">
            <Link href="/parametres">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              {t("profile.editProfile")}
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.labelKey}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm flex flex-col items-center text-center"
          >
            <span className="material-symbols-outlined text-[28px] text-primary mb-sm">
              {stat.icon}
            </span>
            <div className="font-display-md text-[24px] font-bold">{stat.value}</div>
            <div className="font-label-sm text-on-surface-variant">{t(stat.labelKey)}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm">
        <h2 className="font-headline-lg text-[20px] font-bold mb-lg">
          {t("profile.skillProgress")}
        </h2>
        <div className="space-y-md">
          {skillProgress.map((skill) => (
            <div key={skill.key}>
              <div className="flex justify-between mb-1">
                <span className="font-label-md">{t(`skills.${skill.key}`)}</span>
                <span className="font-label-sm text-primary font-bold">{skill.nclc}</span>
              </div>
              <Progress value={skill.progress} size="default" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm">
        <h2 className="font-headline-lg text-[20px] font-bold mb-lg">
          {t("profile.examHistory")}
        </h2>
        {resultsQuery.isLoading ? (
          <p className="text-on-surface-variant animate-pulse">{t("common.loading")}</p>
        ) : attempts.length === 0 ? (
          <p className="text-on-surface-variant">{t("results.noResults")}</p>
        ) : (
          <div className="space-y-sm">
            {attempts.slice(0, 10).map((exam) => {
              const passed = (exam.percentage ?? 0) >= 50;
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-md rounded-xl border border-outline-variant"
                >
                  <div className="flex items-center gap-md">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        passed ? "bg-success-container text-success" : "bg-error-container text-error"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {passed ? "check" : "close"}
                      </span>
                    </div>
                    <div>
                      <div className="font-label-md font-semibold">{exam.series.title}</div>
                      <div className="font-label-sm text-on-surface-variant">
                        {exam.completedAt
                          ? new Date(exam.completedAt).toLocaleDateString("fr-FR")
                          : "—"}
                        {exam.durationSec
                          ? ` · ${Math.floor(exam.durationSec / 60)} min`
                          : ""}
                      </div>
                    </div>
                  </div>
                  <Badge variant={passed ? "default" : "error"}>
                    {formatNclc(exam.nclcLevel)}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
