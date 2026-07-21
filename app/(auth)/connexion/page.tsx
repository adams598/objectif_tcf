import { LoginForm } from "@/modules/auth/components/login-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace Objectif TCF.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}