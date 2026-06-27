import { Suspense } from "react";
import { EmailVerificationView } from "@/modules/auth/components/email-verification-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification de l'email",
};

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40"><span className="material-symbols-outlined text-[48px] text-primary animate-spin">autorenew</span></div>}>
      <EmailVerificationView />
    </Suspense>
  );
}
