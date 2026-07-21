import type { QueryClient } from "@tanstack/react-query";

export const USER_DATA_QUERY_KEYS = [
  "user-profile",
  "auth-session",
  "dashboard-stats",
  "community-stats",
  "community-posts",
  "conversations",
] as const;

export function invalidateUserData(queryClient: QueryClient) {
  for (const key of USER_DATA_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
