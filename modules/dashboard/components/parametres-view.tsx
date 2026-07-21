"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { formatExamDateDisplay } from "@/lib/user/exam-date";
import {
  IMMIGRATION_LABELS,
  LANGUAGE_LEVEL_LABELS,
  NATIVE_LANGUAGE_LABELS,
  profileToFormValues,
  TARGET_COUNTRY_LABELS,
} from "@/lib/user/profile";
import { EXAM_TYPE_TO_TAB, EXAM_TAB_LABELS } from "@/lib/pricing/constants";
import { invalidateUserData } from "@/lib/query/invalidation";
import type { UserProfile } from "@/components/providers/user-preferences-provider";
import { useTranslation } from "@/components/providers/locale-provider";
import type { AppLocale } from "@/lib/i18n/locales";
import { parseAppLocale, localeToStorage } from "@/lib/i18n/locales";
import { UserInvoicesSection } from "@/modules/dashboard/components/user-invoices-section";

export function ParametresView() {
  const {
    profile,
    profileError,
    settings,
    isLoading,
    isGoogleAccount,
    updateProfile,
    updateSettings,
    setThemePreference,
  } = useUserPreferences();
  const { theme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [examDate, setExamDate] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [langue, setLangue] = useState<AppLocale>("fr-FR");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const form = profileToFormValues(profile);
    setPrenom(form.firstName);
    setNom(form.lastName);
    setExamDate(form.examDate);
    setPhone(form.phone);
    setCountry(form.country);
  }, [profile]);

  useEffect(() => {
    if (!settings) return;
    setLangue(parseAppLocale(settings.language));
  }, [settings]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateProfile({
        firstName: prenom.trim(),
        lastName: nom.trim(),
        targetExamDate: examDate || null,
        phone: phone.trim() || null,
        country: country.trim() || null,
      });
      toast.success(t("settings.profileUpdated"));
      router.refresh();
    } catch {
      toast.error(t("settings.profileUpdateError"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleThemeChange = async (next: Theme) => {
    setIsSavingSettings(true);
    try {
      await setThemePreference(next);
    } catch {
      toast.error(t("settings.themeSaveError"));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLanguageChange = async (value: AppLocale) => {
    setLangue(value);
    setLocale(value);
    setIsSavingSettings(true);
    try {
      await updateSettings({ language: localeToStorage(value) });
      toast.success(t("settings.languageUpdated"));
    } catch {
      toast.error(t("settings.languageSaveError"));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleNotificationChange = async (
    key:
      | "studyReminders"
      | "examResultNotifications"
      | "pushNotifications"
      | "weeklyReportNotifications",
    checked: boolean
  ) => {
    try {
      await updateSettings({ [key]: checked });
      toast.success(t("settings.notificationUpdated"));
    } catch {
      toast.error(t("settings.notificationSaveError"));
    }
  };

  const handleSavePassword = () => {
    if (isGoogleAccount) {
      toast.message(t("settings.googlePasswordMessage"));
      return;
    }
    toast.success(t("settings.passwordUpdated"));
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/utilisateurs/profil/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { avatarUrl: string };
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data?.avatarUrl) {
        throw new Error(payload.error ?? "Impossible de téléverser l'image.");
      }

      queryClient.setQueryData<UserProfile>(["user-profile"], (current) =>
        current ? { ...current, avatarUrl: payload.data!.avatarUrl } : current
      );
      invalidateUserData(queryClient);
      toast.success(t("settings.avatarUpdated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings.avatarUploadError")
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const openAvatarPicker = () => {
    avatarInputRef.current?.click();
  };

  const displayName =
    [profile?.displayFirstName, profile?.displayLastName].filter(Boolean).join(" ") ||
    profile?.name ||
    profile?.email ||
    "";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-xl animate-pulse">
        <div className="h-10 w-48 bg-surface-container rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 h-96 bg-surface-container rounded-2xl" />
          <div className="h-96 bg-surface-container rounded-2xl" />
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="rounded-2xl border border-error/30 bg-error/5 p-lg text-center">
        <p className="font-body-md text-body-md text-error mb-md">
          {t("settings.loadProfileError")}
        </p>
        <Button onClick={() => window.location.reload()}>{t("common.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          {t("settings.title")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("settings.subtitle")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">
              account_circle
            </span>
            <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">
              {t("settings.profile")}
            </h2>
            {isGoogleAccount && (
              <span className="ml-auto text-xs font-medium px-sm py-xs rounded-full bg-surface-container text-on-surface-variant border border-outline-variant">
                {t("settings.googleAccount")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-lg pb-md mb-md border-b border-outline-variant/30">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div className="relative group">
              <Avatar
                src={profile?.avatarUrl}
                name={displayName}
                size="xl"
                className="w-24 h-24 text-3xl border-2 border-primary/20"
              />
              <button
                type="button"
                onClick={openAvatarPicker}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 bg-surface-container-high p-sm rounded-full border border-outline-variant shadow-sm hover:bg-secondary-container transition-colors disabled:opacity-50"
                aria-label="Modifier l'avatar"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isUploadingAvatar ? "progress_activity" : "edit"}
                </span>
              </button>
            </div>
            <div>
              <h3 className="font-label-md text-label-md text-on-surface font-semibold">
                {t("settings.avatarTitle")}
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                {isGoogleAccount
                  ? t("settings.avatarGoogleHint")
                  : t("settings.avatarHint")}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-sm"
                onClick={openAvatarPicker}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? t("settings.uploading") : t("settings.changeAvatar")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <Input
              label={t("settings.firstName")}
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <Input
              label={t("settings.lastName")}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
            <div className="md:col-span-2">
              <Input
                label={t("settings.phone")}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 7 49 17 83 91"
              />
            </div>
            <Input
              label={t("settings.country")}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Ex : Cameroun"
            />
            <div className="md:col-span-2">
              <Input
                label={t("settings.email")}
                type="email"
                value={profile.email}
                readOnly
                rightIcon={
                  <span className="material-symbols-outlined text-[18px]">
                    lock
                  </span>
                }
                hint={
                  profile.emailVerified
                    ? t("settings.emailVerified")
                    : t("settings.emailNotVerified")
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">
                {t("settings.examDate")}
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-12 px-md rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              />
              <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant">
                {t("settings.examDateHint")}
              </p>
            </div>
          </div>

          <div className="mt-lg pt-lg border-t border-outline-variant/30">
            <h3 className="font-label-md text-label-md font-semibold text-on-surface mb-md">
              {t("settings.onboardingInfo")}
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <ProfileInfoItem
                label={t("settings.immigrationGoal")}
                value={
                  profile.immigrationObjective
                    ? IMMIGRATION_LABELS[profile.immigrationObjective]
                    : null
                }
              />
              <ProfileInfoItem
                label={t("settings.frenchLevel")}
                value={
                  profile.currentLevel
                    ? LANGUAGE_LEVEL_LABELS[profile.currentLevel]
                    : null
                }
              />
              <ProfileInfoItem
                label={t("settings.nativeLanguage")}
                value={
                  profile.nativeLanguage
                    ? NATIVE_LANGUAGE_LABELS[profile.nativeLanguage] ??
                      profile.nativeLanguage
                    : null
                }
              />
              <ProfileInfoItem
                label={t("settings.targetDestination")}
                value={
                  profile.targetCountry
                    ? TARGET_COUNTRY_LABELS[profile.targetCountry] ??
                      profile.targetCountry
                    : null
                }
              />
              <ProfileInfoItem
                label={t("settings.memberSince")}
                value={new Date(profile.createdAt).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <ProfileInfoItem
                label={t("settings.currentStreak")}
                value={
                  profile.currentStreak > 0
                    ? `${profile.currentStreak} ${profile.currentStreak > 1 ? (locale.startsWith("en") ? "days" : "jours") : (locale.startsWith("en") ? "day" : "jour")}`
                    : t("settings.noStreak")
                }
              />
            </dl>
            {profile.subscriptions.length > 0 && (
              <div className="mt-md">
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-sm">
                  {t("settings.activeSubscriptions")}
                </p>
                <div className="flex flex-wrap gap-sm">
                  {profile.subscriptions.map((sub) => (
                    <span
                      key={`${sub.examType}-${sub.currentPeriodEnd}`}
                      className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-primary/10 text-primary font-label-sm text-label-sm"
                    >
                      {EXAM_TAB_LABELS[EXAM_TYPE_TO_TAB[sub.examType] ?? "tcf"]} — {t("settings.subscriptionUntil")}{" "}
                      {formatExamDateDisplay(sub.currentPeriodEnd)}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await fetch("/api/utilisateurs/abonnements", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ examType: sub.examType }),
                            });
                            toast.success("Abonnement annulé à la fin de la période");
                            invalidateUserData(queryClient);
                          } catch {
                            toast.error("Erreur lors de l'annulation");
                          }
                        }}
                        className="ml-xs text-on-surface-variant hover:text-error underline"
                        title="Annuler le renouvellement"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-md flex justify-end">
            <Button
              size="default"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? t("common.saving") : t("settings.saveProfile")}
            </Button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm flex flex-col"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">tune</span>
            <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">
              {t("settings.preferences")}
            </h2>
          </div>

          <div className="space-y-lg flex-1">
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant block">
                {t("settings.interfaceLanguage")}
              </label>
              <Select
                value={langue}
                onValueChange={(v) => handleLanguageChange(v as AppLocale)}
                disabled={isSavingSettings}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr-FR">{t("settings.langFrFr")}</SelectItem>
                  <SelectItem value="fr-CA">{t("settings.langFrCa")}</SelectItem>
                  <SelectItem value="en-CA">{t("settings.langEnCa")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant block">
                {t("settings.theme")}
              </label>
              <div className="grid grid-cols-2 gap-sm">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  disabled={isSavingSettings}
                  className={`flex items-center justify-center gap-sm py-sm px-md rounded-xl font-label-md text-label-md transition-all ${
                    theme === "light"
                      ? "border-2 border-primary bg-primary/5 text-primary"
                      : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    light_mode
                  </span>
                  {t("settings.themeLight")}
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  disabled={isSavingSettings}
                  className={`flex items-center justify-center gap-sm py-sm px-md rounded-xl font-label-md text-label-md transition-all ${
                    theme === "dark"
                      ? "border-2 border-primary bg-primary/5 text-primary"
                      : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    dark_mode
                  </span>
                  {t("settings.themeDark")}
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <UserInvoicesSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">
              notifications
            </span>
            <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">
              {t("settings.notifications")}
            </h2>
          </div>
          <div className="space-y-lg">
            {[
              {
                key: "studyReminders" as const,
                title: t("settings.studyReminders"),
                desc: t("settings.studyRemindersDesc"),
                checked: settings?.studyReminders ?? true,
              },
              {
                key: "examResultNotifications" as const,
                title: t("settings.examResults"),
                desc: t("settings.examResultsDesc"),
                checked: settings?.examResultNotifications ?? true,
              },
              {
                key: "pushNotifications" as const,
                title: t("settings.newMessages"),
                desc: t("settings.newMessagesDesc"),
                checked: settings?.pushNotifications ?? false,
              },
              {
                key: "weeklyReportNotifications" as const,
                title: t("settings.weeklyReport"),
                desc: t("settings.weeklyReportDesc"),
                checked: settings?.weeklyReportNotifications ?? true,
              },
            ].map((notif) => (
              <div key={notif.key} className="flex items-center justify-between">
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface">
                    {notif.title}
                  </h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                    {notif.desc}
                  </p>
                </div>
                <Switch
                  checked={notif.checked}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(notif.key, checked)
                  }
                />
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">lock</span>
            <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">
              {t("settings.security")}
            </h2>
          </div>
          {isGoogleAccount ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("settings.googlePasswordHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-md">
              <Input
                label={t("settings.currentPassword")}
                type="password"
                placeholder="••••••••"
              />
              <Input
                label={t("settings.newPassword")}
                type="password"
                placeholder="Min. 8 caractères"
                hint={t("settings.passwordHint")}
              />
              <Input
                label={t("settings.confirmPassword")}
                type="password"
                placeholder="••••••••"
              />
              <div className="pt-sm flex justify-end">
                <Button size="default" onClick={handleSavePassword}>
                  {t("settings.updatePassword")}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-xl pt-lg border-t border-outline-variant">
            <h3 className="font-label-md text-label-md text-error font-bold mb-sm">
              {t("settings.dangerousZone")}
            </h3>
            <Button
              variant="destructive"
              size="default"
              className="w-full"
              onClick={() => toast.error(t("settings.deleteAccountDev"))}
            >
              <span className="material-symbols-outlined text-[18px]">
                delete_forever
              </span>
              {t("settings.deleteAccount")}
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function ProfileInfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl bg-surface-container-low px-md py-sm">
      <dt className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </dt>
      <dd className="font-label-md text-label-md text-on-surface mt-xs">
        {value ?? "—"}
      </dd>
    </div>
  );
}
