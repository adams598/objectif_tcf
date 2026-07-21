import type { BankQuestion, BankSeries } from "../content-bank/tcf-canada";
import type { QuestionType, Skill } from "@prisma/client";
import {
  getCeDocumentTag,
  getCeImage,
  getCoMedia,
  getEoPromptScript,
} from "../media/assets";

export function enrichQuestionMedia(
  q: BankQuestion,
  skill: Skill
): BankQuestion {
  if (skill === "COMPREHENSION_ORALE" && q.type === "QCM") {
    const media = getCoMedia(q.order);
    return {
      ...q,
      imageUrl: media.imageUrl,
      meta: {
        ...(q.meta ?? {}),
        audioScript: media.audioScript,
        documentType: media.documentType,
        listenInstruction: q.instruction ?? "Écoutez le document sonore.",
      },
    };
  }

  if (skill === "COMPREHENSION_ECRITE" && q.type === "QCM") {
    const passage = q.instruction ?? "";
    return {
      ...q,
      imageUrl: getCeImage(q.order),
      instruction: undefined,
      meta: {
        passage,
        documentTag: getCeDocumentTag(q.order),
      },
    };
  }

  if (skill === "EXPRESSION_ORALE" && q.type === "SPEAKING_TASK") {
    return {
      ...q,
      meta: {
        ...(q.meta ?? {}),
        promptAudioScript: getEoPromptScript(q.order),
        taskInstruction: q.instruction ?? "",
      },
    };
  }

  return q;
}

export function bankQuestionToPrisma(
  q: BankQuestion,
  seriesId: string
): {
  question: {
    seriesId: string;
    type: QuestionType;
    content: string;
    instruction: string | null;
    audioUrl: string | null;
    imageUrl: string | null;
    order: number;
    explanation: string | null;
    points: number;
  };
  choices: Array<{ content: string; isCorrect: boolean; order: number }>;
} {
  const type: QuestionType =
    q.type === "WRITING_TASK"
      ? "WRITING_TASK"
      : q.type === "SPEAKING_TASK"
        ? "SPEAKING_TASK"
        : "QCM";

  const meta: Record<string, unknown> = { ...(q.meta ?? {}) };

  if (
    q.instruction &&
    !meta.audioScript &&
    !meta.passage &&
    q.type === "QCM" &&
    meta.minWords === undefined
  ) {
    meta.passage = q.instruction;
  }

  if (q.instruction && meta.audioScript && !meta.listenInstruction) {
    meta.listenInstruction = q.instruction;
  }

  let instruction: string | null = null;
  if (Object.keys(meta).length > 0) {
    instruction = JSON.stringify(meta);
  } else if (q.instruction) {
    instruction = q.instruction;
  }

  return {
    question: {
      seriesId,
      type,
      content: q.content,
      instruction,
      audioUrl: q.audioUrl ?? null,
      imageUrl: q.imageUrl ?? null,
      order: q.order,
      explanation: q.explanation ?? null,
      points: 1,
    },
    choices: (q.choices ?? []).map((c, i) => ({
      content: c.content,
      isCorrect: c.isCorrect,
      order: i,
    })),
  };
}

export function parseQuestionMeta(
  instruction: string | null
): Record<string, unknown> {
  if (!instruction) return {};
  try {
    return JSON.parse(instruction) as Record<string, unknown>;
  } catch {
    return { passage: instruction };
  }
}

export function getPassageFromInstruction(
  instruction: string | null
): string | null {
  const meta = parseQuestionMeta(instruction);
  if (typeof meta.passage === "string") return meta.passage;
  if (instruction && !instruction.startsWith("{")) return instruction;
  return null;
}

export function getAudioScriptFromInstruction(
  instruction: string | null
): string | null {
  const meta = parseQuestionMeta(instruction);
  if (typeof meta.audioScript === "string") return meta.audioScript;
  if (typeof meta.promptAudioScript === "string") return meta.promptAudioScript;
  return null;
}

export function getDocumentTypeFromInstruction(
  instruction: string | null
): string | null {
  const meta = parseQuestionMeta(instruction);
  if (typeof meta.documentType === "string") return meta.documentType;
  if (typeof meta.documentTag === "string") return meta.documentTag;
  return null;
}

export function skillToAbbrev(skill: Skill): "CO" | "CE" | "EE" | "EO" {
  const map: Record<string, "CO" | "CE" | "EE" | "EO"> = {
    COMPREHENSION_ORALE: "CO",
    COMPREHENSION_ECRITE: "CE",
    EXPRESSION_ECRITE: "EE",
    EXPRESSION_ORALE: "EO",
  };
  return map[skill] ?? "CO";
}

export type { BankSeries, BankQuestion };
