import type { Metadata } from "next";
import { CommunauteAdminView } from "@/modules/admin/components/communaute-admin-view";

export const metadata: Metadata = { title: "Admin — Communauté" };

export default function AdminCommunautePage() {
  return <CommunauteAdminView />;
}
