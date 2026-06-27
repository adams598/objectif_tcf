"use client";

import React from "react";
import { motion } from "framer-motion";
import { CompetencyRadar } from "./competency-radar";
import { CountdownCard } from "./countdown-card";
import { DailyGoalCard } from "./daily-goal-card";
import { ResumeTrainingCard } from "./resume-training-card";

interface DashboardViewProps {
  userName: string;
}

export function DashboardView({ userName }: DashboardViewProps) {
  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md"
      >
        <div>
          <h1 className="font-display-md text-display-md text-on-surface">
            Bonjour, {userName} 👋
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Prêt pour votre session d&apos;entraînement du jour ?
          </p>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-md">
          {/* Notifications */}
          <button className="p-sm rounded-full bg-surface border border-outline-variant text-on-surface-variant hover:text-primary transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface" />
          </button>

          {/* Target badge */}
          <div className="flex items-center gap-sm bg-surface px-md py-sm rounded-full border border-outline-variant shadow-sm">
            <span className="text-lg">🇨🇦</span>
            <span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant">
              Cible: Canada
            </span>
          </div>
        </div>
      </motion.header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        {/* Left Column: 8 cols */}
        <div className="md:col-span-8 flex flex-col gap-lg">
          {/* Competency Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <CompetencyRadar />
          </motion.div>

          {/* Resume Training */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ResumeTrainingCard />
          </motion.div>
        </div>

        {/* Right Column: 4 cols */}
        <div className="md:col-span-4 flex flex-col gap-lg">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <CountdownCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <DailyGoalCard />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
