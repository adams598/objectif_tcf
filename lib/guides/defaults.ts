import type { Skill } from "@prisma/client";

export const GUIDE_SKILLS = [
  "EXPRESSION_ECRITE",
  "EXPRESSION_ORALE",
] as const satisfies readonly Skill[];

export type GuideSkill = (typeof GUIDE_SKILLS)[number];

export function isGuideSkill(value: string): value is GuideSkill {
  return GUIDE_SKILLS.includes(value as GuideSkill);
}

export const GUIDE_DEFAULTS: Record<
  GuideSkill,
  { title: string; intro: string }
> = {
  EXPRESSION_ECRITE: {
    title: "Expression écrite",
    intro: `L’expression écrite du TCF / TEF évalue votre capacité à rédiger en français, de façon claire et organisée.

Comment répondre
- Lisez bien la consigne et le nombre de mots demandé.
- Faites un plan court (introduction, développement, conclusion) avant d’écrire.
- Restez dans le sujet : donnez des exemples concrets.
- Relisez : accords, conjugaisons, ponctuation.

Les sujets récents sont classés par mois. Chaque mois contient plusieurs combinaisons, comme à l’examen : tâche 1 (message court), tâche 2 (texte argumenté) et tâche 3 (article à partir de deux documents).`,
  },
  EXPRESSION_ORALE: {
    title: "Expression orale",
    intro: `L’expression orale évalue votre aisance à parler en français : se présenter, raconter, argumenter, réagir.

Comment s’entraîner
- Lisez la consigne, préparez 20 à 30 secondes, puis parlez sans lire un texte.
- Structurez : idée principale, 2 arguments, exemple, conclusion.
- Parlez naturellement, même avec des hésitations.
- Enregistrez-vous et réécoutez.

Les sujets récents sont classés par mois. Chaque mois regroupe des combinaisons : tâche 2 (entretien, plusieurs sujets au choix) et tâche 3 (exposé / débat, plusieurs sujets au choix).`,
  },
};

export const MONTH_LABELS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export function defaultTopicTitle(year: number, month: number): string {
  const label = MONTH_LABELS_FR[month - 1] ?? `Mois ${month}`;
  return `${label} ${year}`;
}
