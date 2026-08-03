import type { Metadata } from "next";
import { UtilisateurDetailView } from "@/modules/admin/components/utilisateur-detail-view";

export const metadata: Metadata = { title: "Admin — Détail utilisateur" };

export default async function AdminUtilisateurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UtilisateurDetailView userId={id} />;
}
