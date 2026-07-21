"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import type { UserProfileResponse } from "@/lib/user/profile";
import { invalidateUserData } from "@/lib/query/invalidation";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/notifications/preferences";

export type UserProfile = UserProfileResponse;

export interface UserSettings {
  language: string;
  theme: string;
  studyReminders: boolean;
  examResultNotifications: boolean;
  pushNotifications: boolean;
  weeklyReportNotifications: boolean;
  emailNotifications: boolean;
  dailyGoalMinutes: number;
  weeklyGoalDays: number;
}

interface AuthSessionInfo {
  hasGoogle: boolean;
  hasCredentials: boolean;
}

interface UserPreferencesContextValue {
  profile: UserProfile | undefined;
  profileError: Error | null;
  settings: UserSettings | undefined;
  notificationPreferences: NotificationPreferences;
  isLoading: boolean;
  isGoogleAccount: boolean;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
    phone?: string | null;
    country?: string | null;
    targetCountry?: string | null;
    nativeLanguage?: string | null;
    targetExamDate?: string | null;
  }) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  setThemePreference: (theme: Theme) => Promise<void>;
}

const UserPreferencesContext =
  createContext<UserPreferencesContextValue | null>(null);

const QUERY_STALE_TIME = 5 * 60 * 1000;

export function UserPreferencesProvider({
  children,
  initialProfile,
  initialSettings,
  initialAuthSession,
}: {
  children: React.ReactNode;
  initialProfile?: UserProfile;
  initialSettings?: UserSettings;
  initialAuthSession?: AuthSessionInfo;
}) {
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();

  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => fetchJson<UserProfile>("/api/utilisateurs/profil"),
    initialData: initialProfile,
    initialDataUpdatedAt: initialProfile ? Date.now() : undefined,
    staleTime: QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  const settingsQuery = useQuery({
    queryKey: ["user-settings"],
    queryFn: () => fetchJson<UserSettings>("/api/utilisateurs/parametres"),
    initialData: initialSettings,
    initialDataUpdatedAt: initialSettings ? Date.now() : undefined,
    staleTime: QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
    enabled: !initialSettings,
  });

  const authSession = useMemo<AuthSessionInfo>(
    () =>
      initialAuthSession ?? {
        hasGoogle: false,
        hasCredentials: true,
      },
    [initialAuthSession]
  );

  React.useEffect(() => {
    const theme = settingsQuery.data?.theme ?? initialSettings?.theme;
    if (theme === "light" || theme === "dark") {
      setTheme(theme);
    }
  }, [settingsQuery.data?.theme, initialSettings?.theme, setTheme]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: Parameters<UserPreferencesContextValue["updateProfile"]>[0]) =>
      fetchJson<UserProfile>("/api/utilisateurs/profil", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["user-profile"], data);
      invalidateUserData(queryClient);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) =>
      fetchJson<UserSettings>("/api/utilisateurs/parametres", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["user-settings"], data);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (data.theme === "light" || data.theme === "dark") {
        setTheme(data.theme);
      }
    },
  });

  const effectiveSettings = settingsQuery.data ?? initialSettings;

  const notificationPreferences = useMemo<NotificationPreferences>(
    () => ({
      studyReminders:
        effectiveSettings?.studyReminders ??
        DEFAULT_NOTIFICATION_PREFERENCES.studyReminders,
      examResultNotifications:
        effectiveSettings?.examResultNotifications ??
        DEFAULT_NOTIFICATION_PREFERENCES.examResultNotifications,
      pushNotifications:
        effectiveSettings?.pushNotifications ??
        DEFAULT_NOTIFICATION_PREFERENCES.pushNotifications,
      weeklyReportNotifications:
        effectiveSettings?.weeklyReportNotifications ??
        DEFAULT_NOTIFICATION_PREFERENCES.weeklyReportNotifications,
    }),
    [effectiveSettings]
  );

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      profile: profileQuery.data,
      profileError: profileQuery.error as Error | null,
      settings: effectiveSettings,
      notificationPreferences,
      isLoading:
        !initialProfile &&
        (profileQuery.isLoading || (!initialSettings && settingsQuery.isLoading)),
      isGoogleAccount: authSession.hasGoogle,
      updateProfile: async (data) => {
        await updateProfileMutation.mutateAsync(data);
      },
      updateSettings: async (data) => {
        await updateSettingsMutation.mutateAsync(data);
      },
      setThemePreference: async (theme) => {
        setTheme(theme);
        await updateSettingsMutation.mutateAsync({ theme });
      },
    }),
    [
      profileQuery.data,
      profileQuery.error,
      profileQuery.isLoading,
      effectiveSettings,
      notificationPreferences,
      initialProfile,
      initialSettings,
      settingsQuery.isLoading,
      authSession.hasGoogle,
      updateProfileMutation,
      updateSettingsMutation,
      setTheme,
    ]
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    );
  }
  return context;
}
