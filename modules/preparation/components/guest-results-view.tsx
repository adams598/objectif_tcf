"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ExamScoreResult } from "@/lib/examen/scoring";
import type { SkillAbbrev } from "@/lib/examen/scoring";
import {
  loadGuestResult,
  updateGuestResultWithAiCorrection,
} from "@/lib/examen/guest-results";
import { getExamLabel } from "@/lib/preparation/constants";
import type { ExamTab } from "@/lib/pricing/constants";
import {
  buildExamResultReport,
  downloadExamResultReport,
} from "@/lib/examen/download-result";
import { WritingCorrectionDetails } from "@/modules/examen/components/writing-correction-details";
import { useWritingCorrectionPoll } from "@/modules/examen/hooks/use-writing-correction-poll";
import { useTranslation } from "@/components/providers/locale-provider";

interface GuestResultsViewProps {
  examTab: ExamTab;
  skillParam?: string;
}

const SKILL_KEYS: Record<SkillAbbrev, string> = {
  CO: "results.skillCo",
  CE: "results.skillCe",
  EE: "results.skillEe",
  EO: "results.skillEo",
};

const CECR_KEYS: Record<string, string> = {
  "C1-C2": "guestResults.cecrlC1C2",
  B2: "guestResults.cecrlB2",
  B1: "guestResults.cecrlB1",
  A2: "guestResults.cecrlA2",
  A1: "guestResults.cecrlA1",
};

const RECOMMENDATION_KEYS: Record<SkillAbbrev, string[]> = {
  CO: ["guestResults.recCo1", "guestResults.recCo2", "guestResults.recCo3"],
  CE: ["guestResults.recCe1", "guestResults.recCe2", "guestResults.recCe3"],
  EE: ["guestResults.recEe1", "guestResults.recEe2", "guestResults.recEe3"],
  EO: ["guestResults.recEo1", "guestResults.recEo2", "guestResults.recEo3"],
};

export function GuestResultsView({ examTab, skillParam }: GuestResultsViewProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<ExamScoreResult | null>(null);
  const correctionToken = result?.details?.correctionToken;
  const { status: correctionStatus, result: aiResult, resultSource } =
    useWritingCorrectionPoll(correctionToken);

  useEffect(() => {
    setResult(loadGuestResult());
  }, []);

  useEffect(() => {
    if (correctionStatus !== "completed" || !aiResult) return;
    const updated = updateGuestResultWithAiCorrection(aiResult);
    if (updated) setResult(updated);
  }, [correctionStatus, aiResult]);

  const examLabel = getExamLabel(examTab);

  if (!result) {
    return (
      <div className="max-w-lg mx-auto text-center py-2xl px-md">
        <p className="font-body-lg text-on-surface-variant mb-lg">
          {t("guestResults.noResults")}
        </p>
        <Button asChild>
          <Link href={`/preparation/${examTab}`}>{t("guestResults.startSeries")}</Link>
        </Button>
      </div>
    );
  }

  const skill = result.skill;
  const skillLabel = t(SKILL_KEYS[skill]);
  const isQcm = skill === "CO" || skill === "CE";
  const recommendations = RECOMMENDATION_KEYS[skill].map((key) => t(key));

  return (
    <div className="max-w-container-max mx-auto px-md md:px-lg py-xl md:py-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2xl"
      >
        <p className="font-label-md text-label-md text-primary mb-sm">
          {t("guestResults.resultsLabel", { exam: examLabel })}
        </p>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-md">
          {t("guestResults.yourEvaluation", { skill: skillLabel })}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          {isQcm
            ? t("guestResults.descQcm")
            : skill === "EE"
              ? t("guestResults.descEe")
              : t("guestResults.descOther")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-1 bg-gradient-primary rounded-3xl p-xl text-on-primary shadow-violet-lg text-center flex flex-col items-center justify-center"
        >
          <span className="font-label-md text-label-md opacity-90 mb-sm">
            {t("guestResults.globalScore")}
          </span>
          <span className="font-display-md text-[72px] font-bold leading-none">
            {result.percentage}%
          </span>
          {isQcm && (
            <p className="font-body-md mt-md opacity-90">
              {t("guestResults.correctAnswers", {
                correct: result.correctCount ?? 0,
                total: result.totalQuestions,
              })}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-md"
        >
          <div className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-violet-sm">
            <span className="material-symbols-outlined text-primary text-[28px] mb-sm">
              school
            </span>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">
              {t("guestResults.cecrlLevel")}
            </p>
            <p className="font-display-md text-display-md font-bold text-on-surface">
              {result.cecrLevel}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
              {t(CECR_KEYS[result.cecrLevel] ?? "guestResults.cecrlA1")}
            </p>
          </div>

          <div className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-violet-sm">
            <span className="material-symbols-outlined text-secondary text-[28px] mb-sm">
              flag
            </span>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">
              {t("guestResults.nclcEquivalent")}
            </p>
            <p className="font-display-md text-display-md font-bold text-on-surface">
              NCLC {result.nclcLevel}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
              {t("guestResults.nclcReference")}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant p-lg mb-2xl shadow-violet-sm">
        <div className="flex justify-between mb-sm">
          <span className="font-label-md text-label-md font-bold text-on-surface">
            {t("guestResults.performance")}
          </span>
          <span className="font-label-md text-label-md text-primary font-bold">
            {result.percentage}%
          </span>
        </div>
        <Progress value={result.percentage} size="lg" />
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
          {t("guestResults.duration", {
            min: Math.floor(result.durationSeconds / 60),
            sec: result.durationSeconds % 60,
          })}
        </p>
      </div>

      {skill === "EE" && (
        <WritingCorrectionDetails
          correctionStatus={correctionStatus}
          aiResult={aiResult ?? result.details?.aiCorrection ?? null}
          resultSource={resultSource}
          provisionalTaskScores={result.details?.taskScores}
        />
      )}

      {skill !== "EE" && result.details?.taskScores && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-lg mb-2xl shadow-violet-sm">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-md">
            {t("guestResults.taskDetail")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            {result.details.taskScores.map((task) => (
              <div
                key={task.taskId}
                className={cn(
                  "rounded-xl p-md border",
                  task.compliant
                    ? "border-success/30 bg-success-container/30"
                    : "border-tertiary/30 bg-tertiary-container/30"
                )}
              >
                <p className="font-label-md text-label-md font-bold">
                  {t("guestResults.task", { n: task.taskId })}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  {t("guestResults.words", { count: task.wordCount })}
                </p>
                <p
                  className={cn(
                    "font-label-sm text-label-sm mt-xs font-bold",
                    task.compliant ? "text-success" : "text-tertiary"
                  )}
                >
                  {task.compliant
                    ? t("guestResults.compliant")
                    : t("guestResults.offTopic")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.details?.tasksCompleted !== undefined && skill === "EO" && (
        <div className="bg-surface rounded-2xl border border-outline-variant p-lg mb-2xl shadow-violet-sm">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-sm">
            {t("guestResults.oralExpression")}
          </h2>
          <p className="font-body-md text-on-surface-variant">
            {t("guestResults.tasksCompleted", {
              completed: result.details.tasksCompleted,
              total: result.totalQuestions,
              mode:
                result.details.correctionMode === "instant"
                  ? t("guestResults.correctionInstant")
                  : t("guestResults.correctionHuman"),
            })}
          </p>
        </div>
      )}

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-lg mb-2xl">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-md flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">tips_and_updates</span>
          {t("guestResults.recommendations")}
        </h2>
        <ul className="space-y-sm">
          {recommendations.map((rec) => (
            <li
              key={rec}
              className="flex items-start gap-sm font-body-md text-body-md text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-success text-[20px] shrink-0">
                check_circle
              </span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-md justify-center">
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            const report = buildExamResultReport(
              result,
              {
                title: t("guestResults.resultsLabel", { exam: examLabel }),
                skill: t("guestResults.yourEvaluation", { skill: skillLabel }),
                score: t("guestResults.globalScore"),
                cecrl: t("guestResults.cecrlLevel"),
                nclc: t("guestResults.nclcEquivalent"),
                duration: t("guestResults.performance"),
                completedAt: t("guestResults.completedAt"),
                recommendations: t("guestResults.recommendations"),
                aiFeedback: t("guestResults.aiAnalysis"),
              },
              recommendations,
              aiResult ?? result.details?.aiCorrection ?? null
            );
            downloadExamResultReport(
              report,
              `objectif-tcf-${result.skill.toLowerCase()}-${new Date(result.completedAt).toISOString().slice(0, 10)}.txt`
            );
          }}
        >
          {t("guestResults.downloadResults")}
          <span className="material-symbols-outlined">download</span>
        </Button>
        <Button asChild size="lg">
          <Link href="/inscription">
            {t("guestResults.saveResults")}
            <span className="material-symbols-outlined">person_add</span>
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href={`/preparation/${examTab}`}>{t("guestResults.anotherSeries")}</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={`/preparation/${examTab}/serie/100`}>
            {t("guestResults.retakeSkill", { skill: skillLabel })}
          </Link>
        </Button>
      </div>
    </div>
  );
}
