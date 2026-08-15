import type { Metadata } from "next";
import { LegalPageClient } from "@/modules/marketing/components/legal-page-client";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Objectif TCF",
  description:
    "Découvrez comment Objectif TCF collecte, utilise et protège vos données personnelles.",
};

export default function Page() {
  return <LegalPageClient kind="privacy" />;
}
