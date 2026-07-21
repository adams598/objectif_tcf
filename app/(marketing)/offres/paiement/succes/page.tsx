import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentSuccessView } from "@/modules/pricing/components/payment-result-views";

export const metadata: Metadata = {
  title: "Paiement confirmé",
};

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="py-2xl text-center animate-pulse">…</div>}>
      <PaymentSuccessView />
    </Suspense>
  );
}
