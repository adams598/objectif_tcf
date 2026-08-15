import type { Metadata } from "next";
import { LegalPageClient } from "@/modules/marketing/components/legal-page-client";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Objectif TCF",
  description:
    "Conditions d'utilisation de la plateforme Objectif TCF pour les candidats et abonnés.",
};

export default function Page() {
  return (
    <LegalPageClient kind="terms" downloadHref="/api/legal/cgu" />
  );
}
