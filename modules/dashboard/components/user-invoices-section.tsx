"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
}

interface InvoicesResponse {
  invoices: UserInvoice[];
}

export function UserInvoicesSection() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["user-invoices"],
    queryFn: () => fetchJson<InvoicesResponse>("/api/utilisateurs/factures"),
  });

  const invoices = data?.invoices ?? [];

  const handleDownload = async (invoice: UserInvoice, format: "pdf" | "html" = "pdf") => {
    const path =
      format === "pdf"
        ? `${invoice.downloadPath}?format=pdf`
        : invoice.downloadPath;
    const response = await fetch(path);
    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.invoiceNumber}.${format === "pdf" ? "pdf" : "html"}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
    >
      <div className="flex items-center gap-sm mb-lg">
        <span className="material-symbols-outlined text-primary">receipt_long</span>
        <div>
          <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">
            {t("settings.invoicesTitle")}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            {t("settings.invoicesDesc")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-sm">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-xl bg-surface-container animate-pulse"
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
                <div className="flex gap-sm">
                  <Button
                    variant="secondary"
                    onClick={() => void handleDownload(invoice, "pdf")}
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    PDF
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void handleDownload(invoice, "html")}
                  >
                    HTML
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
