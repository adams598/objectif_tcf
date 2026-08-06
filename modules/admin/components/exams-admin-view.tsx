"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ALL_EXAM_TYPES,
  EXAM_TYPE_LABELS,
  slugifyExamId,
} from "@/lib/exams/catalog";

interface AdminExam {
  id: string;
  type: (typeof ALL_EXAM_TYPES)[number];
  title: string;
  description: string | null;
  isActive: boolean;
  _count: { series: number };
  subscriptionStats: {
    totalActive: number;
    free: number;
    paid: number;
    byPlan: Array<{ plan: string; label: string; count: number }>;
  };
}

const emptyForm = {
  id: "",
  type: "TCF_CANADA" as (typeof ALL_EXAM_TYPES)[number],
  title: "",
  description: "",
  isActive: true,
};

function ExamListSection({
  title,
  exams,
  selectedId,
  onSelect,
  inactive = false,
}: {
  title: string;
  exams: AdminExam[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  inactive?: boolean;
}) {
  return (
    <div>
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs px-xs">
        {title} ({exams.length})
      </p>
      <div className="flex flex-col gap-xs">
        {exams.map((exam) => (
          <button
            key={exam.id}
            type="button"
            onClick={() => onSelect(exam.id)}
            className={cn(
              "text-left p-md rounded-xl border transition-all",
              inactive && "opacity-75",
              selectedId === exam.id
                ? "border-primary bg-primary/5"
                : "border-outline-variant hover:border-primary/30"
            )}
          >
            <div className="flex items-center justify-between gap-sm mb-xs flex-wrap">
              <Badge variant="outline">{EXAM_TYPE_LABELS[exam.type]}</Badge>
              {inactive && (
                <Badge variant="error">Désactivé</Badge>
              )}
            </div>
            <p className="font-label-md font-semibold">{exam.title}</p>
            <p className="font-label-sm text-on-surface-variant mt-xs">
              {exam._count.series} séries · {exam.subscriptionStats.free} gratuits ·{" "}
              {exam.subscriptionStats.paid} payants
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SubscriptionStatsPanel({ exam }: { exam: AdminExam }) {
  const stats = exam.subscriptionStats;
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low/50 p-md flex flex-col gap-sm">
      <h3 className="font-label-md font-bold">Inscriptions (type {EXAM_TYPE_LABELS[exam.type]})</h3>
      <p className="font-label-sm text-on-surface-variant">
        Les abonnements sont liés au type d&apos;examen ({EXAM_TYPE_LABELS[exam.type]}).
      </p>
      <div className="grid grid-cols-3 gap-sm">
        <StatPill label="Total actifs" value={stats.totalActive} />
        <StatPill label="Gratuits" value={stats.free} />
        <StatPill label="Payants" value={stats.paid} />
      </div>
      {stats.byPlan.length > 0 && (
        <div className="flex flex-wrap gap-xs mt-xs">
          {stats.byPlan.map((p) => (
            <Badge key={p.plan} variant={p.plan === "FREE" ? "outline" : "primary"}>
              {p.label} : {p.count}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface p-sm text-center border border-outline-variant/60">
      <p className="font-display-md text-[20px] font-bold">{value}</p>
      <p className="font-label-sm text-[10px] text-on-surface-variant">{label}</p>
    </div>
  );
}

export function ExamsAdminView() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    type: "TCF_CANADA" as (typeof ALL_EXAM_TYPES)[number],
    isActive: true,
  });

  const examsQuery = useQuery({
    queryKey: ["admin-exams-all"],
    queryFn: () => fetchJson<AdminExam[]>("/api/admin/exams"),
  });

  const activeExams = examsQuery.data?.filter((e) => e.isActive) ?? [];
  const inactiveExams = examsQuery.data?.filter((e) => !e.isActive) ?? [];

  const selected = examsQuery.data?.find((e) => e.id === selectedId) ?? null;

  React.useEffect(() => {
    if (!selected) return;
    setEditForm({
      title: selected.title,
      description: selected.description ?? "",
      type: selected.type,
      isActive: selected.isActive,
    });
  }, [selected?.id, selected?.title, selected?.description, selected?.type, selected?.isActive]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-exams-all"] });
    queryClient.invalidateQueries({ queryKey: ["admin-exams"] });
    queryClient.invalidateQueries({ queryKey: ["public-exams"] });
  };

  const createExam = useMutation({
    mutationFn: () =>
      fetchJson("/api/admin/exams", {
        method: "POST",
        body: JSON.stringify({
          id: form.id.trim() || undefined,
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
        }),
      }),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setForm(emptyForm);
      toast.success("Examen créé");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erreur création"),
  });

  const updateExam = useMutation({
    mutationFn: (payload: typeof editForm) =>
      fetchJson(`/api/admin/exams/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: payload.title.trim(),
          description: payload.description.trim() || null,
          type: payload.type,
          isActive: payload.isActive,
        }),
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Examen mis à jour");
    },
    onError: () => toast.error("Erreur mise à jour"),
  });

  const deactivateExam = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/exams/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Examen désactivé");
    },
    onError: () => toast.error("Impossible de désactiver"),
  });

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display-md text-display-md font-bold text-on-surface mb-xs">
            Examens
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Créez et gérez les examens proposés sur la plateforme (TCF, TEF,
            IELTS, DELF, etc.). Chaque examen regroupe ses séries dans{" "}
            <strong>Banque d&apos;exercices</strong>.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouvel examen
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-1 bg-surface border border-outline-variant rounded-2xl p-md max-h-[70vh] overflow-y-auto">
          <h2 className="font-label-md font-bold mb-md">
            Liste ({examsQuery.data?.length ?? 0})
          </h2>
          {examsQuery.isLoading ? (
            <p className="text-on-surface-variant animate-pulse">Chargement…</p>
          ) : (
            <div className="flex flex-col gap-md">
              {activeExams.length > 0 && (
                <ExamListSection
                  title="Actifs"
                  exams={activeExams}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
              {inactiveExams.length > 0 && (
                <ExamListSection
                  title="Désactivés"
                  exams={inactiveExams}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  inactive
                />
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-lg">
          {selected ? (
            <div className="flex flex-col gap-md">
              <div className="flex items-start justify-between gap-md flex-wrap">
                <h2 className="font-headline-lg text-[18px] font-bold">
                  {selected.isActive ? "Modifier l'examen" : "Examen désactivé"}
                </h2>
                {selected.isActive ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      confirm({
                        title: "Désactiver cet examen ?",
                        description:
                          "Il ne sera plus visible pour les apprenants. Vous pourrez toujours le gérer ici.",
                        confirmLabel: "Désactiver",
                        destructive: true,
                        onConfirm: () => deactivateExam.mutateAsync(selected.id),
                      })
                    }
                  >
                    Désactiver
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateExam.mutate({ ...editForm, isActive: true })
                    }
                  >
                    Réactiver
                  </Button>
                )}
              </div>

              {!selected.isActive && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-md py-sm font-label-sm text-amber-900 dark:text-amber-100">
                  Cet examen est désactivé — invisible pour les apprenants, visible pour les admins.
                </div>
              )}

              <div className="flex items-center justify-between gap-md flex-wrap rounded-xl border border-outline-variant bg-surface-container-low/50 p-md">
                <p className="font-label-md text-on-surface">
                  <span className="font-bold">{selected._count.series}</span>
                  {selected._count.series !== 1 ? " séries" : " série"}
                </p>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/admin/series?examId=${encodeURIComponent(selected.id)}`}>
                    Séries
                  </Link>
                </Button>
              </div>

              <SubscriptionStatsPanel exam={selected} />

              <Input
                label="Titre"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
              <textarea
                className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[80px] bg-surface"
                placeholder="Description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <select
                className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
                value={editForm.type}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    type: e.target.value as (typeof ALL_EXAM_TYPES)[number],
                  }))
                }
              >
                {ALL_EXAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {EXAM_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-sm font-label-sm">
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(v) =>
                    setEditForm((f) => ({ ...f, isActive: v }))
                  }
                />
                Examen actif (visible sur la plateforme)
              </label>
              <Button
                onClick={() => updateExam.mutate(editForm)}
                disabled={!editForm.title.trim() || updateExam.isPending}
              >
                Enregistrer
              </Button>
            </div>
          ) : (
            <p className="text-on-surface-variant text-center py-xl">
              Sélectionnez un examen ou créez-en un nouveau.
            </p>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md">
          <div className="bg-surface rounded-2xl border border-outline-variant w-full max-w-lg p-lg shadow-violet-md">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-headline-lg text-[18px] font-bold">
                Nouvel examen
              </h2>
              <button type="button" onClick={() => setShowCreate(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-md">
              <Input
                label="Titre"
                placeholder="Ex. DELF B2"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    id: f.id || slugifyExamId(title),
                  }));
                }}
              />
              <Input
                label="Identifiant (slug technique)"
                placeholder="delf-b2"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              />
              <select
                className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as (typeof ALL_EXAM_TYPES)[number],
                  }))
                }
              >
                {ALL_EXAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {EXAM_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[72px] bg-surface"
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <label className="flex items-center gap-sm font-label-sm">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
                Activer immédiatement
              </label>
              <Button
                onClick={() => createExam.mutate()}
                disabled={!form.title.trim() || createExam.isPending}
              >
                Créer
              </Button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
