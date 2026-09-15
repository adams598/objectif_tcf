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
  { params }: { params: Promise<{ skill: string }> }
) {
  try {
    const { skill } = await params;
    if (!isGuideSkill(skill)) return notFoundResponse("Page introuvable");

    const guide = await ensureSkillGuide(skill);
    return successResponse({
      skill: guide.skill,
      title: guide.title,
      intro: guide.intro,
      topicSets: guide.topicSets
        .filter((set) => set.isPublished)
        .map((set) => {
          const serialized = serializeTopicSet(set);
          return {
            id: serialized.id,
            year: serialized.year,
            month: serialized.month,
            title: serialized.title,
            combinationCount: serialized.combinations.length,
          };
        }),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
