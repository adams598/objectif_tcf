"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const examHistory = [
  {
    date: "15 Oct 2024",
    type: "TCF Canada",
    nclc: "NCLC 9",
    duration: "2h 45min",
    isPassed: true,
  },
  {
    date: "01 Sep 2024",
    type: "Simulation CO",
    nclc: "NCLC 8.5",
    duration: "45min",
    isPassed: true,
  },
  {
    date: "20 Août 2024",
    type: "Simulation EE",
    nclc: "NCLC 8",
    duration: "1h",
    isPassed: false,
  },
];

const skillBadges = [
  { label: "CO NCLC 9", level: "NCLC 9", isPrimary: true },
  { label: "CE NCLC 10", level: "NCLC 10", isPrimary: true },
  { label: "EO NCLC 9", level: "NCLC 9", isPrimary: true },
  { label: "EE NCLC 8", level: "NCLC 8", isPrimary: false },
];

export function ProfilView() {
  return (
    <div className="flex flex-col gap-xl">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-primary to-primary-container rounded-2xl p-xl text-on-primary overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-on-primary/10 rounded-full" />
        <div className="absolute -left-5 -bottom-10 w-32 h-32 bg-on-primary/5 rounded-full" />

        <div className="flex flex-col md:flex-row items-start md:items-center gap-lg relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-on-primary/30">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCASNk8dqy_4f6rlJh-eG5hagBOR34SNfyoSRwfMSnsJv_fgeHmjL6EtCUpq9wgTS0U_Mo0bvFq8MASJxLX7FqyFHCsRZ1axxTGIunZFpOlzFgXuVadr-UQ5Cjy6moAF3S84v2rSaF39JorY7zmD9IQ7tNvkDjxQNA--YGeQjTZogd1h8_vpt5JEfGEqEhLjambmKCXO1IGM5ckrugsNvz-ohS_XLi-xlZcfE5YfO68JsiZy_zNWwZ1eYjWPzRkpJYu3od7KKJZ9mM"
                alt="Jean Dupont"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="absolute bottom-0 right-0 bg-success text-on-primary text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-on-primary">
              ✓
            </span>
          </div>

          <div className="flex-1">
            <h1 className="font-display-md text-[28px] font-bold text-on-primary mb-xs">
              Jean Dupont
            </h1>
            <p className="font-body-md text-body-md text-on-primary/70 mb-md">
              🇨🇦 Objectif: Résidence Permanente Canada · Membre depuis Sept. 2024
            </p>
            <div className="flex flex-wrap gap-sm">
              {skillBadges.map((badge) => (
                <span
                  key={badge.label}
                  className="px-sm py-xs bg-on-primary/20 text-on-primary rounded-full font-label-sm text-label-sm border border-on-primary/30"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          <Button variant="secondary" size="default">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Modifier le profil
          </Button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {[
          { label: "Examens complétés", value: "12", icon: "assignment_turned_in" },
          { label: "Score moyen", value: "NCLC 8.5", icon: "analytics" },
          { label: "Jours de streak", value: "14", icon: "local_fire_department" },
          { label: "Temps d'étude", value: "48h", icon: "schedule" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm flex flex-col items-center text-center"
          >
            <span className="material-symbols-outlined text-[28px] text-primary mb-sm">
              {stat.icon}
            </span>
            <div className="font-display-md text-[24px] text-on-surface font-bold">
              {stat.value}
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Skill Progress */}
      <div className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm">
        <h2 className="font-headline-lg text-[20px] text-on-surface font-bold mb-lg">
          Progression par compétence
        </h2>
        <div className="space-y-md">
          {[
            { label: "Compréhension Orale", progress: 90, nclc: "NCLC 9" },
            { label: "Compréhension Écrite", progress: 95, nclc: "NCLC 10" },
            { label: "Expression Écrite", progress: 78, nclc: "NCLC 8" },
            { label: "Expression Orale", progress: 85, nclc: "NCLC 9" },
          ].map((skill) => (
            <div key={skill.label}>
              <div className="flex justify-between mb-1">
                <span className="font-label-md text-label-md text-on-surface">
                  {skill.label}
                </span>
                <span className="font-label-sm text-label-sm text-primary font-bold">
                  {skill.nclc}
                </span>
              </div>
              <Progress value={skill.progress} size="default" />
            </div>
          ))}
        </div>
      </div>

      {/* Exam History */}
      <div className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm">
        <h2 className="font-headline-lg text-[20px] text-on-surface font-bold mb-lg">
          Historique des examens
        </h2>
        <div className="space-y-sm">
          {examHistory.map((exam, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-md rounded-xl border border-outline-variant hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-md">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    exam.isPassed
                      ? "bg-success-container text-success"
                      : "bg-error-container text-error"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {exam.isPassed ? "check" : "close"}
                  </span>
                </div>
                <div>
                  <div className="font-label-md text-label-md font-semibold text-on-surface">
                    {exam.type}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {exam.date} · {exam.duration}
                  </div>
                </div>
              </div>
              <Badge variant={exam.isPassed ? "default" : "error"}>
                {exam.nclc}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
