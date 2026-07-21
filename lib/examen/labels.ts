import type { SkillAbbrev } from "./scoring";

export const SKILL_LABELS: Record<SkillAbbrev, string> = {
  CO: "Compréhension orale",
  CE: "Compréhension écrite",
  EE: "Expression écrite",
  EO: "Expression orale",
};

export function getSeriesLabel(seriesId: string): string {
  const match = seriesId.match(/(\d+)/);
  return match ? `Série ${match[1]}` : "Série démo";
}

export function getExamLabelFromTab(tab?: string): string {
  if (tab === "tef") return "TEF Canada";
  if (tab === "ielts") return "IELTS";
  return "TCF Canada";
}

export type ExamComponentType = "co" | "ce" | "ee" | "eo";

export function getExamComponentType(seriesId: string): ExamComponentType {
  const id = seriesId.toLowerCase();
  if (id.includes("comprehension-ecrite") || id.startsWith("ce-")) return "ce";
  if (id.includes("expression-ecrite") || id.startsWith("ee-")) return "ee";
  if (id.includes("expression-orale") || id.startsWith("eo-")) return "eo";
  return "co";
}

export function getSkillFromSeriesId(seriesId: string): SkillAbbrev {
  const type = getExamComponentType(seriesId);
  if (type === "ce") return "CE";
  if (type === "ee") return "EE";
  if (type === "eo") return "EO";
  return "CO";
}
