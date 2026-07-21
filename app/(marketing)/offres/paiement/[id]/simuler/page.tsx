import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isMockPaymentsEnabled } from "@/lib/payments/providers/mock";
import { PaymentSimulateView } from "@/modules/pricing/components/payment-result-views";

export const metadata: Metadata = {
  title: "Simulation de paiement",
};

export default async function PaymentSimulatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isMockPaymentsEnabled()) {
    redirect(`/offres/paiement/${id}`);
  }

  return (
    <Suspense fallback={<div className="py-2xl text-center animate-pulse">…</div>}>
      <PaymentSimulateView paymentId={id} />
    </Suspense>
  );
}
