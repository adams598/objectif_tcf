"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const MAX_WORDS = 250;
const MIN_WORDS = 200;
const TARGET_DURATION_SEC = 60 * 60; // 1h

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

interface WritingExamViewProps {
  seriesId: string;
}

export function WritingExamView({ seriesId }: WritingExamViewProps) {
  const router = useRouter();
  const [content, setContent] = useState(
    `Objet : Réaction à votre article sur la fin du télétravail

Monsieur le Rédacteur en chef,

C'est avec un vif intérêt que j'ai pris connaissance de votre article paru ce matin concernant la décision de plusieurs entreprises d'imposer un retour complet au bureau. Je tiens à exprimer mon profond désaccord face à cette tendance que je juge anachronique et contre-productive.

Premièrement, l'argument selon lequel le présentiel strict est l'unique garant de la collaboration me semble dépassé. Les outils numériques actuels, s'ils sont bien maîtrisés, permettent une synergie d'équipe tout aussi efficace.`
  );
  const [timeLeft, setTimeLeft] = useState(TARGET_DURATION_SEC);
  const [lastSaved, setLastSaved] = useState("14:32");
  const wordCount = countWords(content);
  const wordProgress = Math.min((wordCount / MAX_WORDS) * 100, 100);
  const isTooShort = wordCount < MIN_WORDS;
  const isTooLong = wordCount > MAX_WORDS;

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

  const toolbarButtons = [
    { icon: "format_bold", title: "Gras", cmd: "bold" },
    { icon: "format_italic", title: "Italique", cmd: "italic" },
    { icon: "format_underlined", title: "Souligné", cmd: "underline" },
  ];

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
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface-variant">
            Expression Écrite
          </span>
        </div>

        <div className="flex items-center gap-xl">
          <div className="hidden md:flex flex-col items-end gap-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Tâche 2 sur 2</span>
            <div className="w-32">
              <Progress value={50} size="sm" />
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-sm px-md py-sm rounded-full font-label-md text-label-md",
            isTimeLow ? "bg-error-container text-on-error-container" : "bg-surface-container text-on-surface"
          )}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => router.push("/tableau-de-bord")}
            className="flex items-center gap-sm text-on-surface-variant hover:text-error transition-colors font-label-md text-label-md"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden md:inline">Quitter l&apos;examen</span>
          </button>
        </div>
      </header>

      {/* Split layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Task Instructions */}
        <section className="w-full lg:w-[45%] h-64 lg:h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-low p-gutter flex flex-col gap-lg">
          <div>
            <div className="inline-flex items-center gap-xs px-sm py-xs bg-primary/10 text-primary rounded-md font-label-sm text-label-sm mb-md">
              <span className="material-symbols-outlined text-[16px]">article</span>
              Document de référence
            </div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-sm">
              La fin du travail à distance : un retour en arrière ?
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              De nombreuses entreprises technologiques imposent désormais un retour total en présentiel.
              Des géants comme Amazon, Google et Apple ont annoncé des politiques strictes exigeant
              la présence au bureau cinq jours par semaine. Cette tendance soulève des débats passionnés
              entre partisans de la flexibilité et défenseurs de la culture d&apos;entreprise présentielle.
            </p>
          </div>

          <div className="bg-surface border border-primary/20 rounded-xl p-md">
            <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-sm">edit</span>
              Votre tâche
            </h4>
            <p className="text-on-surface-variant font-body-md text-body-md">
              Écrivez une lettre au rédacteur en chef du journal pour exprimer votre opinion sur
              cette question. Développez au moins trois arguments pour justifier votre point de vue.
            </p>
            <ul className="list-disc list-inside mt-sm text-on-surface-variant space-y-xs ml-xs font-body-md text-body-md">
              <li>Longueur exigée : <strong>200 à 250 mots</strong>.</li>
              <li>Format : Lettre formelle.</li>
            </ul>
          </div>
        </section>

        {/* Right: Editor */}
        <section className="w-full lg:w-[55%] flex-1 flex flex-col bg-surface overflow-hidden">
          {/* Toolbar */}
          <div className="h-14 border-b border-outline-variant bg-surface-container flex items-center px-md gap-sm shrink-0">
            <div className="flex items-center gap-xs pr-sm border-r border-outline-variant">
              {toolbarButtons.map((btn) => (
                <button
                  key={btn.cmd}
                  title={btn.title}
                  className="w-8 h-8 rounded hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-xs pr-sm border-r border-outline-variant">
              {[
                { icon: "format_list_bulleted", title: "Liste à puces" },
                { icon: "format_list_numbered", title: "Liste numérotée" },
              ].map((btn) => (
                <button
                  key={btn.title}
                  title={btn.title}
                  className="w-8 h-8 rounded hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-xs">
              {[
                { icon: "undo", title: "Annuler" },
                { icon: "redo", title: "Rétablir" },
              ].map((btn) => (
                <button
                  key={btn.title}
                  title={btn.title}
                  className="w-8 h-8 rounded hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Writing area */}
          <div className="flex-1 overflow-y-auto p-gutter lg:p-xl cursor-text relative group">
            <div className="absolute left-0 top-0 w-1 h-full bg-transparent group-focus-within:bg-primary transition-colors duration-300" />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[500px] outline-none font-body-lg text-body-lg text-on-surface leading-relaxed resize-none bg-transparent placeholder:text-on-surface-variant/50"
              placeholder="Commencez à rédiger votre réponse ici..."
            />
          </div>

          {/* Footer */}
          <div className="h-12 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between px-gutter shrink-0">
            <div className="flex items-center gap-xs text-secondary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] animate-pulse">cloud_done</span>
              <span>Enregistré automatiquement à {lastSaved}</span>
            </div>

            <div className="flex items-center gap-md">
              {/* Word progress ring */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="transparent" stroke="#e6e0e9" strokeWidth="3" />
                  <circle
                    cx="12" cy="12" r="10" fill="transparent"
                    stroke="#4f378a"
                    strokeWidth="3"
                    strokeDasharray="62.8"
                    strokeDashoffset={62.8 - (62.8 * wordProgress) / 100}
                    className="transition-all duration-500"
                  />
                </svg>
              </div>

              <div className="font-label-md text-label-md">
                <span className={cn(
                  "font-bold",
                  isTooShort ? "text-tertiary" : isTooLong ? "text-error" : "text-on-surface"
                )}>
                  {wordCount}
                </span>
                <span className="text-on-surface-variant"> / {MAX_WORDS} mots</span>
              </div>

              {(isTooShort || isTooLong) && (
                <div className="flex items-center gap-xs text-error font-label-sm text-label-sm ml-sm bg-error-container px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  {isTooShort ? "Trop court" : "Trop long"}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
