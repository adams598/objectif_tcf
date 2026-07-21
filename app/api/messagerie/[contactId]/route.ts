import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { formatMessageTime } from "@/lib/dashboard/stats";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const user = await requireAuth();
    const { contactId } = await params;

    const messages = await prisma.message.findMany({
      where: {
        deletedAt: null,
        OR: [
          { senderId: user.userId, receiverId: contactId },
          { senderId: contactId, receiverId: user.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    await prisma.message.updateMany({
      where: {
        senderId: contactId,
        receiverId: user.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    const contact = await prisma.user.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    return successResponse({
      contact,
      messages: messages.map((message) => ({
        id: message.id,
        from: message.senderId === user.userId ? "me" : "other",
        text: message.content,
        time: formatMessageTime(message.createdAt),
        createdAt: message.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
