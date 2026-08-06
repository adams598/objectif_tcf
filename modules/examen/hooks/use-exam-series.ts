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

export interface PlayActiveAttempt {
  id: string;
  currentOrder: number | null;
  elapsedSec: number | null;
  startedAt: string;
  updatedAt: string;
  answers: Record<string, string>;
  textResponses: Record<string, string>;
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
  activeAttempt: PlayActiveAttempt | null;
}

export function useExamSeries(seriesId: string) {
  return useQuery({
    queryKey: ["exam-series", seriesId],
    queryFn: () => fetchJson<PlaySeries>(`/api/series/${seriesId}/play`),
    retry: false,
    // Ne pas conserver les réponses en cache après avoir quitté l'écran :
    // on veut toujours ré-hydrater depuis le serveur (dernière session sauvegardée).
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
