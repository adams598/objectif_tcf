import type { Metadata } from "next";
import { LegalPageClient } from "@/modules/marketing/components/legal-page-client";

export const metadata: Metadata = {
  title: "Conditions de remboursement et de retour | Objectif TCF",
  description:
    "Conditions légales, délai de rétractation et procédure de remboursement des abonnements Objectif TCF.",
};

export default function Page() {
  return <LegalPageClient kind="refund" />;
}
