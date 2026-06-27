import { OnboardingWizard } from "@/modules/onboarding/components/onboarding-wizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuration de votre profil",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
