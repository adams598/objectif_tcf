import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultatsPageContent } from "@/modules/dashboard/components/resultats-page-content";

export const metadata: Metadata = {
  title: "Résultats",
};

export default function ResultatsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-xl font-body-md text-on-surface-variant">
          Chargement des résultats…
        </div>
      }
    >
      <ResultatsPageContent />
    </Suspense>
  );
}
