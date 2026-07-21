"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import { cn } from "@/lib/utils";

interface SystemStatus {
  environment: string;
  appUrl: string;
  production: { ok: boolean; errors: string[]; warnings: string[] };
  payments: {
    stripe: { configured: boolean; webhookConfigured: boolean; webhookUrl: string };
    pawapay: {
      configured: boolean;
      environment: string;
      callbackUrl: string;
      connection: { ok: boolean; message: string } | null;
    };
    mockMode: boolean;
  };
}

export function AdminSystemStatusPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-system-status"],
    queryFn: () => fetchJson<SystemStatus>("/api/admin/system/status"),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface p-md animate-pulse h-24" />
    );
  }

  if (!data) return null;

  const prodOk = data.production.ok;
  const paymentsReady =
    !data.payments.mockMode &&
    (data.payments.stripe.configured || data.payments.pawapay.configured);

  return (
    <div
      className={cn(
        "rounded-2xl border p-md space-y-sm",
        prodOk
          ? "border-success/30 bg-success/5"
          : "border-tertiary/40 bg-tertiary/5"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex items-center gap-sm">
          <span
            className={cn(
              "material-symbols-outlined text-[22px]",
              prodOk ? "text-success" : "text-tertiary"
            )}
          >
            {prodOk ? "verified" : "warning"}
          </span>
          <div>
            <p className="font-label-md text-label-md font-semibold">
              État production — {data.environment}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {prodOk
                ? "Configuration prête pour les paiements automatiques"
                : "Actions requises avant mise en ligne"}
            </p>
          </div>
        </div>
        <Link
          href="/admin/paiements"
          className="font-label-sm text-primary hover:underline"
        >
          Voir les paiements →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm text-sm">
        <StatusChip
          label="Stripe"
          ok={data.payments.stripe.configured && data.payments.stripe.webhookConfigured}
          detail={
            data.payments.stripe.configured
              ? data.payments.stripe.webhookConfigured
                ? "Carte / EUR"
                : "Webhook manquant"
              : "Non configuré"
          }
        />
        <StatusChip
          label="pawaPay"
          ok={Boolean(
            data.payments.pawapay.configured &&
              data.payments.pawapay.connection?.ok
          )}
          detail={
            data.payments.pawapay.configured
              ? `${data.payments.pawapay.environment} — ${data.payments.pawapay.connection?.message ?? "…"}`
              : "Non configuré"
          }
        />
        <StatusChip
          label="Mode démo"
          ok={!data.payments.mockMode}
          detail={data.payments.mockMode ? "ACTIF — désactiver" : "Désactivé"}
          invert
        />
      </div>

      {!prodOk && data.production.errors.length > 0 && (
        <ul className="text-xs text-error space-y-0.5 list-disc pl-4">
          {data.production.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {data.production.warnings.length > 0 && (
        <ul className="text-xs text-on-surface-variant space-y-0.5 list-disc pl-4">
          {data.production.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {paymentsReady && (
        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
          URL : {data.appUrl}
        </p>
      )}
    </div>
  );
}

function StatusChip({
  label,
  ok,
  detail,
  invert = false,
}: {
  label: string;
  ok: boolean;
  detail: string;
  invert?: boolean;
}) {
  const success = invert ? !ok : ok;
  return (
    <div
      className={cn(
        "rounded-xl px-sm py-xs border",
        success
          ? "border-success/30 bg-success/5"
          : "border-outline-variant bg-surface"
      )}
    >
      <p className="font-medium text-on-surface">{label}</p>
      <p className="text-xs text-on-surface-variant truncate">{detail}</p>
    </div>
  );
}
