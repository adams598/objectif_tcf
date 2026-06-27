import { LoginForm } from "@/modules/auth/components/login-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace Objectif Canada.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}