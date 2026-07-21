export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  if (!year || !month || !day) {
    return new Date(NaN);
  }
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatDateInputValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatExamDateDisplay(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function computeDaysUntil(iso: string | Date): number {
  const target =
    typeof iso === "string" ? new Date(iso) : iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.ceil((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function addDaysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}
