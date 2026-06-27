"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Skill = "CO" | "CE" | "EE" | "EO" | "FULL";
type Difficulty = "Débutant" | "Intermédiaire" | "Avancé";

interface Series {
  id: string;
  title: string;
  skill: Skill;
  difficulty: Difficulty;
  questions: number;
  duration: number;
  nclcLevel: string;
  completed: boolean;
  score?: number;
  isLocked?: boolean;
}

const allSeries: Series[] = [
  {
    id: "co-001",
    title: "Compréhension Orale — Série 1",
    skill: "CO",
    difficulty: "Intermédiaire",
    questions: 29,
    duration: 40,
    nclcLevel: "NCLC 7-8",
    completed: true,
    score: 85,
  },
  {
    id: "co-002",
    title: "Compréhension Orale — Série 2",
    skill: "CO",
    difficulty: "Avancé",
    questions: 29,
    duration: 40,
    nclcLevel: "NCLC 9-10",
    completed: false,
  },
  {
    id: "ce-001",
    title: "Compréhension Écrite — Série 1",
    skill: "CE",
    difficulty: "Intermédiaire",
    questions: 29,
    duration: 45,
    nclcLevel: "NCLC 7-8",
    completed: true,
    score: 92,
  },
  {
    id: "ee-001",
    title: "Expression Écrite — Série 1",
    skill: "EE",
    difficulty: "Intermédiaire",
    questions: 2,
    duration: 60,
    nclcLevel: "NCLC 7-8",
    completed: false,
  },
  {
    id: "eo-001",
    title: "Expression Orale — Série 1",
    skill: "EO",
    difficulty: "Intermédiaire",
    questions: 3,
    duration: 15,
    nclcLevel: "NCLC 7-8",
    completed: false,
  },
  {
    id: "full-001",
    title: "Simulation Complète TCF Canada",
    skill: "FULL",
    difficulty: "Avancé",
    questions: 65,
    duration: 150,
    nclcLevel: "NCLC 9-10",
    completed: false,
    isLocked: false,
  },
];

const skillLabels: Record<Skill, string> = {
  CO: "Compréhension Orale",
  CE: "Compréhension Écrite",
  EE: "Expression Écrite",
  EO: "Expression Orale",
  FULL: "Simulation complète",
};

const skillColors: Record<Skill, string> = {
  CO: "bg-primary/10 text-primary",
  CE: "bg-secondary/10 text-secondary",
  EE: "bg-tertiary/10 text-tertiary",
  EO: "bg-success-container text-success",
  FULL: "bg-gradient-primary text-on-primary",
};

const skillIcons: Record<Skill, string> = {
  CO: "hearing",
  CE: "auto_stories",
  EE: "edit_note",
  EO: "mic",
  FULL: "psychology",
};

const examRoutes: Record<Skill, string> = {
  CO: "/examen/serie",
  CE: "/examen/serie",
  EE: "/examen/serie",
  EO: "/examen/serie",
  FULL: "/examen/serie",
};

const filters: Array<Skill | "Tous"> = ["Tous", "CO", "CE", "EE", "EO", "FULL"];

export function SeriesView() {
  const [activeFilter, setActiveFilter] = useState<Skill | "Tous">("Tous");
  const [search, setSearch] = useState("");

  const filtered = allSeries.filter((s) => {
    const matchFilter = activeFilter === "Tous" || s.skill === activeFilter;
    const matchSearch =
      !search || s.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const completedCount = allSeries.filter((s) => s.completed).length;
  const progress = (completedCount / allSeries.length) * 100;

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-md"
      >
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
            Mes Séries
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {completedCount} / {allSeries.length} séries complétées
          </p>
          <div className="mt-sm w-64">
            <Progress value={progress} showLabel label={`Progression globale`} />
          </div>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-md">
        <div className="flex items-center gap-sm bg-surface border border-outline-variant rounded-xl px-md py-sm flex-1">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            search
          </span>
          <input
            className="flex-1 outline-none bg-transparent font-body-md text-body-md placeholder:text-on-surface-variant/50"
            placeholder="Rechercher une série..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-sm overflow-x-auto pb-xs">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-md py-xs rounded-full font-label-sm text-label-sm whitespace-nowrap transition-all",
                activeFilter === f
                  ? "bg-primary text-on-primary shadow-violet-sm"
                  : "bg-surface border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
              )}
            >
              {f === "Tous" ? "Toutes" : skillLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
        {filtered.map((series, i) => (
          <motion.div
            key={series.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "bg-surface rounded-2xl border border-outline-variant shadow-violet-sm overflow-hidden transition-all hover:shadow-violet-md hover:-translate-y-0.5",
              series.isLocked && "opacity-60"
            )}
          >
            {/* Skill color band */}
            <div
              className={cn(
                "h-1.5",
                series.skill === "CO"
                  ? "bg-primary"
                  : series.skill === "CE"
                  ? "bg-secondary"
                  : series.skill === "EE"
                  ? "bg-tertiary"
                  : series.skill === "EO"
                  ? "bg-success"
                  : "bg-gradient-primary"
              )}
            />

            <div className="p-lg">
              <div className="flex items-start justify-between mb-md">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    skillColors[series.skill]
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {skillIcons[series.skill]}
                  </span>
                </div>
                <div className="flex gap-sm">
                  {series.completed && (
                    <Badge variant="success">Complété</Badge>
                  )}
                  {series.isLocked && (
                    <Badge variant="outline">
                      <span className="material-symbols-outlined text-[14px] mr-1">lock</span>
                      Verrouillé
                    </Badge>
                  )}
                </div>
              </div>

              <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs">
                {series.title}
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-lg">
                {series.difficulty} · {series.nclcLevel}
              </p>

              {series.score !== undefined && (
                <div className="mb-md">
                  <div className="flex justify-between mb-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Meilleur score
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">
                      {series.score}%
                    </span>
                  </div>
                  <Progress value={series.score} fillColor="primary" size="sm" />
                </div>
              )}

              <div className="flex items-center gap-md text-on-surface-variant font-label-sm text-label-sm mb-lg">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">help_outline</span>
                  {series.questions} questions
                </span>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {series.duration} min
                </span>
              </div>

              <Link href={`${examRoutes[series.skill]}/${series.id}`}>
                <Button
                  variant={series.completed ? "secondary" : "primary"}
                  size="default"
                  className="w-full"
                  disabled={!!series.isLocked}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {series.completed ? "replay" : "play_arrow"}
                  </span>
                  {series.completed ? "Repasser" : "Commencer"}
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
