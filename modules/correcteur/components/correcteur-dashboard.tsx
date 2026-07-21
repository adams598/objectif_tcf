"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";

interface SubmissionAnswer {
  id: string;
  textResponse: string | null;
  audioUrl: string | null;
  createdAt: string;
  attempt: {
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
    series: { title: string; skill: string };
  };
  question: { content: string; type: string };
  correction: { id: string; score: number | null; status: string } | null;
}

const criteria = [
  { key: "structure", label: "Structure & Organisation", max: 5 },
  { key: "langue", label: "Correction linguistique", max: 5 },
  { key: "vocabulaire", label: "Richesse du vocabulaire", max: 5 },
  { key: "pertinence", label: "Pertinence des idées", max: 5 },
];

const SKILL_SHORT: Record<string, string> = {
  EXPRESSION_ECRITE: "EE",
  EXPRESSION_ORALE: "EO",
};

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Hier" : `Il y a ${days}j`;
}

export function CorrecteurDashboard() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({
    structure: 3,
    langue: 3,
    vocabulaire: 3,
    pertinence: 3,
  });
  const [feedback, setFeedback] = useState("");

  const query = useQuery({
    queryKey: ["corrector-submissions"],
    queryFn: () => fetchJson<SubmissionAnswer[]>("/api/correcteur/soumissions"),
    refetchInterval: 30_000,
  });

  const submissions = query.data ?? [];

  const selected = useMemo(
    () => submissions.find((s) => s.id === selectedId) ?? submissions[0] ?? null,
    [submissions, selectedId]
  );

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = criteria.reduce((a, c) => a + c.max, 0);
  const scorePercent = Math.round((totalScore / maxScore) * 100);

  const submitCorrection = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Aucune soumission");
      const student = selected.attempt.user;
      return fetchJson("/api/correcteur/soumissions", {
        method: "POST",
        body: JSON.stringify({
          answerId: selected.id,
          studentId: student.id,
          score: scorePercent,
          rubric: scores,
          feedback: feedback.trim() || "Correction effectuée.",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corrector-submissions"] });
      setFeedback("");
      toast.success("Correction envoyée");
    },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });

  const studentName = selected
    ? [selected.attempt.user.firstName, selected.attempt.user.lastName]
        .filter(Boolean)
        .join(" ") || "Étudiant"
    : "";

  return (
    <div className="flex flex-col gap-xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-md"
      >
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
            Espace Correcteur
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {submissions.length} soumission{submissions.length !== 1 ? "s" : ""} en attente
          </p>
        </div>
      </motion.div>

      {query.isLoading ? (
        <div className="p-xl text-center text-on-surface-variant animate-pulse">
          Chargement…
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-surface border border-outline-variant rounded-2xl p-xl text-center text-on-surface-variant">
          Aucune soumission en attente de correction.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <div className="lg:col-span-4 flex flex-col gap-sm max-h-[70vh] overflow-y-auto">
            {submissions.map((sub, i) => {
              const name =
                [sub.attempt.user.firstName, sub.attempt.user.lastName]
                  .filter(Boolean)
                  .join(" ") || "Étudiant";
              const skill = SKILL_SHORT[sub.attempt.series.skill] ?? sub.attempt.series.skill;
              return (
                <motion.button
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedId(sub.id)}
                  className={cn(
                    "w-full text-left bg-surface rounded-2xl p-md border transition-all",
                    selected?.id === sub.id
                      ? "border-primary shadow-violet-sm"
                      : "border-outline-variant hover:border-outline"
                  )}
                >
                  <div className="flex items-start justify-between gap-sm mb-sm">
                    <div className="flex items-center gap-sm">
                      <Avatar
                        src={sub.attempt.user.avatarUrl ?? undefined}
                        name={name}
                        size="sm"
                      />
                      <div>
                        <p className="font-label-md text-label-md font-semibold">{name}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {formatRelativeDate(sub.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="error">En attente</Badge>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {skill} · {sub.attempt.series.title}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {selected && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-8 flex flex-col gap-lg"
              >
                <div className="bg-surface rounded-2xl border border-outline-variant shadow-violet-sm p-lg">
                  <div className="flex items-center justify-between mb-md">
                    <div>
                      <h2 className="font-headline-lg text-[20px] font-bold">{studentName}</h2>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {SKILL_SHORT[selected.attempt.series.skill]} ·{" "}
                        {selected.attempt.series.title}
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-lg font-body-md text-body-md whitespace-pre-line border border-outline-variant">
                    {selected.audioUrl ? (
                      <audio controls src={selected.audioUrl} className="w-full mb-md" />
                    ) : null}
                    {selected.textResponse ?? "Contenu non disponible"}
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
                    Consigne : {selected.question.content}
                  </p>
                </div>

                <div className="bg-surface rounded-2xl border border-outline-variant shadow-violet-sm p-lg">
                  <h3 className="font-headline-lg text-[18px] font-bold mb-lg">
                    Grille d&apos;évaluation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-lg">
                    {criteria.map((criterion) => (
                      <div
                        key={criterion.key}
                        className="bg-surface-container-low p-md rounded-xl border border-outline-variant"
                      >
                        <div className="flex justify-between items-center mb-sm">
                          <label className="font-label-md text-label-md">{criterion.label}</label>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {scores[criterion.key]} / {criterion.max}
                          </span>
                        </div>
                        <div className="flex gap-sm flex-wrap">
                          {Array.from({ length: criterion.max + 1 }, (_, n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() =>
                                setScores((prev) => ({ ...prev, [criterion.key]: n }))
                              }
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                scores[criterion.key] === n
                                  ? "bg-primary text-on-primary"
                                  : "bg-surface border border-outline-variant text-on-surface-variant hover:border-primary"
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-md bg-primary/5 rounded-xl border border-primary/20 mb-lg">
                    <span className="font-label-md font-semibold">Score total</span>
                    <div className="flex items-center gap-sm">
                      <span className="font-display-md text-[28px] font-bold text-primary">
                        {totalScore}
                      </span>
                      <span className="text-on-surface-variant">/ {maxScore}</span>
                      <span className="text-primary font-bold">({scorePercent}%)</span>
                    </div>
                  </div>

                  <Textarea
                    label="Commentaire du correcteur"
                    placeholder="Rédigez un commentaire constructif…"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[100px]"
                  />

                  <div className="flex justify-end mt-md">
                    <Button
                      onClick={() => submitCorrection.mutate()}
                      disabled={submitCorrection.isPending}
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Envoyer la correction
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
