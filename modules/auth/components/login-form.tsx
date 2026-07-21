"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/components/providers/locale-provider";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured:
    "La connexion Google n'est pas configurée sur le serveur.",
  google_auth_failed:
    "La connexion Google a échoué. Vérifiez l'URI de redirection dans Google Cloud Console.",
  google_denied: "Connexion Google annulée.",
  google_invalid_state: "Session Google expirée. Veuillez réessayer.",
  google_email_unverified: "Votre email Google n'est pas vérifié.",
  account_disabled: "Ce compte est désactivé.",
};

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const safeRedirect =
    redirectTo?.startsWith("/") ? redirectTo : "/tableau-de-bord";
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const error = searchParams.get("error");
    if (error && AUTH_ERROR_MESSAGES[error]) {
      toast.error(AUTH_ERROR_MESSAGES[error]);
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erreur de connexion");
        return;
      }

      toast.success("Connexion réussie !");
      queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      router.push(safeRedirect);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const params = new URLSearchParams();
    if (redirectTo?.startsWith("/")) {
      params.set("redirect", redirectTo);
    }
    const query = params.toString();
    window.location.href = query ? `/api/auth/google?${query}` : "/api/auth/google";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="shadow-violet-lg">
        <CardHeader className="text-center">
          <BrandLogo variant="icon" href={null} className="mx-auto mb-md" imageClassName="h-12 w-12" />
          <CardTitle className="text-[24px]">{t("auth.welcomeBack")}</CardTitle>
          <CardDescription>
            {redirectTo?.startsWith("/offres")
              ? t("auth.loginForSubscription")
              : t("auth.loginSubtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
            {/* Google SSO */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-sm py-sm px-md rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors font-label-md text-label-md text-on-surface"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t("auth.continueGoogle")}
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="px-md font-label-sm text-label-sm text-on-surface-variant">
                ou
              </span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            {/* Email */}
            <Input
              label={t("auth.email")}
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              leftIcon={
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              }
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password */}
            <div>
              <Input
                label={t("auth.password")}
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                leftIcon={
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                }
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                }
                error={errors.password?.message}
                {...register("password")}
              />
              <div className="flex justify-end mt-1">
                <Link
                  href="/mot-de-passe-oublie"
                  className="font-label-sm text-label-sm text-primary hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isLoading}
            >
              {t("auth.login")}
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-lg">
            {t("auth.noAccount")}{" "}
            <Link
              href={
                redirectTo?.startsWith("/")
                  ? `/inscription?redirect=${encodeURIComponent(redirectTo)}`
                  : "/inscription"
              }
              className="text-primary font-semibold hover:underline"
            >
              {t("auth.registerFree")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
