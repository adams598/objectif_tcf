import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
