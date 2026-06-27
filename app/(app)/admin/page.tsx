import type { Metadata } from "next";
import { AdminDashboard } from "@/modules/admin/components/admin-dashboard";

export const metadata: Metadata = { title: "Admin — Vue d'ensemble" };

export default function AdminPage() {
  return <AdminDashboard />;
}
