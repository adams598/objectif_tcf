import type { Metadata } from "next";
import { DocumentsAdminView } from "@/modules/admin/components/documents-admin-view";

export const metadata: Metadata = { title: "Admin — Documents" };

export default function AdminDocumentsPage() {
  return <DocumentsAdminView />;
}
