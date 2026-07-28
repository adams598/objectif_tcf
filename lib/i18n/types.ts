import type { appExtFr } from "./messages/app-ext-fr";

export type AppLocale = "fr-FR" | "fr-CA" | "en-CA";

export const DEFAULT_LOCALE: AppLocale = "fr-FR";

export const LOCALE_COOKIE = "oc-locale";

export interface CoreMessages {
  common: {
    save: string;
    saving: string;
    cancel: string;
    loading: string;
    retry: string;
    free: string;
    premium: string;
    completed: string;
    search: string;
    all: string;
    user: string;
    myProfile: string;
  };
  nav: {
    dashboard: string;
    series: string;
    results: string;
    community: string;
    messaging: string;
    documents: string;
    settings: string;
    examMode: string;
    help: string;
    logout: string;
    home: string;
    forum: string;
    profile: string;
    adminOverview: string;
    adminOffers: string;
    adminPayments: string;
    adminUsers: string;
    adminExams: string;
    adminSeries: string;
    adminCorrectors: string;
    adminCommunity: string;
    correctorSpace: string;
    expandSidebar: string;
    collapseSidebar: string;
    accountMenu: string;
  };
  settings: {
    title: string;
    subtitle: string;
    profile: string;
    googleAccount: string;
    avatarTitle: string;
    avatarGoogleHint: string;
    avatarHint: string;
    changeAvatar: string;
    uploading: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    email: string;
    emailVerified: string;
    emailNotVerified: string;
    examDate: string;
    examDateHint: string;
    onboardingInfo: string;
    immigrationGoal: string;
    frenchLevel: string;
    nativeLanguage: string;
    targetDestination: string;
    memberSince: string;
    currentStreak: string;
    noStreak: string;
    activeSubscriptions: string;
    subscriptionUntil: string;
    saveProfile: string;
    preferences: string;
    interfaceLanguage: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    notifications: string;
    security: string;
    studyReminders: string;
    studyRemindersDesc: string;
    examResults: string;
    examResultsDesc: string;
    newMessages: string;
    newMessagesDesc: string;
    weeklyReport: string;
    weeklyReportDesc: string;
    googlePasswordHint: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordHint: string;
    updatePassword: string;
    dangerousZone: string;
    deleteAccount: string;
    deleteAccountDev: string;
    invoicesTitle: string;
    invoicesDesc: string;
    noInvoicesTitle: string;
    noInvoicesDesc: string;
    invoicePeriod: string;
    downloadInvoice: string;
    profileUpdated: string;
    profileUpdateError: string;
    themeSaveError: string;
    languageUpdated: string;
    languageSaveError: string;
    notificationUpdated: string;
    notificationSaveError: string;
    avatarUpdated: string;
    avatarUploadError: string;
    googlePasswordMessage: string;
    passwordUpdated: string;
    loadProfileError: string;
    langFrFr: string;
    langFrCa: string;
    langEnCa: string;
  };
  dashboard: {
    greeting: string;
    greetingLoading: string;
    subtitle: string;
    target: string;
  };
  series: {
    title: string;
    completed: string;
    freeCount: string;
    premiumCount: string;
    subscribeBanner: string;
    viewOffers: string;
    searchPlaceholder: string;
    freeSection: string;
    premiumSection: string;
    premiumHint: string;
    noResults: string;
    noResultsDesc: string;
    subscribeToAccess: string;
    chooseDiscipline: string;
    disciplines: string;
    subscriptionRequired: string;
    freeAccess: string;
    disciplinesProgress: string;
    skillCo: string;
    skillCe: string;
    skillEe: string;
    skillEo: string;
  };
  exams: {
    tcf: string;
    tef: string;
    ielts: string;
  };
  skills: {
    co: string;
    ce: string;
    ee: string;
    eo: string;
  };
}

type DeepStringify<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: DeepStringify<T[K]> }
    : T;

export type Messages = CoreMessages & DeepStringify<typeof appExtFr>;
