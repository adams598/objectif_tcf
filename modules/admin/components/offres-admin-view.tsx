"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { dateLocaleTag } from "@/lib/i18n/locales";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import type { OfferFeature } from "@/lib/pricing/constants";
import { type ExamTab } from "@/lib/pricing/constants";

type ExamType = "TCF_CANADA" | "TEF_CANADA" | "IELTS";

const TAB_TO_EXAM: Record<ExamTab, ExamType> = {
  tcf: "TCF_CANADA",
  tef: "TEF_CANADA",
  ielts: "IELTS",
};

interface PricingConfig {
  id: string;
  examType: ExamType;
  pricePerDayXaf: number;
  pricePerDayUsd: number;
  pricePerDayXof: number;
  isActive: boolean;
}

interface AdminOffer {
  id: string;
  examType: ExamType;
  name: string;
  slug: string;
  subtitle: string | null;
  priceXaf: number;
  priceUsd: number;
  priceXof: number;
  baseDays: number;
  bonusDays: number;
  features: OfferFeature[];
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
}

const EXAM_TABS: ExamTab[] = ["tcf", "tef", "ielts"];

function examTabKey(tab: ExamTab) {
  if (tab === "tcf") return "admin.examTabTcf";
  if (tab === "tef") return "admin.examTabTef";
  return "admin.examTabIelts";
}

export function OffresAdminView() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ExamTab>("tcf");
  const [editingId, setEditingId] = useState<string | null>(null);

  const examType = TAB_TO_EXAM[activeTab];

  const pricingQuery = useQuery({
    queryKey: ["admin-pricing"],
    queryFn: () => fetchJson<PricingConfig[]>("/api/admin/tarification"),
  });

  const offersQuery = useQuery({
    queryKey: ["admin-offers", examType],
    queryFn: () =>
      fetchJson<AdminOffer[]>(`/api/admin/offres?examType=${examType}`),
  });

  const currentPricing = pricingQuery.data?.find((c) => c.examType === examType);

  const [pricingForm, setPricingForm] = useState({
    pricePerDayXaf: 1000,
    pricePerDayUsd: 2,
    pricePerDayXof: 1250,
  });

  React.useEffect(() => {
    if (currentPricing) {
      setPricingForm({
        pricePerDayXaf: currentPricing.pricePerDayXaf,
        pricePerDayUsd: currentPricing.pricePerDayUsd,
        pricePerDayXof: currentPricing.pricePerDayXof,
      });
    }
  }, [currentPricing]);

  const savePricingMutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/admin/tarification", {
        method: "PATCH",
        body: JSON.stringify({ examType, ...pricingForm, isActive: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success(t("admin.offersPricingSaved"));
    },
    onError: () => toast.error(t("admin.offersSaveError")),
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/offres/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success(t("admin.offersDeleted"));
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      fetchJson(`/api/admin/offres/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isFeatured }),
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success(
        vars.isFeatured
          ? t("admin.offersFeaturedOn")
          : t("admin.offersFeaturedOff")
      );
    },
    onError: () => toast.error(t("admin.offersVisibilityError")),
  });

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const offers = offersQuery.data ?? [];
  const visibleCount = offers.filter((o) => o.isFeatured && o.isActive).length;
  const activeOffers = offers.filter((o) => o.isActive);

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          {t("admin.offersTitle")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("admin.offersSubtitle")}
        </p>
      </div>

      <div className="flex gap-sm flex-wrap">
        {EXAM_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setEditingId(null);
            }}
            className={cn(
              "px-lg py-sm rounded-full font-label-md text-label-md border transition-all",
              activeTab === tab
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface border-outline-variant text-on-surface-variant"
            )}
          >
            {t(examTabKey(tab))}
          </button>
        ))}
      </div>

      <section className="bg-surface border border-outline-variant rounded-2xl p-lg">
        <h2 className="font-headline-lg text-[20px] font-semibold text-on-surface mb-md">
          {t("admin.offersUnitPrice", { exam: t(examTabKey(activeTab)) })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
          <Input
            label={t("admin.offersPricePerDayXaf")}
            type="number"
            value={pricingForm.pricePerDayXaf}
            onChange={(e) =>
              setPricingForm((p) => ({
                ...p,
                pricePerDayXaf: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
          <Input
            label={t("admin.offersPricePerDayUsd")}
            type="number"
            value={pricingForm.pricePerDayUsd}
            onChange={(e) =>
              setPricingForm((p) => ({
                ...p,
                pricePerDayUsd: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
          <Input
            label={t("admin.offersPricePerDayXof")}
            type="number"
            value={pricingForm.pricePerDayXof}
            onChange={(e) =>
              setPricingForm((p) => ({
                ...p,
                pricePerDayXof: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
        </div>
        <Button
          onClick={() => savePricingMutation.mutate()}
          disabled={savePricingMutation.isPending}
        >
          {t("admin.offersSavePricing")}
        </Button>
      </section>

      <GrantAccessSection offers={activeOffers} examTab={activeTab} />

      <section className="space-y-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
          <div>
            <h2 className="font-headline-lg text-[20px] font-semibold text-on-surface">
              {t("admin.offersSection", { exam: t(examTabKey(activeTab)) })}
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {t("admin.offersVisibleMeta", {
                visible: visibleCount,
                total: offers.length,
              })}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setEditingId(editingId === "new" ? null : "new")
            }
          >
            {editingId === "new" ? t("admin.cancel") : t("admin.add")}
          </Button>
        </div>

        {editingId === "new" && (
          <OfferForm
            examType={examType}
            onSuccess={() => {
              setEditingId(null);
              queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
              queryClient.invalidateQueries({ queryKey: ["offers"] });
            }}
            onCancel={() => setEditingId(null)}
          />
        )}

        {offersQuery.isLoading ? (
          <div className="h-40 bg-surface-container rounded-2xl animate-pulse" />
        ) : offers.length === 0 ? (
          <p className="text-on-surface-variant">
            {t("admin.offersNone")}
          </p>
        ) : (
          offers.map((offer) =>
            editingId === offer.id ? (
              <OfferForm
                key={offer.id}
                examType={examType}
                offer={offer}
                onSuccess={() => {
                  setEditingId(null);
                  queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
                  queryClient.invalidateQueries({ queryKey: ["offers"] });
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={offer.id}
                className="bg-surface border border-outline-variant rounded-2xl p-lg flex flex-col md:flex-row md:items-center justify-between gap-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-sm mb-xs">
                    <h3 className="font-label-md text-label-md font-bold text-on-surface">
                      {offer.name}
                    </h3>
                    {!offer.isActive && (
                      <span className="text-xs text-error">
                        {t("admin.offersInactive")}
                      </span>
                    )}
                    {offer.isFeatured && offer.isActive && (
                      <span className="text-xs px-sm py-xs rounded-full bg-primary/10 text-primary">
                        {t("admin.offersVisible")}
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {offer.priceXaf.toLocaleString(dateLocaleTag(locale))} XAF · {offer.priceUsd}$ ·{" "}
                    {offer.priceXof.toLocaleString(dateLocaleTag(locale))} XOF —{" "}
                    {offer.baseDays + offer.bonusDays > 1
                      ? t("admin.daysCountPlural", {
                          n: offer.baseDays + offer.bonusDays,
                        })
                      : t("admin.daysCount", {
                          n: offer.baseDays + offer.bonusDays,
                        })}
                    {offer.bonusDays > 0
                      ? ` (${offer.baseDays}+${offer.bonusDays})`
                      : ""}
                  </p>
                  <label className="mt-sm inline-flex items-center gap-sm font-label-sm text-label-sm text-on-surface">
                    <Switch
                      checked={offer.isFeatured}
                      disabled={toggleFeaturedMutation.isPending}
                      onCheckedChange={(v) =>
                        toggleFeaturedMutation.mutate({
                          id: offer.id,
                          isFeatured: v,
                        })
                      }
                    />
                    {t("admin.offersVisibleToggle")}
                  </label>
                </div>
                <div className="flex gap-sm shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingId(offer.id)}
                  >
                    {t("admin.edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      confirm({
                        title: t("admin.offersDeleteConfirm"),
                        description: t("admin.offersDeleteDesc"),
                        confirmLabel: t("admin.delete"),
                        destructive: true,
                        onConfirm: () => deleteOfferMutation.mutateAsync(offer.id),
                      })
                    }
                  >
                    {t("admin.delete")}
                  </Button>
                </div>
              </div>
            )
          )
        )}
      </section>
      {confirmDialog}
    </div>
  );
}

function GrantAccessSection({
  offers,
  examTab,
}: {
  offers: AdminOffer[];
  examTab: ExamTab;
}) {
  const { t } = useTranslation();
  const [offerId, setOfferId] = useState("");
  const [emailsText, setEmailsText] = useState("");

  React.useEffect(() => {
    if (!offerId && offers.length > 0) {
      setOfferId(offers[0].id);
    }
    if (offerId && !offers.some((o) => o.id === offerId)) {
      setOfferId(offers[0]?.id ?? "");
    }
  }, [offers, offerId]);

  const selectedOffer = offers.find((o) => o.id === offerId);
  const totalDays = selectedOffer
    ? selectedOffer.baseDays + selectedOffer.bonusDays
    : 0;

  const grantMutation = useMutation({
    mutationFn: () => {
      const emails = emailsText
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter(Boolean);

      return fetchJson<{
        offerName: string;
        days: number;
        results: Array<{
          email: string;
          status: string;
          emailSent: boolean;
          error?: string;
        }>;
      }>("/api/admin/offres/grant-access", {
        method: "POST",
        body: JSON.stringify({ offerId, emails }),
      });
    },
    onSuccess: (data) => {
      const granted = data.results.filter((r) => r.status === "granted").length;
      const mailOk = data.results.filter((r) => r.emailSent).length;
      toast.success(
        t("admin.offersGrantSuccess", {
          name: data.offerName,
          n: granted,
          days: data.days,
        })
      );
      if (mailOk < granted) {
        toast.message(t("admin.offersGrantEmailPartial"));
      }
      setEmailsText("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("admin.offersGrantFail")
      );
    },
  });

  return (
    <section className="bg-surface border border-outline-variant rounded-2xl p-lg space-y-md">
      <div>
        <h2 className="font-headline-lg text-[20px] font-semibold text-on-surface mb-xs">
          {t("admin.offersGrantTitle")}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("admin.offersGrantDesc", { exam: t(examTabKey(examTab)) })}
        </p>
      </div>

      {offers.length === 0 ? (
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {t("admin.offersGrantNeedOffer")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">
                {t("admin.offersGrantOffer")}
              </label>
              <select
                className="w-full rounded-xl border border-outline-variant bg-surface px-md py-sm font-body-md text-body-md"
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
              >
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.name} —{" "}
                    {offer.baseDays + offer.bonusDays > 1
                      ? t("admin.daysCountPlural", {
                          n: offer.baseDays + offer.bonusDays,
                        })
                      : t("admin.daysCount", {
                          n: offer.baseDays + offer.bonusDays,
                        })}
                  </option>
                ))}
              </select>
              {selectedOffer && (
                <p className="font-label-sm text-label-sm text-primary mt-xs">
                  {totalDays > 1
                    ? t("admin.offersGrantDurationPlural", { n: totalDays })
                    : t("admin.offersGrantDuration", { n: totalDays })}
                  {selectedOffer.bonusDays > 0
                    ? ` ${t("admin.offersGrantBonus", {
                        base: selectedOffer.baseDays,
                        bonus: selectedOffer.bonusDays,
                      })}`
                    : ""}
                </p>
              )}
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">
                {t("admin.offersGrantEmails")}
              </label>
              <textarea
                className="w-full min-h-[110px] rounded-xl border border-outline-variant bg-surface p-md font-body-md text-body-md"
                placeholder={"client@email.com\nautre@email.com"}
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
              />
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                {t("admin.offersGrantEmailsHint")}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => grantMutation.mutate()}
              disabled={
                grantMutation.isPending || !offerId || !emailsText.trim()
              }
              loading={grantMutation.isPending}
            >
              {t("admin.offersGrantButton")}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function OfferForm({
  examType,
  offer,
  onSuccess,
  onCancel,
}: {
  examType: ExamType;
  offer?: AdminOffer;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: offer?.name ?? "",
    slug: offer?.slug ?? "",
    subtitle: offer?.subtitle ?? "",
    priceXaf: offer?.priceXaf ?? 0,
    priceUsd: offer?.priceUsd ?? 0,
    priceXof: offer?.priceXof ?? 0,
    baseDays: offer?.baseDays ?? 10,
    bonusDays: offer?.bonusDays ?? 5,
    sortOrder: offer?.sortOrder ?? 1,
    isFeatured: offer?.isFeatured ?? true,
    isActive: offer?.isActive ?? true,
    featuresText: (offer?.features ?? [])
      .map((f) => `${f.included ? "+" : "-"} ${f.label}`)
      .join("\n"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const features: OfferFeature[] = form.featuresText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const included = !line.startsWith("-");
          const label = line.replace(/^[-+]\s*/, "");
          return { label, included };
        });

      const payload = {
        examType,
        name: form.name,
        slug: form.slug,
        subtitle: form.subtitle || null,
        priceXaf: form.priceXaf,
        priceUsd: form.priceUsd,
        priceXof: form.priceXof,
        baseDays: form.baseDays,
        bonusDays: form.bonusDays,
        sortOrder: form.sortOrder,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        features,
      };

      if (offer) {
        return fetchJson(`/api/admin/offres/${offer.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      return fetchJson("/api/admin/offres", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(
        offer ? t("admin.offersUpdated") : t("admin.offersCreated")
      );
      onSuccess();
    },
    onError: () => toast.error(t("admin.offersRecordError")),
  });

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-lg space-y-md">
      <h3 className="font-label-md text-label-md font-bold text-on-surface">
        {offer ? t("admin.offersFormEdit") : t("admin.offersNew")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <Input
          label={t("admin.offersName")}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label={t("admin.offersSlug")}
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <Input
          label={t("admin.offersSubtitleField")}
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
        />
        <Input
          label={t("admin.offersSortOrder")}
          type="number"
          value={form.sortOrder}
          onChange={(e) =>
            setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
          }
        />
        <Input
          label={t("admin.offersPriceXaf")}
          type="number"
          value={form.priceXaf}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceXaf: parseInt(e.target.value, 10) || 0 }))
          }
        />
        <Input
          label={t("admin.offersPriceUsd")}
          type="number"
          value={form.priceUsd}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceUsd: parseInt(e.target.value, 10) || 0 }))
          }
        />
        <Input
          label={t("admin.offersPriceXof")}
          type="number"
          value={form.priceXof}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceXof: parseInt(e.target.value, 10) || 0 }))
          }
        />
        <Input
          label={t("admin.offersBaseDays")}
          type="number"
          value={form.baseDays}
          onChange={(e) =>
            setForm((f) => ({ ...f, baseDays: parseInt(e.target.value, 10) || 1 }))
          }
        />
        <Input
          label={t("admin.offersBonusDays")}
          type="number"
          value={form.bonusDays}
          onChange={(e) =>
            setForm((f) => ({ ...f, bonusDays: parseInt(e.target.value, 10) || 0 }))
          }
        />
      </div>

      <div className="flex items-center gap-lg">
        <label className="flex items-center gap-sm font-label-md text-label-md">
          <Switch
            checked={form.isFeatured}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
          />
          {t("admin.offersVisibleClient")}
        </label>
        <label className="flex items-center gap-sm font-label-md text-label-md">
          <Switch
            checked={form.isActive}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          />
          {t("admin.offersActive")}
        </label>
      </div>

      <div>
        <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">
          {t("admin.offersFeatures")}
        </label>
        <textarea
          className="w-full min-h-[120px] rounded-xl border border-outline-variant bg-surface p-md font-body-md text-body-md"
          value={form.featuresText}
          onChange={(e) =>
            setForm((f) => ({ ...f, featuresText: e.target.value }))
          }
        />
      </div>

      <div className="flex gap-sm justify-end">
        <Button variant="secondary" onClick={onCancel}>
          {t("admin.cancel")}
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.name || !form.slug}
        >
          {t("admin.save")}
        </Button>
      </div>
    </div>
  );
}
