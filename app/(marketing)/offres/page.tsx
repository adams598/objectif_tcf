import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingPage } from "@/modules/pricing/components/pricing-page";

export const metadata: Metadata = {
  title: "Offres et tarifs",
  description:
    "Choisissez votre formule de préparation TCF, TEF ou IELTS. Tarification flexible au jour ou forfaits avantageux.",
};

export default function OffresPage() {
  return (
    <Suspense
      fallback={
        <div className="py-2xl text-center text-on-surface-variant animate-pulse">
          Chargement des offres…
        </div>
      }
    >
      <PricingPage />
    </Suspense>
  );
}
