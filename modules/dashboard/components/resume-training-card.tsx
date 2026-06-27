"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ResumeTrainingCard() {
  return (
    <motion.div
      whileHover={{ borderColor: "rgba(207, 188, 255, 0.8)" }}
      className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-lg relative overflow-hidden group"
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-container to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out opacity-50 pointer-events-none" />

      <div className="flex items-center gap-lg z-10 w-full sm:w-auto">
        {/* Icon */}
        <div className="w-16 h-16 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[30px]">headphones</span>
        </div>

        {/* Info */}
        <div>
          <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
            Reprendre l&apos;entraînement
          </span>
          <h4 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-1">
            Compréhension Orale — Série 12
          </h4>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Section B : Écoute de dialogues longs.
          </p>
        </div>
      </div>

      {/* CTA */}
      <Button asChild size="lg" className="w-full sm:w-auto shrink-0 z-10">
        <Link href="/examen/serie/12">
          Continuer
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </Button>
    </motion.div>
  );
}
