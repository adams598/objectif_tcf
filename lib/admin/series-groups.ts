import type { Skill } from "@prisma/client";

export const BUNDLE_SKILLS = [
  "COMPREHENSION_ORALE",
  "COMPREHENSION_ECRITE",
  "EXPRESSION_ECRITE",
  "EXPRESSION_ORALE",
] as const satisfies readonly Skill[];

export type BundleSkill = (typeof BUNDLE_SKILLS)[number];

export const SKILL_SHORT: Record<BundleSkill, string> = {
  COMPREHENSION_ORALE: "CO",
  COMPREHENSION_ECRITE: "CE",
  EXPRESSION_ECRITE: "EE",
  EXPRESSION_ORALE: "EO",
};

export const SKILL_CARD_LABELS: Record<BundleSkill, string> = {
  COMPREHENSION_ORALE: "Compréhension orale",
  COMPREHENSION_ECRITE: "Compréhension écrite",
  EXPRESSION_ECRITE: "Expression écrite",
  EXPRESSION_ORALE: "Expression orale",
};

export const SKILL_ICONS: Record<BundleSkill, string> = {
  COMPREHENSION_ORALE: "headphones",
  COMPREHENSION_ECRITE: "menu_book",
  EXPRESSION_ECRITE: "edit_note",
  EXPRESSION_ORALE: "mic",
};

export interface AdminSeriesAuthor {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
}

export interface AdminFlatSeries {
  id: string;
  examId: string;
  skill: Skill;
  title: string;
  order: number;
  isPublished: boolean;
  isFree: boolean;
  isCustomContent?: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string | null;
  createdBy?: AdminSeriesAuthor | null;
  exam: { type: string; title: string };
  _count: { questions: number; attempts: number };
}

export function formatSeriesAuthorName(
  author: AdminSeriesAuthor | null | undefined
): string | null {
  if (!author) return null;
  const full = [author.firstName, author.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || author.name || null;
}

export interface AdminSkillEntry {
  seriesId: string;
  skill: BundleSkill;
  questionCount: number;
  isPublished: boolean;
}

export interface AdminSeriesGroup {
  key: string;
  examId: string;
  examTitle: string;
  order: number;
  title: string;
  isFree: boolean;
  isPublished: boolean;
  isDraft: boolean;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  createdByName: string | null;
  skills: Partial<Record<BundleSkill, AdminSkillEntry>>;
}

export function groupKey(examId: string, order: number) {
  return `${examId}:${order}`;
}

export function buildAdminSeriesGroups(series: AdminFlatSeries[]): AdminSeriesGroup[] {
  const map = new Map<string, AdminFlatSeries[]>();

  for (const s of series) {
    const key = groupKey(s.examId, s.order);
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }

  return Array.from(map.entries())
    .map(([key, items]) => {
      const first = items[0]!;
      const skills: Partial<Record<BundleSkill, AdminSkillEntry>> = {};

      for (const item of items) {
        if (BUNDLE_SKILLS.includes(item.skill as BundleSkill)) {
          skills[item.skill as BundleSkill] = {
            seriesId: item.id,
            skill: item.skill as BundleSkill,
            questionCount: item._count.questions,
            isPublished: item.isPublished,
          };
        }
      }

      const totalQuestions = items.reduce((n, s) => n + s._count.questions, 0);
      const isPublished = items.every((s) => s.isPublished);
      const isFree = items.every((s) => s.isFree);
      const title =
        items.find((s) => s.title.trim())?.title ??
        `Série ${first.order}`;

      const createdAt = items.reduce(
        (min, s) => (s.createdAt < min ? s.createdAt : min),
        items[0]!.createdAt
      );
      const updatedAt = items.reduce(
        (max, s) => (s.updatedAt > max ? s.updatedAt : max),
        items[0]!.updatedAt
      );
      const authorSource =
        items.find((s) => s.createdAt === createdAt && s.createdBy) ??
        items.find((s) => s.createdBy) ??
        null;
      const createdById =
        authorSource?.createdById ?? authorSource?.createdBy?.id ?? null;
      const createdByName = formatSeriesAuthorName(authorSource?.createdBy);

      return {
        key,
        examId: first.examId,
        examTitle: first.exam.title,
        order: first.order,
        title,
        isFree,
        isPublished,
        isDraft: !isPublished,
        totalQuestions,
        createdAt,
        updatedAt,
        createdById,
        createdByName,
        skills,
      };
    })
    .sort((a, b) => a.order - b.order || a.examTitle.localeCompare(b.examTitle));
}
