import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { publishToUser } from "@/lib/realtime/hub";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data as Prisma.InputJsonValue | undefined,
    },
  });

  publishToUser(params.userId, { type: "notification" });

  return notification;
}
