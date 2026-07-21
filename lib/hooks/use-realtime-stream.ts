"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeEvent } from "@/lib/realtime/hub";

interface UseRealtimeStreamOptions {
  enabled?: boolean;
  onMessage?: (contactId: string) => void;
}

export function useRealtimeStream(options: UseRealtimeStreamOptions = {}) {
  const { enabled = true, onMessage } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;

    const source = new EventSource("/api/realtime/stream");

    source.onmessage = (event) => {
      let payload: RealtimeEvent;
      try {
        payload = JSON.parse(event.data) as RealtimeEvent;
      } catch {
        return;
      }

      if (payload.type === "notification") {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }

      if (payload.type === "message") {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({
          queryKey: ["messages", payload.contactId],
        });
        onMessage?.(payload.contactId);
      }
    };

    return () => {
      source.close();
    };
  }, [enabled, onMessage, queryClient]);
}
