"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, fetchJson } from "@/lib/api/fetch-json";

export interface AuthSession {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  displayFirstName: string;
  displayLastName: string;
  avatarUrl: string | null;
  role: string;
}

function getDashboardHref(role: string): string {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "CORRECTOR") return "/correcteur";
  return "/tableau-de-bord";
}

export { getDashboardHref };

async function fetchSession(): Promise<AuthSession | null> {
  try {
    return await fetchJson<AuthSession>("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function useAuthSession() {
  return useQuery({
    queryKey: ["auth-session"],
    queryFn: fetchSession,
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
