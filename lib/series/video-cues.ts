import { isEmbeddableVideoUrl } from "@/lib/media/video-upload";

export const MAX_QUESTIONS_PER_CUE = 3;

export type SeriesVideoCue = {
  id: string;
  timeSec: number;
  questionIds: string[];
};

export function canUseNativeVideoCues(videoUrl: string | null | undefined): boolean {
  if (!videoUrl?.trim()) return false;
  return !isEmbeddableVideoUrl(videoUrl);
}

export function parseVideoCues(value: unknown): SeriesVideoCue[] {
  if (!Array.isArray(value)) return [];

  const cues: SeriesVideoCue[] = [];
  const seenQuestionIds = new Set<string>();

  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : "";
    const timeSec = Number(item.timeSec);
    if (!id || !Number.isFinite(timeSec) || timeSec < 0) continue;

    const questionIds = Array.isArray(item.questionIds)
      ? item.questionIds
          .filter((qid): qid is string => typeof qid === "string" && qid.length > 0)
          .filter((qid) => {
            if (seenQuestionIds.has(qid)) return false;
            seenQuestionIds.add(qid);
            return true;
          })
          .slice(0, MAX_QUESTIONS_PER_CUE)
      : [];

    if (questionIds.length === 0) continue;

    cues.push({
      id,
      timeSec: Math.round(timeSec * 10) / 10,
      questionIds,
    });
  }

  return cues.sort((a, b) => a.timeSec - b.timeSec);
}

export function sanitizeVideoCues(
  value: unknown,
  allowedQuestionIds: Set<string>
): SeriesVideoCue[] {
  return parseVideoCues(value)
    .map((cue) => ({
      ...cue,
      questionIds: cue.questionIds.filter((id) => allowedQuestionIds.has(id)),
    }))
    .filter((cue) => cue.questionIds.length > 0);
}

export function formatCueTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const tenth = Math.floor((clamped % 1) * 10);
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}.${tenth}`;
  return `${pad(m)}:${pad(s)}.${tenth}`;
}

export function parseCueTime(input: string): number | null {
  const trimmed = input.trim().replace(",", ".");
  if (!trimmed) return null;

  const parts = trimmed.split(":");
  if (parts.length === 1) {
    const sec = Number(parts[0]);
    return Number.isFinite(sec) && sec >= 0 ? sec : null;
  }
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0) return null;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const s = Number(parts[2]);
    if (
      !Number.isFinite(h) ||
      !Number.isFinite(m) ||
      !Number.isFinite(s) ||
      h < 0 ||
      m < 0 ||
      s < 0
    ) {
      return null;
    }
    return h * 3600 + m * 60 + s;
  }
  return null;
}

export function cueIndexForQuestion(
  cues: SeriesVideoCue[],
  questionId: string
): number {
  return cues.findIndex((cue) => cue.questionIds.includes(questionId));
}

export function questionIndicesForCue(
  cues: SeriesVideoCue[],
  cueIndex: number,
  questions: Array<{ id: string }>
): number[] {
  const cue = cues[cueIndex];
  if (!cue) return [];
  const byId = new Map(questions.map((q, i) => [q.id, i]));
  return cue.questionIds
    .map((id) => byId.get(id))
    .filter((i): i is number => i != null)
    .sort((a, b) => a - b);
}

export function segmentRange(
  cues: SeriesVideoCue[],
  cueIndex: number
): { start: number; end: number } {
  const cue = cues[cueIndex];
  if (!cue) return { start: 0, end: 0 };
  const previous = cueIndex > 0 ? cues[cueIndex - 1].timeSec + 0.05 : 0;
  return { start: previous, end: cue.timeSec };
}
