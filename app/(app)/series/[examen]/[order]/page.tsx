import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseExamTabParam } from "@/lib/preparation/constants";
import { AppSeriesDisciplinePage } from "@/modules/series/components/app-series-discipline-page";

export const metadata: Metadata = { title: "Choisir une discipline" };

export default async function SeriesDisciplinePage({
  params,
}: {
  params: Promise<{ examen: string; order: string }>;
}) {
  const { examen, order } = await params;
  const examTab = parseExamTabParam(examen);
  const groupOrder = Number.parseInt(order, 10);

  if (!examTab || Number.isNaN(groupOrder)) {
    notFound();
  }

  return (
    <AppSeriesDisciplinePage examTab={examTab} groupOrder={groupOrder} />
  );
}
