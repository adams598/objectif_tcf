"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CompetencyRadarChartProps {
  competencies: Array<{ subject: string; score: number; target: number }>;
  notEvaluatedLabel: string;
  currentLevelLabel: string;
  targetLabel: string;
}

export function CompetencyRadarChart({
  competencies,
  notEvaluatedLabel,
  currentLevelLabel,
  targetLabel,
}: CompetencyRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={competencies}>
        <PolarGrid stroke="var(--outline-variant)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: "var(--on-surface-variant)",
            fontSize: 12,
            fontWeight: 500,
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--inverse-surface)",
            border: "none",
            borderRadius: "8px",
            color: "var(--inverse-on-surface)",
            fontSize: "12px",
          }}
          formatter={(value, name) => [
            Number(value) > 0 ? `NCLC ${value}` : notEvaluatedLabel,
            name === "score" ? currentLevelLabel : targetLabel,
          ]}
        />
        <Radar
          name="score"
          dataKey="score"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.2}
          dot={{
            fill: "var(--primary)",
            r: 4,
            strokeWidth: 2,
            stroke: "var(--surface)",
          }}
        />
        <Radar
          name="target"
          dataKey="target"
          stroke="var(--outline-variant)"
          fill="transparent"
          strokeDasharray="5 5"
          dot={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
