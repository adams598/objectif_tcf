"use client";

import React, { useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/components/providers/locale-provider";
import { BrandLogo } from "@/components/layout/brand-logo";

type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const registerSchema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(2, t("auth.firstNameMin")),
          lastName: z.string().min(2, t("auth.lastNameMin")),
          email: z.string().email(t("auth.invalidEmail")),
          password: z
            .string()
            .min(8, t("auth.passwordMin"))
            .regex(/[A-Z]/, t("auth.passwordUppercase"))
            .regex(/[0-9]/, t("auth.passwordDigit")),
          confirmPassword: z.string(),
          acceptTerms: z.boolean().refine((v) => v, t("auth.mustAcceptTerms")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("auth.passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t("auth.registerError"));
        return;
      }

      toast.success(t("auth.accountCreated"));
      router.push(`/verification-email?email=${encodeURIComponent(data.email)}`);
    } catch {
      toast.error(t("auth.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const params = new URLSearchParams({ action: "register" });
    if (redirectTo?.startsWith("/")) {
      params.set("redirect", redirectTo);
    }
    window.location.href = `/api/auth/google?${params.toString()}`;
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
          <CardTitle className="text-[24px]">{t("auth.createAccount")}</CardTitle>
          <CardDescription>
            {redirectTo?.startsWith("/offres")
              ? t("auth.registerForSubscription")
              : t("auth.registerJoinTcf")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-sm py-sm px-md rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors font-label-md text-label-md text-on-surface"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t("auth.continueGoogle")}
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="px-md font-label-sm text-label-sm text-on-surface-variant">
                {t("auth.or")}
              </span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <Input
                label={t("auth.firstName")}
                placeholder="Marie"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label={t("auth.lastName")}
                placeholder="Dupont"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>

            <Input
              label={t("auth.email")}
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
              leftIcon={<span className="material-symbols-outlined text-[20px]">mail</span>}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label={t("auth.password")}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.passwordPlaceholder")}
              autoComplete="new-password"
              leftIcon={<span className="material-symbols-outlined text-[20px]">lock</span>}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              }
              error={errors.password?.message}
              hint={t("auth.passwordHint")}
              {...register("password")}
            />

            <Input
              label={t("auth.confirmPassword")}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.repeatPassword")}
              autoComplete="new-password"
              leftIcon={<span className="material-symbols-outlined text-[20px]">lock</span>}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <div>
              <div className="flex items-start gap-sm">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setValue("acceptTerms", checked as boolean, { shouldValidate: true })
                  }
                />
                <label htmlFor="acceptTerms" className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer leading-relaxed">
                  {t("auth.acceptTermsPrefix")}{" "}
                  <Link href="/conditions" className="text-primary hover:underline">
                    {t("auth.termsLink")}
                  </Link>{" "}
                  {t("auth.acceptTermsAnd")}{" "}
                  <Link href="/confidentialite" className="text-primary hover:underline">
                    {t("auth.privacyLink")}
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="mt-1 font-label-sm text-label-sm text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" loading={isLoading}>
              {t("auth.createFreeAccount")}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Button>
          </form>

          <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-lg">
            {t("auth.hasAccount")}{" "}
            <Link
              href={
                redirectTo?.startsWith("/")
                  ? `/connexion?redirect=${encodeURIComponent(redirectTo)}`
                  : "/connexion"
              }
              className="text-primary font-semibold hover:underline"
            >
              {t("auth.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
