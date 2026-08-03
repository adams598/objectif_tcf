"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExamShell, useExamTimer } from "./shared/exam-shell";
import { QuestionMap } from "./shared/question-map";
import { QcmOptions } from "./shared/qcm-options";
import { ExamAudioPlayer } from "./shared/exam-audio-player";
import { ExamVideoPlayer } from "./shared/exam-video-player";
import { ExamMediaPanel } from "./shared/exam-media-panel";
import { generateCoQuestions } from "@/lib/examen/mock/qcm-generator";
import { getCoMedia } from "@/lib/examen/media/assets";
import {
  buildScoreResult,
  scoreQcm,
} from "@/lib/examen/scoring";
import { submitExamScore } from "@/lib/examen/submit-exam";
import { navigateToResults } from "@/lib/examen/guest-results";
import { useExamSeries, type PlayQuestion } from "@/modules/examen/hooks/use-exam-series";
import {
  getExamLabelFromTab,
  getSeriesLabel,
  SKILL_LABELS,
} from "@/lib/examen/labels";
import { getExamExitHref } from "@/lib/preparation/exam-paths";
import type { ExamViewProps } from "@/modules/examen/types";
import { useTranslation } from "@/components/providers/locale-provider";

const FALLBACK_QUESTIONS: PlayQuestion[] = generateCoQuestions(39).map((q) => {
  const media = getCoMedia(q.order);
  return {
    id: q.id,
    order: q.order,
    type: "QCM",
    content: q.content,
    instruction: null,
    passage: null,
    meta: {},
    audioScript: media.audioScript,
    documentType: media.documentType,
    audioUrl: null,
    videoUrl: null,
    imageUrl: media.imageUrl,
    choices: q.choices.map((c, i) => ({ ...c, order: i })),
  };
});

export function ExamView({ seriesId, guestMode, examTab }: ExamViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const { data: seriesData, isLoading } = useExamSeries(seriesId);

  const QUESTIONS = seriesData?.questions?.length
    ? seriesData.questions
    : FALLBACK_QUESTIONS;
  const TOTAL_DURATION = (seriesData?.durationMin ?? 40) * 60;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showMobileMap, setShowMobileMap] = useState(false);

  const submitExam = useCallback(async () => {
    const durationSeconds = Math.floor((Date.now() - startedAt.current) / 1000);
    try {
      const result = await submitExamScore(seriesId, {
        guestMode,
        examTab,
        durationSeconds,
        answers,
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
      const { correct, total, percentage } = scoreQcm(
        QUESTIONS.map((q) => ({
          id: q.id,
          correctChoiceId: "",
        })),
        answers
      );
      const result = buildScoreResult({
        skill: "CO",
        seriesId,
        examTab,
        guestMode: !!guestMode,
        correctCount: correct,
        totalQuestions: total,
        percentage,
        durationSeconds,
      });
      navigateToResults(result, router, guestMode);
    }
  }, [answers, seriesId, examTab, guestMode, router, QUESTIONS]);

  const { timeLeft } = useExamTimer(TOTAL_DURATION, () => {
    void submitExam();
  });

  const answeredSet = useMemo(() => {
    const set = new Set<number>();
    QUESTIONS.forEach((q, i) => {
      if (answers[q.id]) set.add(i);
    });
    return set;
  }, [answers, QUESTIONS]);

  if (isLoading && !seriesData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <p className="font-body-md text-on-surface-variant">{t("exam.loadingSeries")}</p>
      </div>
    );
  }

  const question = QUESTIONS[currentIndex] ?? QUESTIONS[0];
  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
        <p className="font-body-md text-on-surface-variant">{t("exam.noQuestions")}</p>
      </div>
    );
  }
  const exitHref = getExamExitHref({ guestMode, examTab });

  const footer = (
    <div className="flex justify-between items-center max-w-3xl mx-auto w-full">
      <Button
        variant="secondary"
        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        disabled={currentIndex === 0}
      >
        {t("exam.previous")}
      </Button>
      <button
        type="button"
        className="lg:hidden font-label-sm text-label-sm text-primary"
        onClick={() => setShowMobileMap(!showMobileMap)}
      >
        Q{currentIndex + 1}/{QUESTIONS.length}
      </button>
      <Button
        onClick={() => {
          if (currentIndex < QUESTIONS.length - 1) {
            setCurrentIndex((i) => i + 1);
          } else {
            submitExam();
          }
        }}
      >
        {currentIndex === QUESTIONS.length - 1 ? t("exam.finish") : t("exam.next")}
      </Button>
    </div>
  );

  return (
    <ExamShell
      skillLabel={SKILL_LABELS.CO}
      seriesLabel={getSeriesLabel(seriesId)}
      examLabel={getExamLabelFromTab(examTab)}
      timeLeft={timeLeft}
      totalDuration={TOTAL_DURATION}
      onFinish={submitExam}
      onExit={() => router.push(exitHref)}
      sidebar={
        <QuestionMap
          total={QUESTIONS.length}
          current={currentIndex}
          answered={answeredSet}
          onSelect={setCurrentIndex}
        />
      }
      footer={footer}
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-md">
        {showMobileMap && (
          <div className="lg:hidden bg-surface rounded-xl border border-outline-variant p-md">
            <QuestionMap
              total={QUESTIONS.length}
              current={currentIndex}
              answered={answeredSet}
              onSelect={(i) => {
                setCurrentIndex(i);
                setShowMobileMap(false);
              }}
            />
          </div>
        )}

        <ExamMediaPanel
          imageUrl={question.imageUrl}
          documentType={question.documentType}
          fallbackIcon="hearing"
          fallbackLabel={t("exam.audioDocumentQuestion", { n: question.order })}
          showFallback={!question.videoUrl && !question.audioUrl && !question.imageUrl}
        />

        {question.videoUrl && (
          <ExamVideoPlayer
            videoUrl={question.videoUrl}
            label={
              question.documentType
                ? t("exam.watchDocumentType", {
                    type: question.documentType,
                  })
                : t("exam.videoDocument")
            }
          />
        )}
        {!question.videoUrl && (question.audioUrl || question.audioScript) && (
          <ExamAudioPlayer
            audioUrl={question.audioUrl}
            audioScript={question.audioScript}
            label={
              question.documentType
                ? t("exam.listenDocumentType", {
                    type: question.documentType,
                  })
                : t("exam.audioDocument")
            }
          />
        )}

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-surface rounded-xl border-2 border-primary/20 overflow-hidden shadow-violet-sm"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-10 h-9 sm:h-auto bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md font-bold shrink-0">
                {question.order}
              </div>
              <div className="flex-1 p-sm md:p-md min-w-0">
                <p className="font-body-md text-body-md text-on-surface mb-md">
                  {question.content}
                </p>

                <QcmOptions
                  name={`co-${question.id}`}
                  choices={question.choices}
                  selectedId={answers[question.id]}
                  onSelect={(id) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: id }))
                  }
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </ExamShell>
  );
}
