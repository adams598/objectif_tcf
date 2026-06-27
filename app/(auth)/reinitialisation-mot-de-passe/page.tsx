import { Suspense } from "react";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réinitialisation du mot de passe",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40"><span className="material-symbols-outlined text-[48px] text-primary animate-spin">autorenew</span></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
