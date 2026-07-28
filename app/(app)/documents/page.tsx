import type { Metadata } from "next";
import { DocumentsView } from "@/modules/dashboard/components/documents-view";

export const metadata: Metadata = {
  title: "Documents — Objectif TCF",
  description: "Factures et documents de votre compte",
};

export default function DocumentsPage() {
  return <DocumentsView />;
}
