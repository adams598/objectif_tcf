import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

const cancelSchema = z.object({
  examType: z.enum(["TCF_CANADA", "TEF_CANADA", "IELTS"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const parsed = cancelSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        userId_examType: {
          userId: user.userId,
          examType: parsed.data.examType,
        },
      },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return notFoundResponse("Abonnement actif");
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return successResponse(updated, "Abonnement annulé à la fin de la période en cours");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
