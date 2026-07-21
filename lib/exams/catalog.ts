import type { ExamType } from "@prisma/client";

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  TCF_CANADA: "TCF Canada",
  TEF_CANADA: "TEF Canada",
  IELTS: "IELTS",
  DELF: "DELF",
  DALF: "DALF",
  TOEFL: "TOEFL",
  AUTRE: "Autre examen",
};

export const EXAM_TYPE_SLUGS: Record<ExamType, string> = {
  TCF_CANADA: "tcf",
  TEF_CANADA: "tef",
  IELTS: "ielts",
  DELF: "delf",
  DALF: "dalf",
  TOEFL: "toefl",
  AUTRE: "autre",
};

export const ALL_EXAM_TYPES = Object.keys(EXAM_TYPE_LABELS) as ExamType[];

const SLUG_TO_TYPE = Object.fromEntries(
  Object.entries(EXAM_TYPE_SLUGS).map(([type, slug]) => [slug, type])
) as Record<string, ExamType>;

export function examTypeToSlug(type: ExamType): string {
  return EXAM_TYPE_SLUGS[type] ?? type.toLowerCase();
}

export function slugToExamType(slug: string): ExamType | null {
  return SLUG_TO_TYPE[slug] ?? null;
}

export function resolveExamTypeFromQuery(
  examen?: string | null,
  examType?: string | null
): ExamType | null {
  if (examType && ALL_EXAM_TYPES.includes(examType as ExamType)) {
    return examType as ExamType;
  }
  if (examen) {
    return slugToExamType(examen);
  }
  return null;
}

export function slugifyExamId(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
