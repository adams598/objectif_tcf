import { generateResultPdf } from "@/lib/pdf/generate-documents";
import type { ExamScoreResult } from "@/lib/examen/scoring";

const SKILL_LABELS: Record<string, string> = {
  CO: "Comprehension orale",
  CE: "Comprehension ecrite",
  EE: "Expression ecrite",
  EO: "Expression orale",
};

/** Télécharge le PDF d’un résultat via l’API (compte connecté). */
export async function downloadResultPdfByAttemptId(
  attemptId: string,
  filenameHint?: string
): Promise<void> {
  const response = await fetch(`/api/resultats/${attemptId}/pdf`);
  if (!response.ok) {
    throw new Error("download_pdf_failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filenameHint
    ? `${filenameHint.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 40)}.pdf`
    : `resultat-${attemptId}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Génère un PDF côté client (ex. invité / résultat frais en session). */
export async function downloadResultPdfFromScore(
  result: ExamScoreResult,
  opts?: { title?: string; studentName?: string }
): Promise<void> {
  const review = result.details?.answerReview?.filter((a) => !a.isCorrect) ?? [];
  const pdfBytes = await generateResultPdf({
    title: opts?.title ?? `Serie ${result.skill}`,
    studentName: opts?.studentName ?? "Candidat",
    completedAt: new Date(result.completedAt).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    skill: SKILL_LABELS[result.skill] ?? result.skill,
    percentage: result.percentage,
    cecrLevel: result.cecrLevel,
    nclcLevel: `NCLC ${result.nclcLevel}`,
    durationMinutes: Math.max(
      1,
      Math.floor(result.durationSeconds / 60)
    ),
    skillScores: [
      {
        label: SKILL_LABELS[result.skill] ?? result.skill,
        value: `${result.percentage}%`,
      },
    ],
    corrections: [],
    answerReviewLines: review.map(
      (item) =>
        `Q${item.order}: ${item.question} | Votre reponse: ${item.yourAnswer ?? "—"} | Bonne reponse: ${item.correctAnswer}`
    ),
  });

  const blob = new Blob([pdfBytes as BlobPart], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `objectif-tcf-${result.skill.toLowerCase()}-${new Date(result.completedAt).toISOString().slice(0, 10)}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
