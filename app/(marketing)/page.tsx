import { HeroSection } from "@/modules/landing/components/hero-section";
import { FlagCarousel } from "@/modules/landing/components/flag-carousel";
import { OnboardingTeaser } from "@/modules/landing/components/onboarding-teaser";
import { FeaturesBento } from "@/modules/landing/components/features-bento";
import { Testimonials } from "@/modules/landing/components/testimonials";
import { CtaSection } from "@/modules/landing/components/cta-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Objectif Canada TCF — Le goût des C2 🍁",
  description:
    "L'entraînement immersif conçu pour maximiser votre score NCLC. Des simulations réelles, un feedback instantané, et votre passeport pour le Canada.",
};

export default function HomePage() {
  return (
    <div className="bg-background text-on-background overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <HeroSection />
      <FlagCarousel />
      <OnboardingTeaser />
      <FeaturesBento />
      <Testimonials />
      <CtaSection />
    </div>
  );
}
