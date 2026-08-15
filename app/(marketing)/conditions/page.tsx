import type { Metadata } from "next";
import { LegalPageView } from "@/modules/marketing/components/legal-page";
import { termsFr } from "@/lib/marketing/content/legal";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Objectif TCF",
  description:
    "Conditions d'utilisation de la plateforme Objectif TCF pour les candidats et abonnés.",
};

export default function Page() {
  return (
    <LegalPageView
      content={termsFr}
      downloadHref="/api/legal/cgu"
      downloadLabel="Télécharger en PDF"
    />
  );
}
