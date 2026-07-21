import { RegisterForm } from "@/modules/auth/components/register-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créez votre compte Objectif TCF gratuitement.",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
