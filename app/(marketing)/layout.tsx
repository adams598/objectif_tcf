import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
