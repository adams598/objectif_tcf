export interface ExamNavigationOptions {
  guestMode?: boolean;
  examTab?: string;
}

export function getExamExitHref(options: ExamNavigationOptions = {}): string {
  if (options.guestMode) {
    return options.examTab
      ? `/preparation/${options.examTab}`
      : "/";
  }
  return "/tableau-de-bord";
}

export function getExamResultsHref(options: ExamNavigationOptions = {}): string {
  if (options.guestMode) {
    const params = new URLSearchParams();
    if (options.examTab) params.set("examen", options.examTab);
    return `/preparation/resultats?${params.toString()}`;
  }
  return "/resultats";
}
