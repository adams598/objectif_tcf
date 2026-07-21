import type { Metadata } from "next";
import { SeriesAdminView } from "@/modules/admin/components/series-admin-view";

export const metadata: Metadata = { title: "Admin — Séries & Questions" };

export default function AdminSeriesPage() {
  return <SeriesAdminView />;
}
