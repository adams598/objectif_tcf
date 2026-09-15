import type { Prisma } from "@prisma/client";
import type { GuideSkill } from "@/lib/guides/defaults";

export const GUIDE_SKILL_PATH: Record<GuideSkill, string> = {
  EXPRESSION_ECRITE: "/expression-ecrite",
  EXPRESSION_ORALE: "/expression-orale",
};

export type GuideTaskItem = {
  title: string;
  content: string;
};

export type SerializedGuideTask = {
  id: string;
  taskNumber: number;
  heading: string;
  prompt: string;
  items: GuideTaskItem[];
};

export type SerializedGuideCombination = {
  id: string;
  order: number;
  title: string;
  tasks: SerializedGuideTask[];
};

export type SerializedTopicSet = {
  id: string;
  year: number;
  month: number;
  title: string;
  isPublished: boolean;
  combinations: SerializedGuideCombination[];
};

export function guideMonthHref(
  skill: GuideSkill,
  year: number,
  month: number
) {
  return `${GUIDE_SKILL_PATH[skill]}/${year}/${month}`;
}

export function defaultCombinationTitle(order: number) {
  return `Combinaison ${order}`;
}

export function defaultTaskNumbers(skill: GuideSkill): number[] {
  return skill === "EXPRESSION_ORALE" ? [2, 3] : [1, 2, 3];
}

export function taskHeading(taskNumber: number) {
  return `Tâche ${taskNumber}`;
}

export function parseGuideTaskItems(value: unknown): GuideTaskItem[] {
  if (!Array.isArray(value)) return [];
  const items: GuideTaskItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const content =
      typeof record.content === "string" ? record.content.trim() : "";
    if (!content) continue;
    items.push({
      title: typeof record.title === "string" ? record.title.trim() : "",
      content,
    });
  }
  return items;
}

export function serializeGuideTask(task: {
  id: string;
  taskNumber: number;
  heading: string;
  prompt: string;
  items: Prisma.JsonValue;
}): SerializedGuideTask {
  return {
    id: task.id,
    taskNumber: task.taskNumber,
    heading: task.heading,
    prompt: task.prompt,
    items: parseGuideTaskItems(task.items),
  };
}

export function serializeCombination(combination: {
  id: string;
  order: number;
  title: string;
  tasks: Array<{
    id: string;
    taskNumber: number;
    heading: string;
    prompt: string;
    items: Prisma.JsonValue;
  }>;
}): SerializedGuideCombination {
  return {
    id: combination.id,
    order: combination.order,
    title: combination.title,
    tasks: [...combination.tasks]
      .sort((a, b) => a.taskNumber - b.taskNumber)
      .map(serializeGuideTask),
  };
}

export function serializeTopicSet(set: {
  id: string;
  year: number;
  month: number;
  title: string;
  isPublished: boolean;
  combinations: Array<{
    id: string;
    order: number;
    title: string;
    tasks: Array<{
      id: string;
      taskNumber: number;
      heading: string;
      prompt: string;
      items: Prisma.JsonValue;
    }>;
  }>;
}): SerializedTopicSet {
  return {
    id: set.id,
    year: set.year,
    month: set.month,
    title: set.title,
    isPublished: set.isPublished,
    combinations: [...set.combinations]
      .sort((a, b) => a.order - b.order)
      .map(serializeCombination),
  };
}

export const GUIDE_TOPIC_INCLUDE = {
  combinations: {
    orderBy: { order: "asc" as const },
    include: {
      tasks: { orderBy: { taskNumber: "asc" as const } },
    },
  },
};
