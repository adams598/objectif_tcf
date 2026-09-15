import type { Metadata } from "next";
import { GuidesAdminView } from "@/modules/admin/components/guides-admin-view";

export const metadata: Metadata = { title: "Admin — Expression EE/EO" };

export default function AdminGuidesPage() {
  return <GuidesAdminView />;
}
