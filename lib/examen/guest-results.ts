import type { ExamScoreResult } from "./scoring";

const STORAGE_KEY = "oc_last_exam_result";
const HISTORY_KEY = "oc_exam_results_history";

export function saveGuestResult(result: ExamScoreResult): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));

  try {
    const history: ExamScoreResult[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY) ?? "[]"
    );
    history.unshift(result);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
  } catch {
    // ignore quota errors
  }
}

export function updateGuestResultWithAiCorrection(
  aiCorrection: NonNullable<ExamScoreResult["details"]>["aiCorrection"]
): ExamScoreResult | null {
  const current = loadGuestResult();
  if (!current || !aiCorrection) return null;

  const updated: ExamScoreResult = {
    ...current,
    percentage: aiCorrection.overallScore,
    cecrLevel: aiCorrection.cecrLevel,
    nclcLevel: aiCorrection.nclcLevel,
    details: {
      ...current.details,
      correctionStatus: "completed",
      aiCorrection,
      taskScores: aiCorrection.tasks.map((t) => ({
        taskId: t.taskId,
        wordCount: t.wordCount,
        compliant: t.compliant,
      })),
    },
  };

  saveGuestResult(updated);
  return updated;
}

export function loadGuestResult(): ExamScoreResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExamScoreResult;
  } catch {
    return null;
  }
}

export function clearGuestResult(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function navigateToResults(
  result: ExamScoreResult,
  router: { push: (href: string) => void },
  guestMode?: boolean
): void {
  saveGuestResult(result);
  const params = new URLSearchParams();
  if (result.examTab) params.set("examen", result.examTab);
  params.set("skill", result.skill);

  if (guestMode) {
    router.push(`/preparation/resultats?${params.toString()}`);
  } else {
    router.push(`/resultats?${params.toString()}`);
  }
}
