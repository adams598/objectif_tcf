import type { Metadata } from "next";
import { ParametresView } from "@/modules/dashboard/components/parametres-view";

export const metadata: Metadata = { title: "Paramètres" };

export default function ParametresPage() {
  return <ParametresView />;
}
