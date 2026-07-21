import type { Metadata } from "next";
import { OffresAdminView } from "@/modules/admin/components/offres-admin-view";

export const metadata: Metadata = { title: "Admin — Offres" };

export default function AdminOffresPage() {
  return <OffresAdminView />;
}
