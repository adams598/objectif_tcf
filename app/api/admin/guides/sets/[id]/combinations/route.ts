import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { isGuideSkill } from "@/lib/guides/defaults";
import {
  defaultCombinationTitle,
  defaultTaskNumbers,
  serializeCombination,
} from "@/lib/guides/structure";
import {
  createdResponse,
  notFoundResponse,
  serverErrorResponse,
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const set = await prisma.skillGuideTopicSet.findUnique({
      where: { id },
      include: {
        guide: { select: { skill: true } },
      },
    });
    if (!set) return notFoundResponse("Mois introuvable");
    if (!isGuideSkill(set.guide.skill)) {
      return notFoundResponse("Compétence invalide");
    }

    const maxOrder = await prisma.skillGuideCombination.aggregate({
      where: { topicSetId: id },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? 0) + 1;
    const combination = await prisma.skillGuideCombination.create({
      data: {
        topicSetId: id,
        order,
        title: defaultCombinationTitle(order),
        tasks: {
          create: defaultTaskNumbers(set.guide.skill).map((taskNumber) => ({
            taskNumber,
          })),
        },
      },
      include: {
        tasks: { orderBy: { taskNumber: "asc" } },
      },
    });
    return createdResponse(serializeCombination(combination));
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
