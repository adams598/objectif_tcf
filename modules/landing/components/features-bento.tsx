"use client";

import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    id: "banque",
    icon: "library_books",
    title: "Banque de questions exhaustive",
    description:
      "Plus de 2500 questions conformes aux annales récentes. Renouvelées mensuellement pour coller parfaitement aux tendances de l'examen officiel.",
    bgColor: "bg-primary-container",
    textColor: "text-on-primary-container",
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    rowSpan: "row-span-2",
    size: "large",
  },
  {
    id: "oral",
    icon: "record_voice_over",
    title: "Labo d'Expression Orale",
    description:
      "Enregistrez vos réponses, chronométrez-vous et comparez avec des modèles C2.",
    bgColor: "bg-secondary-container",
    textColor: "text-on-secondary-container",
    colSpan: "",
    rowSpan: "",
    size: "small",
  },
  {
    id: "ia",
    icon: "edit_document",
    title: "Correction IA (Écrit)",
    description:
      "Feedback instantané sur la grammaire, le lexique et la structure de vos tâches.",
    bgColor: "bg-tertiary-container",
    textColor: "text-on-tertiary-container",
    colSpan: "",
    rowSpan: "",
    size: "small",
  },
  {
    id: "timer",
    icon: "timer",
    title: "Gestion du temps",
    description:
      "Interface d'examen reproduisant exactement le stress et le chronomètre officiels.",
    bgColor: "bg-error-container",
    textColor: "text-on-error-container",
    colSpan: "",
    rowSpan: "",
    size: "small",
  },
  {
    id: "analytics",
    icon: "monitoring",
    title: "Analytiques NCLC",
    description:
      "Suivez votre progression convertie directement en niveaux canadiens.",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    colSpan: "",
    rowSpan: "",
    size: "small",
  },
  {
    id: "community",
    icon: "forum",
    title: "Communauté & Support",
    description:
      "Ne préparez pas seul. Rejoignez des milliers d'autres candidats, échangez des astuces, et bénéficiez du support de nos professeurs experts certifiés.",
    bgColor: "bg-surface-variant",
    textColor: "text-on-surface",
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    rowSpan: "",
    size: "wide",
  },
  {
    id: "mobile",
    icon: "phone_iphone",
    title: "100% Mobile",
    description:
      "Révisez dans les transports. Interface optimisée pour smartphone et tablette.",
    bgColor: "bg-secondary/10",
    textColor: "text-secondary",
    colSpan: "",
    rowSpan: "",
    size: "small",
  },
  {
    id: "garantie",
    icon: "verified_user",
    title: "Garantie C2",
    description:
      "Atteignez vos objectifs ou nous prolongeons votre accès gratuitement.",
    bgColor: "bg-tertiary/10",
    textColor: "text-tertiary",
    colSpan: "",
    rowSpan: "",
    size: "small",
  },
];

export function FeaturesBento() {
  return (
    <>
      {/* === DESKTOP === */}
      <section className="hidden md:block py-2xl bg-surface">
        <div className="max-w-container-max mx-auto px-md md:px-lg">
          <div className="text-center mb-xl">
            <h2 className="font-display-md text-display-md md:text-display-lg text-on-surface font-bold mb-sm">
              Tout pour réussir. Sans superflu.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Une suite d&apos;outils conçue spécifiquement pour les exigences de
              l&apos;immigration canadienne.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-md">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={`bg-surface-container-low border border-surface-variant rounded-2xl p-lg hover:border-primary/30 transition-colors group ${feature.colSpan} ${feature.rowSpan} ${
                  feature.size === "large" ? "flex flex-col" : ""
                }`}
              >
                <div
                  className={`${
                    feature.size === "large"
                      ? "w-12 h-12 rounded-xl mb-md"
                      : "w-10 h-10 rounded-lg mb-sm"
                  } ${feature.bgColor} ${feature.textColor} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      feature.size === "large" ? "text-[24px]" : "text-[20px]"
                    }`}
                  >
                    {feature.icon}
                  </span>
                </div>

                <h3
                  className={`font-bold text-on-surface mb-xs ${
                    feature.size === "large"
                      ? "font-headline-lg text-[24px]"
                      : "font-label-md text-label-md text-lg"
                  }`}
                >
                  {feature.title}
                </h3>

                <p
                  className={`text-on-surface-variant ${
                    feature.size === "large"
                      ? "font-body-md text-body-md mb-lg flex-grow"
                      : "font-body-md text-body-md text-sm"
                  }`}
                >
                  {feature.description}
                </p>

                {feature.size === "large" && (
                  <div className="h-32 bg-surface rounded-xl border border-outline-variant/30 flex items-center justify-center opacity-70">
                    <span className="text-on-surface-variant font-label-sm">
                      Illustration Banque
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === MOBILE === */}
      <section className="md:hidden py-xl px-md bg-surface-container-lowest">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface mb-lg text-center">
          Maîtrisez les 4 compétences
        </h2>
        <div className="grid grid-cols-1 gap-md">
          {[
            {
              icon: "headphones",
              title: "Compréhension Orale",
              desc: "Simulations d'écoute avec accents québécois et français. Exercices chronométrés.",
            },
            {
              icon: "mic",
              title: "Expression Orale",
              desc: "Outils d'enregistrement et feedback automatisé sur la prononciation et la fluidité.",
            },
            {
              icon: "menu_book",
              title: "Compréhension Écrite",
              desc: "Textes d'actualité canadiens, questions QCM progressives du niveau A2 au C2.",
            },
            {
              icon: "edit_document",
              title: "Expression Écrite",
              desc: "Correction IA instantanée. Modèles de réponse C2 détaillés par type de tâche.",
            },
          ].map((skill) => (
            <div
              key={skill.icon}
              className="bg-surface p-md rounded-2xl border border-outline-variant shadow-violet-sm flex flex-col gap-md"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">
                  {skill.icon}
                </span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs">
                  {skill.title}
                </h3>
                <p className="font-body-md text-[14px] text-on-surface-variant">
                  {skill.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
