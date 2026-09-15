"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/api/fetch-json";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  MONTH_LABELS_FR,
  defaultTopicTitle,
  type GuideSkill,
} from "@/lib/guides/defaults";
import {
  taskHeading,
  type GuideTaskItem,
  type SerializedGuideCombination,
  type SerializedGuideTask,
  type SerializedTopicSet,
} from "@/lib/guides/structure";

type GuideDetail = {
  id: string;
  skill: GuideSkill;
  title: string;
  intro: string;
  topicSets: SerializedTopicSet[];
};

const TABS: Array<{ skill: GuideSkill; label: string }> = [
  { skill: "EXPRESSION_ECRITE", label: "Expression écrite" },
  { skill: "EXPRESSION_ORALE", label: "Expression orale" },
];

const textareaClass =
  "w-full min-h-[120px] rounded-xl border border-outline-variant p-md font-body-md bg-surface";

function taskEditorMode(skill: GuideSkill, taskNumber: number) {
  if (skill === "EXPRESSION_ORALE") return "subjects" as const;
  if (taskNumber === 3) return "ee-t3" as const;
  return "prompt" as const;
}

function TaskEditor({
  skill,
  task,
  onSave,
  saving,
}: {
  skill: GuideSkill;
  task: SerializedGuideTask;
  onSave: (payload: {
    heading?: string;
    prompt?: string;
    items?: GuideTaskItem[];
  }) => void;
  saving: boolean;
}) {
  const mode = taskEditorMode(skill, task.taskNumber);
  const [heading, setHeading] = useState(task.heading);
  const [prompt, setPrompt] = useState(task.prompt);
  const [items, setItems] = useState<GuideTaskItem[]>(task.items);
  const [newSubject, setNewSubject] = useState("");

  React.useEffect(() => {
    setHeading(task.heading);
    setPrompt(task.prompt);
    setItems(task.items);
  }, [task.heading, task.prompt, task.items]);

  const documents = [
    items[0]?.content ?? "",
    items[1]?.content ?? "",
  ];

  return (
    <div className="rounded-lg bg-surface-container-low p-sm flex flex-col gap-sm">
      <p className="font-label-sm font-bold">{taskHeading(task.taskNumber)}</p>

      {mode === "prompt" ? (
        <>
          <textarea
            className={textareaClass}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Consigne complète de la tâche"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={saving || !prompt.trim()}
            onClick={() => onSave({ prompt: prompt.trim(), items: [] })}
          >
            Enregistrer
          </Button>
        </>
      ) : null}

      {mode === "subjects" ? (
        <>
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="rounded-lg border border-outline-variant bg-surface p-sm flex flex-col gap-xs"
            >
              <div className="flex items-center justify-between gap-sm">
                <p className="font-label-sm font-bold">
                  {item.title || `Sujet ${index + 1}`}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setItems((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                >
                  Retirer
                </Button>
              </div>
              <textarea
                className={textareaClass}
                value={item.content}
                onChange={(e) =>
                  setItems((current) =>
                    current.map((entry, itemIndex) =>
                      itemIndex === index
                        ? { ...entry, content: e.target.value }
                        : entry
                    )
                  )
                }
              />
            </div>
          ))}
          <textarea
            className={textareaClass}
            placeholder="Nouveau sujet (consigne complète)"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />
          <div className="flex flex-wrap gap-sm">
            <Button
              size="sm"
              variant="secondary"
              disabled={!newSubject.trim()}
              onClick={() => {
                setItems((current) => [
                  ...current,
                  {
                    title: `Sujet ${current.length + 1}`,
                    content: newSubject.trim(),
                  },
                ]);
                setNewSubject("");
              }}
            >
              Ajouter ce sujet
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={() =>
                onSave({
                  items: items
                    .map((item, index) => ({
                      title: item.title || `Sujet ${index + 1}`,
                      content: item.content.trim(),
                    }))
                    .filter((item) => item.content),
                })
              }
            >
              Enregistrer la tâche
            </Button>
          </div>
        </>
      ) : null}

      {mode === "ee-t3" ? (
        <>
          <Input
            label="Titre du sujet (optionnel)"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Ex. Vivre en colocation : pour ou contre ?"
          />
          <label className="font-label-sm">
            Consigne
            <textarea
              className={`${textareaClass} mt-xs`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Consigne de la tâche 3 (nombre de mots, plan attendu…)"
            />
          </label>
          <label className="font-label-sm">
            Document 1
            <textarea
              className={`${textareaClass} mt-xs`}
              value={documents[0]}
              onChange={(e) =>
                setItems([
                  { title: "Document 1", content: e.target.value },
                  { title: "Document 2", content: documents[1] },
                ])
              }
            />
          </label>
          <label className="font-label-sm">
            Document 2
            <textarea
              className={`${textareaClass} mt-xs`}
              value={documents[1]}
              onChange={(e) =>
                setItems([
                  { title: "Document 1", content: documents[0] },
                  { title: "Document 2", content: e.target.value },
                ])
              }
            />
          </label>
          <Button
            size="sm"
            disabled={saving}
            onClick={() =>
              onSave({
                heading: heading.trim(),
                prompt: prompt.trim(),
                items: [
                  { title: "Document 1", content: documents[0].trim() },
                  { title: "Document 2", content: documents[1].trim() },
                ].filter((item) => item.content),
              })
            }
          >
            Enregistrer la tâche 3
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function GuidesAdminView() {
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirmDialog();
  const [skill, setSkill] = useState<GuideSkill>("EXPRESSION_ECRITE");
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const query = useQuery({
    queryKey: ["admin-guide", skill],
    queryFn: () => fetchJson<GuideDetail>(`/api/admin/guides/${skill}`),
  });

  const guide = query.data;
  React.useEffect(() => {
    if (!guide) return;
    setTitle(guide.title);
    setIntro(guide.intro);
  }, [guide]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-guide", skill] });

  const saveIntro = useMutation({
    mutationFn: () =>
      fetchJson(`/api/admin/guides/${skill}`, {
        method: "PATCH",
        body: JSON.stringify({ title, intro }),
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Texte de formation enregistré");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const addSet = useMutation({
    mutationFn: () =>
      fetchJson(`/api/admin/guides/${skill}`, {
        method: "POST",
        body: JSON.stringify({
          year,
          month,
          title: defaultTopicTitle(year, month),
        }),
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Mois ajouté");
    },
    onError: (e) =>
      toast.error(
        e instanceof Error ? e.message : "Ce mois existe déjà ou erreur"
      ),
  });

  const addCombination = useMutation({
    mutationFn: (setId: string) =>
      fetchJson(`/api/admin/guides/sets/${setId}/combinations`, {
        method: "POST",
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Combinaison ajoutée");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const saveTask = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        heading?: string;
        prompt?: string;
        items?: GuideTaskItem[];
      };
    }) =>
      fetchJson(`/api/admin/guides/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Tâche enregistrée");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const deleteSet = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/guides/sets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Mois supprimé");
    },
  });

  const deleteCombination = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/guides/combinations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Combinaison supprimée");
    },
  });

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="font-display-md text-display-md font-bold mb-xs">
          Pages expression écrite & orale
        </h1>
        <p className="font-body-md text-on-surface-variant max-w-3xl">
          Alice peut tout modifier ici, sans Vercel : Connexion → Admin →
          Expression EE/EO. Ajoutez un mois, puis des combinaisons. À l’oral,
          chaque combinaison a une tâche 2 (plusieurs sujets d’entretien) et une
          tâche 3 (plusieurs sujets d’opinion). À l’écrit, chaque combinaison a
          les tâches 1, 2 et 3 (avec deux documents). Pages publiques :{" "}
          <a className="text-primary underline" href="/expression-ecrite">
            /expression-ecrite
          </a>{" "}
          et{" "}
          <a className="text-primary underline" href="/expression-orale">
            /expression-orale
          </a>
          .
        </p>
      </div>

      <div className="flex gap-sm">
        {TABS.map((tab) => (
          <Button
            key={tab.skill}
            variant={skill === tab.skill ? "primary" : "secondary"}
            onClick={() => setSkill(tab.skill)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <p className="text-on-surface-variant">Chargement…</p>
      ) : (
        <>
          <div className="rounded-2xl border border-outline-variant bg-surface p-md flex flex-col gap-sm">
            <h2 className="font-label-md font-bold">Texte de formation</h2>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              className="w-full min-h-[220px] rounded-xl border border-outline-variant p-md font-body-md bg-surface"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => saveIntro.mutate()}
              disabled={saveIntro.isPending}
            >
              Enregistrer le texte
            </Button>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface p-md flex flex-col gap-md">
            <h2 className="font-label-md font-bold">Sujets récents par mois</h2>
            <div className="flex flex-wrap items-end gap-sm">
              <label className="flex flex-col gap-xs font-label-sm">
                Mois
                <select
                  className="rounded-lg border border-outline-variant px-sm py-xs bg-surface"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTH_LABELS_FR.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-xs font-label-sm">
                Année
                <Input
                  type="number"
                  className="w-28"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || year)}
                />
              </label>
              <Button
                size="sm"
                onClick={() => addSet.mutate()}
                disabled={addSet.isPending}
              >
                Ajouter ce mois
              </Button>
            </div>

            <div className="flex flex-col gap-md">
              {(guide?.topicSets ?? []).map((set) => (
                <div
                  key={set.id}
                  className="rounded-xl border border-outline-variant p-md flex flex-col gap-md"
                >
                  <div className="flex items-center justify-between gap-sm">
                    <h3 className="font-label-md font-bold">{set.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        confirm({
                          title: "Supprimer ce mois ?",
                          description:
                            "Toutes les combinaisons de ce mois seront retirées.",
                          confirmLabel: "Supprimer",
                          destructive: true,
                          onConfirm: () => deleteSet.mutateAsync(set.id),
                        })
                      }
                    >
                      Supprimer
                    </Button>
                  </div>

                  {set.combinations.map((combination: SerializedGuideCombination) => (
                    <div
                      key={combination.id}
                      className="rounded-xl border border-outline-variant p-sm flex flex-col gap-sm"
                    >
                      <div className="flex items-center justify-between gap-sm">
                        <h4 className="font-label-sm font-bold">
                          {combination.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            confirm({
                              title: "Supprimer cette combinaison ?",
                              description: "Les tâches et sujets seront retirés.",
                              confirmLabel: "Supprimer",
                              destructive: true,
                              onConfirm: () =>
                                deleteCombination.mutateAsync(combination.id),
                            })
                          }
                        >
                          Retirer
                        </Button>
                      </div>
                      {combination.tasks.map((task) => (
                        <TaskEditor
                          key={task.id}
                          skill={skill}
                          task={task}
                          saving={saveTask.isPending}
                          onSave={(payload) =>
                            saveTask.mutate({ id: task.id, payload })
                          }
                        />
                      ))}
                    </div>
                  ))}

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={addCombination.isPending}
                    onClick={() => addCombination.mutate(set.id)}
                  >
                    Ajouter une combinaison
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {dialog}
    </div>
  );
}
