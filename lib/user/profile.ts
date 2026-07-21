import type {
  ExamType,
  ImmigrationObjective,
  LanguageLevel,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import { formatDateInputValue } from "@/lib/user/exam-date";

export interface ProfileSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  examType: ExamType;
  currentPeriodEnd: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName: string | null;
  lastName: string | null;
  displayFirstName: string;
  displayLastName: string;
  avatarUrl: string | null;
  phone: string | null;
  country: string | null;
  nativeLanguage: string | null;
  role: string;
  onboardingCompleted: boolean;
  immigrationObjective: ImmigrationObjective | null;
  currentLevel: LanguageLevel | null;
  targetExamDate: string | null;
  targetCountry: string | null;
  totalStudyTime: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  subscriptions: ProfileSubscription[];
  settings: Record<string, unknown> | null;
}

export function splitDisplayName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function normalizeUserProfile(user: {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  country: string | null;
  nativeLanguage: string | null;
  role: string;
  onboardingCompleted: boolean;
  immigrationObjective: ImmigrationObjective | null;
  currentLevel: LanguageLevel | null;
  targetExamDate: Date | null;
  targetCountry: string | null;
  totalStudyTime: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: Date;
  subscriptions?: Array<{
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    examType: ExamType;
    currentPeriodEnd: Date;
  }>;
  settings?: Record<string, unknown> | null;
}): UserProfileResponse {
  const fromName = splitDisplayName(user.name);

  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    displayFirstName: user.firstName ?? fromName.firstName,
    displayLastName: user.lastName ?? fromName.lastName,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    country: user.country,
    nativeLanguage: user.nativeLanguage,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
    immigrationObjective: user.immigrationObjective,
    currentLevel: user.currentLevel,
    targetExamDate: user.targetExamDate?.toISOString() ?? null,
    targetCountry: user.targetCountry,
    totalStudyTime: user.totalStudyTime,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    createdAt: user.createdAt.toISOString(),
    subscriptions: (user.subscriptions ?? []).map((sub) => ({
      plan: sub.plan,
      status: sub.status,
      examType: sub.examType,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    })),
    settings: user.settings ?? null,
  };
}

export function profileToFormValues(profile: UserProfileResponse) {
  return {
    firstName: profile.displayFirstName,
    lastName: profile.displayLastName,
    examDate: profile.targetExamDate
      ? formatDateInputValue(new Date(profile.targetExamDate))
      : "",
    phone: profile.phone ?? "",
    country: profile.country ?? "",
    targetCountry: profile.targetCountry ?? "",
    nativeLanguage: profile.nativeLanguage ?? "",
  };
}

export const IMMIGRATION_LABELS: Record<ImmigrationObjective, string> = {
  RESIDENCE_PERMANENTE: "Résidence permanente",
  ETUDES: "Études",
  TRAVAIL: "Travail",
  CITOYENNETE: "Citoyenneté",
  AUTRE: "Autre",
};

export const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, string> = {
  A1: "A1 — Débutant",
  A2: "A2 — Élémentaire",
  B1: "B1 — Intermédiaire",
  B2: "B2 — Intermédiaire avancé",
  C1: "C1 — Avancé",
  C2: "C2 — Maîtrise",
};

export const NATIVE_LANGUAGE_LABELS: Record<string, string> = {
  ar: "Arabe",
  fr: "Français",
  en: "Anglais",
  es: "Espagnol",
  pt: "Portugais",
  zh: "Mandarin",
  ha: "Haoussa",
  sw: "Swahili",
  other: "Autre",
};

export const TARGET_COUNTRY_LABELS: Record<string, string> = {
  CA: "Canada",
  QC: "Québec",
  ON: "Ontario",
  BC: "Colombie-Britannique",
};
