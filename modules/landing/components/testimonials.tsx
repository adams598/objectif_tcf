"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const testimonials = [
  {
    id: 1,
    name: "Amina S.",
    origin: "🇨🇮 Abidjan",
    profession: "Infirmière",
    scores: ["CO: C2", "CE: C1", "EE: C2", "EO: C1"],
    quote:
      "La plateforme reproduit exactement l'interface de l'examen sur ordinateur. Le jour J, je n'étais pas stressée car j'avais fait plus de 20 simulations dans les mêmes conditions. Résultat: NCLC 9 atteint!",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1aPStS1FcgYTFya9L7jZNHwaW6kTIzRXgynI9VqXtryLL9LDTvPHOJhZ_sLJFt143BtPN-kfKPEWMgjvo8oLWNKmqBA5DFL8FIB6Dx7a4SWvpgZ9YCvi34KyYyF2inZKFmI1SXI96HtCgc-6vynNxKroxkuRoUh2M_qsW2mi52xNqREfOlr7uHwX7NXSpCzSEQu9O3Ydylv5AT9XIppLz-Zz0IYvEj6MCBVkAU7nzYR3s5B_omut96QZYnq-0JBZsdo5VJQCWsfQ",
  },
  {
    id: 2,
    name: "Karim M.",
    origin: "🇲🇦 Casablanca",
    profession: "Ingénieur",
    scores: ["CO: C1", "CE: C2", "EE: C1", "EO: B2"],
    quote:
      "L'outil de correction IA pour l'expression écrite est bluffant. Il a corrigé mes erreurs récurrentes de syntaxe en quelques jours. J'ai gagné les points qui me manquaient pour Entrée Express.",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBAuKhw3Kzh-2kOZWdQDqKqSlzv6m_h2CM_VmYZncKh6f5TTm13vWf-qqveCZq-Bl1Sw0M_en5Rz9D6bcf2etMGbjP-uJcWxiamoqFKMrEeAsWPoxmhK48Tce8zJuee6AnEAZRE26804VqykqpUF8ZflY9m-IA_RjNni5Ks3Yki1N-PoVbnWd75ALQYb6SHfRqestg4_3PE-6U3ZXz_5qkwiGENu0drpUtaL3lLU-qXWfEzuK0NkHS_HXyvucRTBqUP-SaI0eHQK50",
  },
  {
    id: 3,
    name: "Julien B.",
    origin: "🇫🇷 Paris",
    profession: "Développeur",
    scores: ["CO: C2", "CE: C2", "EE: C2", "EO: C2"],
    quote:
      "Même en étant francophone natif, le format du TCF est particulier. Objectif Canada m'a appris la 'méthodologie' de l'examen. J'ai sécurisé le score maximum sans mauvaise surprise.",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA8212HbjVdElQw0UcVkJcokt8l6DLV9dGJ6Wp181PMepCNGqgwNK3n5-riyrQHYJUhqD99QyLunUC62w4bAdPbTSiki1NTjKbT0uW-6hQWhJuhbT2j5nbEMMKSo08LcqhlTVPZw8yVg7aDYHp6OfblImnAKDXCldirLLMrhoMPX1InXQpKHYG_NSL9dgSZSmxIrZ8MvIIYskBs8mpsJZWwcyY37EJkRTlB3PE5vtGgGxHj6AJNptwz-5T6_C80sJXqumOBZ3PukRE",
  },
];

export function Testimonials() {
  return (
    <section className="py-2xl px-md md:px-lg max-w-container-max mx-auto bg-background">
      <div className="text-center mb-xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display-md text-display-md md:text-display-lg text-on-surface font-bold mb-sm"
        >
          Ils ont eu leur RP.
        </motion.h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Des histoires de réussite de candidats qui ont fait confiance à
          Objectif Canada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {testimonials.map((t, index) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.15 }}
            className="glass-panel p-lg rounded-2xl flex flex-col h-full relative overflow-hidden group hover:-translate-y-1 transition-transform"
          >
            {/* Quote decoration */}
            <div className="absolute top-0 right-0 p-md opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[64px] text-primary">
                format_quote
              </span>
            </div>

            {/* Author */}
            <div className="flex items-center gap-md mb-md z-10">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-surface shadow-sm shrink-0">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface font-bold text-lg">
                  {t.name}
                </h4>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
                  {t.origin}
                  <span className="w-1 h-1 bg-outline-variant rounded-full" />
                  {t.profession}
                </span>
              </div>
            </div>

            {/* Scores */}
            <div className="mb-md z-10">
              <div className="inline-flex flex-wrap gap-sm">
                {t.scores.map((score) => (
                  <span
                    key={score}
                    className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold font-label-sm"
                  >
                    {score}
                  </span>
                ))}
              </div>
            </div>

            {/* Quote */}
            <p className="font-body-md text-body-md text-on-surface-variant italic z-10 flex-grow">
              &ldquo;{t.quote}&rdquo;
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
