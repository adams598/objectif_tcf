import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  createdResponse,
  serverErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { createNotification } from "@/lib/notifications/create-notification";
import { formatMessageTime, formatRelativeTime } from "@/lib/dashboard/stats";
import { publishToUser } from "@/lib/realtime/hub";

function getContactId(
  message: { senderId: string; receiverId: string },
  userId: string
): string {
  return message.senderId === userId ? message.receiverId : message.senderId;
}

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const messages = await prisma.message.findMany({
      where: {
        deletedAt: null,
        OR: [{ senderId: user.userId }, { receiverId: user.userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    const conversationMap = new Map<
      string,
      {
        contactId: string;
        contactName: string;
        contactAvatar: string | null;
        contactRole: string;
        lastMessage: string;
        lastMessageAt: Date;
        unread: number;
      }
    >();

    for (const message of messages) {
      const contactId = getContactId(message, user.userId);
      const contact =
        message.senderId === user.userId ? message.receiver : message.sender;

      const existing = conversationMap.get(contactId);
      const isUnread =
        message.receiverId === user.userId && message.readAt === null;

      if (!existing) {
        conversationMap.set(contactId, {
          contactId,
          contactName: contact.name,
          contactAvatar: contact.avatarUrl,
          contactRole: contact.role,
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
          unread: isUnread ? 1 : 0,
        });
      } else if (isUnread) {
        existing.unread += 1;
      }
    }

    const conversations = Array.from(conversationMap.values())
      .sort(
        (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
      )
      .map((conv) => ({
        ...conv,
        lastMessageAt: conv.lastMessageAt.toISOString(),
        time: formatMessageTime(conv.lastMessageAt),
      }));

    return successResponse({ conversations });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}

const sendSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const receiver = await prisma.user.findUnique({
      where: { id: parsed.data.receiverId },
      select: { id: true, isActive: true },
    });

    if (!receiver?.isActive) {
      return validationErrorResponse({
        receiverId: ["Destinataire introuvable"],
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.userId,
        receiverId: parsed.data.receiverId,
        content: parsed.data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    await createNotification({
      userId: parsed.data.receiverId,
      type: "NEW_MESSAGE",
      title: "Nouveau message",
      message: `${message.sender.name} : ${parsed.data.content.slice(0, 120)}`,
      data: { messageId: message.id, senderId: user.userId },
    });

    publishToUser(parsed.data.receiverId, {
      type: "message",
      contactId: user.userId,
    });
    publishToUser(user.userId, {
      type: "message",
      contactId: parsed.data.receiverId,
    });

    return createdResponse({
      ...message,
      createdAt: message.createdAt.toISOString(),
      time: formatRelativeTime(message.createdAt),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
