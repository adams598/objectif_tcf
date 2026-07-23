import { parseQuestionMeta } from "@/lib/examen/content-bank/helpers";

export type AdminSkill =
  | "COMPREHENSION_ORALE"
  | "COMPREHENSION_ECRITE"
  | "EXPRESSION_ECRITE"
  | "EXPRESSION_ORALE"
  | "LEXIQUE";

export function buildQcmInstruction(
  skill: AdminSkill,
  instructionText: string,
  documentTag?: string
): string | null {
  const text = instructionText.trim();
  const tag = documentTag?.trim();

  if (!text && !tag) return null;

  if (skill === "COMPREHENSION_ORALE") {
    if (!tag) return text || null;
    return JSON.stringify({
      listenInstruction: text || undefined,
      documentTag: tag,
    });
  }

  if (!tag) return text || null;

  return JSON.stringify({
    passage: text || undefined,
    documentTag: tag,
  });
}

export function parseQcmInstructionForForm(
  skill: AdminSkill,
  instruction: string | null
): { instruction: string; documentTag: string } {
  const meta = parseQuestionMeta(instruction);
  let text = "";
  if (skill === "COMPREHENSION_ORALE") {
    text =
      (typeof meta.listenInstruction === "string" ? meta.listenInstruction : "") ||
      (typeof meta.audioScript === "string" ? "" : "") ||
      (instruction && !instruction.startsWith("{") ? instruction : "");
  } else {
    text =
      (typeof meta.passage === "string" ? meta.passage : "") ||
      (instruction && !instruction.startsWith("{") ? instruction : "");
  }
  const documentTag =
    typeof meta.documentTag === "string"
      ? meta.documentTag
      : typeof meta.documentType === "string"
        ? meta.documentType
        : "";
  return { instruction: text, documentTag };
}

export function buildTaskInstructionPayload(form: {
  instruction: string;
  minWords?: number;
  maxWords?: number;
  preparationTime?: number;
  speakingTime?: number;
}): string | null {
  const taskInstruction = form.instruction.trim();
  const meta: Record<string, unknown> = {};

  if (taskInstruction) meta.taskInstruction = taskInstruction;
  if (form.minWords != null && form.minWords > 0) meta.minWords = form.minWords;
  if (form.maxWords != null && form.maxWords > 0) meta.maxWords = form.maxWords;
  if (form.preparationTime != null && form.preparationTime >= 0) {
    meta.preparationTime = form.preparationTime;
  }
  if (form.speakingTime != null && form.speakingTime > 0) {
    meta.speakingTime = form.speakingTime;
  }

  if (Object.keys(meta).length === 0) return null;
  if (Object.keys(meta).length === 1 && meta.taskInstruction) {
    return taskInstruction;
  }
  return JSON.stringify(meta);
}

export function parseTaskInstructionForForm(instruction: string | null): {
  instruction: string;
  minWords: number;
  maxWords: number;
  preparationTime: number;
  speakingTime: number;
} {
  const meta = parseQuestionMeta(instruction);
  const instructionText =
    typeof meta.taskInstruction === "string"
      ? meta.taskInstruction
      : instruction && !instruction.startsWith("{")
        ? instruction
        : "";

  return {
    instruction: instructionText,
    minWords: typeof meta.minWords === "number" ? meta.minWords : 60,
    maxWords: typeof meta.maxWords === "number" ? meta.maxWords : 120,
    preparationTime:
      typeof meta.preparationTime === "number" ? meta.preparationTime : 120,
    speakingTime:
      typeof meta.speakingTime === "number" ? meta.speakingTime : 120,
  };
}
