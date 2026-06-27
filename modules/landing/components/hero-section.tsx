"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "12 000+", label: "Candidats accompagnés" },
  { value: "94%", label: "Taux de réussite (B2+)" },
  { value: "47", label: "Pays d'origine" },
];

export function HeroSection() {
  return (
    <>
      {/* === DESKTOP HERO === */}
      <section className="hidden md:flex relative min-h-[921px] flex-col items-center justify-center pt-2xl pb-2xl px-md md:px-lg overflow-hidden">
        {/* Abstract Blob Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-tertiary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-container-max mx-auto text-center flex flex-col items-center gap-xl relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-sm px-md py-xs rounded-full border border-primary/20 bg-primary/5 text-primary font-label-sm text-label-sm mb-sm"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Plateforme Officielle de Préparation</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display-lg text-display-lg md:text-[72px] md:leading-[1.1] font-bold text-on-surface max-w-4xl tracking-tight"
          >
            Maîtrisez le TCF.{" "}
            <br />
            <span className="gradient-text">Le goût des C2 🍁</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto md:text-[20px]"
          >
            L&apos;entraînement immersif conçu pour maximiser votre score NCLC.
            Des simulations réelles, un feedback instantané, et votre passeport
            pour le Canada.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-md mt-md"
          >
            <Button asChild size="xl" className="w-full sm:w-auto">
              <Link href="/inscription">
                Commencer gratuitement
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </Link>
            </Button>
            <Button asChild variant="secondary" size="xl" className="w-full sm:w-auto">
              <Link href="#demo">
                <span className="material-symbols-outlined text-[20px]">
                  play_circle
                </span>
                Voir la démo
              </Link>
            </Button>
          </motion.div>

          {/* Trust Stats Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-2xl glass-panel rounded-2xl p-lg w-full max-w-5xl flex flex-col md:flex-row justify-around items-center gap-lg"
          >
            {stats.map((stat, index) => (
              <React.Fragment key={stat.value}>
                <div className="flex flex-col items-center text-center">
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">
                    {stat.value}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {stat.label}
                  </span>
                </div>
                {index < stats.length - 1 && (
                  <div className="hidden md:block w-px h-12 bg-outline-variant" />
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === MOBILE HERO === */}
      <section className="md:hidden bg-gradient-to-br from-surface to-secondary-container/30 px-md py-xl flex flex-col items-center text-center relative overflow-hidden min-h-screen">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #4f378a 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-lg">
          {/* Badge */}
          <div className="inline-flex items-center gap-xs px-md py-xs rounded-full bg-surface-container-lowest border border-outline-variant text-label-sm font-label-sm text-primary mb-sm shadow-violet-sm">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Préparation certifiée IRCC</span>
          </div>

          {/* Headline */}
          <h1 className="font-display-lg text-display-md text-primary font-bold leading-tight">
            Le goût des C2 🍁
          </h1>

          <p className="font-body-md text-body-md text-on-surface-variant">
            Atteignez le niveau C2 au TCF Canada. Une méthode rigoureuse pour
            votre projet d&apos;immigration.
          </p>

          {/* CTAs */}
          <div className="w-full flex flex-col gap-sm mt-md">
            <Button asChild size="lg" className="w-full">
              <Link href="/inscription">Commencer l&apos;entraînement</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full">
              <Link href="#methode">Découvrir la méthode</Link>
            </Button>
          </div>

          {/* Hero Image Card */}
          <div className="w-full h-48 mt-lg rounded-2xl overflow-hidden shadow-violet-md border border-outline-variant relative">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOGaa5xOCfBAz3bv_-Nat00-RxPMRM-ubS3WUJEcT5pmmVMsGWn2BwSCfnAZiPiaTSxRYTxNNS-txKGqQ8rcgEpxrWri_QrRlK9EoeVUbBoHcQ8CAJLW5IlVjKoCkWyhvR-gRIxrTu9-ycbgOYCPQP1VHPDCQ_2wQlIjeBrX3aVhHXkEeUTuiuLT-sKNuRXCwqJdHrxqsK0G7cuY0Un_62xQiiHwFKpeAAZux5F_p7TPKsJwKIbyv16v8ReJBC83smTKzczx4a0vg"
              alt="Étudiant préparant le TCF Canada"
              fill
              className="object-cover"
            />
            {/* Overlay badge */}
            <div className="absolute bottom-md left-md bg-surface-container-lowest/90 backdrop-blur-sm p-sm rounded-lg border border-outline-variant flex items-center gap-sm">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  trending_up
                </span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface">
                  Score C2 visé
                </div>
                <div className="font-label-sm text-[10px] text-on-surface-variant">
                  Taux de réussite 92%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="w-full max-w-sm mt-xl bg-surface-container-lowest py-lg px-md border border-outline-variant rounded-2xl flex justify-around items-center shadow-violet-sm">
          {[
            { value: "500+", label: "Exercices" },
            { value: "4", label: "Compétences" },
            { value: "C2", label: "Objectif" },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.value}>
              <div className="flex flex-col items-center text-center">
                <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
                  {stat.value}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  {stat.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-px h-12 bg-outline-variant" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </>
  );
}
