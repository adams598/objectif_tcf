import type { Metadata } from "next";
import { CorrecteursAdminView } from "@/modules/admin/components/correcteurs-admin-view";

export const metadata: Metadata = { title: "Admin — Correcteurs" };

export default function AdminCorrecteursPage() {
  return <CorrecteursAdminView />;
}
