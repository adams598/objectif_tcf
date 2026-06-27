import type { Metadata } from "next";
import { SeriesView } from "@/modules/series/components/series-view";

export const metadata: Metadata = { title: "Mes Séries" };

export default function SeriesPage() {
  return <SeriesView />;
}
