import type { Metadata } from "next";
import { LegalPageView } from "@/modules/marketing/components/legal-page";
import { refundFr } from "@/lib/marketing/content/legal";

export const metadata: Metadata = {
  title: "Conditions de remboursement et de retour | Objectif TCF",
  description:
    "Conditions légales, délai de rétractation et procédure de remboursement des abonnements Objectif TCF.",
};

export default function Page() {
  return <LegalPageView content={refundFr} />;
}
