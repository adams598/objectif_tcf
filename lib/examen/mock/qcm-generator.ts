import type { QcmQuestion } from "../scoring";

const CO_TEMPLATES = [
  {
    content: "Que propose l'intervenant pour résoudre le problème évoqué ?",
    choices: [
      "Instaurer une taxe sur les véhicules polluants.",
      "Augmenter la fréquence des transports en commun.",
      "Créer de nouvelles zones piétonnes le week-end.",
      "Construire des parkings à la périphérie.",
    ],
    correct: 1,
  },
  {
    content: "Quelle est l'attitude du journaliste face aux propositions ?",
    choices: [
      "Elle est enthousiaste et les soutient.",
      "Elle exprime des réserves sur leur financement.",
      "Elle reste neutre et demande des précisions.",
      "Elle les rejette en citant des exemples étrangers.",
    ],
    correct: 2,
  },
  {
    content: "Quel est le thème principal de cette conversation ?",
    choices: [
      "L'organisation d'un voyage scolaire.",
      "La recherche d'un logement étudiant.",
      "L'inscription à une formation professionnelle.",
      "La préparation d'un examen de langue.",
    ],
    correct: 3,
  },
  {
    content: "Pourquoi le personnage principal hésite-t-il ?",
    choices: [
      "Il manque de temps pour décider.",
      "Il n'a pas les moyens financiers nécessaires.",
      "Il attend l'avis de sa famille.",
      "Il préfère une autre destination.",
    ],
    correct: 0,
  },
];

const CE_PASSAGES = [
  {
    tag: "Message",
    text: `Chers collègues,

Nous vous informons que la réunion parents-professeurs des classes de seconde prévue pour ce samedi est reportée au samedi prochain à midi. Votre présence est obligatoire.

La direction du lycée`,
    question: "À qui est adressé ce message ?",
    choices: ["Aux élèves.", "Aux étudiants.", "Aux parents.", "Aux professeurs."],
    correct: 3,
  },
  {
    tag: "Annonce",
    text: `La bibliothèque municipale de Montréal ouvre ses portes gratuitement tous les dimanches de 10 h à 18 h. Ateliers de lecture pour enfants à 14 h. Inscription sur place.`,
    question: "Que propose la bibliothèque le dimanche ?",
    choices: [
      "Des cours de français gratuits.",
      "Des ateliers de lecture pour enfants.",
      "Une exposition d'art contemporain.",
      "Un concours de poésie.",
    ],
    correct: 1,
  },
  {
    tag: "Article",
    text: `Le télétravail s'est généralisé au Canada depuis 2020. Aujourd'hui, près de 35 % des employés travaillent en mode hybride. Le gouvernement étudie un droit à la déconnexion.`,
    question: "Quel pourcentage d'employés canadiens travaille en mode hybride ?",
    choices: ["15 %", "25 %", "35 %", "45 %"],
    correct: 2,
  },
];

function makeChoices(labels: string[]) {
  return labels.map((content, i) => ({
    id: String.fromCharCode(97 + i),
    content,
  }));
}

export function generateCoQuestions(count = 39): QcmQuestion[] {
  return Array.from({ length: count }, (_, i) => {
    const tpl = CO_TEMPLATES[i % CO_TEMPLATES.length];
    const choices = makeChoices(tpl.choices);
    return {
      id: `co-q${i + 1}`,
      order: i + 1,
      content: tpl.content,
      choices,
      correctChoiceId: choices[tpl.correct].id,
    };
  });
}

export interface CeQuestion extends QcmQuestion {
  passage: string;
  passageTag: string;
}

export function generateCeQuestions(count = 39): CeQuestion[] {
  return Array.from({ length: count }, (_, i) => {
    const tpl = CE_PASSAGES[i % CE_PASSAGES.length];
    const choices = makeChoices(tpl.choices);
    return {
      id: `ce-q${i + 1}`,
      order: i + 1,
      content: tpl.question,
      passage: tpl.text,
      passageTag: tpl.tag,
      choices,
      correctChoiceId: choices[tpl.correct].id,
    };
  });
}
