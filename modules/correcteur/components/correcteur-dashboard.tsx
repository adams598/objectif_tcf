"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CorrectionStatus = "pending" | "in_progress" | "done";

interface Submission {
  id: number;
  student: string;
  type: "EE" | "EO";
  task: string;
  date: string;
  status: CorrectionStatus;
  content: string;
  score?: number;
  feedback?: string;
}

const submissions: Submission[] = [
  {
    id: 1,
    student: "Amina Sow",
    type: "EE",
    task: "Tâche 2 — Lettre formelle",
    date: "Il y a 30 min",
    status: "pending",
    content: `Objet : Réaction à votre article sur le retour en présentiel

Monsieur le Rédacteur en chef,

Je me permets de vous adresser ce courrier à la suite de la lecture de votre article paru dans votre édition du 15 octobre dernier. Je suis particulièrement surpris par la vision réductrice que vous présentez du télétravail.

En tant que professionnel du secteur numérique, je tiens à souligner que le travail à distance a démontré, chiffres à l'appui, une amélioration significative de la productivité dans de nombreuses entreprises. Une étude récente de l'Université de Stanford révèle une augmentation de 13 % de la performance des employés en télétravail.

Néanmoins, je reconnais que certains défis méritent d'être adressés, notamment en matière de cohésion d'équipe et de transmission du savoir-faire. C'est pourquoi un modèle hybride, plutôt qu'un retour total en présentiel, me semble être la solution la plus appropriée.

Je vous remercie de l'attention que vous porterez à cette lettre et vous adresse mes cordiales salutations.

Alexandre Dupont`,
  },
  {
    id: 2,
    student: "Karim Menali",
    type: "EE",
    task: "Tâche 1 — Article de presse",
    date: "Il y a 2h",
    status: "in_progress",
    content: `Le numérique transforme l'éducation canadienne

L'intelligence artificielle bouleverse les méthodes pédagogiques dans les universités canadiennes. De Vancouver à Montréal, les établissements adoptent des outils d'apprentissage adaptatif qui personnalisent l'enseignement selon le profil de chaque étudiant.

Cette révolution pédagogique soulève cependant des questions éthiques importantes : comment garantir l'équité d'accès ? Comment préserver le rôle crucial de l'enseignant humain ?`,
    score: 12,
    feedback: "Bonne structure générale, mais manque d'exemples concrets.",
  },
  {
    id: 3,
    student: "Marie-Claire Fontaine",
    type: "EO",
    task: "Tâche 3 — Débat",
    date: "Hier",
    status: "done",
    content: "[Transcription audio disponible]",
    score: 16,
    feedback: "Excellente fluidité, argumentation solide et vocabulaire riche.",
  },
];

const criteria = [
  { key: "structure", label: "Structure & Organisation", max: 5 },
  { key: "langue", label: "Correction linguistique", max: 5 },
  { key: "vocabulaire", label: "Richesse du vocabulaire", max: 5 },
  { key: "pertinence", label: "Pertinence des idées", max: 5 },
];

export function CorrecteurDashboard() {
  const [selected, setSelected] = useState<Submission>(submissions[0]);
  const [scores, setScores] = useState<Record<string, number>>({
    structure: 3,
    langue: 4,
    vocabulaire: 3,
    pertinence: 4,
  });
  const [feedback, setFeedback] = useState("");
  const [filter, setFilter] = useState<CorrectionStatus | "all">("all");

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = criteria.reduce((a, c) => a + c.max, 0);

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  const statusLabel: Record<CorrectionStatus, string> = {
    pending: "En attente",
    in_progress: "En cours",
    done: "Corrigé",
  };

  const statusVariant: Record<CorrectionStatus, "error" | "default" | "success"> = {
    pending: "error",
    in_progress: "default",
    done: "success",
  };

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
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
            Gérez et annotez les soumissions d&apos;expression écrite et orale.
          </p>
        </div>
        <div className="flex gap-sm">
          {(["all", "pending", "in_progress", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-md py-xs rounded-full font-label-sm text-label-sm transition-all whitespace-nowrap",
                filter === f
                  ? "bg-primary text-on-primary"
                  : "bg-surface border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
              )}
            >
              {f === "all" ? "Tout" : statusLabel[f]}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Submission List */}
        <div className="lg:col-span-4 flex flex-col gap-sm">
          {filtered.map((sub, i) => (
            <motion.button
              key={sub.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(sub)}
              className={cn(
                "w-full text-left bg-surface rounded-2xl p-md border transition-all",
                selected.id === sub.id
                  ? "border-primary shadow-violet-sm"
                  : "border-outline-variant hover:border-outline"
              )}
            >
              <div className="flex items-start justify-between gap-sm mb-sm">
                <div className="flex items-center gap-sm">
                  <Avatar name={sub.student} size="sm" />
                  <div>
                    <p className="font-label-md text-label-md font-semibold text-on-surface">
                      {sub.student}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {sub.date}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant[sub.status]}>{statusLabel[sub.status]}</Badge>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {sub.type} · {sub.task}
              </p>
              {sub.score !== undefined && (
                <p className="font-label-sm text-label-sm text-primary font-bold mt-xs">
                  Score: {sub.score}/{maxScore}
                </p>
              )}
            </motion.button>
          ))}
        </div>

        {/* Correction panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="lg:col-span-8 flex flex-col gap-lg"
          >
            {/* Student text */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-violet-sm p-lg">
              <div className="flex items-center justify-between mb-md">
                <div>
                  <h2 className="font-headline-lg text-[20px] font-bold text-on-surface">
                    {selected.student}
                  </h2>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {selected.type} · {selected.task}
                  </p>
                </div>
                <Badge variant={statusVariant[selected.status]}>
                  {statusLabel[selected.status]}
                </Badge>
              </div>
              <div className="bg-surface-container-low rounded-xl p-lg font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line border border-outline-variant">
                {selected.content}
              </div>
            </div>

            {/* Scoring grid */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-violet-sm p-lg">
              <h3 className="font-headline-lg text-[18px] font-bold text-on-surface mb-lg">
                Grille d&apos;évaluation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-lg">
                {criteria.map((criterion) => (
                  <div
                    key={criterion.key}
                    className="bg-surface-container-low p-md rounded-xl border border-outline-variant"
                  >
                    <div className="flex justify-between items-center mb-sm">
                      <label className="font-label-md text-label-md text-on-surface">
                        {criterion.label}
                      </label>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {scores[criterion.key]} / {criterion.max}
                      </span>
                    </div>
                    <div className="flex gap-sm">
                      {Array.from({ length: criterion.max + 1 }, (_, n) => (
                        <button
                          key={n}
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

              {/* Total */}
              <div className="flex items-center justify-between p-md bg-primary/5 rounded-xl border border-primary/20 mb-lg">
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  Score total
                </span>
                <div className="flex items-center gap-sm">
                  <span className="font-display-md text-[28px] font-bold text-primary">
                    {totalScore}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    / {maxScore}
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <Textarea
                label="Commentaire du correcteur"
                placeholder="Rédigez un commentaire constructif pour l'étudiant..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px]"
              />

              <div className="flex justify-end gap-md mt-md">
                <Button variant="secondary">Sauvegarder le brouillon</Button>
                <Button>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Envoyer la correction
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
