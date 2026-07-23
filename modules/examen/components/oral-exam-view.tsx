"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExamShell, formatExamTime, useExamTimer } from "./shared/exam-shell";
import { TaskTabs } from "./shared/task-tabs";
import {
  CorrectionModeDialog,
  type CorrectionMode,
} from "./shared/correction-mode-dialog";
import { ExamAudioPlayer } from "./shared/exam-audio-player";
import { ExamMediaPanel } from "./shared/exam-media-panel";
import { OralRecorder } from "./shared/oral-recorder";
import { getEoPromptScript } from "@/lib/examen/media/assets";
import { ORAL_TASKS } from "@/lib/examen/mock/tasks";
import { submitExamScore } from "@/lib/examen/submit-exam";
import { uploadOralRecordingFile } from "@/lib/examen/upload-oral-recordings";
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

type OralTaskItem = {
  id: number;
  questionId: string;
  title: string;
  instruction: string;
  prompt: string;
  promptAudioScript: string;
  promptAudioUrl?: string | null;
  imageUrl?: string | null;
  preparationTime: number;
  speakingTime: number;
};

export function OralExamView({
  seriesId,
  guestMode,
  examTab,
}: ExamViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const { data: seriesData, isLoading } = useExamSeries(seriesId);

  const tasks: OralTaskItem[] = useMemo(() => {
    if (seriesData?.questions?.length) {
      return seriesData.questions.map((q) => {
        const meta = q.meta as {
          preparationTime?: number;
          speakingTime?: number;
          promptAudioScript?: string;
          taskInstruction?: string;
        };
        return {
          id: q.order,
          questionId: q.id,
          title: t("exam.task", { n: q.order }),
          instruction:
            meta.taskInstruction ||
            (q.instruction && !q.instruction.startsWith("{")
              ? q.instruction
              : t("exam.followInstruction")),
          prompt: q.content,
          promptAudioScript:
            q.audioScript ??
            meta.promptAudioScript ??
            getEoPromptScript(q.order),
          promptAudioUrl: q.audioUrl ?? null,
          imageUrl: q.imageUrl ?? null,
          preparationTime: meta.preparationTime ?? 120,
          speakingTime: meta.speakingTime ?? 120,
        };
      });
    }
    return ORAL_TASKS.map((t) => ({
      id: t.id,
      questionId: `oral-task-${t.id}`,
      title: t.title,
      instruction: t.instruction,
      prompt: t.prompt,
      promptAudioScript: getEoPromptScript(t.id),
      promptAudioUrl: null,
      imageUrl: null,
      preparationTime: t.preparationTime,
      speakingTime: t.speakingTime,
    }));
  }, [seriesData?.questions, t]);

  const totalDuration = (seriesData?.durationMin ?? 12) * 60;

  const [showCorrectionDialog, setShowCorrectionDialog] = useState(true);
  const [correctionMode, setCorrectionMode] = useState<CorrectionMode>("instant");
  const [testStarted, setTestStarted] = useState(false);
  const [activeTask, setActiveTask] = useState(1);
  const [phase, setPhase] = useState<"prepare" | "speak">("prepare");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [taskRecordings, setTaskRecordings] = useState<
    Record<number, { blob: Blob; duration: number }>
  >({});
  const [taskTimeLeft, setTaskTimeLeft] = useState(120);

  const task = tasks.find((t) => t.id === activeTask) ?? tasks[0];

  const finishExam = useCallback(
    async (completedCount: number) => {
      const durationSeconds = Math.floor((Date.now() - startedAt.current) / 1000);
      try {
        const oralRecordings: Record<string, string> = {};

        if (!guestMode) {
          for (const t of tasks) {
            const recording = taskRecordings[t.id];
            if (recording && t.questionId && !t.questionId.startsWith("oral-task-")) {
              try {
                oralRecordings[t.questionId] = await uploadOralRecordingFile({
                  file: recording.blob,
                  seriesId,
                  questionId: t.questionId,
                });
              } catch (uploadErr) {
                console.error("Oral upload failed:", uploadErr);
              }
            }
          }
        }

        const result = await submitExamScore(seriesId, {
          guestMode,
          examTab,
          durationSeconds,
          tasksCompleted: completedCount,
          correctionMode,
          ...(Object.keys(oralRecordings).length > 0 ? { oralRecordings } : {}),
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
            skill: "EO",
            seriesId,
            examTab,
            guestMode: !!guestMode,
            correctCount: completedCount,
            totalQuestions: tasks.length,
            percentage: Math.round((completedCount / tasks.length) * 70 + 20),
            durationSeconds,
            completedAt: new Date().toISOString(),
            cecrLevel: "B1",
            nclcLevel: 6,
            details: { tasksCompleted: completedCount, correctionMode },
          },
          router,
          guestMode
        );
      }
    },
    [seriesId, guestMode, examTab, correctionMode, tasks, taskRecordings, router]
  );

  const submitExam = useCallback(() => {
    void finishExam(completedTasks.size);
  }, [completedTasks.size, finishExam]);

  const { timeLeft } = useExamTimer(totalDuration, () => {
    if (testStarted) void finishExam(completedTasks.size);
  });

  React.useEffect(() => {
    if (!testStarted || !task) return;
    setTaskTimeLeft(
      phase === "prepare" ? task.preparationTime : task.speakingTime
    );
    setIsRecording(false);
    setIsPaused(false);
  }, [activeTask, phase, testStarted, task]);

  React.useEffect(() => {
    if (!testStarted || isPaused || taskTimeLeft <= 0) return;
    const id = setInterval(
      () => setTaskTimeLeft((t) => Math.max(0, t - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [testStarted, isPaused, taskTimeLeft]);

  const exitHref = getExamExitHref({ guestMode, examTab });

  const handleNextTask = () => {
    const newCompleted = new Set([...completedTasks, activeTask]);
    setCompletedTasks(newCompleted);

    const lastTaskId = tasks[tasks.length - 1]?.id ?? 3;
    if (activeTask < lastTaskId) {
      setActiveTask((t) => t + 1);
      setPhase("prepare");
    } else {
      void finishExam(newCompleted.size);
    }
  };

  const taskTabs = tasks.map((t) => ({
    id: t.id,
    label: t.title,
    badge: completedTasks.has(t.id) ? 1 : 0,
  }));

  if (isLoading && !seriesData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <p className="font-body-md text-on-surface-variant">{t("exam.loadingSeries")}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <p className="font-body-md text-on-surface-variant">{t("exam.noTasks")}</p>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <>
        <CorrectionModeDialog
          open={showCorrectionDialog}
          skillLabel={SKILL_LABELS.EO}
          guestMode={guestMode}
          onConfirm={(mode) => {
            setCorrectionMode(mode);
            setShowCorrectionDialog(false);
            setTestStarted(true);
          }}
        />
        <div className="min-h-screen bg-surface-container-low flex items-center justify-center">
          <p className="font-body-md text-on-surface-variant">
            {t("exam.preparingExam")}
          </p>
        </div>
      </>
    );
  }

  return (
    <ExamShell
      skillLabel={SKILL_LABELS.EO}
      seriesLabel={getSeriesLabel(seriesId)}
      examLabel={getExamLabelFromTab(examTab)}
      timeLeft={timeLeft}
      totalDuration={totalDuration}
      onFinish={submitExam}
      onExit={() => router.push(exitHref)}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-xl py-md">
        <TaskTabs
          tasks={taskTabs}
          activeId={activeTask}
          onChange={(id) => {
            if (completedTasks.has(id) || id <= activeTask) {
              setActiveTask(id);
              setPhase("prepare");
            }
          }}
        />

        <div className="flex flex-col items-center gap-sm">
          <div className="bg-on-surface rounded-2xl px-xl py-md shadow-violet-md">
            <span className="font-display-md text-[48px] text-surface font-bold tabular-nums tracking-wider">
              {formatExamTime(taskTimeLeft)}
            </span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant">
            {task.title} ·{" "}
            {phase === "prepare" ? t("exam.preparation") : t("exam.recording")}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTask}-${phase}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-2xl border border-outline-variant p-xl shadow-violet-sm text-center"
          >
            <p className="font-body-lg text-body-lg text-on-surface mb-lg">
              {task.instruction}
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg bg-surface-container-low rounded-xl p-lg">
              {task.prompt}
            </p>

            <ExamAudioPlayer
              audioUrl={task.promptAudioUrl}
              audioScript={task.promptAudioScript}
              label={t("exam.examinerInstruction")}
              className="mb-xl text-left"
            />

            {task.imageUrl ? (
              <ExamMediaPanel
                imageUrl={task.imageUrl}
                className="mb-xl"
                fallbackLabel={t("exam.subject")}
              />
            ) : null}

            {phase === "speak" && (
              <div className="flex flex-col items-center gap-md mb-lg">
                <p className="font-label-md text-label-md font-bold text-on-surface">
                  {t("exam.recording")}
                </p>
                <div className="flex items-center gap-md">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecording(!isRecording);
                      setIsPaused(false);
                    }}
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md",
                      isRecording && !isPaused
                        ? "bg-error text-on-error"
                        : "bg-primary text-on-primary"
                    )}
                  >
                    <span
                      className="material-symbols-outlined text-[32px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      mic
                    </span>
                  </button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsPaused((p) => !p)}
                    disabled={!isRecording}
                  >
                    {isPaused ? t("exam.resume") : t("exam.pause")}
                  </Button>
                </div>
                <OralRecorder
                  active={isRecording}
                  paused={isPaused}
                  maxSeconds={task.speakingTime}
                  onRecordingChange={(blob, durationSec) => {
                    if (blob) {
                      setTaskRecordings((prev) => ({
                        ...prev,
                        [activeTask]: { blob, duration: durationSec },
                      }));
                    }
                  }}
                />
              </div>
            )}

            <div className="flex justify-center gap-md">
              {phase === "prepare" ? (
                <Button
                  onClick={() => {
                    setPhase("speak");
                    setIsRecording(true);
                  }}
                >
                  {t("exam.startSpeaking")}
                </Button>
              ) : (
                <Button onClick={handleNextTask}>
                  {activeTask < (tasks[tasks.length - 1]?.id ?? 3)
                    ? t("exam.nextTask")
                    : t("exam.finishExam")}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
          {t("exam.modeLabel", {
            mode:
              correctionMode === "instant" ? t("exam.instant") : t("exam.human"),
          })}
        </p>
      </div>
    </ExamShell>
  );
}
