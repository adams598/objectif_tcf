export interface WritingTask {
  id: number;
  title: string;
  minWords: number;
  maxWords: number;
  prompt: string;
}

export const WRITING_TASKS: WritingTask[] = [
  {
    id: 1,
    title: "Tâche 1",
    minWords: 60,
    maxWords: 120,
    prompt:
      "Écrivez un courriel à votre ami pour l'inviter à passer une journée avec vous (lieu, date, activités, etc.). (60-120 mots)",
  },
  {
    id: 2,
    title: "Tâche 2",
    minWords: 120,
    maxWords: 150,
    prompt:
      "Vous avez lu un article sur le télétravail. Rédigez un message sur un forum pour partager votre opinion. (120-150 mots)",
  },
  {
    id: 3,
    title: "Tâche 3",
    minWords: 150,
    maxWords: 180,
    prompt:
      "Comparez deux situations (vie en ville / vie à la campagne) en exprimant votre point de vue argumenté. (150-180 mots)",
  },
];

export interface OralTask {
  id: number;
  title: string;
  instruction: string;
  preparationTime: number;
  speakingTime: number;
  prompt: string;
}

export const ORAL_TASKS: OralTask[] = [
  {
    id: 1,
    title: "Tâche 1",
    instruction: "Présentez-vous en 2 minutes.",
    preparationTime: 120,
    speakingTime: 120,
    prompt:
      "Présentez-vous : qui vous êtes, d'où vous venez, votre parcours et votre projet au Canada.",
  },
  {
    id: 2,
    title: "Tâche 2",
    instruction: "Répondez aux questions du correcteur (3 minutes).",
    preparationTime: 180,
    speakingTime: 180,
    prompt:
      "Sujet : L'immigration francophone au Canada. Exprimez votre opinion et justifiez-la.",
  },
  {
    id: 3,
    title: "Tâche 3",
    instruction: "Exprimez un point de vue argumenté (4 minutes).",
    preparationTime: 240,
    speakingTime: 240,
    prompt:
      "Le télétravail : avantages et inconvénients pour la société canadienne. Développez votre argumentation.",
  },
];
