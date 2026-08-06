"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api/fetch-json";
import type { PaymentSessionDetails } from "@/lib/payments/types";
import { useTranslation } from "@/components/providers/locale-provider";

export function PaymentSimulateView({ paymentId }: { paymentId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [done, setDone] = useState(false);

  const simulateMutation = useMutation({
    mutationFn: () =>
      fetchJson(`/api/paiement/${paymentId}/simuler`, { method: "POST" }),
    onSuccess: () => {
      setDone(true);
      toast.success(t("pricing.simulateSuccess"));
      setTimeout(() => {
        router.push(`/offres/paiement/succes?paymentId=${paymentId}`);
      }, 1200);
    },
    onError: () => toast.error(t("pricing.simulateError")),
  });

  useEffect(() => {
    if (!ref) {
      router.replace(`/offres/paiement/${paymentId}`);
    }
  }, [ref, paymentId, router]);

  if (done) {
    return (
      <div className="py-2xl text-center text-on-surface-variant">
        {t("pricing.redirecting")}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center py-2xl space-y-lg">
      <span className="material-symbols-outlined text-tertiary text-[56px]">
        science
      </span>
      <h1 className="font-headline-lg text-headline-lg font-bold">
        {t("pricing.simulateTitle")}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {t("pricing.simulateDesc")}
      </p>
      <Button
        size="lg"
        loading={simulateMutation.isPending}
        onClick={() => simulateMutation.mutate()}
      >
        {t("pricing.simulateButton")}
      </Button>
      <Button asChild variant="secondary">
        <Link href={`/offres/paiement/${paymentId}`}>{t("pricing.back")}</Link>
      </Button>
    </div>
  );
}

async function downloadInvoicePdf(paymentId: string, invoiceNumber: string) {
  const response = await fetch(
    `/api/paiement/${paymentId}/facture?format=pdf`
  );
  if (!response.ok) throw new Error("download_failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoiceNumber}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PaymentSuccessView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const transactionId = searchParams.get("transaction_id");
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  const sendEmailMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ sent: boolean }>(`/api/paiement/${paymentId}/facture/envoyer`, {
        method: "POST",
      }),
    onSuccess: () => toast.success(t("pricing.invoiceEmailSent")),
    onError: (err) =>
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : t("pricing.invoiceEmailError"),
        { duration: 8000 }
      ),
  });

  useEffect(() => {
    if (!paymentId) {
      setStatus("error");
      return;
    }

    const params = new URLSearchParams();
    if (transactionId) params.set("transaction_id", transactionId);
    if (sessionId) params.set("session_id", sessionId);
    const query = params.toString();

    fetchJson<{ payment: PaymentSessionDetails }>(
      `/api/paiement/${paymentId}/statut${query ? `?${query}` : ""}`
    )
      .then((data) => {
        if (data.payment.status === "SUCCEEDED") {
          setStatus("success");
          void fetchJson<{ invoices: { paymentId: string; invoiceNumber: string }[] }>(
            "/api/utilisateurs/factures"
          )
            .then((invoicesData) => {
              const match = invoicesData.invoices.find(
                (inv) => inv.paymentId === paymentId
              );
              if (match) setInvoiceNumber(match.invoiceNumber);
            })
            .catch(() => undefined);
        } else if (data.payment.status === "PROCESSING") {
          setStatus("pending");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [paymentId, transactionId, sessionId]);

  if (status === "loading") {
    return (
      <div className="py-2xl text-center text-on-surface-variant animate-pulse">
        {t("pricing.verifyingPayment")}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="max-w-lg mx-auto text-center py-2xl space-y-md">
        <span className="material-symbols-outlined text-tertiary text-[48px]">
          hourglass_top
        </span>
        <h1 className="font-headline-lg text-headline-lg font-bold">
          {t("pricing.paymentPending")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("pricing.paymentPendingDesc")}
        </p>
        <Button asChild>
          <Link href="/tableau-de-bord">{t("pricing.backDashboard")}</Link>
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-lg mx-auto text-center py-2xl space-y-md">
        <span className="material-symbols-outlined text-error text-[48px]">
          error
        </span>
        <h1 className="font-headline-lg text-headline-lg font-bold">
          {t("pricing.paymentNotConfirmed")}
        </h1>
        <Button asChild>
          <Link href="/offres">{t("pricing.retry")}</Link>
        </Button>
      </div>
    );
  }

  const viewPath = paymentId
    ? `/api/paiement/${paymentId}/facture?inline=1`
    : null;

  return (
    <div className="max-w-xl mx-auto text-center py-2xl space-y-lg">
      <span className="material-symbols-outlined text-success text-[56px]">
        check_circle
      </span>
      <div className="space-y-sm">
        <h1 className="font-display-md text-display-md font-bold text-on-surface">
          {t("pricing.paymentSuccessTitle")}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("pricing.subscriptionActive")}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("pricing.invoiceSent")}
        </p>
      </div>

      {paymentId && (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-lg text-left space-y-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <div>
              <p className="font-label-md text-label-md font-bold text-on-surface">
                {t("documents.invoicesSectionTitle")}
              </p>
              {invoiceNumber && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {invoiceNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-sm">
            {viewPath && (
              <Button
                variant="secondary"
                onClick={() => window.open(viewPath, "_blank", "noopener")}
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                {t("pricing.viewInvoice")}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() =>
                void downloadInvoicePdf(
                  paymentId,
                  invoiceNumber ?? `facture-${paymentId.slice(0, 8)}`
                ).catch(() => toast.error(t("documents.downloadError")))
              }
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {t("pricing.downloadInvoicePdf")}
            </Button>
            <Button
              variant="secondary"
              loading={sendEmailMutation.isPending}
              onClick={() => sendEmailMutation.mutate()}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              {t("pricing.emailInvoice")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-sm justify-center">
        <Button asChild size="lg">
          <Link href="/tableau-de-bord">{t("pricing.startPreparation")}</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/documents">{t("pricing.goToDocuments")}</Link>
        </Button>
      </div>
    </div>
  );
}

export function PaymentCancelView() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto text-center py-2xl space-y-md">
      <span className="material-symbols-outlined text-on-surface-variant text-[48px]">
        cancel
      </span>
      <h1 className="font-headline-lg text-headline-lg font-bold">
        {t("pricing.paymentCancelled")}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {t("pricing.paymentCancelledDesc")}
      </p>
      <Button asChild>
        <Link href="/offres">{t("pricing.backToOffers")}</Link>
      </Button>
    </div>
  );
}
