import { PageLoader } from "@/components/ui/page-loader";

export default function MarketingLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <PageLoader variant="content" />
    </div>
  );
}
