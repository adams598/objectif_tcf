import {
  percentageToCecr,
  percentageToNclc,
} from "@/lib/examen/scoring";
import type {
  WritingCorrectionResult,
  WritingTaskFeedback,
  WritingTaskInput,
} from "./writing-correction-types";

const COMMON_PATTERNS: Array<{
  label: string;
  pattern: RegExp;
  suggestion: string;
}> = [
  {
    label: "Accord",
    pattern: /\b(les|des|mes|tes|ses)\s+\w+(?<!s|x)\b/gi,
    suggestion: "Vérifiez les accords pluriel/adjectif.",
  },
  {
    label: "Homophone",
    pattern: /\b(a\s+(?:fait|été|eu|peur|besoin))\b/gi,
    suggestion: "« a » (verbe avoir) vs « à » (préposition) — relisez le contexte.",
  },
  {
    label: "Ponctuation",
    pattern: /[a-zàâäéèêëïîôùûüç],[^\s]/gi,
    suggestion: "Ajoutez un espace après la virgule.",
  },
  {
    label: "Majuscule",
    pattern: /(?:^|[.!?]\s+)[a-zàâäéèêëïîôùûüç]/g,
    suggestion: "Une majuscule doit ouvrir la phrase.",
  },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/[.!?…]+/).filter((s) => s.trim().length > 3).length;
}

function uniqueWordRatio(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^\wàâäéèêëïîôùûüç\s-]/gi, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (words.length === 0) return 0;
  return new Set(words).size / words.length;
}

function detectErrors(text: string) {
  const errors: WritingTaskFeedback["errors"] = [];

  for (const rule of COMMON_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match?.[0]) {
      errors.push({
        type: rule.label,
        excerpt: match[0].slice(0, 40),
        suggestion: rule.suggestion,
      });
    }
  }

  const words = text.toLowerCase().split(/\s+/);
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length > 5) freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const repeated = [...freq.entries()].find(([, n]) => n >= 4);
  if (repeated) {
    errors.push({
      type: "Répétition",
      excerpt: `"${repeated[0]}" (${repeated[1]}×)`,
      suggestion: "Variez le vocabulaire pour enrichir le texte.",
    });
  }

  return errors.slice(0, 4);
}

function scoreTask(task: WritingTaskInput): WritingTaskFeedback {
  const wordCount = countWords(task.text);
  const compliant =
    wordCount >= task.minWords && wordCount <= task.maxWords;
  const sentences = countSentences(task.text);
  const diversity = uniqueWordRatio(task.text);
  const errors = detectErrors(task.text);

  let score = 35;

  if (wordCount === 0) {
    return {
      taskId: task.taskId,
      score: 10,
      wordCount: 0,
      compliant: false,
      strengths: [],
      improvements: [
        "Rédigez un texte complet en respectant la consigne.",
        `Objectif : ${task.minWords}–${task.maxWords} mots.`,
      ],
      errors: [],
    };
  }

  if (compliant) score += 25;
  else if (wordCount < task.minWords) score += Math.round((wordCount / task.minWords) * 15);
  else score += 10;

  if (sentences >= 3) score += 15;
  else if (sentences >= 2) score += 8;

  if (diversity >= 0.55) score += 10;
  else if (diversity >= 0.4) score += 5;

  score -= errors.length * 4;
  score = Math.min(85, Math.max(15, score));

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (compliant) strengths.push("Nombre de mots conforme à la consigne.");
  else if (wordCount < task.minWords) {
    improvements.push(
      `Texte trop court (${wordCount}/${task.minWords} mots minimum).`
    );
  } else {
    improvements.push(
      `Texte trop long (${wordCount}/${task.maxWords} mots maximum).`
    );
  }

  if (sentences >= 3) strengths.push("Texte structuré en plusieurs phrases.");
  else improvements.push("Développez avec plus de phrases liées.");

  if (diversity >= 0.5) strengths.push("Vocabulaire varié.");
  else improvements.push("Enrichissez le vocabulaire (synonymes, connecteurs).");

  if (errors.length === 0) strengths.push("Peu d'erreurs détectées automatiquement.");
  else improvements.push("Relisez orthographe, accords et ponctuation.");

  return {
    taskId: task.taskId,
    score,
    wordCount,
    compliant,
    strengths,
    improvements,
    errors,
  };
}

export function correctWritingTasksHeuristic(
  tasks: WritingTaskInput[]
): WritingCorrectionResult {
  const taskResults = tasks.map(scoreTask);
  const overallScore = Math.round(
    taskResults.reduce((sum, t) => sum + t.score, 0) / taskResults.length
  );

  const compliantCount = taskResults.filter((t) => t.compliant).length;

  return {
    overallScore,
    cecrLevel: percentageToCecr(overallScore),
    nclcLevel: percentageToNclc(overallScore),
    globalFeedback:
      compliantCount === tasks.length
        ? "Analyse automatique : vos textes respectent globalement les consignes. Une relecture ciblée sur la grammaire et la cohérence renforcera votre score à l'examen officiel."
        : "Analyse automatique : certains textes ne respectent pas encore les consignes de longueur ou de structure. Concentrez-vous sur le nombre de mots et l'organisation (introduction, développement, conclusion).",
    tasks: taskResults,
    source: "heuristic",
  };
}
