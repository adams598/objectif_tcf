import { RegisterForm } from "@/modules/auth/components/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créez votre compte Objectif Canada gratuitement.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
