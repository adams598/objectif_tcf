/**
 * Banque de contenu IELTS — Academic / General Training.
 */
import type { BankQuestion, BankSeries } from "./tcf-canada";
import { buildExamBankSeries, expandQcm } from "./exam-bank-factory";

const coQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "QCM",
    instruction: "Listen to the conversation.",
    content: "What does the woman want to book?",
    choices: [
      { content: "A hotel room", isCorrect: true },
      { content: "A flight ticket", isCorrect: false },
      { content: "A restaurant table", isCorrect: false },
      { content: "A guided tour", isCorrect: false },
    ],
    explanation: "Identify the main request in the dialogue.",
  },
  {
    order: 2,
    type: "QCM",
    instruction: "Listen to the lecture excerpt.",
    content: "According to the speaker, what is the main cause of the problem?",
    choices: [
      { content: "Climate change", isCorrect: true },
      { content: "Overpopulation", isCorrect: false },
      { content: "Industrial waste", isCorrect: false },
      { content: "Deforestation", isCorrect: false },
    ],
    explanation: "Main idea identification.",
  },
  {
    order: 3,
    type: "QCM",
    instruction: "Listen to the announcement.",
    content: "Where should passengers go next?",
    choices: [
      { content: "Gate 12", isCorrect: false },
      { content: "Gate 24", isCorrect: true },
      { content: "Baggage claim", isCorrect: false },
      { content: "Information desk", isCorrect: false },
    ],
    explanation: "Specific detail listening.",
  },
];

const ceQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "QCM",
    instruction: "Read the passage.",
    content: "What is the author's main argument about remote work?",
    choices: [
      { content: "It improves work-life balance", isCorrect: true },
      { content: "It reduces productivity", isCorrect: false },
      { content: "It is only for tech workers", isCorrect: false },
      { content: "It will disappear soon", isCorrect: false },
    ],
    explanation: "Main idea question.",
  },
  {
    order: 2,
    type: "QCM",
    instruction: "Read the email.",
    content: "Why is the meeting being rescheduled?",
    choices: [
      { content: "The venue is unavailable", isCorrect: true },
      { content: "The manager is ill", isCorrect: false },
      { content: "Participants requested it", isCorrect: false },
      { content: "Budget was cut", isCorrect: false },
    ],
    explanation: "Detail comprehension.",
  },
  {
    order: 3,
    type: "QCM",
    instruction: "Read the article headline and lead.",
    content: "The research focuses primarily on:",
    choices: [
      { content: "Renewable energy storage", isCorrect: true },
      { content: "Electric vehicle design", isCorrect: false },
      { content: "Nuclear power safety", isCorrect: false },
      { content: "Solar panel manufacturing", isCorrect: false },
    ],
    explanation: "Skimming for gist.",
  },
];

const eeQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "WRITING_TASK",
    content:
      "Task 1: The chart below shows energy consumption in three countries. Summarise the information in at least 150 words.",
    instruction: JSON.stringify({ minWords: 150, maxWords: 200 }),
    meta: { minWords: 150, maxWords: 200 },
  },
  {
    order: 2,
    type: "WRITING_TASK",
    content:
      "Task 2: Some people believe that universities should focus on practical skills. Others think academic knowledge is more important. Discuss both views and give your opinion.",
    instruction: JSON.stringify({ minWords: 250, maxWords: 300 }),
    meta: { minWords: 250, maxWords: 300 },
  },
];

const eoQuestions: BankQuestion[] = [
  {
    order: 1,
    type: "SPEAKING_TASK",
    content: "Part 1: Talk about your hometown and what you like about it.",
    instruction: JSON.stringify({ preparationTime: 0, speakingTime: 120 }),
    meta: { preparationTime: 0, speakingTime: 120 },
  },
  {
    order: 2,
    type: "SPEAKING_TASK",
    content:
      "Part 2: Describe a skill you learned that was useful. You should say what it was, how you learned it, and why it was useful.",
    instruction: JSON.stringify({ preparationTime: 60, speakingTime: 120 }),
    meta: { preparationTime: 60, speakingTime: 120 },
  },
  {
    order: 3,
    type: "SPEAKING_TASK",
    content:
      "Part 3: How has technology changed the way people learn new skills?",
    instruction: JSON.stringify({ preparationTime: 0, speakingTime: 180 }),
    meta: { preparationTime: 0, speakingTime: 180 },
  },
];

const IELTS_SERIE_100_BANK: BankSeries[] = [
  {
    order: 100,
    skill: "COMPREHENSION_ORALE",
    title: "Series 100 — IELTS Listening",
    description: "IELTS Listening practice",
    durationMin: 30,
    difficulty: "B2",
    isFree: true,
    questions: expandQcm(coQuestions, 40),
  },
  {
    order: 100,
    skill: "COMPREHENSION_ECRITE",
    title: "Series 100 — IELTS Reading",
    description: "IELTS Reading practice",
    durationMin: 60,
    difficulty: "B2",
    isFree: true,
    questions: expandQcm(ceQuestions, 40),
  },
  {
    order: 100,
    skill: "EXPRESSION_ECRITE",
    title: "Series 100 — IELTS Writing",
    description: "IELTS Writing tasks",
    durationMin: 60,
    difficulty: "B2",
    isFree: true,
    questions: eeQuestions,
  },
  {
    order: 100,
    skill: "EXPRESSION_ORALE",
    title: "Series 100 — IELTS Speaking",
    description: "IELTS Speaking tasks",
    durationMin: 15,
    difficulty: "B2",
    isFree: true,
    questions: eoQuestions,
  },
];

export function getAllIeltsBankSeries(): BankSeries[] {
  return buildExamBankSeries(IELTS_SERIE_100_BANK);
}
