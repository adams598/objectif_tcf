import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentCancelView } from "@/modules/pricing/components/payment-result-views";

export const metadata: Metadata = {
  title: "Paiement annulé",
};

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="py-2xl text-center animate-pulse">…</div>}>
      <PaymentCancelView />
    </Suspense>
  );
}
