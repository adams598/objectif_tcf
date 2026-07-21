import type { ExamType, Skill } from "@prisma/client";
import type { ExamTab } from "@/lib/pricing/constants";
import { EXAM_TAB_LABELS, EXAM_TAB_TO_TYPE } from "@/lib/pricing/constants";

export interface DisciplineInfo {
  skill: Skill;
  slug: string;
  label: string;
  icon: string;
  durationMin: number;
  unitLabel: string;
  description: string;
}

export const DISCIPLINES: DisciplineInfo[] = [
  {
    skill: "COMPREHENSION_ECRITE",
    slug: "comprehension-ecrite",
    label: "Compréhension écrite",
    icon: "auto_stories",
    durationMin: 60,
    unitLabel: "39 questions",
    description: "Lisez des documents et répondez aux questions.",
  },
  {
    skill: "COMPREHENSION_ORALE",
    slug: "comprehension-orale",
    label: "Compréhension orale",
    icon: "hearing",
    durationMin: 40,
    unitLabel: "39 questions",
    description: "Écoutez des enregistrements et choisissez la bonne réponse.",
  },
  {
    skill: "EXPRESSION_ECRITE",
    slug: "expression-ecrite",
    label: "Expression écrite",
    icon: "edit_note",
    durationMin: 60,
    unitLabel: "3 tâches",
    description: "Rédigez des textes selon les consignes du TCF.",
  },
  {
    skill: "EXPRESSION_ORALE",
    slug: "expression-orale",
    label: "Expression orale",
    icon: "mic",
    durationMin: 12,
    unitLabel: "3 tâches",
    description: "Enregistrez vos réponses aux tâches orales.",
  },
];

export const SKILL_TO_DISCIPLINE = Object.fromEntries(
  DISCIPLINES.map((d) => [d.skill, d])
) as Record<Skill, DisciplineInfo>;

export function getExamTypeFromTab(tab: ExamTab): ExamType {
  return EXAM_TAB_TO_TYPE[tab];
}

export function getExamLabel(tab: ExamTab): string {
  return EXAM_TAB_LABELS[tab];
}

export function parseExamTabParam(value: string): ExamTab | null {
  if (value === "tcf" || value === "tef" || value === "ielts") return value;
  return null;
}

export function getDemoSeriesId(skill: Skill, groupOrder: number): string {
  const slug: Record<Skill, string> = {
    COMPREHENSION_ORALE: "comprehension-orale",
    COMPREHENSION_ECRITE: "comprehension-ecrite",
    EXPRESSION_ECRITE: "expression-ecrite",
    EXPRESSION_ORALE: "expression-orale",
    LEXIQUE: "lexique",
  };
  return `tcf-${groupOrder}-${slug[skill]}`;
}
