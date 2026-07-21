import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { UserPreferencesProvider } from "@/components/providers/user-preferences-provider";
import { LocaleSync } from "@/components/providers/locale-sync";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchUserBootstrap } from "@/lib/user/bootstrap";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/connexion");
  }

  const bootstrap = await fetchUserBootstrap(session.userId);

  const role = (bootstrap.profile?.role ?? session.role) as
    | "USER"
    | "ADMIN"
    | "SUPER_ADMIN"
    | "CORRECTOR";

  return (
    <UserPreferencesProvider
      initialProfile={bootstrap.profile ?? undefined}
      initialSettings={bootstrap.settings}
      initialAuthSession={bootstrap.authSession}
    >
      <LocaleSync />
      <div className="min-h-screen bg-surface-container-low flex">
        <Sidebar role={role} />

        <main className="flex-1 md:ml-[280px] pb-24 md:pb-0 min-h-screen">
          <div className="p-md md:p-xl max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        <BottomNav />
      </div>
    </UserPreferencesProvider>
  );
}
