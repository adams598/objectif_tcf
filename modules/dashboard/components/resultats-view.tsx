"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/components/providers/locale-provider";
import { fetchJson } from "@/lib/api/fetch-json";
import {
  buildExamResultReport,
  downloadExamResultReport,
} from "@/lib/examen/download-result";
import type { SkillAbbrev } from "@/lib/examen/scoring";
import { nclcLevelToNumber } from "@/lib/dashboard/stats";

interface ResultAttempt {
  id: string;
  score: number | null;
  percentage: number | null;
  nclcLevel: string | null;
  completedAt: string | null;
  series: { title: string; skill: string; difficulty: string };
  answers: Array<{
    correction: { score: number | null; feedback: string | null; status: string } | null;
  }>;
}

interface ResultsResponse {
  attempts: ResultAttempt[];
  skillStats: Array<{ skill: string; average: number; count: number }>;
}

const SKILL_ABBREV: Record<string, string> = {
  COMPREHENSION_ORALE: "CO",
  COMPREHENSION_ECRITE: "CE",
  EXPRESSION_ECRITE: "EE",
  EXPRESSION_ORALE: "EO",
};

const SKILL_LABEL_KEYS: Record<string, "results.skillCo" | "results.skillCe" | "results.skillEe" | "results.skillEo"> = {
  COMPREHENSION_ORALE: "results.skillCo",
  COMPREHENSION_ECRITE: "results.skillCe",
  EXPRESSION_ECRITE: "results.skillEe",
  EXPRESSION_ORALE: "results.skillEo",
};

function formatNclc(level: string | null | undefined): string {
  if (!level) return "—";
  const n = nclcLevelToNumber(level as never);
  return n > 0 ? `NCLC ${n}` : "—";
}

export function ResultatsView() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["resultats"],
    queryFn: () => fetchJson<ResultsResponse>("/api/resultats"),
  });

  const latest = data?.attempts[0];
  const globalNclc = latest ? formatNclc(latest.nclcLevel) : "—";
  const globalPct = latest?.percentage ?? 0;

  const skillScores = useMemo(() => {
    const map: Record<string, { nclc: string; avg: number }> = {};
    for (const stat of data?.skillStats ?? []) {
      const abbrev = SKILL_ABBREV[stat.skill] ?? stat.skill;
      map[abbrev] = {
        nclc: `NCLC ${Math.min(12, Math.max(1, Math.round(stat.average / 10)))}`,
        avg: stat.average,
      };
    }
    return (["CO", "CE", "EE", "EO"] as const).map((key) => ({
      key,
      labelKey: SKILL_LABEL_KEYS[
        Object.entries(SKILL_ABBREV).find(([, v]) => v === key)?.[0] ?? ""
      ] ?? "results.skillCo",
      nclc: map[key]?.nclc ?? "—",
      score: map[key]?.avg ?? 0,
    }));
  }, [data?.skillStats]);

  const radarData = skillScores.map((s) => ({
    subject: s.key,
    score: s.score > 0 ? Math.min(12, Math.round(s.score / 10)) : 0,
  }));

  const corrections = useMemo(() => {
    const items: Array<{
      id: string;
      skill: string;
      feedback: string;
      score: number | null;
    }> = [];
    for (const attempt of data?.attempts ?? []) {
      for (const answer of attempt.answers) {
        if (answer.correction?.feedback) {
          items.push({
            id: `${attempt.id}-${answer.correction.feedback.slice(0, 20)}`,
            skill: `${SKILL_ABBREV[attempt.series.skill] ?? attempt.series.skill} — ${attempt.series.title}`,
            feedback: answer.correction.feedback,
            score: answer.correction.score,
          });
        }
      }
    }
    return items.slice(0, 5);
  }, [data?.attempts]);

  const handleDownload = async () => {
    if (!latest) return;
    try {
      const response = await fetch(`/api/resultats/${latest.id}/pdf`);
      if (!response.ok) throw new Error("PDF failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `resultat-${latest.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      const report = buildExamResultReport(
      {
        skill: (SKILL_ABBREV[latest.series.skill] ?? "CO") as SkillAbbrev,
        seriesId: latest.id,
        guestMode: false,
        correctCount: latest.score ?? 0,
        totalQuestions: 0,
        percentage: latest.percentage ?? 0,
        durationSeconds: 0,
        completedAt: latest.completedAt ?? new Date().toISOString(),
        cecrLevel: "—",
        nclcLevel: nclcLevelToNumber(latest.nclcLevel as never) || 0,
      },
      {
        title: latest.series.title,
        skill: t("results.competencyProfile"),
        score: t("results.globalScore"),
        cecrl: "CECRL",
        nclc: "NCLC",
        duration: "Durée",
        completedAt: "Date",
        recommendations: t("results.detailedCorrections"),
      },
      corrections.map((c) => c.feedback)
    );
      downloadExamResultReport(report, `resultats-${latest.id}.txt`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-xl text-center text-on-surface-variant animate-pulse">
        {t("common.loading")}
      </div>
    );
  }

  if (!data?.attempts.length) {
    return (
      <div className="flex flex-col items-center gap-md p-xl text-center">
        <h1 className="font-display-md text-display-md text-primary">{t("results.title")}</h1>
        <p className="text-on-surface-variant">{t("results.noResults")}</p>
        <Button asChild>
          <Link href="/series">{t("nav.series")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-md"
      >
        <div>
          <h1 className="font-display-md text-display-md text-primary mb-xs">
            {t("results.title")}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {latest?.series.title} —{" "}
            {latest?.completedAt
              ? new Date(latest.completedAt).toLocaleDateString("fr-FR")
              : "—"}
          </p>
        </div>
        <div className="flex gap-md">
          <Button variant="secondary" size="default" onClick={handleDownload}>
            <span className="material-symbols-outlined text-[18px]">download</span>
            {t("results.downloadPdf")}
          </Button>
          <Button asChild size="default">
            <Link href="/series">
              <span className="material-symbols-outlined text-[18px]">replay</span>
              {t("results.retake")}
            </Link>
          </Button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface rounded-2xl p-xl border border-outline-variant shadow-violet-sm flex flex-col justify-center items-center text-center"
        >
          <div className="font-label-md text-on-surface-variant uppercase tracking-widest mb-md">
            {t("results.globalScore")}
          </div>
          <div className="font-display-lg text-display-lg text-primary mb-sm">{globalNclc}</div>
          <div className="font-body-md text-on-surface-variant mb-lg">
            {Math.round(globalPct)}%
          </div>
          <Progress value={globalPct} showLabel fillColor="primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-surface rounded-2xl p-xl border border-outline-variant shadow-violet-sm flex flex-col md:flex-row items-center gap-xl"
        >
          <div className="flex-1 w-full">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-sm">
              {t("results.competencyProfile")}
            </h3>
            <div className="grid grid-cols-2 gap-md">
              {skillScores.map((skill) => (
                <div
                  key={skill.key}
                  className="bg-surface-container-low p-md rounded-xl border border-surface-variant"
                >
                  <div className="font-label-sm text-on-surface-variant">
                    {t(skill.labelKey)}
                  </div>
                  <div className="font-headline-lg-mobile text-primary">{skill.nclc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e6e0e9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#494551", fontSize: 10 }} />
                <Radar
                  dataKey="score"
                  stroke="#6750a4"
                  fill="#6750a4"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {corrections.length > 0 && (
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-lg">
            {t("results.detailedCorrections")}
          </h2>
          <div className="space-y-md">
            {corrections.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-surface rounded-2xl p-lg border border-outline-variant"
              >
                <div className="font-label-md font-bold mb-xs">{item.skill}</div>
                {item.score != null && (
                  <p className="font-label-sm text-primary mb-sm">Score : {item.score}/100</p>
                )}
                <p className="font-body-md text-on-surface">{item.feedback}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-lg">
          Historique récent
        </h2>
        <div className="space-y-sm">
          {data.attempts.slice(0, 10).map((attempt) => (
            <div
              key={attempt.id}
              className="flex items-center justify-between p-md rounded-xl border border-outline-variant"
            >
              <div>
                <p className="font-label-md font-semibold">{attempt.series.title}</p>
                <p className="font-label-sm text-on-surface-variant">
                  {attempt.completedAt
                    ? new Date(attempt.completedAt).toLocaleDateString("fr-FR")
                    : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-label-md text-primary">{formatNclc(attempt.nclcLevel)}</p>
                <p className="font-label-sm text-on-surface-variant">
                  {Math.round(attempt.percentage ?? 0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
