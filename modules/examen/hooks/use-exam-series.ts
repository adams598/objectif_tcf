import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";

export interface PlayQuestion {
  id: string;
  order: number;
  type: string;
  content: string;
  instruction: string | null;
  passage: string | null;
  meta: Record<string, unknown>;
  audioScript: string | null;
  documentType: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  choices: Array<{ id: string; content: string; order: number }>;
}

export interface PlaySeries {
  id: string;
  title: string;
  skill: "CO" | "CE" | "EE" | "EO";
  skillRaw: string;
  durationMin: number;
  order: number;
  examType: string;
  examTitle: string;
  questionCount: number;
  questions: PlayQuestion[];
}

export function useExamSeries(seriesId: string) {
  return useQuery({
    queryKey: ["exam-series", seriesId],
    queryFn: () => fetchJson<PlaySeries>(`/api/series/${seriesId}/play`),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
