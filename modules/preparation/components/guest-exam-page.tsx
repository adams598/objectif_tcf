"use client";

import { ExamView } from "@/modules/examen/components/exam-view";
import { ReadingExamView } from "@/modules/examen/components/reading-exam-view";
import { WritingExamView } from "@/modules/examen/components/writing-exam-view";
import { OralExamView } from "@/modules/examen/components/oral-exam-view";
import type { ExamTab } from "@/lib/pricing/constants";
import { parseExamTab } from "@/lib/pricing/constants";
import { getExamComponentType } from "@/lib/examen/labels";

interface GuestExamPageProps {
  seriesId: string;
  examTab?: string;
}

export function GuestExamPage({ seriesId, examTab }: GuestExamPageProps) {
  const type = getExamComponentType(seriesId);
  const tab: ExamTab = parseExamTab(examTab);
  const props = { seriesId, guestMode: true as const, examTab: tab };

  if (type === "ce") return <ReadingExamView {...props} />;
  if (type === "ee") return <WritingExamView {...props} />;
  if (type === "eo") return <OralExamView {...props} />;
  return <ExamView {...props} />;
}
