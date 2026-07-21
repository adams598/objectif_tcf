"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchJson } from "@/lib/api/fetch-json";
import { useTranslation } from "@/components/providers/locale-provider";
import { useRealtimeStream } from "@/lib/hooks/use-realtime-stream";
import { cn } from "@/lib/utils";

interface NotificationsResponse {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    readAt: string | null;
    createdAt: string;
  }>;
  unreadCount: number;
}

export function NotificationBell() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  useRealtimeStream();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchJson<NotificationsResponse>("/api/notifications"),
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      fetchJson("/api/notifications", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-sm rounded-full bg-surface border border-outline-variant text-on-surface-variant hover:text-primary transition-colors relative"
          aria-label={
            unreadCount > 0
              ? t("layout.unreadNotifications", { count: unreadCount })
              : t("layout.notifications")
          }
        >
          <span className="material-symbols-outlined">notifications</span>
          {!isLoading && unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-2.5 h-2.5 px-0.5 bg-error rounded-full border-2 border-surface text-[9px] text-on-error font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
          <span className="font-label-md font-semibold">{t("layout.notifications")}</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="font-label-sm text-primary hover:underline"
            >
              Tout marquer lu
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="px-md py-lg text-center font-label-sm text-on-surface-variant">
            Aucune notification
          </p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn(
                "flex flex-col items-start gap-xs py-md cursor-default",
                !n.readAt && "bg-primary/5"
              )}
            >
              <span className="font-label-md font-semibold">{n.title}</span>
              <span className="font-label-sm text-on-surface-variant line-clamp-2">
                {n.message}
              </span>
              <span className="font-label-sm text-on-surface-variant/70">
                {new Date(n.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
