import type { Metadata } from "next";
import { AboutTcfPage } from "@/modules/marketing/components/about-tcf-page";

export const metadata: Metadata = {
  title: "À propos du TCF Canada | Objectif TCF",
  description:
    "Tout savoir sur le TCF Canada : épreuves, inscription, résultats, correspondance NCLC et conseils de préparation.",
};

export default function Page() {
  return <AboutTcfPage />;
}
