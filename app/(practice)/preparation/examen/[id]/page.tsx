import type { Metadata } from "next";
import { GuestExamPage } from "@/modules/preparation/components/guest-exam-page";

export const metadata: Metadata = {
  title: "Examen — Mode invité",
};

export default async function PreparationGuestExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ examen?: string }>;
}) {
  const { id } = await params;
  const { examen } = await searchParams;

  return <GuestExamPage seriesId={id} examTab={examen} />;
}
