"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/providers/locale-provider";

export function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      id: 1,
      nameKey: "landingFeatures.testimonial1Name" as const,
      originKey: "landingFeatures.testimonial1Origin" as const,
      professionKey: "landingFeatures.testimonial1Profession" as const,
      quoteKey: "landingFeatures.testimonial1Quote" as const,
      scores: ["CO: C2", "CE: C1", "EE: C2", "EO: C1"],
      avatar: "/images/testimonials/amina.jpg",
    },
    {
      id: 2,
      nameKey: "landingFeatures.testimonial2Name" as const,
      originKey: "landingFeatures.testimonial2Origin" as const,
      professionKey: "landingFeatures.testimonial2Profession" as const,
      quoteKey: "landingFeatures.testimonial2Quote" as const,
      scores: ["CO: C1", "CE: C2", "EE: C1", "EO: B2"],
      avatar: "/images/testimonials/karim.jpg",
    },
    {
      id: 3,
      nameKey: "landingFeatures.testimonial3Name" as const,
      originKey: "landingFeatures.testimonial3Origin" as const,
      professionKey: "landingFeatures.testimonial3Profession" as const,
      quoteKey: "landingFeatures.testimonial3Quote" as const,
      scores: ["CO: C2", "CE: C2", "EE: C2", "EO: C2"],
      avatar: "/images/testimonials/julien.jpg",
    },
  ];

  return (
    <section className="py-2xl px-md md:px-lg max-w-container-max mx-auto bg-background">
      <div className="text-center mb-xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display-md text-display-md md:text-display-lg text-on-surface font-bold mb-sm"
        >
          {t("landingFeatures.testimonialsTitle")}
        </motion.h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          {t("landingFeatures.testimonialsSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {testimonials.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.15 }}
            className="glass-panel p-lg rounded-2xl flex flex-col h-full relative overflow-hidden group hover:-translate-y-1 transition-transform"
          >
            <div className="absolute top-0 right-0 p-md opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[64px] text-primary">
                format_quote
              </span>
            </div>

            <div className="flex items-center gap-md mb-md z-10">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-surface shadow-sm shrink-0">
                <Image
                  src={item.avatar}
                  alt={t(item.nameKey)}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface font-bold text-lg">
                  {t(item.nameKey)}
                </h4>
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
                  {t(item.originKey)}
                  <span className="w-1 h-1 bg-outline-variant rounded-full" />
                  {t(item.professionKey)}
                </span>
              </div>
            </div>

            <div className="mb-md z-10">
              <div className="inline-flex flex-wrap gap-sm">
                {item.scores.map((score) => (
                  <span
                    key={score}
                    className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold font-label-sm"
                  >
                    {score}
                  </span>
                ))}
              </div>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant italic z-10 flex-grow">
              &ldquo;{t(item.quoteKey)}&rdquo;
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
