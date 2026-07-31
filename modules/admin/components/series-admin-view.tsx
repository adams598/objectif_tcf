"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  BUNDLE_SKILLS,
  SKILL_CARD_LABELS,
  SKILL_ICONS,
  SKILL_SHORT,
  buildAdminSeriesGroups,
  groupKey,
  type AdminFlatSeries,
  type AdminSeriesGroup,
  type BundleSkill,
} from "@/lib/admin/series-groups";
import {
  parseQcmInstructionForForm,
  parseTaskInstructionForForm,
  type AdminSkill,
} from "@/lib/admin/question-instruction";
import {
  SeriesQuestionForm,
  buildQcmPayload,
  buildTaskPayload,
  emptyQcmForm,
  emptyTaskForm,
  isQcmSkill,
  type QcmFormState,
  type TaskFormState,
} from "@/modules/admin/components/series/series-question-form";

interface AdminExam {
  id: string;
  type: string;
  title: string;
}

interface AdminQuestion {
  id: string;
  type: string;
  content: string;
  instruction: string | null;
  order: number;
  audioUrl?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  choices: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
  }>;
}

type CreateForm = {
  examId: string;
  title: string;
  isFree: boolean;
};

const emptyCreateForm = (): CreateForm => ({
  examId: "",
  title: "",
  isFree: false,
});

function questionToQcmForm(q: AdminQuestion, skill: AdminSkill): QcmFormState {
  const choices = q.choices.slice(0, 4);
  while (choices.length < 4) {
    choices.push({ id: "", content: "", isCorrect: false, order: choices.length });
  }
  const parsed = parseQcmInstructionForForm(skill, q.instruction);
  return {
    content: q.content,
    instruction: parsed.instruction,
    explanation: "",
    order: q.order,
    choiceA: choices[0]?.content ?? "",
    choiceB: choices[1]?.content ?? "",
    choiceC: choices[2]?.content ?? "",
    choiceD: choices[3]?.content ?? "",
    correctIndex: Math.max(0, choices.findIndex((c) => c.isCorrect)),
    audioUrl: q.audioUrl ?? "",
    videoUrl: q.videoUrl ?? "",
    imageUrl: q.imageUrl ?? "",
    documentTag: parsed.documentTag,
  };
}

function questionToTaskForm(q: AdminQuestion): TaskFormState {
  const parsed = parseTaskInstructionForForm(q.instruction);
  return {
    content: q.content,
    instruction: parsed.instruction,
    explanation: "",
    order: q.order,
    audioUrl: q.audioUrl ?? "",
    videoUrl: q.videoUrl ?? "",
    imageUrl: q.imageUrl ?? "",
    minWords: parsed.minWords,
    maxWords: parsed.maxWords,
    preparationTime: parsed.preparationTime,
    speakingTime: parsed.speakingTime,
  };
}

function SkillPanel({
  group,
  skill,
  onClose,
}: {
  group: AdminSeriesGroup;
  skill: BundleSkill;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const entry = group.skills[skill];
  const seriesId = entry?.seriesId;

  const [showForm, setShowForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qcmForm, setQcmForm] = useState(emptyQcmForm());
  const [taskForm, setTaskForm] = useState(emptyTaskForm());

  const detailQuery = useQuery({
    queryKey: ["admin-series-detail", seriesId],
    queryFn: () =>
      fetchJson<{ questions: AdminQuestion[] }>(`/api/admin/series/${seriesId}`),
    enabled: !!seriesId,
  });

  const questions = detailQuery.data?.questions ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-series"] });
    queryClient.invalidateQueries({ queryKey: ["admin-series-detail"] });
  };

  const addQuestion = useMutation({
    mutationFn: (payload: object) =>
      fetchJson(`/api/admin/series/${seriesId}/questions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success("Question ajoutée");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const updateQuestion = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) =>
      fetchJson(`/api/admin/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success("Question mise à jour");
    },
    onError: () => toast.error("Erreur mise à jour"),
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/questions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Question supprimée");
    },
  });

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const closeForm = () => {
    setShowForm(false);
    setEditingQuestionId(null);
    setQcmForm(emptyQcmForm());
    setTaskForm(emptyTaskForm());
  };

  const openAdd = () => {
    const next = questions.length + 1;
    setEditingQuestionId(null);
    setQcmForm(emptyQcmForm(next));
    setTaskForm(emptyTaskForm(next));
    setShowForm(true);
  };

  const openEdit = (q: AdminQuestion) => {
    setEditingQuestionId(q.id);
    if (isQcmSkill(skill)) {
      setQcmForm(questionToQcmForm(q, skill as AdminSkill));
    } else {
      setTaskForm(questionToTaskForm(q));
    }
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = isQcmSkill(skill)
      ? buildQcmPayload(skill as AdminSkill, qcmForm)
      : buildTaskPayload(skill, taskForm);
    if (editingQuestionId) {
      updateQuestion.mutate({ id: editingQuestionId, payload });
    } else {
      addQuestion.mutate(payload);
    }
  };

  if (!seriesId) {
    return (
      <p className="text-on-surface-variant font-label-sm p-md">
        Compétence non disponible pour cette série.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between gap-sm">
        <h3 className="font-label-md text-label-md font-bold">
          {SKILL_CARD_LABELS[skill]} — {questions.length} question
          {questions.length !== 1 ? "s" : ""}
        </h3>
        <div className="flex gap-xs">
          {!showForm && (
            <Button size="sm" onClick={openAdd}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Ajouter
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {showForm && (
        <SeriesQuestionForm
          skill={skill}
          qcmForm={qcmForm}
          taskForm={taskForm}
          onQcmChange={setQcmForm}
          onTaskChange={setTaskForm}
          onSave={handleSave}
          onCancel={closeForm}
          saving={addQuestion.isPending || updateQuestion.isPending}
          editing={!!editingQuestionId}
        />
      )}

      {detailQuery.isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
      ) : questions.length === 0 ? (
        <p className="font-label-sm text-label-sm text-on-surface-variant text-center py-lg">
          Aucune question — cliquez sur Ajouter pour commencer.
        </p>
      ) : (
        <div className="flex flex-col gap-xs">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex items-start justify-between gap-sm rounded-xl border border-outline-variant bg-surface p-md"
            >
              <div className="min-w-0 flex-1">
                <span className="font-label-sm text-label-sm font-bold text-primary">
                  Q{q.order}
                </span>
                <p className="font-body-md text-body-md text-on-surface mt-xs line-clamp-2">
                  {q.content}
                </p>
              </div>
              <div className="flex shrink-0 gap-xs">
                <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    confirm({
                      title: "Supprimer cette question ?",
                      description: "Cette action est définitive.",
                      confirmLabel: "Supprimer",
                      destructive: true,
                      onConfirm: () => deleteQuestion.mutateAsync(q.id),
                    })
                  }
                >
                  <span className="material-symbols-outlined text-error text-[18px]">
                    delete
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDialog}
    </div>
  );
}

export function SeriesAdminView() {
  const queryClient = useQueryClient();
  const [examFilter, setExamFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState<BundleSkill | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [titleDraft, setTitleDraft] = useState("");

  const examsQuery = useQuery({
    queryKey: ["admin-exams"],
    queryFn: () => fetchJson<AdminExam[]>("/api/admin/exams"),
  });

  const seriesQuery = useQuery({
    queryKey: ["admin-series", examFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (examFilter !== "ALL") params.set("examId", examFilter);
      const q = params.toString();
      return fetchJson<AdminFlatSeries[]>(
        q ? `/api/admin/series?${q}` : "/api/admin/series"
      );
    },
  });

  const groups = useMemo(
    () => buildAdminSeriesGroups(seriesQuery.data ?? []),
    [seriesQuery.data]
  );

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const term = search.toLowerCase();
    return groups.filter(
      (g) =>
        g.title.toLowerCase().includes(term) ||
        g.examTitle.toLowerCase().includes(term)
    );
  }, [groups, search]);

  const selectedGroup = filteredGroups.find((g) => g.key === selectedGroupKey) ?? null;

  React.useEffect(() => {
    if (selectedGroup) setTitleDraft(selectedGroup.title);
  }, [selectedGroup?.key, selectedGroup?.title]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-series"] });
    queryClient.invalidateQueries({ queryKey: ["admin-series-detail"] });
  };

  const createBundle = useMutation({
    mutationFn: (payload: CreateForm) =>
      fetchJson<{ examId: string; order: number }>("/api/admin/series/bundle", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      invalidate();
      setShowCreate(false);
      setCreateForm(emptyCreateForm());
      setSelectedGroupKey(groupKey(data.examId, data.order));
      setActiveSkill(null);
      toast.success("Brouillon créé — ajoutez vos questions par compétence");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Erreur création"),
  });

  const updateBundle = useMutation({
    mutationFn: (payload: {
      examId: string;
      order: number;
      title?: string;
      isFree?: boolean;
      isPublished?: boolean;
    }) =>
      fetchJson("/api/admin/series/bundle", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Série mise à jour");
    },
    onError: () => toast.error("Erreur mise à jour"),
  });

  const deleteBundle = useMutation({
    mutationFn: ({ examId, order }: { examId: string; order: number }) =>
      fetchJson(`/api/admin/series/bundle?examId=${examId}&order=${order}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate();
      setSelectedGroupKey(null);
      setActiveSkill(null);
      toast.success("Série supprimée");
    },
  });

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const handlePublish = () => {
    if (!selectedGroup) return;
    if (selectedGroup.totalQuestions === 0) {
      toast.error("Ajoutez au moins une question avant de publier");
      return;
    }
    updateBundle.mutate({
      examId: selectedGroup.examId,
      order: selectedGroup.order,
      isPublished: true,
    });
  };

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
            Séries d&apos;examen
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Créez une série en 2 étapes : informations de base, puis questions CO / CE / EE / EO.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouvelle série
        </Button>
      </div>

      <div className="flex flex-wrap gap-sm">
        <select
          className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
        >
          <option value="ALL">Tous les examens</option>
          {examsQuery.data?.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
        <Input
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-1 bg-surface border border-outline-variant rounded-2xl p-md max-h-[75vh] overflow-y-auto">
          <h2 className="font-label-md text-label-md font-bold mb-md">
            Séries ({filteredGroups.length})
          </h2>
          {seriesQuery.isLoading ? (
            <p className="text-on-surface-variant font-label-sm">Chargement…</p>
          ) : filteredGroups.length === 0 ? (
            <p className="text-on-surface-variant font-label-sm">
              Aucune série. Créez un brouillon pour commencer.
            </p>
          ) : (
            <div className="flex flex-col gap-xs">
              {filteredGroups.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => {
                    setSelectedGroupKey(g.key);
                    setActiveSkill(null);
                  }}
                  className={cn(
                    "text-left p-md rounded-xl border transition-all",
                    selectedGroupKey === g.key
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant hover:border-primary/30"
                  )}
                >
                  <p className="font-label-sm text-label-sm font-bold text-on-surface line-clamp-2">
                    {g.title}
                  </p>
                  <p className="font-label-sm text-[11px] text-on-surface-variant mt-xs">
                    {g.examTitle} · #{g.order}
                  </p>
                  <div className="flex flex-wrap gap-xs mt-sm">
                    {g.isDraft && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold">
                        Brouillon
                      </span>
                    )}
                    {g.isPublished && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        Publié
                      </span>
                    )}
                    {g.isFree && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-container text-success font-bold">
                        Gratuit
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      {g.totalQuestions} Q
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-md">
          {!selectedGroup ? (
            <div className="bg-surface border border-outline-variant rounded-2xl p-xl text-center text-on-surface-variant">
              Sélectionnez une série ou créez-en une nouvelle
            </div>
          ) : (
            <>
              <div className="bg-surface border border-outline-variant rounded-2xl p-lg flex flex-col gap-md">
                <div className="flex flex-wrap items-start justify-between gap-md">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => {
                        if (
                          titleDraft.trim() &&
                          titleDraft !== selectedGroup.title
                        ) {
                          updateBundle.mutate({
                            examId: selectedGroup.examId,
                            order: selectedGroup.order,
                            title: titleDraft.trim(),
                          });
                        }
                      }}
                      className="font-headline-lg text-lg font-bold"
                    />
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                      {selectedGroup.examTitle}
                      {selectedGroup.isDraft && " · Brouillon — non visible des apprenants"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-sm">
                    {!selectedGroup.isPublished && (
                      <Button size="sm" onClick={handlePublish}>
                        Publier
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        confirm({
                          title: "Supprimer toute la série ?",
                          description:
                            "CO, CE, EE et EO seront supprimés. Cette action est définitive.",
                          confirmLabel: "Supprimer",
                          destructive: true,
                          onConfirm: () =>
                            deleteBundle.mutateAsync({
                              examId: selectedGroup.examId,
                              order: selectedGroup.order,
                            }),
                        })
                      }
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>

                <label className="flex items-center gap-sm font-label-sm text-label-sm w-fit">
                  <Switch
                    checked={selectedGroup.isFree}
                    onCheckedChange={(v) =>
                      updateBundle.mutate({
                        examId: selectedGroup.examId,
                        order: selectedGroup.order,
                        isFree: v,
                      })
                    }
                  />
                  Série gratuite (accessible sans abonnement)
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                {BUNDLE_SKILLS.map((skill) => {
                  const entry = selectedGroup.skills[skill];
                  const count = entry?.questionCount ?? 0;
                  const isActive = activeSkill === skill;
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setActiveSkill(isActive ? null : skill)}
                      className={cn(
                        "flex flex-col items-center gap-sm rounded-2xl border p-md transition-all text-center",
                        isActive
                          ? "border-primary bg-primary/10 shadow-violet-sm"
                          : count > 0
                            ? "border-outline-variant bg-surface hover:border-primary/40"
                            : "border-dashed border-outline-variant bg-surface-container-low hover:border-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-[28px]",
                          isActive ? "text-primary" : "text-on-surface-variant"
                        )}
                      >
                        {SKILL_ICONS[skill]}
                      </span>
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">
                        {SKILL_SHORT[skill]}
                      </span>
                      <span className="font-label-sm text-[11px] text-on-surface-variant">
                        {count === 0 ? "À compléter" : `${count} question${count > 1 ? "s" : ""}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeSkill && (
                <div className="bg-surface border border-outline-variant rounded-2xl p-lg">
                  <SkillPanel
                    group={selectedGroup}
                    skill={activeSkill}
                    onClose={() => setActiveSkill(null)}
                  />
                </div>
              )}

              {!activeSkill && (
                <p className="text-center font-label-sm text-label-sm text-on-surface-variant py-md">
                  Cliquez sur une compétence (CO, CE, EE ou EO) pour ajouter des questions.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md">
          <div className="bg-surface rounded-2xl border border-outline-variant w-full max-w-md p-lg shadow-violet-md">
            <div className="flex items-center justify-between mb-md">
              <div>
                <h2 className="font-headline-lg text-[18px] font-bold">Nouvelle série</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  Étape 1 — vous ajouterez les questions juste après.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-md">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-xs block">
                  Examen
                </label>
                <select
                  className="w-full rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
                  value={createForm.examId}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, examId: e.target.value }))
                  }
                >
                  <option value="">Choisir…</option>
                  {examsQuery.data?.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-xs block">
                  Titre de la série
                </label>
                <Input
                  placeholder="Ex. Série 5 — Immigration"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>

              <label className="flex items-center gap-sm font-label-sm text-label-sm">
                <Switch
                  checked={createForm.isFree}
                  onCheckedChange={(v) =>
                    setCreateForm((f) => ({ ...f, isFree: v }))
                  }
                />
                Série gratuite
              </label>

              <Button
                onClick={() => createBundle.mutate(createForm)}
                disabled={
                  !createForm.examId ||
                  !createForm.title.trim() ||
                  createBundle.isPending
                }
                className="w-full"
              >
                Créer le brouillon
              </Button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
