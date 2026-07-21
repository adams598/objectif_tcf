"use client";

import { useUserPreferences } from "@/components/providers/user-preferences-provider";

export function useCurrentUser() {
  const { profile, isLoading, profileError } = useUserPreferences();

  const displayName = profile
    ? [profile.displayFirstName, profile.displayLastName]
        .filter(Boolean)
        .join(" ") || profile.name
    : "";

  return {
    profile,
    isLoading,
    error: profileError,
    displayName,
    firstName: profile?.displayFirstName || "Étudiant",
    email: profile?.email ?? "",
    avatarUrl: profile?.avatarUrl ?? undefined,
    role: profile?.role ?? "USER",
    targetCountry: profile?.targetCountry ?? null,
    immigrationObjective: profile?.immigrationObjective ?? null,
    currentStreak: profile?.currentStreak ?? 0,
    createdAt: profile?.createdAt ?? null,
  };
}
