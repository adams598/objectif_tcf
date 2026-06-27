import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex">
      {/* Desktop Sidebar */}
      <Sidebar
        role={user.role as "USER" | "ADMIN" | "SUPER_ADMIN" | "CORRECTOR"}
        user={{
          name: user.name,
          email: user.email,
        }}
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] pb-24 md:pb-0 min-h-screen">
        <div className="p-md md:p-xl max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
