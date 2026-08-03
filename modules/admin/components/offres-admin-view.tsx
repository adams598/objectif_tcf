"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import type { OfferFeature } from "@/lib/pricing/constants";
import { EXAM_TAB_LABELS, type ExamTab } from "@/lib/pricing/constants";

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

export function OffresAdminView() {
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
      toast.success("Tarification unitaire mise à jour.");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde."),
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/offres/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Offre supprimée.");
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
          ? "Offre visible sur l'accueil et la page offres."
          : "Offre masquée de l'accueil et de la page offres."
      );
    },
    onError: () => toast.error("Impossible de modifier la visibilité."),
  });

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const offers = offersQuery.data ?? [];
  const visibleCount = offers.filter((o) => o.isFeatured && o.isActive).length;
  const activeOffers = offers.filter((o) => o.isActive);

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          Gestion des offres
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Créez autant d&apos;offres que nécessaire, choisissez celles visibles
          côté client, et accordez un accès par email.
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
            {EXAM_TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <section className="bg-surface border border-outline-variant rounded-2xl p-lg">
        <h2 className="font-headline-lg text-[20px] font-semibold text-on-surface mb-md">
          Prix unitaire par jour — {EXAM_TAB_LABELS[activeTab]}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
          <Input
            label="Prix / jour (XAF)"
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
            label="Prix / jour (USD $)"
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
            label="Prix / jour (XOF)"
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
          Enregistrer la tarification
        </Button>
      </section>

      <GrantAccessSection offers={activeOffers} examTab={activeTab} />

      <section className="space-y-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
          <div>
            <h2 className="font-headline-lg text-[20px] font-semibold text-on-surface">
              Offres — {EXAM_TAB_LABELS[activeTab]}
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {visibleCount} visible{visibleCount > 1 ? "s" : ""} côté client ·{" "}
              {offers.length} au total. Activez « Visible » pour publier une offre.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setEditingId(editingId === "new" ? null : "new")
            }
          >
            {editingId === "new" ? "Annuler" : "Nouvelle offre"}
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
            Aucune offre. Lancez le seed ou créez une offre.
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
                      <span className="text-xs text-error">Inactive</span>
                    )}
                    {offer.isFeatured && offer.isActive && (
                      <span className="text-xs px-sm py-xs rounded-full bg-primary/10 text-primary">
                        Visible
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {offer.priceXaf.toLocaleString("fr-CA")} XAF · {offer.priceUsd}$ ·{" "}
                    {offer.priceXof.toLocaleString("fr-CA")} XOF —{" "}
                    {offer.baseDays + offer.bonusDays} jours
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
                    Visible sur l&apos;accueil et la page offres
                  </label>
                </div>
                <div className="flex gap-sm shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingId(offer.id)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      confirm({
                        title: "Supprimer cette offre ?",
                        description: "Cette action est définitive.",
                        confirmLabel: "Supprimer",
                        destructive: true,
                        onConfirm: () => deleteOfferMutation.mutateAsync(offer.id),
                      })
                    }
                  >
                    Supprimer
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
        `Accès « ${data.offerName} » accordé à ${granted} personne${granted > 1 ? "s" : ""} (${data.days} j). Identifiants envoyés par email — consultables aussi dans Admin → Apprenants.`
      );
      if (mailOk < granted) {
        toast.message("Certains emails n'ont pas pu être envoyés. Vérifiez Resend.");
      }
      setEmailsText("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Échec de l'attribution"
      );
    },
  });

  return (
    <section className="bg-surface border border-outline-variant rounded-2xl p-lg space-y-md">
      <div>
        <h2 className="font-headline-lg text-[20px] font-semibold text-on-surface mb-xs">
          Accorder un accès par email
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Ajoutez une ou plusieurs adresses, choisissez une offre {EXAM_TAB_LABELS[examTab]} :
          durée = offre. Chaque destinataire reçoit un email avec le lien, son email et un
          mot de passe généré (aussi visible dans Admin → Apprenants).
        </p>
      </div>

      {offers.length === 0 ? (
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Créez d&apos;abord une offre active pour pouvoir inviter des clients.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">
                Offre
              </label>
              <select
                className="w-full rounded-xl border border-outline-variant bg-surface px-md py-sm font-body-md text-body-md"
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
              >
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.name} — {offer.baseDays + offer.bonusDays} jours
                  </option>
                ))}
              </select>
              {selectedOffer && (
                <p className="font-label-sm text-label-sm text-primary mt-xs">
                  Durée incluse : {totalDays} jour{totalDays > 1 ? "s" : ""}
                  {selectedOffer.bonusDays > 0
                    ? ` (${selectedOffer.baseDays} + ${selectedOffer.bonusDays} offerts)`
                    : ""}
                </p>
              )}
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">
                Adresses email
              </label>
              <textarea
                className="w-full min-h-[110px] rounded-xl border border-outline-variant bg-surface p-md font-body-md text-body-md"
                placeholder={"client@email.com\nautre@email.com"}
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
              />
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                Une adresse par ligne, ou séparées par des virgules.
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
              Accorder l&apos;accès et envoyer l&apos;invitation
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
      toast.success(offer ? "Offre mise à jour." : "Offre créée.");
      onSuccess();
    },
    onError: () => toast.error("Erreur lors de l'enregistrement."),
  });

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-lg space-y-md">
      <h3 className="font-label-md text-label-md font-bold text-on-surface">
        {offer ? "Modifier l'offre" : "Nouvelle offre"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <Input
          label="Nom"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Slug (identifiant unique)"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <Input
          label="Sous-titre"
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
        />
        <Input
          label="Ordre d'affichage"
          type="number"
          value={form.sortOrder}
          onChange={(e) =>
            setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
          }
        />
        <Input
          label="Prix XAF"
          type="number"
          value={form.priceXaf}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceXaf: parseInt(e.target.value, 10) || 0 }))
          }
        />
        <Input
          label="Prix USD ($)"
          type="number"
          value={form.priceUsd}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceUsd: parseInt(e.target.value, 10) || 0 }))
          }
        />
        <Input
          label="Prix XOF"
          type="number"
          value={form.priceXof}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceXof: parseInt(e.target.value, 10) || 0 }))
          }
        />
        <Input
          label="Jours de base"
          type="number"
          value={form.baseDays}
          onChange={(e) =>
            setForm((f) => ({ ...f, baseDays: parseInt(e.target.value, 10) || 1 }))
          }
        />
        <Input
          label="Jours offerts"
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
          Visible sur l&apos;accueil et la page offres (côté client)
        </label>
        <label className="flex items-center gap-sm font-label-md text-label-md">
          <Switch
            checked={form.isActive}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          />
          Active
        </label>
      </div>

      <div>
        <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">
          Fonctionnalités (une par ligne, préfixez - pour exclure)
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
          Annuler
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.name || !form.slug}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
