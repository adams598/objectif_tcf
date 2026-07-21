import type { ExamScoreResult } from "@/lib/examen/scoring";
import type { WritingCorrectionResult } from "@/lib/ai/writing-correction-types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR");
}

export function buildExamResultReport(
  result: ExamScoreResult,
  labels: {
    title: string;
    skill: string;
    score: string;
    cecrl: string;
    nclc: string;
    duration: string;
    completedAt: string;
    recommendations: string;
    aiFeedback?: string;
  },
  recommendations: string[],
  aiCorrection?: WritingCorrectionResult | null
): string {
  const lines = [
    "Objectif TCF — Rapport de résultats",
    "===================================",
    "",
    `${labels.title}`,
    `${labels.skill}: ${result.skill}`,
    `${labels.completedAt}: ${formatDate(result.completedAt)}`,
    "",
    `${labels.score}: ${result.percentage}%`,
    `${labels.cecrl}: ${result.cecrLevel}`,
    `${labels.nclc}: NCLC ${result.nclcLevel}`,
    `${labels.duration}: ${Math.floor(result.durationSeconds / 60)} min ${result.durationSeconds % 60} s`,
  ];

  if (result.correctCount != null && result.totalQuestions) {
    lines.push(
      `Bonnes réponses: ${result.correctCount}/${result.totalQuestions}`
    );
  }

  if (aiCorrection) {
    lines.push("", labels.aiFeedback ?? "Analyse IA", aiCorrection.globalFeedback);
    for (const task of aiCorrection.tasks) {
      lines.push(
        "",
        `Tâche ${task.taskId} — ${task.score}/100`,
        `Points forts: ${task.strengths.join("; ")}`,
        `À améliorer: ${task.improvements.join("; ")}`
      );
    }
  }

  lines.push("", labels.recommendations);
  for (const rec of recommendations) {
    lines.push(`- ${rec}`);
  }

  return lines.join("\n");
}

export function downloadExamResultReport(
  content: string,
  filename: string
): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
