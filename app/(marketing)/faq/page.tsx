import type { Metadata } from "next";
import { FaqPage } from "@/modules/marketing/components/faq-page";

export const metadata: Metadata = {
  title: "FAQ | Objectif TCF",
  description:
    "Réponses aux questions fréquentes sur Objectif TCF, les examens TCF/TEF/IELTS, les abonnements et la correction.",
};

export default function Page() {
  return <FaqPage />;
}
