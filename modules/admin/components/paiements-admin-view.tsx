"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { dateLocaleTag } from "@/lib/i18n/locales";
import { formatPaymentAmount } from "@/lib/payments/methods";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const STATUS_KEYS: Record<PaymentStatus, string> = {
  PENDING: "admin.statusPending",
  PROCESSING: "admin.statusProcessing",
  SUCCEEDED: "admin.statusSucceeded",
  FAILED: "admin.statusFailed",
  REFUNDED: "admin.statusRefunded",
  CANCELLED: "admin.statusCancelled",
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-tertiary/10 text-tertiary",
  PROCESSING: "bg-primary/10 text-primary",
  SUCCEEDED: "bg-success/10 text-success",
  FAILED: "bg-error/10 text-error",
  REFUNDED: "bg-on-surface-variant/10 text-on-surface-variant",
  CANCELLED: "bg-on-surface-variant/10 text-on-surface-variant",
};

export function PaiementsAdminView() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const dateTag = dateLocaleTag(locale);

  const methodLabels: Partial<Record<PaymentMethod, string>> = {
    CARD: t("admin.methodCard"),
    MOBILE_MONEY_MTN: "MTN MoMo",
    MOBILE_MONEY_ORANGE: "Orange Money",
    MOBILE_MONEY_AIRTEL: "Airtel",
    MOBILE_MONEY_WAVE: "Wave",
    MOBILE_MONEY_MOOV: "Moov",
    PAYPAL: "PayPal",
    BANK_TRANSFER: t("admin.methodTransfer"),
    SEPA: "SEPA",
  };
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [deleteTargets, setDeleteTargets] = useState<AdminPaymentRow[]>([]);

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
      toast.success(t("admin.toastRefunded"));
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t("admin.toastRefundError");
      toast.error(message);
    },
  });

  const removePayments = useMutation({
    mutationFn: async ({
      ids,
      mode,
    }: {
      ids: string[];
      mode: "archive" | "permanent";
    }) => {
      let ok = 0;
      let fail = 0;
      const errors: string[] = [];
      for (const id of ids) {
        try {
          await fetchJson(`/api/admin/paiements/${id}?mode=${mode}`, {
            method: "DELETE",
          });
          ok += 1;
        } catch (error) {
          fail += 1;
          errors.push(
            error instanceof Error
              ? error.message
              : t("admin.toastFailUser", { email: id })
          );
        }
      }
      if (fail > 0 && ok === 0) {
        throw new Error(errors[0] ?? t("admin.toastDeleteError"));
      }
      return { ok, fail, errors, mode };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      setDeleteTargets([]);
      if (result.fail > 0) {
        toast.warning(
          `${t("admin.toastProcessedPartial", {
            ok: result.ok,
            fail: result.fail,
          })}${result.errors[0] ? ` — ${result.errors[0]}` : ""}`
        );
      } else {
        toast.success(
          result.mode === "permanent"
            ? t("admin.toastPaymentsDeleted", { n: result.ok })
            : t("admin.toastPaymentsArchived", { n: result.ok })
        );
      }
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : t("admin.toastDeleteError")
      ),
  });

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const { stats, payments, meta } = query.data ?? {
    stats: { total: 0, succeeded: 0, pending: 0, failed: 0, revenueXaf: 0 },
    payments: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
  };

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md font-bold text-on-surface mb-xs">
          {t("admin.paymentsTitle")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("admin.paymentsSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {[
          { label: t("admin.kpiTotal"), value: stats.total },
          { label: t("admin.kpiSucceeded"), value: stats.succeeded },
          { label: t("admin.kpiPending"), value: stats.pending },
          {
            label: t("admin.kpiRevenue"),
            value: formatPaymentAmount(stats.revenueXaf, "XAF"),
          },
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
              {status === "ALL" ? t("admin.all") : t(STATUS_KEYS[status])}
            </button>
          )
        )}
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
        {query.isLoading ? (
          <div className="p-xl text-center text-on-surface-variant animate-pulse">
            {t("admin.loading")}
          </div>
        ) : payments.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">
            {t("admin.noPayments")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {[
                    t("admin.colDate"),
                    t("admin.colUser"),
                    t("admin.colDescription"),
                    t("admin.colAmount"),
                    t("admin.colMethod"),
                    t("admin.colStatus"),
                    t("admin.colActions"),
                  ].map(
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
                      {new Date(payment.createdAt).toLocaleDateString(dateTag)}
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
                          {" "}
                          ({t("admin.daysShort", { n: payment.subscriptionDays })})
                        </span>
                      )}
                    </td>
                    <td className="px-md py-sm font-label-md text-label-md whitespace-nowrap">
                      {formatPaymentAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="px-md py-sm font-label-sm text-label-sm">
                      {payment.method
                        ? methodLabels[payment.method] ?? payment.method
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
                        {t(STATUS_KEYS[payment.status])}
                      </span>
                    </td>
                    <td className="px-md py-sm">
                      <div className="flex items-center gap-xs">
                        {payment.status === "SUCCEEDED" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={refundMutation.isPending}
                            onClick={() =>
                              confirm({
                                title: t("admin.refundConfirmTitle"),
                                description: t("admin.refundConfirmDesc"),
                                confirmLabel: t("admin.refund"),
                                destructive: true,
                                onConfirm: () =>
                                  refundMutation.mutateAsync(payment.id),
                              })
                            }
                          >
                            {t("admin.refund")}
                          </Button>
                        )}
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors"
                          title={t("admin.archiveOrDelete")}
                          onClick={() => setDeleteTargets([payment])}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
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
            {t("exam.previous")}
          </button>
          <span className="px-md py-xs font-label-sm text-label-sm text-on-surface-variant">
            {t("admin.pageOf", { page, total: meta.totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-md py-xs rounded-lg border border-outline-variant disabled:opacity-40"
          >
            {t("exam.next")}
          </button>
        </div>
      )}

      <Dialog
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open && !removePayments.isPending) setDeleteTargets([]);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTargets.length > 1
                ? t("admin.paymentsDeleteTitleN", { n: deleteTargets.length })
                : t("admin.paymentsDeleteTitle")}
            </DialogTitle>
            <DialogDescription>
              {deleteTargets.length === 1
                ? `${deleteTargets[0].userName} (${deleteTargets[0].userEmail}) — ${formatPaymentAmount(deleteTargets[0].amount, deleteTargets[0].currency)}. `
                : `${t("admin.paymentsSelected", { n: deleteTargets.length })} `}
              {t("admin.paymentsArchiveHint")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-sm">
            <button
              type="button"
              disabled={removePayments.isPending || deleteTargets.length === 0}
              onClick={() =>
                removePayments.mutate({
                  ids: deleteTargets.map((p) => p.id),
                  mode: "archive",
                })
              }
              className="w-full text-left rounded-xl border border-outline-variant bg-surface-container-low p-md hover:border-primary transition-colors disabled:opacity-50"
            >
              <p className="font-label-md text-sm font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  inventory_2
                </span>
                {t("admin.archive")}
              </p>
              <p className="font-label-sm text-[12px] text-on-surface-variant mt-xs">
                {t("admin.paymentsArchiveDesc")}
              </p>
            </button>
            <button
              type="button"
              disabled={removePayments.isPending || deleteTargets.length === 0}
              onClick={() =>
                removePayments.mutate({
                  ids: deleteTargets.map((p) => p.id),
                  mode: "permanent",
                })
              }
              className="w-full text-left rounded-xl border border-error/30 bg-error/5 p-md hover:border-error transition-colors disabled:opacity-50"
            >
              <p className="font-label-md text-sm font-semibold text-error flex items-center gap-sm">
                <span className="material-symbols-outlined text-[20px]">
                  delete_forever
                </span>
                {t("admin.deleteForever")}
              </p>
              <p className="font-label-sm text-[12px] text-on-surface-variant mt-xs">
                {t("admin.paymentsDeleteForeverDesc")}
              </p>
            </button>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              disabled={removePayments.isPending}
              onClick={() => setDeleteTargets([])}
            >
              {t("admin.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}
