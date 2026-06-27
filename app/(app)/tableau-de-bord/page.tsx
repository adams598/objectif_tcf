import { DashboardView } from "@/modules/dashboard/components/dashboard-view";
import { getCurrentUser } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <DashboardView
      userName={user?.name?.split(" ")[0] ?? "Étudiant"}
    />
  );
}
