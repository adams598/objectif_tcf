"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/components/providers/locale-provider";

type FormData = { email: string };

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.invalidEmail")),
      }),
    [t]
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, action: "request" }),
      });

      if (response.ok) {
        setSentEmail(data.email);
        setSent(true);
      } else {
        const result = await response.json();
        toast.error(result.error || t("auth.sendError"));
      }
    } catch {
      toast.error(t("auth.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="shadow-violet-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl mx-auto mb-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-primary">
              {sent ? "mark_email_read" : "lock_reset"}
            </span>
          </div>
          <CardTitle className="text-[24px]">
            {sent ? t("auth.emailSent") : t("auth.forgotTitle")}
          </CardTitle>
          <CardDescription>
            {sent
              ? t("auth.forgotSentTo", { email: sentEmail })
              : t("auth.forgotSubtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-md"
              >
                <Input
                  label={t("auth.email")}
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                  leftIcon={<span className="material-symbols-outlined text-[20px]">mail</span>}
                  error={errors.email?.message}
                  {...register("email")}
                />

                <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                  {t("auth.sendLink")}
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-md text-center"
              >
                <div className="bg-success-container rounded-xl p-md">
                  <p className="font-body-md text-body-md text-success">
                    {t("auth.checkInboxSpam")}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setSent(false)}
                >
                  {t("auth.resendEmail")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-lg">
            <Link href="/connexion" className="text-primary font-semibold hover:underline flex items-center justify-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              {t("auth.backToLogin")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
