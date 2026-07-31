"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SKILLS = [
  { code: "CO", label: "Compréhension orale", hue: "var(--primary)" },
  { code: "CE", label: "Compréhension écrite", hue: "var(--secondary)" },
  { code: "EE", label: "Expression écrite", hue: "var(--tertiary)" },
  { code: "EO", label: "Expression orale", hue: "var(--primary-container)" },
] as const;

const ORBIT_RADII = [68, 88, 68, 88];
const ORBIT_DURATIONS = [9, 11, 13, 15];
const ORBIT_OFFSETS = [0, 90, 180, 270];

type PageLoaderProps = {
  variant?: "fullscreen" | "content";
  className?: string;
};

function OrbitalSkill({
  skill,
  index,
  reduced,
}: {
  skill: (typeof SKILLS)[number];
  index: number;
  reduced: boolean;
}) {
  const radius = ORBIT_RADII[index];
  const duration = ORBIT_DURATIONS[index];
  const startAngle = ORBIT_OFFSETS[index];
  const orbitTransition = {
    duration,
    repeat: Infinity,
    ease: "linear" as const,
  };

  if (reduced) {
    const angle = (startAngle * Math.PI) / 180;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return (
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-surface text-[11px] font-bold text-primary shadow-violet-sm">
          {skill.code}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-0 w-0"
      initial={{ rotate: startAngle }}
      animate={{ rotate: startAngle + 360 }}
      transition={orbitTransition}
    >
      <motion.div
        className="absolute -translate-x-1/2"
        style={{ top: -radius }}
        initial={{ rotate: -startAngle }}
        animate={{ rotate: -(startAngle + 360) }}
        transition={orbitTransition}
      >
        <motion.span
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-surface-container-lowest text-[11px] font-bold tracking-wide text-primary shadow-violet-md"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: index * 0.35,
            ease: "easeInOut",
          }}
        >
          <span
            className="absolute inset-0 rounded-full opacity-40 blur-[2px]"
            style={{ background: skill.hue }}
            aria-hidden
          />
          <span className="relative">{skill.code}</span>
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

function FloatingParticle({ index, reduced }: { index: number; reduced: boolean }) {
  if (reduced) return null;

  const left = 12 + ((index * 17) % 76);
  const delay = index * 0.45;
  const size = 3 + (index % 3);

  return (
    <motion.span
      className="absolute rounded-full bg-primary/30"
      style={{
        left: `${left}%`,
        bottom: `${8 + (index % 5) * 4}%`,
        width: size,
        height: size,
      }}
      animate={{
        y: [0, -120 - index * 8],
        opacity: [0, 0.7, 0],
        scale: [0.5, 1, 0.3],
      }}
      transition={{
        duration: 3.2 + (index % 4) * 0.5,
        repeat: Infinity,
        delay,
        ease: "easeOut",
      }}
      aria-hidden
    />
  );
}

export function PageLoader({ variant = "fullscreen", className }: PageLoaderProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [skillIndex, setSkillIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setSkillIndex((i) => (i + 1) % SKILLS.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const activeSkill = SKILLS[skillIndex];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement de la page"
      className={cn(
        variant === "fullscreen"
          ? "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-surface/90 backdrop-blur-md"
          : "relative flex w-full min-h-[52vh] items-center justify-center overflow-hidden py-2xl",
        className
      )}
    >
      {/* Ambient mesh */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[20%] top-[25%] h-48 w-48 rounded-full bg-tertiary/15 blur-3xl animate-blob" />
        <div className="absolute bottom-[20%] right-[18%] h-56 w-56 rounded-full bg-secondary-container/30 blur-3xl animate-blob animation-delay-2000" />
        {Array.from({ length: 10 }).map((_, i) => (
          <FloatingParticle key={i} index={i} reduced={reduceMotion} />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-lg px-md">
        {/* Orbital system */}
        <div className="relative h-[220px] w-[220px]">
          {/* SVG rings */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 220 220"
            aria-hidden
          >
            <defs>
              <linearGradient id="loader-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                <stop offset="50%" stopColor="var(--primary-container)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--tertiary)" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {[98, 78, 58].map((r, i) => (
              <motion.circle
                key={r}
                cx="110"
                cy="110"
                r={r}
                fill="none"
                stroke="url(#loader-ring-grad)"
                strokeWidth={i === 0 ? 1.5 : 1}
                strokeDasharray={i === 0 ? "8 14" : "4 10"}
                initial={{ rotate: 0 }}
                animate={reduceMotion ? undefined : { rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{
                  duration: 18 + i * 6,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ transformOrigin: "110px 110px" }}
              />
            ))}

            {/* Arc de trajectoire */}
            <motion.path
              d="M 40 150 Q 110 40 180 150"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="120"
              initial={{ strokeDashoffset: 120, opacity: 0.3 }}
              animate={
                reduceMotion
                  ? { strokeDashoffset: 0, opacity: 0.35 }
                  : { strokeDashoffset: [120, 0, 120], opacity: [0.25, 0.55, 0.25] }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>

          {/* Core */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-primary/20 bg-surface-container-lowest shadow-violet-lg"
              animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/20 via-primary-container/30 to-tertiary/25"
                animate={reduceMotion ? undefined : { opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
              <motion.span
                className="relative text-[28px] leading-none select-none"
                animate={reduceMotion ? undefined : { rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              >
                🍁
              </motion.span>
            </motion.div>
          </div>

          {SKILLS.map((skill, i) => (
            <OrbitalSkill
              key={skill.code}
              skill={skill}
              index={i}
              reduced={reduceMotion}
            />
          ))}
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-xs text-center">
          <p className="font-display-md text-[22px] font-bold tracking-tight text-on-surface">
            <span className="bg-gradient-to-r from-primary via-primary-container to-tertiary bg-clip-text text-transparent">
              Objectif TCF
            </span>
          </p>

          <div className="flex items-center gap-1.5 min-h-[24px]">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Préparation
            </span>
            <motion.span
              key={activeSkill.code}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-label-md text-label-md font-semibold text-primary"
            >
              {activeSkill.label}
            </motion.span>
          </div>

          {/* Progress shimmer bar */}
          <div className="mt-sm h-1 w-40 overflow-hidden rounded-full bg-surface-container-high">
            <motion.div
              className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={reduceMotion ? undefined : { x: ["-100%", "200%"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
