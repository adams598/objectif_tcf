import type { Metadata } from "next";
import { AidePageContent } from "@/modules/dashboard/components/aide-view";

export const metadata: Metadata = { title: "Aide & Support | Help & Support" };

export default function AidePage() {
  return <AidePageContent />;
}
