import type { Metadata } from "next";
import { CommunauteView } from "@/modules/communaute/components/communaute-view";

export const metadata: Metadata = { title: "Communauté" };

export default function CommunautePage() {
  return <CommunauteView />;
}
