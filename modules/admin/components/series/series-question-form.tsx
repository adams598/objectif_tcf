"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminMediaUpload } from "@/modules/admin/components/admin-media-upload";
import {
  buildQcmInstruction,
  buildTaskInstructionPayload,
  type AdminSkill,
} from "@/lib/admin/question-instruction";
import type { BundleSkill } from "@/lib/admin/series-groups";

export type QcmFormState = {
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
  videoUrl: string;
  imageUrl: string;
  documentTag: string;
};

export type TaskFormState = {
  content: string;
  instruction: string;
  explanation: string;
  order: number;
  audioUrl: string;
  videoUrl: string;
  imageUrl: string;
  minWords: number;
  maxWords: number;
  preparationTime: number;
  speakingTime: number;
};

export const emptyQcmForm = (order = 1): QcmFormState => ({
  content: "",
  instruction: "",
  explanation: "",
  order,
  choiceA: "",
  choiceB: "",
  choiceC: "",
  choiceD: "",
  correctIndex: 0,
  audioUrl: "",
  videoUrl: "",
  imageUrl: "",
  documentTag: "",
});

export const emptyTaskForm = (order = 1): TaskFormState => ({
  content: "",
  instruction: "",
  explanation: "",
  order,
  audioUrl: "",
  videoUrl: "",
  imageUrl: "",
  minWords: 60,
  maxWords: 120,
  preparationTime: 120,
  speakingTime: 120,
});

export function isQcmSkill(skill: BundleSkill) {
  return skill === "COMPREHENSION_ORALE" || skill === "COMPREHENSION_ECRITE";
}

export function buildQcmPayload(skill: AdminSkill, form: QcmFormState) {
  return {
    type: "QCM" as const,
    content: form.content,
    instruction:
      buildQcmInstruction(skill, form.instruction, form.documentTag) || null,
    explanation: form.explanation || null,
    order: form.order,
    audioUrl: form.audioUrl || null,
    videoUrl: form.videoUrl || null,
    imageUrl: form.imageUrl || null,
    choices: [form.choiceA, form.choiceB, form.choiceC, form.choiceD].map(
      (content, order) => ({
        content,
        isCorrect: order === form.correctIndex,
        order,
      })
    ),
  };
}

export function buildTaskPayload(skill: BundleSkill, form: TaskFormState) {
  return {
    type:
      skill === "EXPRESSION_ORALE"
        ? ("SPEAKING_TASK" as const)
        : ("WRITING_TASK" as const),
    content: form.content,
    instruction: buildTaskInstructionPayload(form),
    explanation: form.explanation || null,
    order: form.order,
    audioUrl: form.audioUrl || null,
    videoUrl: form.videoUrl || null,
    imageUrl: form.imageUrl || null,
  };
}

interface SeriesQuestionFormProps {
  skill: BundleSkill;
  qcmForm: QcmFormState;
  taskForm: TaskFormState;
  onQcmChange: React.Dispatch<React.SetStateAction<QcmFormState>>;
  onTaskChange: React.Dispatch<React.SetStateAction<TaskFormState>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  editing: boolean;
}

export function SeriesQuestionForm({
  skill,
  qcmForm,
  taskForm,
  onQcmChange,
  onTaskChange,
  onSave,
  onCancel,
  saving,
  editing,
}: SeriesQuestionFormProps) {
  const isQcm = isQcmSkill(skill);

  return (
    <div className="flex flex-col gap-md rounded-xl border border-primary/25 bg-primary/5 p-md">
      <h4 className="font-label-md text-label-md font-bold">
        {editing ? "Modifier" : "Ajouter"} une question
      </h4>

      {isQcm ? (
        <>
          {skill === "COMPREHENSION_ORALE" && (
            <>
              <AdminMediaUpload
                kind="audio"
                label="Audio de la question"
                value={qcmForm.audioUrl}
                onChange={(url) =>
                  onQcmChange((f) => ({ ...f, audioUrl: url }))
                }
              />
              <AdminMediaUpload
                kind="video"
                label="Vidéo de la question (optionnel)"
                value={qcmForm.videoUrl}
                onChange={(url) =>
                  onQcmChange((f) => ({ ...f, videoUrl: url }))
                }
              />
            </>
          )}
          {skill === "COMPREHENSION_ECRITE" && (
            <AdminMediaUpload
              kind="image"
              label="Document / image"
              value={qcmForm.imageUrl}
              onChange={(url) => onQcmChange((f) => ({ ...f, imageUrl: url }))}
            />
          )}
          <textarea
            className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[72px] bg-surface"
            placeholder={
              skill === "COMPREHENSION_ORALE"
                ? "Consigne affichée à l'élève (optionnel)"
                : "Texte du document (passage)"
            }
            value={qcmForm.instruction}
            onChange={(e) =>
              onQcmChange((f) => ({ ...f, instruction: e.target.value }))
            }
          />
          <textarea
            className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[56px] bg-surface"
            placeholder="Énoncé de la question"
            value={qcmForm.content}
            onChange={(e) =>
              onQcmChange((f) => ({ ...f, content: e.target.value }))
            }
          />
          {["A", "B", "C", "D"].map((letter, i) => (
            <div key={letter} className="flex items-center gap-sm">
              <input
                type="radio"
                name={`correct-${skill}`}
                checked={qcmForm.correctIndex === i}
                onChange={() => onQcmChange((f) => ({ ...f, correctIndex: i }))}
              />
              <Input
                placeholder={`Réponse ${letter}`}
                value={
                  [qcmForm.choiceA, qcmForm.choiceB, qcmForm.choiceC, qcmForm.choiceD][i]
                }
                onChange={(e) => {
                  const key = ["choiceA", "choiceB", "choiceC", "choiceD"][
                    i
                  ] as keyof QcmFormState;
                  onQcmChange((f) => ({ ...f, [key]: e.target.value }));
                }}
              />
            </div>
          ))}
        </>
      ) : (
        <>
          <textarea
            className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[72px] bg-surface"
            placeholder="Consigne de la tâche"
            value={taskForm.instruction}
            onChange={(e) =>
              onTaskChange((f) => ({ ...f, instruction: e.target.value }))
            }
          />
          <textarea
            className="w-full rounded-xl border border-outline-variant p-md font-body-md min-h-[88px] bg-surface"
            placeholder="Sujet"
            value={taskForm.content}
            onChange={(e) =>
              onTaskChange((f) => ({ ...f, content: e.target.value }))
            }
          />
          {skill === "EXPRESSION_ECRITE" && (
            <AdminMediaUpload
              kind="image"
              label="Document (optionnel)"
              value={taskForm.imageUrl}
              onChange={(url) => onTaskChange((f) => ({ ...f, imageUrl: url }))}
            />
          )}
          {skill === "EXPRESSION_ORALE" && (
            <>
              <AdminMediaUpload
                kind="audio"
                label="Consigne audio (optionnel)"
                value={taskForm.audioUrl}
                onChange={(url) => onTaskChange((f) => ({ ...f, audioUrl: url }))}
              />
              <div className="grid grid-cols-2 gap-sm">
                <Input
                  type="number"
                  min={0}
                  placeholder="Préparation (s)"
                  value={taskForm.preparationTime}
                  onChange={(e) =>
                    onTaskChange((f) => ({
                      ...f,
                      preparationTime: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Parole (s)"
                  value={taskForm.speakingTime}
                  onChange={(e) =>
                    onTaskChange((f) => ({
                      ...f,
                      speakingTime: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
            </>
          )}
        </>
      )}

      <div className="flex gap-sm">
        <Button onClick={onSave} disabled={saving} size="sm">
          {editing ? "Enregistrer" : "Ajouter"}
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
