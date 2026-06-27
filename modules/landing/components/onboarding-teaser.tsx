"use client";

import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Évaluation initiale",
    description:
      "Test diagnostique complet pour identifier vos forces et faiblesses.",
    active: true,
  },
  {
    number: 2,
    title: "Plan personnalisé",
    description:
      "Génération d'un calendrier d'étude adapté à votre date d'examen.",
    active: false,
  },
  {
    number: 3,
    title: "Entraînement ciblé",
    description: "Exercices spécifiques par compétence (CO, CE, EE, EO).",
    active: false,
  },
  {
    number: 4,
    title: "Simulations réelles",
    description:
      "Examens blancs chronométrés dans les conditions du TCF.",
    active: false,
  },
  {
    number: 5,
    title: "Validation C2",
    description:
      "Analyse des performances et feu vert pour l'examen officiel.",
    active: false,
  },
];

export function OnboardingTeaser() {
  return (
    <>
      {/* === DESKTOP VERSION === */}
      <section className="hidden md:block py-2xl px-md md:px-lg max-w-container-max mx-auto">
        <div className="mb-xl text-center md:text-left">
          <h2 className="font-display-md text-display-md md:text-display-lg text-on-surface font-bold mb-sm">
            Votre chemin vers l&apos;excellence
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Une méthode éprouvée en 5 étapes pour garantir votre niveau NCLC 7
            et plus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg items-center">
          {/* Steps List */}
          <div className="md:col-span-5 flex flex-col gap-md relative">
            {/* Connecting Line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-surface-variant z-0 hidden sm:block" />

            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative z-10 flex gap-md items-start group ${
                  !step.active ? "opacity-70 hover:opacity-100 transition-opacity" : ""
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-headline-lg shrink-0 shadow-md ${
                    step.active
                      ? "bg-primary text-on-primary"
                      : "bg-surface border-2 border-surface-variant text-on-surface-variant"
                  }`}
                >
                  {step.number}
                </div>
                <div className="pt-2">
                  <h3 className="font-headline-lg text-[20px] text-on-surface font-bold mb-xs">
                    {step.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Visual Mockup */}
          <div className="md:col-span-7 bg-surface-container rounded-2xl p-lg md:p-xl h-[500px] relative overflow-hidden flex items-center justify-center border border-outline-variant">
            <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-container-high opacity-50" />

            <div className="relative z-10 glass-panel w-full max-w-md rounded-2xl p-lg shadow-violet-lg border border-white/50">
              <div className="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-sm">
                <div>
                  <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                    Compétence Active
                  </h4>
                  <span className="font-headline-lg text-[20px] text-on-surface font-bold">
                    Compréhension Orale
                  </span>
                </div>
                <span className="px-sm py-xs bg-tertiary-container text-on-tertiary-container rounded text-xs font-bold">
                  C1 Visé
                </span>
              </div>

              <div className="space-y-md">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm mb-xs">
                    <span className="text-on-surface">Progression globale</span>
                    <span className="text-primary font-bold">78%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full w-[78%] transition-all duration-700" />
                  </div>
                </div>

                {/* Question Mockup */}
                <div className="bg-surface rounded-xl p-md border border-outline-variant/30">
                  <div className="flex items-center gap-sm mb-sm text-primary">
                    <span className="material-symbols-outlined">headphones</span>
                    <span className="font-label-sm text-label-sm">
                      Écoutez l&apos;enregistrement (0:45)
                    </span>
                  </div>
                  <div className="h-10 bg-surface-container-highest rounded-lg w-full mb-sm flex items-center px-sm">
                    <div className="w-full h-1 bg-outline-variant/50 rounded-full">
                      <div className="h-full bg-primary w-1/3 rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow" />
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full btn-primary py-sm rounded-lg font-label-md text-label-md flex justify-center items-center gap-xs">
                  Continuer la série
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === MOBILE VERSION === */}
      <section id="methode" className="md:hidden py-xl px-md bg-surface">
        <div className="text-center mb-xl">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface mb-sm">
            Votre chemin vers le succès
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Une progression en 5 étapes structurées.
          </p>
        </div>

        <div className="relative pl-lg border-l-2 border-outline-variant space-y-xl ml-sm">
          {steps.slice(0, 3).map((step) => (
            <div key={step.number} className="relative">
              <div
                className={`absolute -left-[30px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md font-bold shadow-sm ${
                  step.active
                    ? "bg-primary text-on-primary"
                    : step.number === 2
                    ? "bg-surface-container-highest border-2 border-primary text-primary"
                    : "bg-surface-container-highest border-2 border-outline text-outline"
                }`}
              >
                {step.number}
              </div>
              <div
                className={`bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-violet-sm ${
                  step.number > 2 ? "opacity-60" : ""
                }`}
              >
                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs">
                  {step.title}
                </h3>
                <p className="font-body-md text-[14px] text-on-surface-variant">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-lg text-center">
          <button className="text-primary font-label-md text-label-md font-semibold underline hover:text-surface-tint">
            Voir les 5 étapes complètes
          </button>
        </div>
      </section>
    </>
  );
}
