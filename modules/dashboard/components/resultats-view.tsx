"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

const radarData = [
  { subject: "CO", score: 9 },
  { subject: "CE", score: 10 },
  { subject: "EE", score: 8 },
  { subject: "EO", score: 9 },
];

const skillScores = [
  { label: "Compréhension Orale", nclc: "NCLC 9", key: "CO" },
  { label: "Compréhension Écrite", nclc: "NCLC 10", key: "CE" },
  { label: "Expression Orale", nclc: "NCLC 9", key: "EO" },
  { label: "Expression Écrite", nclc: "NCLC 8", key: "EE" },
];

const corrections = [
  {
    id: 1,
    type: "error",
    skill: "Expression Écrite - Tâche 2",
    subtitle: "Erreur de syntaxe complexe",
    penalty: "Pénalité: -1 pt",
    wrong: '"Bien que je suis d\'accord avec cette politique..."',
    correct: '"Bien que je sois d\'accord avec cette politique..."',
    comment:
      'Attention au subjonctif après "bien que". C\'est une erreur fréquente mais attendue à un niveau C1. Révisez la conjugaison du verbe être au subjonctif présent.',
  },
  {
    id: 2,
    type: "success",
    skill: "Expression Orale - Tâche 3",
    subtitle: "Excellente argumentation",
    penalty: "Bonus: +2 pts",
    comment:
      'Très belle utilisation des connecteurs logiques complexes ("Néanmoins", "En dépit de"). Votre fluidité et votre capacité à structurer votre pensée reflètent un niveau C2 solide.',
  },
];

export function ResultatsView() {
  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-md"
      >
        <div>
          <h1 className="font-display-md text-display-md text-primary mb-xs">
            Résultats de la simulation
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Épreuve TCF Canada du 15 Octobre 2024
          </p>
        </div>
        <div className="flex gap-md">
          <Button variant="secondary" size="default">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Télécharger PDF
          </Button>
          <Button size="default">
            <span className="material-symbols-outlined text-[18px]">replay</span>
            Repasser l&apos;examen
          </Button>
        </div>
      </motion.header>

      {/* Top Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Global Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-2xl p-xl border border-outline-variant shadow-violet-sm flex flex-col justify-center items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed rounded-bl-full opacity-20 blur-xl" />
          <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-md">
            Score Global
          </div>
          <div className="font-display-lg text-display-lg text-primary mb-sm">
            NCLC 9
          </div>
          <div className="inline-flex items-center gap-xs bg-success-container text-success px-sm py-xs rounded-full font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Objectif Atteint
          </div>
          <div className="w-full mt-lg">
            <Progress value={100} showLabel label="Progression vers RP" fillColor="success" />
          </div>
        </motion.div>

        {/* Radar + Skills */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-surface rounded-2xl p-xl border border-outline-variant shadow-violet-sm flex flex-col md:flex-row items-center gap-xl"
        >
          <div className="flex-1 w-full">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-sm">
              Profil de Compétences
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              Vos résultats dépassent la moyenne requise pour l&apos;immigration canadienne dans toutes les catégories.
            </p>
            <div className="grid grid-cols-2 gap-md">
              {skillScores.map((skill) => (
                <div
                  key={skill.key}
                  className="bg-surface-container-low p-md rounded-xl border border-surface-variant"
                >
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {skill.label}
                  </div>
                  <div className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
                    {skill.nclc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar chart */}
          <div className="w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e6e0e9" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#494551", fontSize: 10 }}
                />
                <Radar
                  dataKey="score"
                  stroke="#6750a4"
                  fill="#6750a4"
                  fillOpacity={0.2}
                  dot={{ fill: "#6750a4", r: 3 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed corrections */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-lg">
          Corrections Détaillées
        </h2>
        <div className="space-y-md">
          {corrections.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
            >
              <div className="flex items-start justify-between mb-md">
                <div className="flex items-center gap-sm">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === "error"
                        ? "bg-error-container text-error"
                        : "bg-success-container text-success"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {item.type === "error" ? "close" : "check"}
                    </span>
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold">
                      {item.skill}
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                <span
                  className={`font-label-sm text-label-sm px-sm py-xs rounded ${
                    item.type === "error"
                      ? "bg-surface-variant"
                      : "bg-success-container text-success"
                  }`}
                >
                  {item.penalty}
                </span>
              </div>

              {item.wrong && item.correct && (
                <div className="bg-surface-container-low p-md rounded-xl mb-md font-body-md text-body-md">
                  <p className="line-through text-on-surface-variant mb-xs">
                    {item.wrong}
                  </p>
                  <p className="text-primary font-medium">{item.correct}</p>
                </div>
              )}

              <div
                className={`flex gap-sm items-start p-md rounded-xl ${
                  item.type === "success"
                    ? "bg-surface-container-low"
                    : "bg-secondary-container/30"
                }`}
              >
                <span
                  className={`material-symbols-outlined mt-1 text-[20px] ${
                    item.type === "success" ? "text-success" : "text-primary"
                  }`}
                >
                  {item.type === "success" ? "star" : "lightbulb"}
                </span>
                <p className="font-body-md text-body-md text-on-surface">
                  <strong>Commentaire du correcteur:</strong> {item.comment}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
