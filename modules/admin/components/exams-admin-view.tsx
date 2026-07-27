"use client";

import React, { useState } from "react";
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
}

const emptyForm = {
  id: "",
  type: "TCF_CANADA" as (typeof ALL_EXAM_TYPES)[number],
  title: "",
  description: "",
  isActive: true,
};

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
    queryFn: () =>
      fetchJson<AdminExam[]>("/api/admin/exams?includeInactive=true"),
  });

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

  const deleteExam = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/exams/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      toast.success("Examen désactivé");
    },
    onError: () => toast.error("Impossible de supprimer"),
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
            <div className="flex flex-col gap-xs">
              {examsQuery.data?.map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => setSelectedId(exam.id)}
                  className={cn(
                    "text-left p-md rounded-xl border transition-all",
                    selectedId === exam.id
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-sm mb-xs">
                    <Badge variant="outline">{EXAM_TYPE_LABELS[exam.type]}</Badge>
                    {!exam.isActive && (
                      <Badge variant="error">Inactif</Badge>
                    )}
                  </div>
                  <p className="font-label-md font-semibold">{exam.title}</p>
                  <p className="font-label-sm text-on-surface-variant mt-xs">
                    {exam._count.series} séries · {exam.id}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-lg">
          {selected ? (
            <div className="flex flex-col gap-md">
              <div className="flex items-start justify-between gap-md">
                <h2 className="font-headline-lg text-[18px] font-bold">
                  Modifier l&apos;examen
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    confirm({
                      title: "Désactiver cet examen ?",
                      description:
                        "Il ne sera plus visible pour les apprenants. Les séries associées restent en base.",
                      confirmLabel: "Désactiver",
                      destructive: true,
                      onConfirm: () => deleteExam.mutateAsync(selected.id),
                    })
                  }
                >
                  Désactiver
                </Button>
              </div>

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
