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
import { useTranslation } from "@/components/providers/locale-provider";

type FormData = { password: string; confirmPassword: string };

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(8, t("auth.passwordMin"))
            .regex(/[A-Z]/, t("auth.passwordUppercase"))
            .regex(/[0-9]/, t("auth.passwordDigit")),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("auth.passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error(t("auth.invalidLink"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password, action: "reset" }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t("auth.resetError"));
        return;
      }

      toast.success(t("auth.passwordUpdated"));
      router.push("/connexion");
    } catch {
      toast.error(t("auth.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card variant="elevated" className="shadow-violet-lg">
        <CardContent className="text-center py-xl">
          <span className="material-symbols-outlined text-[48px] text-error mb-md block">
            link_off
          </span>
          <h2 className="font-headline-lg text-[20px] text-on-surface font-bold mb-sm">
            {t("auth.invalidLinkTitle")}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {t("auth.invalidLinkDescExtended")}
          </p>
          <Button asChild size="default">
            <Link href="/mot-de-passe-oublie">{t("auth.requestNewLink")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="shadow-violet-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl mx-auto mb-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-primary">lock</span>
          </div>
          <CardTitle className="text-[24px]">{t("auth.resetTitle")}</CardTitle>
          <CardDescription>{t("auth.resetSubtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
            <Input
              label={t("auth.newPassword")}
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

            <Button type="submit" size="lg" className="w-full" loading={isLoading}>
              {t("auth.resetPasswordBtn")}
              <span className="material-symbols-outlined text-[18px]">check</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
