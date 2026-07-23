"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { AdminMediaUpload } from "@/modules/admin/components/admin-media-upload";
import {
  buildQcmInstruction,
  buildTaskInstructionPayload,
  parseQcmInstructionForForm,
  parseTaskInstructionForForm,
  type AdminSkill,
} from "@/lib/admin/question-instruction";

interface AdminExam {
  id: string;
  type: string;
  title: string;
}

interface AdminSeries {
  id: string;
  examId: string;
  skill: string;
  title: string;
  description: string | null;
  difficulty: string;
  durationMin: number;
  order: number;
  isPublished: boolean;
  isFree: boolean;
  isCustomContent?: boolean;
  exam: { type: string; title: string };
  _count: { questions: number; attempts: number };
}

interface AdminQuestion {
  id: string;
  type: string;
  content: string;
  instruction: string | null;
  explanation: string | null;
  order: number;
  audioUrl?: string | null;
  imageUrl?: string | null;
  choices: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
  }>;
}

const SKILL_LABELS: Record<string, string> = {
  COMPREHENSION_ORALE: "CO — Compréhension orale",
  COMPREHENSION_ECRITE: "CE — Compréhension écrite",
  EXPRESSION_ECRITE: "EE — Expression écrite",
  EXPRESSION_ORALE: "EO — Expression orale",
  LEXIQUE: "Lexique",
};

const SKILLS = Object.keys(SKILL_LABELS);
const DIFFICULTIES = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

type QcmFormState = {
  content: string;
  instruction: string;
  explanation: string;
  order: number;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correctIndex: number;
  audioUrl: string;
  imageUrl: string;
  documentTag: string;
};

type TaskFormState = {
  content: string;
  instruction: string;
  explanation: string;
  order: number;
  audioUrl: string;
  imageUrl: string;
  minWords: number;
  maxWords: number;
  preparationTime: number;
  speakingTime: number;
};

const emptyQcmForm = (): QcmFormState => ({
  content: "",
  instruction: "",
  explanation: "",
  order: 1,
  choiceA: "",
  choiceB: "",
  choiceC: "",
  choiceD: "",
  correctIndex: 0,
  audioUrl: "",
  imageUrl: "",
  documentTag: "",
});

const emptyTaskForm = (): TaskFormState => ({
  content: "",
  instruction: "",
  explanation: "",
  order: 1,
  audioUrl: "",
  imageUrl: "",
  minWords: 60,
  maxWords: 120,
  preparationTime: 120,
  speakingTime: 120,
});

const emptySeriesForm = {
  examId: "",
  skill: "COMPREHENSION_ORALE",
  title: "",
  description: "",
  difficulty: "B1" as const,
  durationMin: 30,
  order: 101,
  isPublished: false,
  isFree: false,
};

function questionToQcmForm(q: AdminQuestion, skill: AdminSkill): QcmFormState {
  const choices = q.choices.slice(0, 4);
  while (choices.length < 4) {
    choices.push({ id: "", content: "", isCorrect: false, order: choices.length });
  }
  const parsed = parseQcmInstructionForForm(skill, q.instruction);
  return {
    content: q.content,
    instruction: parsed.instruction,
    explanation: q.explanation ?? "",
    order: q.order,
    choiceA: choices[0]?.content ?? "",
    choiceB: choices[1]?.content ?? "",
    choiceC: choices[2]?.content ?? "",
    choiceD: choices[3]?.content ?? "",
    correctIndex: Math.max(0, choices.findIndex((c) => c.isCorrect)),
    audioUrl: q.audioUrl ?? "",
    imageUrl: q.imageUrl ?? "",
    documentTag: parsed.documentTag,
  };
}

function questionToTaskForm(q: AdminQuestion): TaskFormState {
  const parsed = parseTaskInstructionForForm(q.instruction);
  return {
    content: q.content,
    instruction: parsed.instruction,
    explanation: q.explanation ?? "",
    order: q.order,
    audioUrl: q.audioUrl ?? "",
    imageUrl: q.imageUrl ?? "",
    minWords: parsed.minWords,
    maxWords: parsed.maxWords,
    preparationTime: parsed.preparationTime,
    speakingTime: parsed.speakingTime,
  };
}

export function SeriesAdminView() {
  const queryClient = useQueryClient();
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<string>("ALL");
  const [skillFilter, setSkillFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showCreateSeries, setShowCreateSeries] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [seriesForm, setSeriesForm] = useState(emptySeriesForm);
  const [seriesEdit, setSeriesEdit] = useState({
    title: "",
    description: "",
    difficulty: "B1",
    durationMin: 30,
    order: 0,
  });
  const [qcmForm, setQcmForm] = useState(emptyQcmForm());
  const [taskForm, setTaskForm] = useState(emptyTaskForm());

  const examsQuery = useQuery({
    queryKey: ["admin-exams"],
    queryFn: () => fetchJson<AdminExam[]>("/api/admin/exams"),
  });

  const seriesQuery = useQuery({
    queryKey: ["admin-series", examFilter, skillFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (examFilter !== "ALL") params.set("examId", examFilter);
      if (skillFilter !== "ALL") params.set("skill", skillFilter);
      const query = params.toString();
      return fetchJson<AdminSeries[]>(
        query ? `/api/admin/series?${query}` : "/api/admin/series"
      );
    },
  });

  const detailQuery = useQuery({
    queryKey: ["admin-series-detail", selectedSeriesId],
    queryFn: () =>
      fetchJson<AdminSeries & { questions: AdminQuestion[] }>(
        `/api/admin/series/${selectedSeriesId}`
      ),
    enabled: !!selectedSeriesId,
  });

  const filteredSeries = useMemo(() => {
    const list = seriesQuery.data ?? [];
    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.exam.title.toLowerCase().includes(term) ||
        String(s.order).includes(term)
    );
  }, [seriesQuery.data, search]);

  const selectedDetail = detailQuery.data;
  const isQcmSeries =
    selectedDetail?.skill === "COMPREHENSION_ORALE" ||
    selectedDetail?.skill === "COMPREHENSION_ECRITE";
  const isTaskSeries =
    selectedDetail?.skill === "EXPRESSION_ECRITE" ||
    selectedDetail?.skill === "EXPRESSION_ORALE";

  React.useEffect(() => {
    if (!selectedDetail) return;
    setSeriesEdit({
      title: selectedDetail.title,
      description: selectedDetail.description ?? "",
      difficulty: selectedDetail.difficulty,
      durationMin: selectedDetail.durationMin,
      order: selectedDetail.order,
    });
  }, [selectedDetail?.id, selectedDetail?.title, selectedDetail?.description, selectedDetail?.difficulty, selectedDetail?.durationMin, selectedDetail?.order]);

  const invalidateSeries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-series"] });
    queryClient.invalidateQueries({ queryKey: ["admin-series-detail"] });
  };

  const createSeries = useMutation({
    mutationFn: (payload: typeof emptySeriesForm) =>
      fetchJson("/api/admin/series", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidateSeries();
      setShowCreateSeries(false);
      setSeriesForm(emptySeriesForm);
      toast.success("Série créée");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erreur création série"),
  });

  const updateSeries = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) =>
      fetchJson(`/api/admin/series/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidateSeries();
      toast.success("Série mise à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteSeries = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/series/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateSeries();
      setSelectedSeriesId(null);
      toast.success("Série supprimée");
    },
    onError: () => toast.error("Impossible de supprimer la série"),
  });

  const addQuestion = useMutation({
    mutationFn: (payload: object) =>
      fetchJson(`/api/admin/series/${selectedSeriesId}/questions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidateSeries();
      closeQuestionForm();
      toast.success("Question ajoutée");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erreur ajout question"),
  });

  const updateQuestion = useMutation({
    mutationFn: ({
      questionId,
      payload,
    }: {
      questionId: string;
      payload: object;
    }) =>
      fetchJson(`/api/admin/questions/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidateSeries();
      closeQuestionForm();
      toast.success("Question mise à jour");
    },
    onError: () => toast.error("Erreur mise à jour question"),
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: string) =>
      fetchJson(`/api/admin/questions/${questionId}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateSeries();
      toast.success("Question supprimée");
    },
  });

  const closeQuestionForm = () => {
    setShowQuestionForm(false);
    setEditingQuestionId(null);
    setQcmForm(emptyQcmForm());
    setTaskForm(emptyTaskForm());
  };

  const openAddQuestion = () => {
    setEditingQuestionId(null);
    const nextOrder = (selectedDetail?.questions?.length ?? 0) + 1;
    setQcmForm({ ...emptyQcmForm(), order: nextOrder });
    setTaskForm({ ...emptyTaskForm(), order: nextOrder });
    setShowQuestionForm(true);
  };

  const openEditQuestion = (q: AdminQuestion) => {
    setEditingQuestionId(q.id);
    if (q.type === "QCM") {
      setQcmForm(
        questionToQcmForm(q, (selectedDetail?.skill ?? "COMPREHENSION_ORALE") as AdminSkill)
      );
    } else {
      setTaskForm(questionToTaskForm(q));
    }
    setShowQuestionForm(true);
  };

  const buildQcmPayload = (form: QcmFormState) => {
    const skill = (selectedDetail?.skill ?? "COMPREHENSION_ORALE") as AdminSkill;
    const choices = [form.choiceA, form.choiceB, form.choiceC, form.choiceD].map(
      (content, order) => ({
        content,
        isCorrect: order === form.correctIndex,
        order,
      })
    );

    return {
      type: "QCM" as const,
      content: form.content,
      instruction:
        buildQcmInstruction(skill, form.instruction, form.documentTag) ||
        null,
      explanation: form.explanation || null,
      order: form.order,
      audioUrl: form.audioUrl || null,
      imageUrl: form.imageUrl || null,
      choices,
    };
  };

  const buildTaskPayload = (form: TaskFormState) => ({
    type:
      selectedDetail?.skill === "EXPRESSION_ORALE"
        ? ("SPEAKING_TASK" as const)
        : ("WRITING_TASK" as const),
    content: form.content,
    instruction: buildTaskInstructionPayload(form),
    explanation: form.explanation || null,
    order: form.order,
    audioUrl: form.audioUrl || null,
    imageUrl: form.imageUrl || null,
  });

  const handleSaveQuestion = () => {
    const payload = isQcmSeries ? buildQcmPayload(qcmForm) : buildTaskPayload(taskForm);
    if (editingQuestionId) {
      updateQuestion.mutate({ questionId: editingQuestionId, payload });
    } else {
      addQuestion.mutate(payload);
    }
  };

  const handleSaveSeriesMeta = () => {
    if (!selectedDetail) return;
    updateSeries.mutate({
      id: selectedDetail.id,
      data: {
        title: seriesEdit.title,
        description: seriesEdit.description || null,
        difficulty: seriesEdit.difficulty,
        durationMin: seriesEdit.durationMin,
        order: seriesEdit.order,
      },
    });
  };

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
            Banque d&apos;exercices
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Créez, modifiez et publiez vos séries et questions sans intervention
            technique. Les séries modifiées ici sont marquées « contenu admin » et
            ne sont plus écrasées par{" "}
            <code className="text-primary">npm run db:seed</code> (le seed ne
            remplace que les séries issues du code non personnalisées).
          </p>
        </div>
        <Button onClick={() => setShowCreateSeries(true)} className="shrink-0">
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
        <select
          className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
        >
          <option value="ALL">Toutes les compétences</option>
          {SKILLS.map((skill) => (
            <option key={skill} value={skill}>
              {SKILL_LABELS[skill]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Rechercher une série…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-1 bg-surface border border-outline-variant rounded-2xl p-md max-h-[70vh] overflow-y-auto">
          <h2 className="font-label-md text-label-md font-bold mb-md">
            Séries ({filteredSeries.length})
          </h2>
          {seriesQuery.isLoading ? (
            <p className="text-on-surface-variant font-label-sm">Chargement…</p>
          ) : filteredSeries.length === 0 ? (
            <p className="text-on-surface-variant font-label-sm">
              Aucune série. Créez-en une avec le bouton ci-dessus.
            </p>
          ) : (
            <div className="flex flex-col gap-xs">
              {filteredSeries.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSeriesId(s.id)}
                  className={cn(
                    "text-left p-md rounded-xl border transition-all",
                    selectedSeriesId === s.id
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-sm mb-xs">
                    <span className="font-label-sm text-label-sm font-bold text-primary">
                      {SKILL_LABELS[s.skill]?.split(" — ")[0] ?? s.skill}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      #{s.order} · {s._count.questions} Q
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface line-clamp-2">
                    {s.title}
                  </p>
                  <p className="font-label-sm text-[11px] text-on-surface-variant mt-xs">
                    {s.exam.title}
                  </p>
                  <div className="flex gap-xs mt-sm">
                    {s.isFree && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-container text-success font-bold">
                        Gratuit
                      </span>
                    )}
                    {s.isPublished && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        Publié
                      </span>
                    )}
                    {s.isCustomContent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold">
                        Admin
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-md">
          {!selectedSeriesId ? (
            <div className="bg-surface border border-outline-variant rounded-2xl p-xl text-center text-on-surface-variant">
              Sélectionnez une série pour modifier ses paramètres et ses questions
            </div>
          ) : detailQuery.isLoading ? (
            <div className="bg-surface border border-outline-variant rounded-2xl p-xl animate-pulse h-64" />
          ) : selectedDetail ? (
            <>
              <div className="bg-surface border border-outline-variant rounded-2xl p-lg flex flex-col gap-md">
                <div className="flex flex-wrap items-start justify-between gap-md">
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    Paramètres de la série
                    {selectedDetail.isCustomContent && (
                      <span className="ml-sm text-[12px] font-label-sm font-bold px-sm py-xs rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 align-middle">
                        Contenu admin (protégé du seed)
                      </span>
                    )}
                  </h2>
                  <div className="flex gap-sm">
                    <Button size="sm" onClick={openAddQuestion}>
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Question
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Supprimer cette série ? Les questions associées seront masquées."
                          )
                        ) {
                          deleteSeries.mutate(selectedDetail.id);
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <Input
                    placeholder="Titre"
                    value={seriesEdit.title}
                    onChange={(e) =>
                      setSeriesEdit((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Numéro d'ordre"
                    type="number"
                    value={seriesEdit.order}
                    onChange={(e) =>
                      setSeriesEdit((f) => ({
                        ...f,
                        order: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                  <select
                    className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
                    value={seriesEdit.difficulty}
                    onChange={(e) =>
                      setSeriesEdit((f) => ({ ...f, difficulty: e.target.value }))
                    }
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Durée (minutes)"
                    type="number"
                    value={seriesEdit.durationMin}
                    onChange={(e) =>
                      setSeriesEdit((f) => ({
                        ...f,
                        durationMin: parseInt(e.target.value, 10) || 30,
                      }))
                    }
                  />
                </div>
                <textarea
                  className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[72px] bg-surface"
                  placeholder="Description"
                  value={seriesEdit.description}
                  onChange={(e) =>
                    setSeriesEdit((f) => ({ ...f, description: e.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-md items-center">
                  <label className="flex items-center gap-sm font-label-sm text-label-sm">
                    <Switch
                      checked={selectedDetail.isPublished}
                      onCheckedChange={(v) =>
                        updateSeries.mutate({
                          id: selectedDetail.id,
                          data: { isPublished: v },
                        })
                      }
                    />
                    Publié
                  </label>
                  <label className="flex items-center gap-sm font-label-sm text-label-sm">
                    <Switch
                      checked={selectedDetail.isFree}
                      onCheckedChange={(v) =>
                        updateSeries.mutate({
                          id: selectedDetail.id,
                          data: { isFree: v },
                        })
                      }
                    />
                    Gratuit (invités)
                  </label>
                  <Button size="sm" onClick={handleSaveSeriesMeta}>
                    Enregistrer les paramètres
                  </Button>
                </div>
              </div>

              {showQuestionForm && (
                <div className="bg-surface-container-low border border-primary/20 rounded-2xl p-lg flex flex-col gap-md">
                  <h3 className="font-label-md text-label-md font-bold">
                    {editingQuestionId ? "Modifier la question" : "Nouvelle question"}
                    {isTaskSeries ? " (tâche EE/EO)" : " (QCM)"}
                  </h3>

                  <Input
                    placeholder="Numéro d'ordre"
                    type="number"
                    value={isQcmSeries ? qcmForm.order : taskForm.order}
                    onChange={(e) => {
                      const order = parseInt(e.target.value, 10) || 1;
                      if (isQcmSeries) setQcmForm((f) => ({ ...f, order }));
                      else setTaskForm((f) => ({ ...f, order }));
                    }}
                  />

                  {isQcmSeries ? (
                    <>
                      <textarea
                        className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[80px] bg-surface"
                        placeholder={
                          selectedDetail?.skill === "COMPREHENSION_ORALE"
                            ? "Consigne d'écoute (texte affiché à l'élève)"
                            : "Passage / document texte (CE)"
                        }
                        value={qcmForm.instruction}
                        onChange={(e) =>
                          setQcmForm((f) => ({ ...f, instruction: e.target.value }))
                        }
                      />
                      {(selectedDetail?.skill === "COMPREHENSION_ORALE" ||
                        selectedDetail?.skill === "COMPREHENSION_ECRITE") && (
                        <Input
                          placeholder="Étiquette document (ex. Annonce, Email…)"
                          value={qcmForm.documentTag}
                          onChange={(e) =>
                            setQcmForm((f) => ({ ...f, documentTag: e.target.value }))
                          }
                        />
                      )}
                      <textarea
                        className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[60px] bg-surface"
                        placeholder="Question"
                        value={qcmForm.content}
                        onChange={(e) =>
                          setQcmForm((f) => ({ ...f, content: e.target.value }))
                        }
                      />
                      {["A", "B", "C", "D"].map((letter, i) => (
                        <div key={letter} className="flex items-center gap-sm">
                          <input
                            type="radio"
                            name="correct"
                            checked={qcmForm.correctIndex === i}
                            onChange={() =>
                              setQcmForm((f) => ({ ...f, correctIndex: i }))
                            }
                          />
                          <Input
                            placeholder={`Réponse ${letter}`}
                            value={
                              [qcmForm.choiceA, qcmForm.choiceB, qcmForm.choiceC, qcmForm.choiceD][i]
                            }
                            onChange={(e) => {
                              const key = ["choiceA", "choiceB", "choiceC", "choiceD"][i] as keyof QcmFormState;
                              setQcmForm((f) => ({ ...f, [key]: e.target.value }));
                            }}
                          />
                        </div>
                      ))}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <AdminMediaUpload
                          kind="audio"
                          label="Fichier audio (CO)"
                          value={qcmForm.audioUrl}
                          onChange={(url) =>
                            setQcmForm((f) => ({ ...f, audioUrl: url }))
                          }
                        />
                        <AdminMediaUpload
                          kind="image"
                          label="Image (CE / document)"
                          value={qcmForm.imageUrl}
                          onChange={(url) =>
                            setQcmForm((f) => ({ ...f, imageUrl: url }))
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <textarea
                        className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[80px] bg-surface"
                        placeholder="Consigne / instruction de la tâche"
                        value={taskForm.instruction}
                        onChange={(e) =>
                          setTaskForm((f) => ({ ...f, instruction: e.target.value }))
                        }
                      />
                      <textarea
                        className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[100px] bg-surface"
                        placeholder="Sujet de la tâche"
                        value={taskForm.content}
                        onChange={(e) =>
                          setTaskForm((f) => ({ ...f, content: e.target.value }))
                        }
                      />
                      {selectedDetail?.skill === "EXPRESSION_ECRITE" && (
                        <div className="grid grid-cols-2 gap-md">
                          <Input
                            type="number"
                            min={1}
                            placeholder="Min. mots"
                            value={taskForm.minWords}
                            onChange={(e) =>
                              setTaskForm((f) => ({
                                ...f,
                                minWords: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                          <Input
                            type="number"
                            min={1}
                            placeholder="Max. mots"
                            value={taskForm.maxWords}
                            onChange={(e) =>
                              setTaskForm((f) => ({
                                ...f,
                                maxWords: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </div>
                      )}
                      {selectedDetail?.skill === "EXPRESSION_ORALE" && (
                        <div className="grid grid-cols-2 gap-md">
                          <Input
                            type="number"
                            min={0}
                            placeholder="Préparation (secondes)"
                            value={taskForm.preparationTime}
                            onChange={(e) =>
                              setTaskForm((f) => ({
                                ...f,
                                preparationTime: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                          <Input
                            type="number"
                            min={1}
                            placeholder="Temps de parole (secondes)"
                            value={taskForm.speakingTime}
                            onChange={(e) =>
                              setTaskForm((f) => ({
                                ...f,
                                speakingTime: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        {selectedDetail?.skill === "EXPRESSION_ORALE" && (
                          <AdminMediaUpload
                            kind="audio"
                            label="Consigne audio (EO)"
                            value={taskForm.audioUrl}
                            onChange={(url) =>
                              setTaskForm((f) => ({ ...f, audioUrl: url }))
                            }
                          />
                        )}
                        <AdminMediaUpload
                          kind="image"
                          label={
                            selectedDetail?.skill === "EXPRESSION_ECRITE"
                              ? "Document / image (EE)"
                              : "Image (EO, optionnel)"
                          }
                          value={taskForm.imageUrl}
                          onChange={(url) =>
                            setTaskForm((f) => ({ ...f, imageUrl: url }))
                          }
                        />
                      </div>
                    </>
                  )}

                  <Input
                    placeholder="Explication pédagogique (optionnel)"
                    value={isQcmSeries ? qcmForm.explanation : taskForm.explanation}
                    onChange={(e) => {
                      if (isQcmSeries) {
                        setQcmForm((f) => ({ ...f, explanation: e.target.value }));
                      } else {
                        setTaskForm((f) => ({ ...f, explanation: e.target.value }));
                      }
                    }}
                  />

                  <div className="flex gap-sm">
                    <Button
                      onClick={handleSaveQuestion}
                      disabled={addQuestion.isPending || updateQuestion.isPending}
                    >
                      Enregistrer
                    </Button>
                    <Button variant="secondary" onClick={closeQuestionForm}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-sm">
                <h3 className="font-label-md text-label-md font-bold">
                  Questions ({selectedDetail.questions?.length ?? 0})
                </h3>
                {selectedDetail.questions?.map((q) => (
                  <div
                    key={q.id}
                    className="bg-surface border border-outline-variant rounded-xl p-md"
                  >
                    <div className="flex justify-between items-start gap-md">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm">
                          <span className="font-label-sm text-label-sm text-primary font-bold">
                            Q{q.order}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            {q.type}
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface mt-xs">
                          {q.content}
                        </p>
                        {q.instruction && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm line-clamp-3 whitespace-pre-wrap">
                            {q.instruction}
                          </p>
                        )}
                        {q.choices.length > 0 && (
                          <ul className="mt-sm space-y-xs">
                            {q.choices.map((c, i) => (
                              <li
                                key={c.id}
                                className={cn(
                                  "font-label-sm text-label-sm",
                                  c.isCorrect
                                    ? "text-success font-bold"
                                    : "text-on-surface-variant"
                                )}
                              >
                                {String.fromCharCode(65 + i)}. {c.content}
                                {c.isCorrect && " ✓"}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex gap-xs shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditQuestion(q)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Supprimer cette question ?")) {
                              deleteQuestion.mutate(q.id);
                            }
                          }}
                        >
                          <span className="material-symbols-outlined text-error text-[18px]">
                            delete
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {showCreateSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md">
          <div className="bg-surface rounded-2xl border border-outline-variant w-full max-w-lg p-lg shadow-violet-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-headline-lg text-[18px] font-bold">Nouvelle série</h2>
              <button
                type="button"
                onClick={() => setShowCreateSeries(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-md">
              <select
                className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
                value={seriesForm.examId}
                onChange={(e) =>
                  setSeriesForm((f) => ({ ...f, examId: e.target.value }))
                }
              >
                <option value="">Choisir un examen</option>
                {examsQuery.data?.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
                value={seriesForm.skill}
                onChange={(e) =>
                  setSeriesForm((f) => ({ ...f, skill: e.target.value }))
                }
              >
                {SKILLS.map((skill) => (
                  <option key={skill} value={skill}>
                    {SKILL_LABELS[skill]}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Titre de la série"
                value={seriesForm.title}
                onChange={(e) =>
                  setSeriesForm((f) => ({ ...f, title: e.target.value }))
                }
              />
              <textarea
                className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[72px] bg-surface"
                placeholder="Description (optionnel)"
                value={seriesForm.description}
                onChange={(e) =>
                  setSeriesForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-md">
                <Input
                  placeholder="Ordre"
                  type="number"
                  value={seriesForm.order}
                  onChange={(e) =>
                    setSeriesForm((f) => ({
                      ...f,
                      order: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
                <Input
                  placeholder="Durée (min)"
                  type="number"
                  value={seriesForm.durationMin}
                  onChange={(e) =>
                    setSeriesForm((f) => ({
                      ...f,
                      durationMin: parseInt(e.target.value, 10) || 30,
                    }))
                  }
                />
              </div>
              <select
                className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm"
                value={seriesForm.difficulty}
                onChange={(e) =>
                  setSeriesForm((f) => ({
                    ...f,
                    difficulty: e.target.value as typeof seriesForm.difficulty,
                  }))
                }
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-sm font-label-sm">
                <Switch
                  checked={seriesForm.isPublished}
                  onCheckedChange={(v) =>
                    setSeriesForm((f) => ({ ...f, isPublished: v }))
                  }
                />
                Publier immédiatement
              </label>
              <label className="flex items-center gap-sm font-label-sm">
                <Switch
                  checked={seriesForm.isFree}
                  onCheckedChange={(v) =>
                    setSeriesForm((f) => ({ ...f, isFree: v }))
                  }
                />
                Série gratuite
              </label>
              <Button
                onClick={() => createSeries.mutate(seriesForm)}
                disabled={!seriesForm.examId || !seriesForm.title.trim()}
              >
                Créer la série
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
