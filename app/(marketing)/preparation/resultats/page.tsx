import type { Metadata } from "next";
import { GuestResultsView } from "@/modules/preparation/components/guest-results-view";
import { parseExamTab } from "@/lib/pricing/constants";

export const metadata: Metadata = {
  title: "Vos résultats",
};

export default async function PreparationResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ examen?: string; skill?: string }>;
}) {
  const { examen, skill } = await searchParams;
  const tab = parseExamTab(examen);

  return <GuestResultsView examTab={tab} skillParam={skill} />;
}
