"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { WritingCorrectionResult } from "@/lib/ai/writing-correction-types";
import { useTranslation } from "@/components/providers/locale-provider";

interface WritingCorrectionDetailsProps {
  correctionStatus: "idle" | "pending" | "processing" | "completed" | "failed";
  aiResult: WritingCorrectionResult | null;
  resultSource?: string | null;
  provisionalTaskScores?: Array<{
    taskId: number;
    wordCount: number;
    compliant: boolean;
  }>;
}

export function WritingCorrectionDetails({
  correctionStatus,
  aiResult,
  resultSource,
  provisionalTaskScores,
}: WritingCorrectionDetailsProps) {
  const { t } = useTranslation();
  const isLoading =
    correctionStatus === "pending" || correctionStatus === "processing";
  const showAi = correctionStatus === "completed" && aiResult;
  const tasks = showAi ? aiResult.tasks : null;

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant p-lg mb-2xl shadow-violet-sm">
      <div className="flex items-center justify-between gap-md mb-md flex-wrap">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">edit_note</span>
          {t("writingCorrection.title")}
        </h2>
        {showAi && (
          <span className="inline-flex items-center gap-xs px-sm py-xs rounded-md bg-primary/10 text-primary font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px]">
              {resultSource === "gemini" ? "auto_awesome" : "rule"}
            </span>
            {resultSource === "gemini"
              ? t("writingCorrection.aiGemini")
              : t("writingCorrection.aiAutomatic")}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="rounded-xl bg-surface-container-low p-lg mb-md">
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-primary animate-pulse">
              hourglass_top
            </span>
            <p className="font-body-md text-on-surface">
              {t("writingCorrection.loadingTitle")}
            </p>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {t("writingCorrection.loadingDesc")}
          </p>
        </div>
      )}

      {correctionStatus === "failed" && !showAi && (
        <p className="font-body-md text-on-surface-variant mb-md">
          {t("writingCorrection.failedDesc")}
        </p>
      )}

      {showAi && (
        <>
          <p className="font-body-md text-on-surface-variant mb-lg">
            {aiResult.globalFeedback}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            {tasks!.map((task) => (
              <div
                key={task.taskId}
                className={cn(
                  "rounded-xl p-md border",
                  task.compliant
                    ? "border-success/30 bg-success-container/20"
                    : "border-tertiary/30 bg-tertiary-container/20"
                )}
              >
                <div className="flex justify-between items-start mb-sm">
                  <p className="font-label-md text-label-md font-bold">
                    {t("writingCorrection.task", { n: task.taskId })}
                  </p>
                  <span className="font-label-md text-label-md text-primary font-bold">
                    {task.score}/100
                  </span>
                </div>
                <Progress value={task.score} size="sm" className="mb-sm" />
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {t("writingCorrection.wordsCompliant", {
                    count: task.wordCount,
                    status: task.compliant
                      ? t("writingCorrection.compliant")
                      : t("writingCorrection.offTopic"),
                  })}
                </p>

                {task.strengths.length > 0 && (
                  <ul className="mt-sm space-y-xs">
                    {task.strengths.slice(0, 2).map((s) => (
                      <li
                        key={s}
                        className="font-label-sm text-label-sm text-success flex gap-xs"
                      >
                        <span className="material-symbols-outlined text-[14px] shrink-0">
                          check
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                {task.improvements.length > 0 && (
                  <ul className="mt-sm space-y-xs">
                    {task.improvements.slice(0, 2).map((s) => (
                      <li
                        key={s}
                        className="font-label-sm text-label-sm text-on-surface-variant flex gap-xs"
                      >
                        <span className="material-symbols-outlined text-[14px] shrink-0 text-tertiary">
                          arrow_forward
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                {task.errors.length > 0 && (
                  <div className="mt-sm pt-sm border-t border-outline-variant/50">
                    {task.errors.slice(0, 2).map((err) => (
                      <p
                        key={`${err.type}-${err.excerpt}`}
                        className="font-label-sm text-label-sm text-on-surface-variant mt-xs"
                      >
                        <strong>{err.type}</strong> — {err.suggestion}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!showAi && provisionalTaskScores && provisionalTaskScores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          {provisionalTaskScores.map((task) => (
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
                {t("writingCorrection.task", { n: task.taskId })}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                {t("writingCorrection.words", { count: task.wordCount })}
              </p>
              <p
                className={cn(
                  "font-label-sm text-label-sm mt-xs font-bold",
                  task.compliant ? "text-success" : "text-tertiary"
                )}
              >
                {task.compliant
                  ? t("writingCorrection.compliant")
                  : t("writingCorrection.offTopic")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
