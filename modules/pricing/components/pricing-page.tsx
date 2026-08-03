"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import {
  type CheckoutIntent,
  buildAuthRedirectUrl,
  buildPaymentPagePath,
  clearCheckoutIntent,
  loadCheckoutIntent,
  parseCheckoutFromSearchParams,
  saveCheckoutIntent,
} from "@/lib/pricing/checkout";
import {
  type ExamTab,
  type OfferFeature,
  type PricingOffer,
  EXAM_TAB_LABELS,
  EXAM_TAB_TO_TYPE,
  MIN_PREPARATION_DAYS,
  MAX_PREPARATION_DAYS,
  isValidPreparationDays,
  calculateDynamicPrice,
  formatExamDate,
  formatPrice,
  formatPricePair,
  getExamDateFromDays,
  parseExamTab,
} from "@/lib/pricing/constants";
import { useTranslation } from "@/components/providers/locale-provider";

interface OffersResponse {
  examTab: ExamTab;
  pricing: {
    pricePerDayXaf: number;
    pricePerDayUsd: number;
    pricePerDayXof: number;
  };
  offers: PricingOffer[];
}

const EXAM_TABS: ExamTab[] = ["tcf", "tef", "ielts"];

function parseDaysInput(value: string): number | null {
  const parsed = parseInt(value, 10);
  if (!isValidPreparationDays(parsed)) return null;
  return parsed;
}

export function PricingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = parseExamTab(searchParams.get("examen"));
  const [activeTab, setActiveTab] = useState<ExamTab>(initialTab);
  const [daysInput, setDaysInput] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [resumeCheckout, setResumeCheckout] = useState<CheckoutIntent | null>(
    null
  );
  const autoCheckoutStarted = useRef(false);

  const { data: session, isLoading: isSessionLoading } = useAuthSession();

  useEffect(() => {
    setActiveTab(parseExamTab(searchParams.get("examen")));
  }, [searchParams]);

  useEffect(() => {
    const fromUrl = parseCheckoutFromSearchParams(searchParams);
    const fromStorage = loadCheckoutIntent();
    const intent = fromUrl ?? fromStorage;

    if (!intent) return;

    setActiveTab(intent.examTab);
    if (intent.type === "custom") {
      setDaysInput(String(intent.days));
    }
    setResumeCheckout(intent);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["offers", activeTab],
    queryFn: () =>
      fetchJson<OffersResponse>(`/api/offres?examen=${activeTab}`),
  });

  const days = useMemo(() => parseDaysInput(daysInput), [daysInput]);

  const dynamicQuote = useMemo(() => {
    if (!days || !data?.pricing) return null;
    return calculateDynamicPrice(days, {
      examType: EXAM_TAB_TO_TYPE[activeTab],
      ...data.pricing,
    });
  }, [days, data?.pricing, activeTab]);

  const examDate = days ? getExamDateFromDays(days) : null;
  const canPay = Boolean(days && dynamicQuote);
  const isAuthenticated = Boolean(session);

  const requireAuth = useCallback(
    (intent: CheckoutIntent, onAuthenticated: () => void) => {
      if (session) {
        onAuthenticated();
        return;
      }

      saveCheckoutIntent(intent);
      toast.message(t("pricing.loginRequired"), {
        description: t("pricing.loginRequiredDesc"),
      });
      router.push(buildAuthRedirectUrl(intent, "connexion"));
    },
    [session, router]
  );

  const processCheckout = useCallback(
    async (payload: CheckoutIntent) => {
      setIsPaying(true);
      try {
        const response = await fetchJson<{ paymentId: string }>(
          "/api/paiement/checkout",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        clearCheckoutIntent();
        setResumeCheckout(null);
        router.push(buildPaymentPagePath(response.paymentId));
      } catch {
        toast.error(t("pricing.checkoutError"));
      } finally {
        setIsPaying(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (
      !session ||
      !resumeCheckout ||
      autoCheckoutStarted.current ||
      isSessionLoading
    ) {
      return;
    }

    autoCheckoutStarted.current = true;
    void processCheckout(resumeCheckout);
  }, [session, resumeCheckout, isSessionLoading, processCheckout]);

  const handlePayOffer = (offer: PricingOffer) => {
    const intent: CheckoutIntent = {
      type: "offer",
      examTab: activeTab,
      offerId: offer.id,
    };

    requireAuth(intent, () => processCheckout(intent));
  };

  const handlePayCustom = () => {
    if (!dynamicQuote || !days) return;

    const intent: CheckoutIntent = {
      type: "custom",
      examTab: activeTab,
      days,
    };

    requireAuth(intent, () => processCheckout(intent));
  };

  return (
    <div className="flex flex-col gap-xl pb-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl mx-auto"
      >
        <p className="font-label-md text-label-md text-primary mb-sm">
          {t("pricing.priceGrid")}
        </p>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-md">
          {t("pricing.title")} !
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("pricing.fastSecurePayment", {
            fast: t("pricing.fast"),
            secure: t("pricing.secure"),
          })}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant mt-md max-w-2xl mx-auto">
          {t("pricing.autoRenewNotice")}
        </p>
      </motion.div>

      <div className="flex justify-center gap-sm flex-wrap">
        {EXAM_TABS.map((tab) => (
          <Link
            key={tab}
            href={`/offres?examen=${tab}`}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-lg py-sm rounded-full font-label-md text-label-md transition-all border",
              activeTab === tab
                ? "bg-primary text-on-primary border-primary shadow-violet-sm"
                : "bg-surface text-on-surface border-outline-variant hover:border-primary"
            )}
          >
            {EXAM_TAB_LABELS[tab]}
          </Link>
        ))}
      </div>

      {resumeCheckout && isAuthenticated && isPaying && (
        <div className="max-w-2xl mx-auto w-full rounded-xl border border-primary/30 bg-primary/5 px-md py-sm text-center">
          <p className="font-body-md text-body-md text-on-surface">
            {t("pricing.redirectPayment")}
          </p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto w-full bg-surface border-2 border-primary/20 rounded-2xl p-lg shadow-violet-md"
      >
        <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface mb-xs text-center">
          {t("pricing.createSubscription")}
        </h2>
        <p className="font-body-md text-body-md text-primary text-center mb-xs">
          {t("pricing.indicateDays")}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant text-center mb-lg">
          {t("pricing.chooseDurationDesc")}
        </p>

        <Input
          label={t("pricing.daysQuestion")}
          type="number"
          min={MIN_PREPARATION_DAYS}
          max={MAX_PREPARATION_DAYS}
          placeholder={t("pricing.daysPlaceholder")}
          hint={t("pricing.daysMinHint", { min: MIN_PREPARATION_DAYS })}
          value={daysInput}
          onChange={(e) => setDaysInput(e.target.value)}
        />

        {dynamicQuote && examDate && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-lg text-center space-y-sm"
          >
            <p className="font-label-md text-label-md text-on-surface-variant">
              {t("pricing.preparationDays", { n: dynamicQuote.days })}
            </p>
            <p className="font-display-md text-[32px] md:text-display-md text-primary font-bold leading-tight">
              {formatPricePair(dynamicQuote.priceXaf, dynamicQuote.priceUsd)}
            </p>
            <p className="font-label-md text-label-md text-on-surface-variant">
              {formatPrice(dynamicQuote.priceXof, "xof")}
            </p>
            <p className="font-label-md text-label-md text-tertiary font-semibold pt-xs">
              {t("pricing.examOn", { date: formatExamDate(examDate) })}
            </p>
          </motion.div>
        )}

        <div className="mt-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-md">
          {dynamicQuote && (
            <div className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-center sm:text-left">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">
                {t("pricing.subscriptionTotal")}
              </p>
              <p className="font-label-md text-label-md text-on-surface font-bold">
                {formatPricePair(dynamicQuote.priceXaf, dynamicQuote.priceUsd)}
              </p>
            </div>
          )}
          <Button
            size="lg"
            className="w-full sm:w-auto sm:min-w-[200px] shrink-0"
            disabled={!canPay || isPaying || isSessionLoading}
            loading={isPaying}
            onClick={handlePayCustom}
          >
            {t("pricing.validateAndPay")}
          </Button>
        </div>

        {!isSessionLoading && !isAuthenticated && canPay && (
          <p className="font-label-sm text-label-sm text-on-surface-variant text-center mt-sm">
            <Link
              href={buildAuthRedirectUrl(
                { type: "custom", examTab: activeTab, days: days! },
                "connexion"
              )}
              className="text-primary font-semibold hover:underline"
            >
              {t("pricing.signInToPay")}
            </Link>
            {" "}{t("auth.or")}{" "}
            <Link
              href={buildAuthRedirectUrl(
                { type: "custom", examTab: activeTab, days: days! },
                "inscription"
              )}
              className="text-primary font-semibold hover:underline"
            >
              {t("pricing.createAccountToPay")}
            </Link>
            {" "}{t("pricing.toPaySuffix")}
          </p>
        )}

        {data?.pricing && (
          <p className="font-label-sm text-label-sm text-on-surface-variant text-center mt-sm">
            {t("pricing.unitPrice", {
              xaf: formatPrice(data.pricing.pricePerDayXaf, "xaf"),
              usd: formatPrice(data.pricing.pricePerDayUsd, "usd"),
            })}
          </p>
        )}
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-lg max-w-6xl mx-auto w-full">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-96 bg-surface-container rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (data?.offers ?? []).length === 0 ? (
        <p className="text-center font-body-md text-body-md text-on-surface-variant">
          {t("pricing.noOffersAvailable")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-lg max-w-6xl mx-auto w-full">
          {(data?.offers ?? []).map((offer, index) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              index={index}
              isAuthenticated={isAuthenticated}
              isSessionLoading={isSessionLoading}
              isPaying={isPaying}
              examTab={activeTab}
              onPay={() => handlePayOffer(offer)}
            />
          ))}
        </div>
      )}

      <div className="text-center">
        <p className="font-body-md text-body-md text-on-surface-variant mb-md">
          {t("pricing.noAccountYet")}
        </p>
        <Button asChild variant="secondary">
          <Link href="/inscription">{t("auth.registerFree")}</Link>
        </Button>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  index,
  isAuthenticated,
  isSessionLoading,
  isPaying,
  examTab,
  onPay,
}: {
  offer: PricingOffer;
  index: number;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  isPaying: boolean;
  examTab: ExamTab;
  onPay: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm flex flex-col"
    >
      <h3 className="font-headline-lg text-[20px] font-bold text-on-surface mb-md">
        {offer.name}
      </h3>

      <div className="space-y-xs mb-md">
        <p className="font-display-md text-[28px] font-bold text-primary leading-none">
          {formatPrice(offer.priceXaf, "xaf")}
        </p>
        <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          {formatPrice(offer.priceUsd, "usd")}
        </p>
        <p className="font-label-md text-label-md text-on-surface-variant">
          {formatPrice(offer.priceXof, "xof")}
        </p>
      </div>

      {offer.subtitle && (
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-sm">
          {offer.subtitle}
        </p>
      )}

      <p className="font-label-md text-label-md text-on-surface mb-lg">
        {t("pricing.validity", { days: offer.baseDays })}{" "}
        {offer.bonusDays > 0 && (
          <span className="text-success font-semibold">
            {t("pricing.bonusDays", { days: offer.bonusDays })}
          </span>
        )}
      </p>

      <Button
        size="default"
        className="w-full mb-sm"
        disabled={isSessionLoading || isPaying}
        loading={isPaying}
        onClick={onPay}
      >
        {t("pricing.payNow")}
      </Button>

      {!isSessionLoading && !isAuthenticated && (
        <p className="font-label-sm text-label-sm text-on-surface-variant text-center mb-lg">
          <Link
            href={buildAuthRedirectUrl(
              { type: "offer", examTab, offerId: offer.id },
              "connexion"
            )}
            className="text-primary hover:underline"
          >
            {t("layout.login")}
          </Link>
          {" "}{t("pricing.loginRequiredForPay")}
        </p>
      )}

      {isAuthenticated && <div className="mb-lg" />}

      <ul className="space-y-sm flex-1">
        {offer.features.map((feature: OfferFeature, i) => (
          <li key={i} className="flex items-start gap-sm">
            <span
              className={cn(
                "material-symbols-outlined text-[18px] shrink-0 mt-0.5",
                feature.included ? "text-success" : "text-error"
              )}
            >
              {feature.included ? "check_circle" : "cancel"}
            </span>
            <span
              className={cn(
                "font-label-sm text-label-sm",
                feature.included
                  ? "text-on-surface"
                  : "text-on-surface-variant line-through"
              )}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
