import { NextRequest } from "next/server";
import { ensureSkillGuide } from "@/lib/guides/ensure";
import { isGuideSkill } from "@/lib/guides/defaults";
import { serializeTopicSet } from "@/lib/guides/structure";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ skill: string; year: string; month: string }> }
) {
  try {
    const { skill, year: yearRaw, month: monthRaw } = await params;
    if (!isGuideSkill(skill)) return notFoundResponse("Page introuvable");

    const year = Number(yearRaw);
    const month = Number(monthRaw);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return notFoundResponse("Mois introuvable");
    }

    const guide = await ensureSkillGuide(skill);
    const set = guide.topicSets.find(
      (topic) => topic.isPublished && topic.year === year && topic.month === month
    );
    if (!set) return notFoundResponse("Mois introuvable");

    return successResponse({
      skill: guide.skill,
      title: guide.title,
      topicSet: serializeTopicSet(set),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
