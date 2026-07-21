import { z } from "zod";
import {
  percentageToCecr,
  percentageToNclc,
} from "@/lib/examen/scoring";
import type {
  WritingCorrectionResult,
  WritingTaskInput,
} from "./writing-correction-types";

const taskFeedbackSchema = z.object({
  taskId: z.number(),
  score: z.number().min(0).max(100),
  wordCount: z.number(),
  compliant: z.boolean(),
  strengths: z.array(z.string()).max(5),
  improvements: z.array(z.string()).max(5),
  errors: z
    .array(
      z.object({
        type: z.string(),
        excerpt: z.string(),
        suggestion: z.string(),
      })
    )
    .max(5),
});

const aiResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  globalFeedback: z.string(),
  tasks: z.array(taskFeedbackSchema),
});

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"] as const;

function buildPrompt(tasks: WritingTaskInput[]): string {
  const tasksBlock = tasks
    .map(
      (t) =>
        `Tâche ${t.taskId} (${t.minWords}–${t.maxWords} mots)\nConsigne : ${t.prompt}\nRéponse candidat :\n"""${t.text || "(vide)"}"""`
    )
    .join("\n\n---\n\n");

  return `Tu es correcteur agrégé expert TCF Canada, TEF Canada et IELTS — expression écrite.
Évalue chaque tâche avec rigueur institutionnelle sur : adéquation à la consigne, registre de langue, cohérence argumentative, connecteurs logiques, orthographe, grammaire, syntaxe, vocabulaire et richesse lexicale.
Cite des extraits exacts du texte du candidat pour chaque erreur identifiée. Ne invente jamais d'erreur absente du texte.
Attribue un score réaliste (0-100) aligné sur les grilles officielles. Un texte hors consigne ou sous le minimum de mots ne peut pas dépasser 45/100.
Réponds UNIQUEMENT en JSON valide (sans markdown) avec ce schéma :
{
  "overallScore": number (0-100, moyenne pondérée),
  "globalFeedback": string (2-3 phrases en français, ton encourageant),
  "tasks": [
    {
      "taskId": number,
      "score": number (0-100),
      "wordCount": number,
      "compliant": boolean,
      "strengths": string[],
      "improvements": string[],
      "errors": [{ "type": string, "excerpt": string, "suggestion": string }]
    }
  ]
}

${tasksBlock}`;
}

async function callGeminiModel(
  model: string,
  apiKey: string,
  prompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });

  if (response.status === 429) {
    throw new Error("GEMINI_RATE_LIMIT");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GEMINI_ERROR_${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("GEMINI_EMPTY_RESPONSE");
  return text;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function correctWritingTasksWithGemini(
  tasks: WritingTaskInput[]
): Promise<WritingCorrectionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");

  const prompt = buildPrompt(tasks);
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
        const raw = await callGeminiModel(model, apiKey, prompt);
        const parsed = aiResponseSchema.parse(JSON.parse(raw));

        return {
          overallScore: Math.round(parsed.overallScore),
          cecrLevel: percentageToCecr(parsed.overallScore),
          nclcLevel: percentageToNclc(parsed.overallScore),
          globalFeedback: parsed.globalFeedback,
          tasks: parsed.tasks,
          source: "gemini",
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError.message === "GEMINI_RATE_LIMIT") {
          await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        }
      }
    }
  }

  throw lastError ?? new Error("GEMINI_FAILED");
}
