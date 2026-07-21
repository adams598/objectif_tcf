export type RealtimeEvent =
  | { type: "notification" }
  | { type: "message"; contactId: string };

type Listener = (event: RealtimeEvent) => void;

const subscribers = new Map<string, Set<Listener>>();

export function subscribeUser(userId: string, listener: Listener): () => void {
  let set = subscribers.get(userId);
  if (!set) {
    set = new Set();
    subscribers.set(userId, set);
  }
  set.add(listener);

  return () => {
    set?.delete(listener);
    if (set?.size === 0) {
      subscribers.delete(userId);
    }
  };
}

export function publishToUser(userId: string, event: RealtimeEvent): void {
  const set = subscribers.get(userId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch (error) {
      console.error("[Realtime] listener error:", error);
    }
  }
}
