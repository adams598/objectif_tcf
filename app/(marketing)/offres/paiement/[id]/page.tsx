import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentCheckoutView } from "@/modules/pricing/components/payment-checkout-view";

export const metadata: Metadata = {
  title: "Paiement",
  description: "Finalisez votre abonnement Objectif TCF.",
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="py-2xl text-center text-on-surface-variant animate-pulse">
          Chargement…
        </div>
      }
    >
      <PaymentCheckoutView paymentId={id} />
    </Suspense>
  );
}
