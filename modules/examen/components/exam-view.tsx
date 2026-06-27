"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Choice {
  id: string;
  content: string;
}

interface Question {
  id: string;
  content: string;
  instruction?: string;
  audioUrl?: string;
  choices: Choice[];
  order: number;
}

// Mock data for demo
const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    order: 1,
    content:
      "Que propose l'intervenant pour résoudre le problème de circulation au centre-ville ?",
    audioUrl: "/audio/sample.mp3",
    choices: [
      { id: "a", content: "Instaurer une taxe sur les véhicules polluants." },
      {
        id: "b",
        content: "Augmenter la fréquence des transports en commun gratuits.",
      },
      { id: "c", content: "Créer de nouvelles zones piétonnes le week-end." },
      {
        id: "d",
        content: "Construire des parkings souterrains à la périphérie.",
      },
    ],
  },
  {
    id: "q2",
    order: 2,
    content:
      "Quelle est l'attitude de la journaliste face aux propositions présentées ?",
    choices: [
      { id: "a", content: "Elle est enthousiaste et les soutient pleinement." },
      { id: "b", content: "Elle exprime des réserves sur leur financement." },
      { id: "c", content: "Elle reste neutre et demande des précisions." },
      { id: "d", content: "Elle les rejette en citant des exemples étrangers." },
    ],
  },
];

const TOTAL_DURATION_SEC = 30 * 60; // 30 minutes

interface ExamViewProps {
  seriesId: string;
}

export function ExamView({ seriesId }: ExamViewProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(11); // Q12 as per mockup
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION_SEC - 15 * 60 - 45); // 24:15 as mockup
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(14 / 45); // 0:14 of 0:45

  const totalQuestions = 30;
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeLow = timeLeft < 5 * 60; // Under 5 minutes

  const currentQuestion = MOCK_QUESTIONS[Math.min(1, MOCK_QUESTIONS.length - 1)];
  const currentAnswer = selectedAnswers[currentQuestion?.id ?? ""];

  const handleAnswer = (choiceId: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choiceId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      // Submit exam
      router.push("/resultats");
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface font-body-md flex flex-col">
      {/* Focused Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg h-20 bg-surface/80 backdrop-blur-md border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-md">
          <span className="font-display-md text-display-md font-bold text-primary hidden md:block">
            Objectif Canada
          </span>
          <span className="font-display-md text-display-md font-bold text-primary md:hidden">
            OC
          </span>
          <div className="h-8 w-px bg-outline-variant mx-sm" />
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface-variant">
            Compréhension Orale
          </span>
        </div>

        <div className="flex items-center gap-xl">
          {/* Progress (desktop) */}
          <div className="hidden md:flex flex-col items-end gap-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Question {currentQuestionIndex + 1} sur {totalQuestions}
            </span>
            <div className="w-48">
              <Progress value={progressPercent} size="sm" />
            </div>
          </div>

          {/* Timer */}
          <div
            className={cn(
              "flex items-center gap-sm px-md py-sm rounded-full font-label-md text-label-md transition-colors",
              isTimeLow
                ? "bg-error-container text-on-error-container"
                : "bg-surface-container text-on-surface"
            )}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              timer
            </span>
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Exit */}
          <button
            onClick={() => router.push("/tableau-de-bord")}
            className="flex items-center gap-sm text-on-surface-variant hover:text-error transition-colors font-label-md text-label-md"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden md:inline">Quitter l&apos;examen</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mt-20 p-md md:p-xl flex justify-center items-start pt-12">
        <div className="w-full max-w-[800px] flex flex-col gap-lg">
          {/* Mobile progress */}
          <div className="md:hidden flex flex-col items-center gap-xs mb-md">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Question {currentQuestionIndex + 1}/{totalQuestions}
            </span>
            <Progress value={progressPercent} size="sm" />
          </div>

          {/* Audio Player */}
          <div className="bg-surface border border-outline-variant rounded-3xl p-lg shadow-violet-sm flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Document Sonore
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-md">
                Écoute 1/2
              </span>
            </div>

            <div className="flex items-center gap-md">
              {/* Play button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-on-primary-fixed-variant transition-colors shadow-md flex-shrink-0"
                aria-label={isPlaying ? "Pause" : "Lecture"}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>

              {/* Waveform visualizer */}
              <div className="flex-1 h-12 flex items-center gap-[3px] overflow-hidden px-sm">
                {Array.from({ length: 30 }).map((_, i) => {
                  const played = i < Math.floor(audioProgress * 30);
                  const heights = [
                    33, 66, 100, 50, 75, 25, 66, 100, 33, 50, 75, 33, 66, 50,
                    100, 25, 75, 33, 66, 100, 50, 25, 75, 33, 66, 50, 100, 25,
                    75, 33,
                  ];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-1 rounded-full transition-all",
                        played
                          ? "bg-primary"
                          : "bg-surface-variant"
                      )}
                      style={{
                        height: `${heights[i]}%`,
                        animation: played && isPlaying
                          ? `pulse-wave 1.5s infinite ease-in-out alternate ${(i % 7) * 0.1}s`
                          : "none",
                      }}
                    />
                  );
                })}
              </div>

              {/* Time */}
              <span className="font-label-md text-label-md text-on-surface-variant w-12 text-right">
                0:14
              </span>

              {/* Volume */}
              <button className="text-on-surface-variant hover:text-primary transition-colors hidden sm:block">
                <span className="material-symbols-outlined">volume_up</span>
              </button>
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-outline-variant rounded-3xl p-lg md:p-xl shadow-violet-sm"
            >
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xl">
                {currentQuestion?.content}
              </h2>

              <div className="flex flex-col gap-sm">
                {currentQuestion?.choices.map((choice) => (
                  <label
                    key={choice.id}
                    className="relative cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="qcm"
                      className="sr-only"
                      checked={currentAnswer === choice.id}
                      onChange={() => handleAnswer(choice.id)}
                    />
                    <div
                      className={cn(
                        "p-md rounded-xl border transition-all duration-200 flex items-center gap-md",
                        currentAnswer === choice.id
                          ? "border-primary bg-surface-container-low"
                          : "border-outline-variant bg-surface group-hover:bg-surface-container"
                      )}
                    >
                      {/* Custom radio */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          currentAnswer === choice.id
                            ? "border-primary"
                            : "border-outline-variant"
                        )}
                      >
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-transform",
                            currentAnswer === choice.id
                              ? "scale-100 bg-primary"
                              : "scale-0"
                          )}
                        />
                      </div>
                      <span className="font-body-lg text-body-lg text-on-surface">
                        {choice.content}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-md pb-8">
            <Button
              variant="secondary"
              size="default"
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
            >
              <span className="material-symbols-outlined">chevron_left</span>
              Précédent
            </Button>
            <Button size="default" onClick={handleNext}>
              {currentQuestionIndex === totalQuestions - 1
                ? "Terminer"
                : "Suivant"}
              <span className="material-symbols-outlined">chevron_right</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
