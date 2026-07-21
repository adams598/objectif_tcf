"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExamShell, useExamTimer } from "./shared/exam-shell";
import { TaskTabs } from "./shared/task-tabs";
import { FrenchKeyboard } from "./shared/french-keyboard";
import { WRITING_TASKS } from "@/lib/examen/mock/tasks";
import { submitExamScore } from "@/lib/examen/submit-exam";
import { navigateToResults } from "@/lib/examen/guest-results";
import { useExamSeries } from "@/modules/examen/hooks/use-exam-series";
import {
  getExamLabelFromTab,
  getSeriesLabel,
  SKILL_LABELS,
} from "@/lib/examen/labels";
import { getExamExitHref } from "@/lib/preparation/exam-paths";
import type { ExamViewProps } from "@/modules/examen/types";
import { useTranslation } from "@/components/providers/locale-provider";

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type TaskItem = {
  id: number;
  questionId: string;
  title: string;
  minWords: number;
  maxWords: number;
  prompt: string;
};

export function WritingExamView({
  seriesId,
  guestMode,
  examTab,
}: ExamViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: seriesData, isLoading } = useExamSeries(seriesId);

  const tasks: TaskItem[] = seriesData?.questions?.length
    ? seriesData.questions.map((q) => {
        const meta = q.meta as { minWords?: number; maxWords?: number };
        return {
          id: q.order,
          questionId: q.id,
          title: t("exam.task", { n: q.order }),
          minWords: meta.minWords ?? 60,
          maxWords: meta.maxWords ?? 120,
          prompt: q.content,
        };
      })
    : WRITING_TASKS.map((t) => ({
        id: t.id,
        questionId: String(t.id),
        title: t.title,
        minWords: t.minWords,
        maxWords: t.maxWords,
        prompt: t.prompt,
      }));

  const [activeTask, setActiveTask] = useState(tasks[0]?.id ?? 1);
  const [contents, setContents] = useState<Record<string, string>>({});

  const task = tasks.find((t) => t.id === activeTask) ?? tasks[0];
  const content = contents[task?.questionId ?? ""] ?? "";
  const wordCount = countWords(content);
  const isTooShort = wordCount > 0 && wordCount < (task?.minWords ?? 60);
  const isTooLong = wordCount > (task?.maxWords ?? 120);
  const totalDuration = (seriesData?.durationMin ?? 60) * 60;

  const submitExam = useCallback(async () => {
    const durationSeconds = Math.floor((Date.now() - startedAt.current) / 1000);
    const textResponses: Record<string, string> = {};
    tasks.forEach((t) => {
      textResponses[t.questionId] = contents[t.questionId] ?? "";
    });

    try {
      const result = await submitExamScore(seriesId, {
        guestMode,
        examTab,
        durationSeconds,
        textResponses,
      });
      const params = new URLSearchParams();
      if (result.examTab) params.set("examen", result.examTab);
      params.set("skill", result.skill);
      router.push(
        guestMode
          ? `/preparation/resultats?${params.toString()}`
          : `/resultats?${params.toString()}`
      );
    } catch {
      navigateToResults(
        {
          skill: "EE",
          seriesId,
          examTab,
          guestMode: !!guestMode,
          correctCount: 0,
          totalQuestions: tasks.length,
          percentage: 50,
          durationSeconds,
          completedAt: new Date().toISOString(),
          cecrLevel: "B1",
          nclcLevel: 6,
        },
        router,
        guestMode
      );
    }
  }, [contents, tasks, seriesId, examTab, guestMode, router]);

  const { timeLeft } = useExamTimer(totalDuration, () => {
    void submitExam();
  });
  const exitHref = getExamExitHref({ guestMode, examTab });

  const insertChar = (char: string) => {
    const qid = task?.questionId ?? "";
    const el = textareaRef.current;
    if (!el) {
      setContents((prev) => ({ ...prev, [qid]: (prev[qid] ?? "") + char }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + char + content.slice(end);
    setContents((prev) => ({ ...prev, [qid]: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + char.length, start + char.length);
    });
  };

  if (isLoading && !seriesData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <p className="font-body-md text-on-surface-variant">{t("exam.loadingSeries")}</p>
      </div>
    );
  }

  if (!task) return null;

  const taskTabs = tasks.map((t) => ({
    id: t.id,
    label: t.title,
    badge: countWords(contents[t.questionId] ?? ""),
  }));

  const lastTaskId = tasks[tasks.length - 1]?.id ?? 3;

  return (
    <ExamShell
      skillLabel={SKILL_LABELS.EE}
      seriesLabel={getSeriesLabel(seriesId)}
      examLabel={getExamLabelFromTab(examTab)}
      timeLeft={timeLeft}
      totalDuration={totalDuration}
      onFinish={() => void submitExam()}
      onExit={() => router.push(exitHref)}
      footer={
        <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
          <Button
            variant="secondary"
            onClick={() => {
              const idx = tasks.findIndex((t) => t.id === activeTask);
              if (idx > 0) setActiveTask(tasks[idx - 1].id);
            }}
            disabled={activeTask === tasks[0]?.id}
          >
            {t("exam.previousTask")}
          </Button>
          {activeTask < lastTaskId ? (
            <Button
              onClick={() => {
                const idx = tasks.findIndex((t) => t.id === activeTask);
                if (idx < tasks.length - 1) setActiveTask(tasks[idx + 1].id);
              }}
            >
              {t("exam.nextTask")}
            </Button>
          ) : (
            <Button onClick={() => void submitExam()}>{t("exam.finishExam")}</Button>
          )}
        </div>
      }
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-lg">
        <TaskTabs tasks={taskTabs} activeId={activeTask} onChange={setActiveTask} />

        <div className="text-center">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {t("exam.minMaxWords", { min: task.minWords, max: task.maxWords })}
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-violet-sm">
          <p className="font-label-md text-label-md font-bold text-on-surface flex items-start gap-sm">
            <span className="material-symbols-outlined text-tertiary text-[20px]">
              push_pin
            </span>
            {t("exam.subject")} : {task.prompt}
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-md">
          <div className="flex-1 bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-violet-sm relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) =>
                setContents((prev) => ({
                  ...prev,
                  [task.questionId]: e.target.value,
                }))
              }
              className="w-full min-h-[320px] p-lg outline-none font-body-lg text-body-lg text-on-surface leading-relaxed resize-y bg-transparent"
              placeholder={t("exam.writePlaceholder")}
            />
          </div>
          <FrenchKeyboard onInsert={insertChar} />
        </div>

        <div className="flex items-center justify-between">
          <p className="font-label-md text-label-md text-on-surface-variant">
            {t("exam.wordCount")} :{" "}
            <span
              className={cn(
                "font-bold",
                isTooShort ? "text-tertiary" : isTooLong ? "text-error" : "text-on-surface"
              )}
            >
              {wordCount}
            </span>
          </p>
          <span className="inline-flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-md py-xs rounded-full">
            {t("exam.modeLabel", { mode: t("exam.modeInstant") })}
          </span>
        </div>
      </div>
    </ExamShell>
  );
}
