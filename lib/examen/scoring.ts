export type SkillAbbrev = "CO" | "CE" | "EE" | "EO";

export interface WritingTaskScoreSummary {
  taskId: number;
  wordCount: number;
  compliant: boolean;
}

export interface QcmQuestion {
  id: string;
  order: number;
  content: string;
  choices: { id: string; content: string }[];
  correctChoiceId: string;
  audioUrl?: string;
  imageUrl?: string;
}

export interface AnswerReviewItem {
  questionId: string;
  order: number;
  question: string;
  yourAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface ExamScoreResult {
  skill: SkillAbbrev;
  seriesId: string;
  /** ID de la tentative persistée (compte connecté) — pour PDF / Documents */
  attemptId?: string;
  examTab?: string;
  guestMode: boolean;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  cecrLevel: string;
  nclcLevel: number;
  durationSeconds: number;
  completedAt: string;
  details?: {
    taskScores?: WritingTaskScoreSummary[];
    tasksCompleted?: number;
    correctionMode?: "instant" | "human";
    correctionToken?: string;
    correctionStatus?: "pending" | "processing" | "completed" | "failed";
    aiCorrection?: import("@/lib/ai/writing-correction-types").WritingCorrectionResult;
    /** Revue QCM : surtout les questions ratées (+ éventuellement les bonnes). */
    answerReview?: AnswerReviewItem[];
    /** Stats d’activité apprenant (séries faites / dernière activité). */
    activityStats?: LearnerActivityStats;
  };
}

export interface LearnerActivityStats {
  seriesCompleted: number;
  seriesPartial: number;
  seriesStarted: number;
  lastActivityAt: string | null;
  lastOpenedSeriesAt: string | null;
}

export function scoreQcm(
  questions: Pick<QcmQuestion, "id" | "correctChoiceId">[],
  answers: Record<string, string>
) {
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctChoiceId) correct++;
  }
  const total = questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, percentage };
}

/** Niveau CECRL estimé (A1 → C2) à partir du score de la série. */
export function percentageToCecr(percentage: number): string {
  if (percentage >= 95) return "C2";
  if (percentage >= 85) return "C1";
  if (percentage >= 75) return "B2";
  if (percentage >= 60) return "B1";
  if (percentage >= 45) return "A2";
  return "A1";
}

export function percentageToNclc(percentage: number): number {
  if (percentage >= 90) return 9;
  if (percentage >= 80) return 8;
  if (percentage >= 70) return 7;
  if (percentage >= 60) return 6;
  if (percentage >= 50) return 5;
  if (percentage >= 40) return 4;
  if (percentage >= 30) return 3;
  if (percentage >= 20) return 2;
  return 1;
}

export function scoreWritingTasks(
  tasks: Array<{ id: number; minWords: number; maxWords: number }>,
  contents: Record<number, string>
) {
  const taskScores = tasks.map((task) => {
    const wordCount = contents[task.id]
      ?.trim()
      .split(/\s+/)
      .filter(Boolean).length ?? 0;
    const compliant =
      wordCount >= task.minWords && wordCount <= task.maxWords;
    return { taskId: task.id, wordCount, compliant };
  });

  const compliantCount = taskScores.filter((t) => t.compliant).length;
  const percentage = Math.round((compliantCount / tasks.length) * 70 + 15);
  const clamped = Math.min(95, Math.max(20, percentage));

  return {
    taskScores,
    percentage: clamped,
    correctCount: compliantCount,
    total: tasks.length,
  };
}

export function scoreOralTasks(
  totalTasks: number,
  completedTasks: number,
  correctionMode: "instant" | "human"
) {
  const ratio = completedTasks / totalTasks;
  const base = Math.round(ratio * 60 + 25);
  const bonus = correctionMode === "instant" ? 5 : 0;
  const percentage = Math.min(90, base + bonus);

  return {
    percentage,
    correctCount: completedTasks,
    total: totalTasks,
  };
}

export function buildScoreResult(
  base: Omit<
    ExamScoreResult,
    "cecrLevel" | "nclcLevel" | "completedAt" | "percentage"
  > & { percentage: number }
): ExamScoreResult {
  return {
    ...base,
    cecrLevel: percentageToCecr(base.percentage),
    nclcLevel: percentageToNclc(base.percentage),
    completedAt: new Date().toISOString(),
  };
}
