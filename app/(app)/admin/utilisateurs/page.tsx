import type { Metadata } from "next";
import { UtilisateursAdminView } from "@/modules/admin/components/utilisateurs-admin-view";

export const metadata: Metadata = { title: "Admin — Utilisateurs" };

export default function AdminUtilisateursPage() {
  return <UtilisateursAdminView />;
}
