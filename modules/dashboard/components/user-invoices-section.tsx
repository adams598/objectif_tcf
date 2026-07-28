"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchJson } from "@/lib/api/fetch-json";
import { useTranslation } from "@/components/providers/locale-provider";

interface UserInvoice {
  paymentId: string;
  invoiceNumber: string;
  paidAt: string;
  amountFormatted: string;
  description: string;
  examTypeLabel: string;
  periodStart: string;
  periodEnd: string;
  subscriptionDays: number;
  downloadPath: string;
  pdfDownloadPath: string;
  viewPath: string;
}

interface InvoicesResponse {
  invoices: UserInvoice[];
}

async function downloadInvoice(invoice: UserInvoice, format: "pdf" | "html") {
  const path = format === "pdf" ? invoice.pdfDownloadPath : invoice.downloadPath;
  const response = await fetch(path);
  if (!response.ok) throw new Error("download_failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoice.invoiceNumber}.${format === "pdf" ? "pdf" : "html"}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function UserInvoicesSection({
  variant = "settings",
}: {
  variant?: "settings" | "documents";
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["user-invoices"],
    queryFn: () => fetchJson<InvoicesResponse>("/api/utilisateurs/factures"),
  });

  const sendMutation = useMutation({
    mutationFn: (paymentId: string) =>
      fetchJson<{ sent: boolean }>(`/api/paiement/${paymentId}/facture/envoyer`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success(t("documents.invoiceEmailSent"));
      void queryClient.invalidateQueries({ queryKey: ["user-invoices"] });
    },
    onError: () => toast.error(t("documents.invoiceEmailError")),
    onSettled: () => setSendingId(null),
  });

  const invoices = data?.invoices ?? [];

  const title =
    variant === "documents"
      ? t("documents.invoicesSectionTitle")
      : t("settings.invoicesTitle");
  const desc =
    variant === "documents"
      ? t("documents.invoicesSectionDesc")
      : t("settings.invoicesDesc");

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: variant === "documents" ? 0 : 0.18 }}
      className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
    >
      <div className="flex items-center gap-sm mb-lg">
        <span className="material-symbols-outlined text-primary">receipt_long</span>
        <div>
          <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">
            {title}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            {desc}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-sm">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-xl bg-surface-container animate-pulse"
            />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title={t("settings.noInvoicesTitle")}
          description={t("settings.noInvoicesDesc")}
        />
      ) : (
        <div className="space-y-md">
          {invoices.map((invoice) => (
            <div
              key={invoice.paymentId}
              className="rounded-xl border border-outline-variant bg-surface-container-low p-md"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-md">
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                    {invoice.description} · {invoice.examTypeLabel}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                    {t("settings.invoicePeriod", {
                      start: invoice.periodStart,
                      end: invoice.periodEnd,
                    })}
                  </p>
                  <p className="font-label-sm text-label-sm text-primary font-semibold mt-sm">
                    {invoice.amountFormatted}
                  </p>
                </div>
                <div className="flex flex-wrap gap-sm">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      window.open(`${invoice.viewPath}`, "_blank", "noopener")
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      visibility
                    </span>
                    {t("documents.viewInvoice")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void downloadInvoice(invoice, "pdf").catch(() =>
                        toast.error(t("documents.downloadError"))
                      )
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      download
                    </span>
                    PDF
                  </Button>
                  <Button
                    variant="secondary"
                    loading={sendingId === invoice.paymentId}
                    onClick={() => {
                      setSendingId(invoice.paymentId);
                      sendMutation.mutate(invoice.paymentId);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      mail
                    </span>
                    {t("documents.emailInvoice")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
