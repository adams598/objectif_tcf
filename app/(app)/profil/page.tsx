import type { Metadata } from "next";
import { ProfilView } from "@/modules/dashboard/components/profil-view";

export const metadata: Metadata = { title: "Mon Profil" };

export default function ProfilPage() {
  return <ProfilView />;
}
