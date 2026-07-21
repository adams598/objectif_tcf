"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { PaymentCurrency, PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchJson, ApiError } from "@/lib/api/fetch-json";
import {
  CURRENCY_OPTIONS,
  formatPaymentAmount,
  getAmountForCurrency,
  type PaymentMethodOption,
} from "@/lib/payments/methods";
import type { PaymentLocaleContext } from "@/lib/payments/country-currency";
import type { PaymentSessionDetails } from "@/lib/payments/types";
import { useTranslation } from "@/components/providers/locale-provider";

interface PaymentPageData {
  payment: PaymentSessionDetails;
  methodsByCurrency: Record<PaymentCurrency, PaymentMethodOption[]>;
  paymentLocale: PaymentLocaleContext;
  suggestedCurrency: PaymentCurrency;
  userPhone: string | null;
  mockMode: boolean;
  providersConfigured: boolean;
  stripeConfigured?: boolean;
  pawapayConfigured?: boolean;
}

export function PaymentCheckoutView({ paymentId }: { paymentId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [currency, setCurrency] = useState<PaymentCurrency>("XAF");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [localeApplied, setLocaleApplied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-session", paymentId],
    queryFn: () => fetchJson<PaymentPageData>(`/api/paiement/${paymentId}`),
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 401) return false;
      return failureCount < 2;
    },
  });

  React.useEffect(() => {
    if (!data || localeApplied) return;
    setCurrency(data.suggestedCurrency);
    if (data.userPhone) {
      setPhoneNumber(data.userPhone);
    } else if (data.paymentLocale.phonePrefix) {
      setPhoneNumber(data.paymentLocale.phonePrefix);
    }
    const methods = data.methodsByCurrency[data.suggestedCurrency] ?? [];
    if (methods.length > 0) {
      setMethod(methods[0].id);
    }
    setLocaleApplied(true);
  }, [data, localeApplied]);

  React.useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      router.push(
        `/connexion?redirect=${encodeURIComponent(`/offres/paiement/${paymentId}`)}`
      );
    }
  }, [error, paymentId, router]);

  const availableMethods = useMemo(
    () => data?.methodsByCurrency[currency] ?? [],
    [data, currency]
  );

  const selectedMethod = availableMethods.find((m) => m.id === method);
  const amount = data
    ? getAmountForCurrency(data.payment.amounts, currency)
    : 0;

  const initiateMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ checkoutUrl: string }>(`/api/paiement/${paymentId}/initier`, {
        method: "POST",
        body: JSON.stringify({
          currency,
          method,
          ...(phoneNumber ? { phoneNumber } : {}),
        }),
      }),
    onSuccess: (result) => {
      window.location.href = result.checkoutUrl;
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : t("pricing.checkoutError");
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <div className="py-2xl text-center text-on-surface-variant animate-pulse">
        {t("pricing.loadingPayment")}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto text-center py-2xl">
        <p className="text-error mb-md">{t("pricing.sessionNotFound")}</p>
        <Button asChild>
          <Link href="/offres">{t("pricing.backToOffers")}</Link>
        </Button>
      </div>
    );
  }

  if (data.payment.status === "SUCCEEDED") {
    return (
      <div className="max-w-lg mx-auto text-center py-2xl space-y-md">
        <span className="material-symbols-outlined text-success text-[48px]">
          check_circle
        </span>
        <h1 className="font-headline-lg text-headline-lg font-bold">
          {t("pricing.alreadyPaid")}
        </h1>
        <Button asChild>
          <Link href="/tableau-de-bord">{t("pricing.accessDashboard")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-xl pb-2xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="font-label-md text-label-md text-primary mb-sm">
          {t("pricing.finalizeSubscription")}
        </p>
        <h1 className="font-display-md text-display-md font-bold text-on-surface">
          {t("pricing.securePayment")}
        </h1>
      </motion.div>

      {!data.providersConfigured && !data.mockMode && (
        <div className="rounded-xl border border-error/40 bg-error/5 px-md py-md text-center">
          <p className="font-label-md text-label-md text-error font-semibold mb-xs">
            {t("pricing.paymentNotConfigured")}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {t("pricing.addEnvKeys")}
          </p>
        </div>
      )}

      {data.mockMode && (
        <div className="rounded-xl border border-tertiary/40 bg-tertiary/5 px-md py-sm text-center">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {t("pricing.demoModeActive")}
          </p>
        </div>
      )}

      {data.stripeConfigured && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-md py-sm text-center flex items-center justify-center gap-sm">
          <span className="material-symbols-outlined text-primary text-[20px]">
            lock
          </span>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {t("pricing.stripeSecureDesc")}
          </p>
        </div>
      )}

      <div className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm">
        <h2 className="font-headline-lg text-[20px] font-semibold mb-md">
          {t("pricing.summary")}
        </h2>
        <div className="flex justify-between items-start gap-md mb-sm">
          <span className="font-body-md text-body-md text-on-surface-variant">
            {data.payment.description}
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant shrink-0">
            {t("pricing.daysCount", { n: data.payment.subscriptionDays ?? 0 })}
          </span>
        </div>
        <p className="font-display-md text-[28px] font-bold text-primary">
          {formatPaymentAmount(amount, currency)}
        </p>
      </div>

      <div className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm">
        <h2 className="font-headline-lg text-[18px] font-semibold mb-md">
          {t("pricing.currency")}
        </h2>
        {data.paymentLocale.countryLabel ? (
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">
            Devise proposée selon votre pays ({data.paymentLocale.countryLabel}
            ) :{" "}
            <strong>
              {CURRENCY_OPTIONS.find((c) => c.id === data.suggestedCurrency)?.label}
            </strong>
          </p>
        ) : (
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">
            Devise par défaut : Afrique centrale (XAF). Indiquez votre pays dans
            les paramètres du profil pour ajuster automatiquement.
          </p>
        )}
        <div className="grid grid-cols-2 gap-sm">
          {CURRENCY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setCurrency(option.id);
                setMethod(null);
              }}
              className={cn(
                "rounded-xl border p-md text-left transition-all",
                currency === option.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-outline-variant hover:border-primary/50",
                data.suggestedCurrency === option.id &&
                  currency !== option.id &&
                  "border-primary/30"
              )}
            >
              <p className="font-label-md text-label-md font-semibold">
                {option.label}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {option.hint}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm">
        <h2 className="font-headline-lg text-[18px] font-semibold mb-md">
          {t("pricing.paymentMethod")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
          {availableMethods.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMethod(option.id)}
              className={cn(
                "rounded-xl border p-md text-left flex items-start gap-sm transition-all",
                method === option.id
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant hover:border-primary/50"
              )}
            >
              <span className="material-symbols-outlined text-primary text-[22px]">
                {option.icon}
              </span>
              <div>
                <p className="font-label-md text-label-md font-semibold">
                  {option.label}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedMethod?.requiresPhone && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-lg">
          <Input
            label={t("pricing.mobileMoneyNumber")}
            placeholder={t("pricing.phonePlaceholder")}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            hint={t("pricing.phoneHint")}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-md">
        <Button asChild variant="secondary" className="sm:flex-1">
          <Link href="/offres">{t("pricing.modifyChoice")}</Link>
        </Button>
        <Button
          size="lg"
          className="sm:flex-1"
          disabled={
            !method ||
            initiateMutation.isPending ||
            !data.providersConfigured ||
            (selectedMethod?.requiresPhone && phoneNumber.trim().length < 8)
          }
          loading={initiateMutation.isPending}
          onClick={() => initiateMutation.mutate()}
        >
          {method === "GOOGLE_PAY"
            ? "Payer avec Google Pay"
            : data.stripeConfigured && method === "CARD" && currency === "EUR"
              ? t("pricing.payStripe")
              : t("pricing.payAmount", {
                  amount: formatPaymentAmount(amount, currency),
                })}
        </Button>
      </div>

      <p className="font-label-sm text-label-sm text-on-surface-variant text-center">
        {t("pricing.paymentProvidersDesc")}
      </p>
    </div>
  );
}
