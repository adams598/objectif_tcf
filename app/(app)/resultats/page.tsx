import { ResultatsView } from "@/modules/dashboard/components/resultats-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Résultats",
};

export default function ResultatsPage() {
  return <ResultatsView />;
}
