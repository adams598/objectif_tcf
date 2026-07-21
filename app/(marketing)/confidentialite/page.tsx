import type { Metadata } from "next";
import { LegalPageView } from "@/modules/marketing/components/legal-page";
import { privacyFr } from "@/lib/marketing/content/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Objectif TCF",
  description:
    "Découvrez comment Objectif TCF collecte, utilise et protège vos données personnelles.",
};

export default function Page() {
  return <LegalPageView content={privacyFr} />;
}
