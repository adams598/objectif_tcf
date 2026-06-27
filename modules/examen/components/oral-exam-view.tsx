"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const TARGET_DURATION_SEC = 60 * 15; // 15 min de préparation

interface OralTask {
  id: number;
  type: "monologue" | "dialogue" | "description";
  title: string;
  instruction: string;
  preparationTime: number;
  speakingTime: number;
  prompt: string;
}

const tasks: OralTask[] = [
  {
    id: 1,
    type: "monologue",
    title: "Tâche 1 — Présentation",
    instruction:
      "Vous devez présenter un sujet de manière structurée pendant 3 minutes. Vous disposez de 2 minutes de préparation.",
    preparationTime: 120,
    speakingTime: 180,
    prompt:
      "Présentez les avantages et les inconvénients du travail à distance pour les employés et les entreprises. Donnez des exemples concrets et votre opinion personnelle.",
  },
  {
    id: 2,
    type: "dialogue",
    title: "Tâche 2 — Interaction",
    instruction:
      "Vous participez à un débat avec le correcteur pendant 5 minutes. Exprimez votre point de vue et répondez aux arguments de votre interlocuteur.",
    preparationTime: 180,
    speakingTime: 300,
    prompt:
      "Débat : Le gouvernement devrait-il imposer un quota d'immigration pour les francophones ? Défendez votre position avec des arguments précis.",
  },
  {
    id: 3,
    type: "description",
    title: "Tâche 3 — Description d'image",
    instruction:
      "Décrivez l'image ci-dessous en détail, puis donnez votre interprétation et reliez-la à un contexte plus large.",
    preparationTime: 60,
    speakingTime: 120,
    prompt:
      "Décrivez cette image d'une scène de travail collaborative dans un bureau moderne. Quel message communique-t-elle selon vous ?",
  },
];

interface OralExamViewProps {
  seriesId: string;
}

export function OralExamView({ seriesId }: OralExamViewProps) {
  const router = useRouter();
  const [currentTask, setCurrentTask] = useState(0);
  const [phase, setPhase] = useState<"prepare" | "speak" | "done">("prepare");
  const [timeLeft, setTimeLeft] = useState(tasks[0].preparationTime);
  const [isRecording, setIsRecording] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  const task = tasks[currentTask];

  useEffect(() => {
    setTimeLeft(phase === "prepare" ? task.preparationTime : task.speakingTime);
    setIsRecording(false);
  }, [currentTask, phase, task.preparationTime, task.speakingTime]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStartSpeaking = () => {
    setPhase("speak");
    setIsRecording(true);
  };

  const handleNextTask = () => {
    setCompletedTasks((prev) => new Set([...prev, currentTask]));
    if (currentTask < tasks.length - 1) {
      setCurrentTask((t) => t + 1);
      setPhase("prepare");
    } else {
      router.push("/resultats");
    }
  };

  const progress = ((currentTask + (phase === "speak" ? 0.5 : 0)) / tasks.length) * 100;

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-outline-variant bg-surface/80 backdrop-blur-md flex justify-between items-center px-lg shrink-0 z-50">
        <div className="flex items-center gap-md">
          <span className="font-display-md text-display-md font-bold text-primary hidden md:block">
            Objectif Canada
          </span>
          <span className="font-display-md text-display-md font-bold text-primary md:hidden">OC</span>
          <div className="h-8 w-px bg-outline-variant mx-sm" />
          <span className="text-on-surface-variant font-label-md text-label-md">
            Expression Orale
          </span>
        </div>

        <div className="flex items-center gap-xl">
          <div className="hidden md:flex flex-col items-end gap-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Tâche {currentTask + 1} sur {tasks.length}
            </span>
            <div className="w-32">
              <Progress value={progress} size="sm" />
            </div>
          </div>

          <div
            className={cn(
              "flex items-center gap-sm px-md py-sm rounded-full font-label-md text-label-md",
              timeLeft < 30
                ? "bg-error-container text-on-error-container animate-pulse"
                : phase === "speak"
                ? "bg-error-container/30 text-error"
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

          <button
            onClick={() => router.push("/tableau-de-bord")}
            className="flex items-center gap-sm text-on-surface-variant hover:text-error transition-colors font-label-md text-label-md"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden md:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-xl overflow-y-auto">
        <div className="max-w-2xl w-full flex flex-col gap-lg">
          {/* Phase indicator */}
          <div className="flex items-center gap-lg">
            {tasks.map((t, i) => (
              <div key={t.id} className="flex items-center gap-sm flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold transition-all",
                    completedTasks.has(i)
                      ? "bg-success text-on-primary"
                      : i === currentTask
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant"
                  )}
                >
                  {completedTasks.has(i) ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < tasks.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-colors",
                      completedTasks.has(i) ? "bg-success" : "bg-outline-variant"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentTask}-${phase}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface rounded-2xl border border-outline-variant shadow-violet-sm overflow-hidden"
            >
              {/* Task header */}
              <div className="p-xl border-b border-outline-variant bg-surface-container-low">
                <div className="inline-flex items-center gap-xs px-sm py-xs rounded-md bg-primary/10 text-primary font-label-sm text-label-sm mb-sm">
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                  {phase === "prepare" ? "Temps de préparation" : "Temps de parole"}
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
                  {task.title}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {task.instruction}
                </p>
              </div>

              {/* Prompt */}
              <div className="p-xl">
                <div className="bg-secondary-container/30 rounded-xl p-lg mb-lg">
                  <h3 className="font-label-md text-label-md font-bold text-on-surface mb-sm">
                    Sujet :
                  </h3>
                  <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                    {task.prompt}
                  </p>
                </div>

                {/* Recording UI */}
                {phase === "speak" && (
                  <div className="flex flex-col items-center gap-lg mt-lg">
                    {/* Animated mic */}
                    <div className="relative">
                      <div
                        className={cn(
                          "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                          isRecording ? "bg-error/10" : "bg-surface-container"
                        )}
                      >
                        {isRecording && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-error/20"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          />
                        )}
                        <span
                          className={cn(
                            "material-symbols-outlined text-[48px]",
                            isRecording ? "text-error" : "text-on-surface-variant"
                          )}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          mic
                        </span>
                      </div>
                    </div>

                    {/* Waveform */}
                    {isRecording && (
                      <div className="flex items-center gap-1 h-12">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-error rounded-full"
                            animate={{ height: [4, Math.random() * 40 + 4, 4] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.5 + Math.random() * 0.5,
                              delay: i * 0.05,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <p className="font-label-md text-label-md text-on-surface-variant">
                      {isRecording ? "Enregistrement en cours..." : "Prêt à enregistrer"}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-md mt-lg">
                  {phase === "prepare" ? (
                    <Button size="default" onClick={handleStartSpeaking}>
                      <span className="material-symbols-outlined text-[18px]">mic</span>
                      Commencer à parler
                    </Button>
                  ) : (
                    <Button size="default" onClick={handleNextTask}>
                      {currentTask < tasks.length - 1 ? "Tâche suivante" : "Terminer l'examen"}
                      <span className="material-symbols-outlined text-[18px]">
                        {currentTask < tasks.length - 1 ? "arrow_forward" : "check"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
