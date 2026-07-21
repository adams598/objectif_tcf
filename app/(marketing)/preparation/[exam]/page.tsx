import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreparationSeriesPage } from "@/modules/preparation/components/preparation-series-page";
import { parseExamTabParam, getExamLabel } from "@/lib/preparation/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exam: string }>;
}): Promise<Metadata> {
  const { exam } = await params;
  const tab = parseExamTabParam(exam);
  if (!tab) return { title: "Préparation" };
  return {
    title: `Préparation ${getExamLabel(tab)} — Séries gratuites`,
  };
}

export default async function PreparationExamPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  const tab = parseExamTabParam(exam);
  if (!tab) notFound();

  return <PreparationSeriesPage examTab={tab} />;
}
