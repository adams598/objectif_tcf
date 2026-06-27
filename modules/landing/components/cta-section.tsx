"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <>
      {/* === DESKTOP CTA === */}
      <section className="hidden md:block py-2xl px-md md:px-lg max-w-container-max mx-auto mb-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary-container rounded-3xl p-xl md:p-2xl text-center relative overflow-hidden flex flex-col items-center"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary rounded-full mix-blend-multiply opacity-20 filter blur-2xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary rounded-full mix-blend-multiply opacity-20 filter blur-2xl" />

          <h2 className="font-display-lg text-display-md md:text-[48px] text-on-primary-container font-bold mb-md relative z-10">
            Prêt à décrocher votre NCLC 9 ?
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary-container/80 max-w-2xl mb-lg relative z-10">
            Rejoignez la plateforme la plus avancée pour la préparation aux
            tests de langue canadiens. Créez un compte gratuitement et commencez
            votre évaluation initiale.
          </p>
          <Button asChild size="xl" className="relative z-10 shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/inscription">
              Commencer gratuitement
              <span className="material-symbols-outlined">rocket_launch</span>
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* === MOBILE CTA === */}
      <section className="md:hidden p-lg bg-primary text-on-primary text-center">
        <h2 className="font-headline-lg-mobile text-[20px] font-bold mb-md">
          Prêt pour le Canada ?
        </h2>
        <Link
          href="/inscription"
          className="block w-full bg-surface-container-lowest text-primary font-label-md text-label-md py-md px-lg rounded-xl font-bold shadow-md hover:bg-surface-variant transition-colors text-center"
        >
          Créer un compte gratuit
        </Link>
      </section>
    </>
  );
}
