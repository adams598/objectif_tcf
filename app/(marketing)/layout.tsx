import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PageViewTracker />
      <TopNav />
      <main className="flex-1 pt-28">{children}</main>
      <Footer />
    </div>
  );
}
