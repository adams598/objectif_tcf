import type { Metadata } from "next";
import { CorrecteurDashboard } from "@/modules/correcteur/components/correcteur-dashboard";

export const metadata: Metadata = { title: "Espace Correcteur" };

export default function CorrecteurPage() {
  return <CorrecteurDashboard />;
}
