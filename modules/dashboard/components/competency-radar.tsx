"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Progress } from "@/components/ui/progress";

const data = [
  { subject: "CO", score: 9, target: 9 },
  { subject: "CE", score: 8, target: 9 },
  { subject: "EE", score: 8.5, target: 9 },
  { subject: "EO", score: 7.5, target: 9 },
];

const fullLabels: Record<string, string> = {
  CO: "Compréhension Orale",
  CE: "Compréhension Écrite",
  EE: "Expression Écrite",
  EO: "Expression Orale",
};

export function CompetencyRadar() {
  return (
    <div className="glass-panel rounded-2xl p-lg flex flex-col lg:flex-row gap-xl items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-container opacity-20 rounded-full blur-3xl pointer-events-none" />

      {/* Text side */}
      <div className="flex-1 w-full flex flex-col gap-md z-10">
        <h3 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-on-surface">
          Profil de Compétences
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Votre niveau actuel estimé par rapport à l&apos;objectif NCLC 9.
        </p>

        {/* Global score */}
        <div className="flex items-end gap-sm mt-md">
          <span className="font-display-lg text-display-lg text-primary leading-none">
            8.5
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-widest">
            NCLC Global Estimé
          </span>
        </div>

        {/* Progress to NCLC 9 */}
        <div className="mt-sm">
          <Progress
            value={94}
            showLabel
            label="Progression vers NCLC 9"
            size="default"
          />
        </div>

        {/* Per skill scores */}
        <div className="grid grid-cols-2 gap-sm mt-md">
          {data.map((item) => (
            <div
              key={item.subject}
              className="bg-surface rounded-xl p-sm border border-outline-variant/50"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {item.subject}
                </span>
                <span className="font-label-sm text-label-sm text-primary font-bold">
                  {item.score}/12
                </span>
              </div>
              <p className="font-label-sm text-[10px] text-on-surface-variant">
                {fullLabels[item.subject]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full max-w-[280px] aspect-square relative z-10 bg-surface rounded-xl p-md border border-outline-variant shadow-sm flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e6e0e9" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill: "#494551",
                fontSize: 12,
                fontFamily: "Inter",
                fontWeight: 500,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(29, 27, 32, 0.9)",
                border: "none",
                borderRadius: "8px",
                color: "#f5eff7",
                fontSize: "12px",
                fontFamily: "Inter",
              }}
              formatter={(value, name) => [
                `NCLC ${value}`,
                name === "score" ? "Niveau actuel" : "Objectif",
              ]}
            />
            <Radar
              name="score"
              dataKey="score"
              stroke="#6750a4"
              fill="#6750a4"
              fillOpacity={0.2}
              dot={{ fill: "#6750a4", r: 4, strokeWidth: 2, stroke: "#fff" }}
            />
            <Radar
              name="target"
              dataKey="target"
              stroke="#e6e0e9"
              fill="transparent"
              strokeDasharray="5 5"
              dot={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
