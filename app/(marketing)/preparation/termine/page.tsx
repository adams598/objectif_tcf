import { redirect } from "next/navigation";
import { parseExamTab } from "@/lib/pricing/constants";

export default async function PreparationCompleteRedirect({
  searchParams,
}: {
  searchParams: Promise<{ examen?: string }>;
}) {
  const { examen } = await searchParams;
  const tab = parseExamTab(examen);
  redirect(`/preparation/resultats?examen=${tab}`);
}

