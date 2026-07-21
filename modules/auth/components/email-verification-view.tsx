"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/locale-provider";
import { toast } from "sonner";

export function EmailVerificationView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"pending" | "verifying" | "success" | "error">(
    token ? "verifying" : "pending"
  );
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (verifyToken: string) => {
    try {
      const response = await fetch("/api/auth/verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken }),
      });

      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  const resendEmail = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/verification-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success(t("auth.resendEmailSuccess"));
      } else {
        toast.error(t("auth.resendEmailError"));
      }
    } catch {
      toast.error(t("auth.resendEmailError"));
    } finally {
      setIsResending(false);
    }
  };

  const configs = {
    pending: {
      icon: "mail_outline",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      title: t("auth.verifyEmailTitle"),
      description: t("auth.verifyPendingDesc", {
        email: email || t("auth.verifyPendingEmailFallback"),
      }),
      content: (
        <>
          <div className="bg-surface-container rounded-xl p-md text-center">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {t("auth.resendPrompt")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-sm text-primary"
              onClick={resendEmail}
              loading={isResending}
            >
              {t("auth.resendEmail")}
            </Button>
          </div>
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link href="/connexion">{t("auth.backToLogin")}</Link>
          </Button>
        </>
      ),
    },
    verifying: {
      icon: "hourglass_top",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      title: t("auth.verifyingTitle"),
      description: t("auth.verifyingDesc"),
      content: (
        <div className="flex justify-center">
          <span className="material-symbols-outlined text-[48px] text-primary animate-spin">
            autorenew
          </span>
        </div>
      ),
    },
    success: {
      icon: "check_circle",
      iconColor: "text-success",
      iconBg: "bg-success-container",
      title: t("auth.verifySuccessTitle"),
      description: t("auth.verifySuccessDesc"),
      content: (
        <Button asChild size="lg" className="w-full">
          <Link href="/connexion">
            {t("auth.accessSpace")}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </Button>
      ),
    },
    error: {
      icon: "error_outline",
      iconColor: "text-error",
      iconBg: "bg-error-container",
      title: t("auth.linkExpired"),
      description: t("auth.linkExpiredDesc"),
      content: (
        <>
          {email ? (
            <div className="bg-surface-container rounded-xl p-md text-center">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {t("auth.resendPrompt")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-sm text-primary"
                onClick={resendEmail}
                loading={isResending}
              >
                {t("auth.resendEmail")}
              </Button>
            </div>
          ) : null}
          <Button asChild size="lg" className="w-full">
            <Link href="/inscription">{t("auth.createNewAccount")}</Link>
          </Button>
          <Button asChild variant="secondary" size="default" className="w-full">
            <Link href="/connexion">{t("auth.login")}</Link>
          </Button>
        </>
      ),
    },
  };

  const config = configs[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="shadow-violet-lg">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 ${config.iconBg} rounded-2xl mx-auto mb-md flex items-center justify-center`}>
            <span className={`material-symbols-outlined text-[32px] ${config.iconColor}`}>
              {config.icon}
            </span>
          </div>
          <CardTitle className="text-[24px]">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-sm">{config.content}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
