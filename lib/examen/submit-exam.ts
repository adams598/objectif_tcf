import { fetchJson } from "@/lib/api/fetch-json";
import type { ExamScoreResult } from "@/lib/examen/scoring";
import { saveGuestResult } from "@/lib/examen/guest-results";

export interface SubmitExamPayload {
  guestMode?: boolean;
  examTab?: string;
  durationSeconds: number;
  answers?: Record<string, string>;
  textResponses?: Record<string, string>;
  oralRecordings?: Record<string, string>;
  tasksCompleted?: number;
  correctionMode?: "instant" | "human";
}

export async function submitExamScore(
  seriesId: string,
  payload: SubmitExamPayload
): Promise<ExamScoreResult> {
  const result = await fetchJson<ExamScoreResult>(
    `/api/series/${seriesId}/play`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  saveGuestResult(result);
  return result;
}
