import type { Metadata } from "next";
import { ExamView } from "@/modules/examen/components/exam-view";
import { ReadingExamView } from "@/modules/examen/components/reading-exam-view";
import { WritingExamView } from "@/modules/examen/components/writing-exam-view";
import { OralExamView } from "@/modules/examen/components/oral-exam-view";

export const metadata: Metadata = {
  title: "Mode Examen",
};

function getExamType(id: string): "co" | "ce" | "ee" | "eo" {
  if (id.startsWith("ce-")) return "ce";
  if (id.startsWith("ee-")) return "ee";
  if (id.startsWith("eo-")) return "eo";
  return "co";
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const type = getExamType(id);

  if (type === "ce") return <ReadingExamView seriesId={id} />;
  if (type === "ee") return <WritingExamView seriesId={id} />;
  if (type === "eo") return <OralExamView seriesId={id} />;
  return <ExamView seriesId={id} />;
}
