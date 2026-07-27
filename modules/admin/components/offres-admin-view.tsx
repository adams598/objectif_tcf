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

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const offers = offersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          Gestion des offres
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Configurez les tarifs unitaires et les 3 offres affichées par type
          d&apos;examen.
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

      <section className="space-y-md">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-lg text-[20px] font-semibold text-on-surface">
            Offres affichées ({offers.filter((o) => o.isFeatured).length}/3)
          </h2>
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
                <div>
                  <div className="flex items-center gap-sm mb-xs">
                    <h3 className="font-label-md text-label-md font-bold text-on-surface">
                      {offer.name}
                    </h3>
                    {!offer.isActive && (
                      <span className="text-xs text-error">Inactive</span>
                    )}
                    {offer.isFeatured && (
                      <span className="text-xs text-primary">Affichée</span>
                    )}
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {offer.priceXaf.toLocaleString("fr-CA")} XAF · {offer.priceUsd}$ ·{" "}
                    {offer.priceXof.toLocaleString("fr-CA")} XOF — {offer.baseDays}+
                    {offer.bonusDays} jours
                  </p>
                </div>
                <div className="flex gap-sm">
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
          Afficher sur la page offres
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
