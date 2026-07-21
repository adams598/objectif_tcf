/**
 * Banque de contenu TEF Canada — format officiel CCI Paris Île-de-France.
 */
import type { BankQuestion, BankSeries } from "./tcf-canada";
import { buildExamBankSeries, expandQcm } from "./exam-bank-factory";

const coQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "QCM",
    instruction: "Écoutez l'annonce.",
    content: "Quel est le sujet principal de cette annonce TEF ?",
    choices: [
      { content: "Un festival de musique", isCorrect: false },
      { content: "Une formation professionnelle", isCorrect: true },
      { content: "Une offre d'emploi", isCorrect: false },
      { content: "Un changement d'horaires", isCorrect: false },
    ],
    explanation: "Repérer l'objectif de l'annonce.",
  },
  {
    order: 2,
    type: "QCM",
    instruction: "Écoutez le dialogue.",
    content: "Pourquoi la cliente appelle-t-elle le service client ?",
    choices: [
      { content: "Pour annuler une commande", isCorrect: true },
      { content: "Pour demander un remboursement", isCorrect: false },
      { content: "Pour modifier son adresse", isCorrect: false },
      { content: "Pour signaler une panne", isCorrect: false },
    ],
    explanation: "Identifier la demande du locuteur.",
  },
  {
    order: 3,
    type: "QCM",
    instruction: "Écoutez l'extrait radio.",
    content: "Quelle solution le journaliste propose-t-il ?",
    choices: [
      { content: "Réduire la consommation d'eau", isCorrect: true },
      { content: "Planter plus d'arbres", isCorrect: false },
      { content: "Interdire les voitures", isCorrect: false },
      { content: "Construire des barrages", isCorrect: false },
    ],
    explanation: "Comprendre la proposition centrale.",
  },
];

const ceQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "QCM",
    instruction: "Lisez le texte et répondez.",
    content: "Quel est l'objectif de cet article sur l'immigration au Québec ?",
    choices: [
      { content: "Présenter les démarches administratives", isCorrect: true },
      { content: "Critiquer la politique migratoire", isCorrect: false },
      { content: "Comparer Québec et Ontario", isCorrect: false },
      { content: "Décrire un parcours personnel", isCorrect: false },
    ],
    explanation: "Identifier l'intention de l'auteur.",
  },
  {
    order: 2,
    type: "QCM",
    instruction: "Lisez l'email professionnel.",
    content: "Que demande l'expéditeur au destinataire ?",
    choices: [
      { content: "Confirmer sa présence à une réunion", isCorrect: true },
      { content: "Signer un contrat", isCorrect: false },
      { content: "Envoyer un document", isCorrect: false },
      { content: "Reporter un entretien", isCorrect: false },
    ],
    explanation: "Repérer la demande explicite.",
  },
  {
    order: 3,
    type: "QCM",
    instruction: "Lisez la notice.",
    content: "Quelle mesure de sécurité est mentionnée ?",
    choices: [
      { content: "Porter un casque", isCorrect: false },
      { content: "Couper l'alimentation", isCorrect: true },
      { content: "Appeler les pompiers", isCorrect: false },
      { content: "Ouvrir les fenêtres", isCorrect: false },
    ],
    explanation: "Information explicite dans le texte.",
  },
];

const eeQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "WRITING_TASK",
    content: "Vous écrivez à un ami pour lui parler de votre projet d'immigration au Canada.",
    instruction: JSON.stringify({ minWords: 80, maxWords: 120 }),
    meta: { minWords: 80, maxWords: 120 },
  },
  {
    order: 2,
    type: "WRITING_TASK",
    content:
      "Vous répondez à un message sur un forum : « Faut-il apprendre le français avant de partir au Canada ? »",
    instruction: JSON.stringify({ minWords: 120, maxWords: 150 }),
    meta: { minWords: 120, maxWords: 150 },
  },
  {
    order: 3,
    type: "WRITING_TASK",
    content:
      "Rédigez un article de blog sur les avantages de vivre dans une ville bilingue comme Montréal.",
    instruction: JSON.stringify({ minWords: 150, maxWords: 180 }),
    meta: { minWords: 150, maxWords: 180 },
  },
];

const eoQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "SPEAKING_TASK",
    content: "Présentez-vous et parlez de votre parcours professionnel.",
    instruction: JSON.stringify({ preparationTime: 60, speakingTime: 120 }),
    meta: { preparationTime: 60, speakingTime: 120 },
  },
  {
    order: 2,
    type: "SPEAKING_TASK",
    content: "Décrivez une expérience marquante liée à votre projet d'immigration.",
    instruction: JSON.stringify({ preparationTime: 120, speakingTime: 120 }),
    meta: { preparationTime: 120, speakingTime: 120 },
  },
  {
    order: 3,
    type: "SPEAKING_TASK",
    content:
      "Argumentez : « Le télétravail facilite-t-il l'intégration dans un nouveau pays ? »",
    instruction: JSON.stringify({ preparationTime: 120, speakingTime: 120 }),
    meta: { preparationTime: 120, speakingTime: 120 },
  },
];

const TEF_SERIE_100_BANK: BankSeries[] = [
  {
    order: 100,
    skill: "COMPREHENSION_ORALE",
    title: "Série 100 — Compréhension orale TEF",
    description: "Entraînement CO TEF Canada",
    durationMin: 40,
    difficulty: "B1",
    isFree: true,
    questions: expandQcm(coQuestions, 39),
  },
  {
    order: 100,
    skill: "COMPREHENSION_ECRITE",
    title: "Série 100 — Compréhension écrite TEF",
    description: "Entraînement CE TEF Canada",
    durationMin: 60,
    difficulty: "B1",
    isFree: true,
    questions: expandQcm(ceQuestions, 39),
  },
  {
    order: 100,
    skill: "EXPRESSION_ECRITE",
    title: "Série 100 — Expression écrite TEF",
    description: "3 tâches d'expression écrite TEF Canada",
    durationMin: 60,
    difficulty: "B2",
    isFree: true,
    questions: eeQuestions,
  },
  {
    order: 100,
    skill: "EXPRESSION_ORALE",
    title: "Série 100 — Expression orale TEF",
    description: "3 tâches d'expression orale TEF Canada",
    durationMin: 15,
    difficulty: "B2",
    isFree: true,
    questions: eoQuestions,
  },
];

export function getAllTefCanadaBankSeries(): BankSeries[] {
  return buildExamBankSeries(TEF_SERIE_100_BANK);
}
