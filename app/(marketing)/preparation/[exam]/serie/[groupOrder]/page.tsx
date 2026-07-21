import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreparationDisciplinePage } from "@/modules/preparation/components/preparation-discipline-page";
import { parseExamTabParam, getExamLabel } from "@/lib/preparation/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exam: string; groupOrder: string }>;
}): Promise<Metadata> {
  const { exam, groupOrder } = await params;
  const tab = parseExamTabParam(exam);
  if (!tab) return { title: "Disciplines" };
  return {
    title: `Série ${groupOrder} — ${getExamLabel(tab)}`,
  };
}

export default async function PreparationSeriePage({
  params,
}: {
  params: Promise<{ exam: string; groupOrder: string }>;
}) {
  const { exam, groupOrder } = await params;
  const tab = parseExamTabParam(exam);
  const order = parseInt(groupOrder, 10);

  if (!tab || Number.isNaN(order)) notFound();

  return (
    <PreparationDisciplinePage examTab={tab} groupOrder={order} />
  );
}
