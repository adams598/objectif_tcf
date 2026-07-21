"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { formatPaymentAmount } from "@/lib/payments/methods";
import { Button } from "@/components/ui/button";
import type { PaymentCurrency, PaymentMethod, PaymentProvider, PaymentStatus } from "@prisma/client";

interface AdminPaymentRow {
  id: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: PaymentCurrency;
  status: PaymentStatus;
  provider: PaymentProvider | null;
  method: PaymentMethod | null;
  description: string | null;
  examType: string | null;
  subscriptionDays: number | null;
  paidAt: string | null;
  createdAt: string;
}

interface AdminPaymentsResponse {
  payments: AdminPaymentRow[];
  stats: {
    total: number;
    succeeded: number;
    pending: number;
    failed: number;
    revenueXaf: number;
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  SUCCEEDED: "Réussi",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  CANCELLED: "Annulé",
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-tertiary/10 text-tertiary",
  PROCESSING: "bg-primary/10 text-primary",
  SUCCEEDED: "bg-success/10 text-success",
  FAILED: "bg-error/10 text-error",
  REFUNDED: "bg-on-surface-variant/10 text-on-surface-variant",
  CANCELLED: "bg-on-surface-variant/10 text-on-surface-variant",
};

const METHOD_LABELS: Partial<Record<PaymentMethod, string>> = {
  CARD: "Carte",
  MOBILE_MONEY_MTN: "MTN MoMo",
  MOBILE_MONEY_ORANGE: "Orange Money",
  MOBILE_MONEY_AIRTEL: "Airtel",
  MOBILE_MONEY_WAVE: "Wave",
  MOBILE_MONEY_MOOV: "Moov",
  PAYPAL: "PayPal",
  BANK_TRANSFER: "Virement",
  SEPA: "SEPA",
};

export function PaiementsAdminView() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin-payments", statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      return fetchJson<AdminPaymentsResponse>(`/api/admin/paiements?${params}`);
    },
  });

  const refundMutation = useMutation({
    mutationFn: (paymentId: string) =>
      fetchJson(`/api/admin/paiements/${paymentId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "refund" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success("Paiement remboursé");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Impossible de rembourser ce paiement";
      toast.error(message);
    },
  });

  const { stats, payments, meta } = query.data ?? {
    stats: { total: 0, succeeded: 0, pending: 0, failed: 0, revenueXaf: 0 },
    payments: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
  };

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md font-bold text-on-surface mb-xs">
          Paiements
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Suivi des transactions — pawaPay (Mobile Money), Stripe (Europe).
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {[
          { label: "Total", value: stats.total },
          { label: "Réussis", value: stats.succeeded },
          { label: "En attente", value: stats.pending },
          { label: "Revenus (XAF)", value: formatPaymentAmount(stats.revenueXaf, "XAF") },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-surface border border-outline-variant rounded-xl p-md"
          >
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {item.label}
            </p>
            <p className="font-headline-lg text-headline-lg font-bold mt-xs">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-sm">
        {(["ALL", "SUCCEEDED", "PROCESSING", "PENDING", "FAILED"] as const).map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={cn(
                "px-md py-xs rounded-full font-label-sm text-label-sm border transition-all",
                statusFilter === status
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-on-surface-variant hover:border-primary"
              )}
            >
              {status === "ALL" ? "Tous" : STATUS_LABELS[status]}
            </button>
          )
        )}
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
        {query.isLoading ? (
          <div className="p-xl text-center text-on-surface-variant animate-pulse">
            Chargement…
          </div>
        ) : payments.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">
            Aucun paiement pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {["Date", "Utilisateur", "Description", "Montant", "Méthode", "Statut", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-outline-variant/50 hover:bg-surface-container-low/50"
                  >
                    <td className="px-md py-sm font-label-sm text-label-sm whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-md py-sm">
                      <p className="font-label-md text-label-md">{payment.userName}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {payment.userEmail}
                      </p>
                    </td>
                    <td className="px-md py-sm font-label-sm text-label-sm">
                      {payment.description ?? "—"}
                      {payment.subscriptionDays && (
                        <span className="text-on-surface-variant">
                          {" "}({payment.subscriptionDays} j)
                        </span>
                      )}
                    </td>
                    <td className="px-md py-sm font-label-md text-label-md whitespace-nowrap">
                      {formatPaymentAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="px-md py-sm font-label-sm text-label-sm">
                      {payment.method
                        ? METHOD_LABELS[payment.method] ?? payment.method
                        : "—"}
                      {payment.provider && (
                        <span className="block text-on-surface-variant text-[11px]">
                          {payment.provider}
                        </span>
                      )}
                    </td>
                    <td className="px-md py-sm">
                      <span
                        className={cn(
                          "inline-flex px-sm py-xs rounded-full font-label-sm text-label-sm",
                          STATUS_COLORS[payment.status]
                        )}
                      >
                        {STATUS_LABELS[payment.status]}
                      </span>
                    </td>
                    <td className="px-md py-sm">
                      {payment.status === "SUCCEEDED" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={refundMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Confirmer le remboursement de ce paiement ? L'abonnement associé sera révoqué."
                              )
                            ) {
                              refundMutation.mutate(payment.id);
                            }
                          }}
                        >
                          Rembourser
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-md py-xs rounded-lg border border-outline-variant disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="px-md py-xs font-label-sm text-label-sm text-on-surface-variant">
            Page {page} / {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-md py-xs rounded-lg border border-outline-variant disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
