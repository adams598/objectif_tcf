import { DashboardView } from "@/modules/dashboard/components/dashboard-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default function DashboardPage() {
  return <DashboardView />;
}
