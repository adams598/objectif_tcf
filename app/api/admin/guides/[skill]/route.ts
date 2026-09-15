import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ensureSkillGuide } from "@/lib/guides/ensure";
import { defaultTopicTitle, isGuideSkill } from "@/lib/guides/defaults";
import { serializeTopicSet } from "@/lib/guides/structure";
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

const updateGuideSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  intro: z.string().min(1).max(20000).optional(),
});

const createSetSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  title: z.string().min(2).max(200).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ skill: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { skill } = await params;
    if (!isGuideSkill(skill)) return notFoundResponse("Page introuvable");
    const guide = await ensureSkillGuide(skill);
    return successResponse({
      id: guide.id,
      skill: guide.skill,
      title: guide.title,
      intro: guide.intro,
      topicSets: guide.topicSets.map(serializeTopicSet),
    });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ skill: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { skill } = await params;
    if (!isGuideSkill(skill)) return notFoundResponse("Page introuvable");
    const parsed = updateGuideSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }
    const guide = await ensureSkillGuide(skill);
    const updated = await prisma.skillGuide.update({
      where: { id: guide.id },
      data: parsed.data,
    });
    return successResponse(updated);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ skill: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { skill } = await params;
    if (!isGuideSkill(skill)) return notFoundResponse("Page introuvable");
    const parsed = createSetSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }
    const guide = await ensureSkillGuide(skill);
    const title =
      parsed.data.title?.trim() ||
      defaultTopicTitle(parsed.data.year, parsed.data.month);
    const set = await prisma.skillGuideTopicSet.create({
      data: {
        guideId: guide.id,
        year: parsed.data.year,
        month: parsed.data.month,
        title,
      },
    });
    return createdResponse(serializeTopicSet({ ...set, combinations: [] }));
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
