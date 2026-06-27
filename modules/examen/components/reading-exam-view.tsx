"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const TARGET_DURATION_SEC = 60 * 45; // 45 min

interface Question {
  id: number;
  type: "title" | "question";
  text: string;
  choices?: { id: string; label: string }[];
}

interface TextSection {
  id: number;
  tag: string;
  title: string;
  content: string;
  questions: Question[];
}

const sections: TextSection[] = [
  {
    id: 1,
    tag: "Document A",
    title: "La révolution du télétravail au Canada",
    content: `Au Canada, le télétravail a connu une expansion sans précédent depuis 2020. Selon Statistique Canada, près de 40 % des employés canadiens travaillaient à domicile au plus fort de la pandémie. Aujourd'hui, même si ce chiffre a diminué, le modèle hybride s'est solidement implanté dans le paysage professionnel canadien.

Les avantages sont nombreux : réduction des temps de déplacement, meilleur équilibre vie professionnelle-vie personnelle et économies sur les frais de transport. Cependant, des défis persistent, notamment l'isolement social et la difficulté à maintenir une culture d'entreprise cohésive.

Le gouvernement fédéral envisage d'introduire un droit à la déconnexion dans les prochaines années, une initiative déjà adoptée par certaines provinces.`,
    questions: [
      {
        id: 1,
        type: "question",
        text: "Quel pourcentage d'employés canadiens travaillaient à domicile au plus fort de la pandémie ?",
        choices: [
          { id: "a", label: "20 %" },
          { id: "b", label: "30 %" },
          { id: "c", label: "40 %" },
          { id: "d", label: "50 %" },
        ],
      },
      {
        id: 2,
        type: "question",
        text: "Quelle mesure le gouvernement fédéral canadien envisage-t-il d'adopter ?",
        choices: [
          { id: "a", label: "L'obligation du présentiel à 100 %" },
          { id: "b", label: "Un droit à la déconnexion" },
          { id: "c", label: "La réduction de la semaine de travail" },
          { id: "d", label: "Des subventions pour le télétravail" },
        ],
      },
    ],
  },
  {
    id: 2,
    tag: "Document B",
    title: "Montréal : ville-modèle pour l'immigration francophone",
    content: `Montréal attire chaque année des dizaines de milliers de nouveaux arrivants francophones du monde entier. Son caractère bilingue, son dynamisme culturel et son coût de la vie relatif font d'elle une destination de choix pour ceux qui souhaitent s'établir au Canada tout en vivant en français.

Le Québec a mis en place des programmes d'immigration spécifiques, comme le Programme de l'expérience québécoise (PEQ), qui favorisent l'intégration des francophones qualifiés. Les candidats doivent démontrer leur maîtrise du français, notamment via le TCF Canada ou le TEF Canada.`,
    questions: [
      {
        id: 3,
        type: "question",
        text: "Quel programme québécois favorise l'intégration des francophones qualifiés ?",
        choices: [
          { id: "a", label: "Le Programme de résidence permanente (PRP)" },
          { id: "b", label: "Le Programme de l'expérience québécoise (PEQ)" },
          { id: "c", label: "Le Programme d'immigration express (PIE)" },
          { id: "d", label: "Le Programme d'accueil francophone (PAF)" },
        ],
      },
    ],
  },
];

interface ReadingExamViewProps {
  seriesId: string;
}

export function ReadingExamView({ seriesId }: ReadingExamViewProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(TARGET_DURATION_SEC);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const isTimeLow = timeLeft < 10 * 60;
  const section = sections[currentSection];

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
            Compréhension Écrite
          </span>
        </div>

        <div className="flex items-center gap-xl">
          <div className="hidden md:flex flex-col items-end gap-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {answeredCount} / {totalQuestions} questions répondues
            </span>
            <div className="w-32">
              <Progress value={progress} size="sm" />
            </div>
          </div>

          <div
            className={cn(
              "flex items-center gap-sm px-md py-sm rounded-full font-label-md text-label-md",
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

          <button
            onClick={() => router.push("/tableau-de-bord")}
            className="flex items-center gap-sm text-on-surface-variant hover:text-error transition-colors font-label-md text-label-md"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden md:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* Main split */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Text */}
        <section className="w-full lg:w-1/2 overflow-y-auto border-r border-outline-variant bg-surface-container-low p-xl">
          <div className="inline-flex items-center gap-xs px-sm py-xs bg-primary/10 text-primary rounded-md font-label-sm text-label-sm mb-md">
            <span className="material-symbols-outlined text-[16px]">article</span>
            {section.tag}
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">
            {section.title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
            {section.content}
          </p>
        </section>

        {/* Right: Questions */}
        <section className="w-full lg:w-1/2 overflow-y-auto p-xl flex flex-col gap-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-lg"
            >
              {section.questions.map((question) => (
                <div key={question.id}>
                  <p className="font-label-md text-label-md text-on-surface font-semibold mb-md">
                    Q{question.id}. {question.text}
                  </p>
                  <div className="space-y-sm">
                    {question.choices?.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: choice.id }))
                        }
                        className={cn(
                          "w-full flex items-center gap-md px-md py-sm rounded-xl border transition-all text-left",
                          answers[question.id] === choice.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-outline-variant hover:border-outline hover:bg-surface-container"
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors",
                            answers[question.id] === choice.id
                              ? "border-primary bg-primary text-on-primary"
                              : "border-outline text-on-surface-variant"
                          )}
                        >
                          {choice.id.toUpperCase()}
                        </span>
                        <span className="font-body-md text-body-md">{choice.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-lg border-t border-outline-variant">
            <Button
              variant="secondary"
              onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
              disabled={currentSection === 0}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Précédent
            </Button>

            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Document {currentSection + 1} / {sections.length}
            </span>

            {currentSection < sections.length - 1 ? (
              <Button onClick={() => setCurrentSection((s) => s + 1)}>
                Suivant
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Button>
            ) : (
              <Button onClick={() => router.push("/resultats")}>
                Terminer l&apos;examen
                <span className="material-symbols-outlined text-[18px]">check</span>
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
