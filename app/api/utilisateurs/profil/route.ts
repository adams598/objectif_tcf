import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { parseDateInput } from "@/lib/user/exam-date";
import { fetchUserProfile } from "@/lib/user/fetch-user-profile";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

const updateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  targetCountry: z.string().max(80).optional().nullable(),
  nativeLanguage: z.string().max(20).optional().nullable(),
  targetExamDate: z.string().min(1).optional().nullable(),
});

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const profile = await fetchUserProfile(user.userId);

    if (!profile) {
      return notFoundResponse("Utilisateur");
    }

    return successResponse(profile);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const current = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { firstName: true, lastName: true, name: true },
    });

    if (!current) {
      return notFoundResponse("Utilisateur");
    }

    const { targetExamDate: targetExamDateInput, ...profileFields } = parsed.data;

    const firstName = profileFields.firstName ?? current.firstName ?? undefined;
    const lastName = profileFields.lastName ?? current.lastName ?? undefined;
    const name =
      [firstName, lastName].filter(Boolean).join(" ") || current.name;

    let targetExamDate: Date | null | undefined;
    if (targetExamDateInput === null) {
      targetExamDate = null;
    } else if (targetExamDateInput) {
      targetExamDate = parseDateInput(targetExamDateInput);
      if (Number.isNaN(targetExamDate.getTime())) {
        return validationErrorResponse({
          targetExamDate: ["Date d'examen invalide"],
        });
      }
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...profileFields,
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        name,
        ...(targetExamDate !== undefined ? { targetExamDate } : {}),
      },
    });

    const profile = await fetchUserProfile(user.userId);
    return successResponse(profile, "Profil mis à jour avec succès");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
