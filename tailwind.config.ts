import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Material Design 3 — L'Avant-Garde Canadien
        "on-surface-variant": "#494551",
        "surface-variant": "#e6e0e9",
        "surface-dim": "#ded8e0",
        "on-surface": "#1d1b20",
        "tertiary-fixed": "#ffdf93",
        surface: "#fdf7ff",
        "on-tertiary-fixed": "#241a00",
        "secondary-fixed-dim": "#cdc0e9",
        "primary-fixed": "#e9ddff",
        "tertiary-fixed-dim": "#e7c365",
        "on-secondary-fixed-variant": "#4b4263",
        "surface-container-high": "#ece6ee",
        "error-container": "#ffdad6",
        "surface-bright": "#fdf7ff",
        "on-primary-fixed": "#22005d",
        "inverse-on-surface": "#f5eff7",
        "surface-tint": "#6750a4",
        secondary: "#63597c",
        primary: "#4f378a",
        "on-tertiary-container": "#503d00",
        "on-tertiary-fixed-variant": "#594400",
        "tertiary-container": "#c9a74d",
        "on-primary-container": "#e0d2ff",
        "on-error-container": "#93000a",
        "on-primary-fixed-variant": "#4f378a",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed": "#e9ddff",
        outline: "#7a7582",
        "on-error": "#ffffff",
        error: "#ba1a1a",
        "on-background": "#1d1b20",
        "inverse-primary": "#cfbcff",
        "secondary-container": "#e1d4fd",
        "outline-variant": "#cbc4d2",
        "surface-container-low": "#f8f2fa",
        tertiary: "#765b00",
        "on-secondary-container": "#645a7d",
        "on-tertiary": "#ffffff",
        "on-primary": "#ffffff",
        background: "#fdf7ff",
        "surface-container": "#f2ecf4",
        "primary-container": "#6750a4",
        "surface-container-highest": "#e6e0e9",
        "inverse-surface": "#322f35",
        "on-secondary": "#ffffff",
        "primary-fixed-dim": "#cfbcff",
        "on-secondary-fixed": "#1f1635",

        // Shadcn UI compatibility
        border: "#cbc4d2",
        input: "#cbc4d2",
        ring: "#4f378a",
        foreground: "#1d1b20",
        muted: {
          DEFAULT: "#f2ecf4",
          foreground: "#494551",
        },
        accent: {
          DEFAULT: "#e9ddff",
          foreground: "#22005d",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1d1b20",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1d1b20",
        },
        destructive: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
        },

        // Success / Emerald for C2 mastery
        success: "#10b981",
        "success-container": "#d1fae5",
        "on-success": "#ffffff",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        xs: "0.25rem",
        "2xl": "3rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        gutter: "24px",
        base: "4px",
        "container-max": "1280px",
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        display: ["Geist", ...fontFamily.sans],
        "body-lg": ["Inter"],
        "label-sm": ["Inter"],
        "display-md": ["Geist"],
        "display-lg": ["Geist"],
        "headline-lg": ["Geist"],
        "headline-lg-mobile": ["Geist"],
        "body-md": ["Inter"],
        "label-md": ["Inter"],
      },
      fontSize: {
        "body-lg": [
          "18px",
          { lineHeight: "1.6", letterSpacing: "-0.01em", fontWeight: "400" },
        ],
        "label-sm": [
          "12px",
          { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "600" },
        ],
        "display-md": [
          "36px",
          { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        "display-lg": [
          "48px",
          { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "700" },
        ],
        "headline-lg": [
          "30px",
          { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "headline-lg-mobile": [
          "24px",
          { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "body-md": [
          "16px",
          { lineHeight: "1.5", letterSpacing: "-0.01em", fontWeight: "400" },
        ],
        "label-md": [
          "14px",
          { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" },
        ],
      },
      maxWidth: {
        "container-max": "1280px",
      },
      boxShadow: {
        "violet-sm":
          "0 4px 6px -1px rgba(109, 40, 217, 0.05), 0 2px 4px -1px rgba(109, 40, 217, 0.03)",
        "violet-md":
          "0 4px 12px rgba(79, 55, 138, 0.15), 0 2px 4px rgba(79, 55, 138, 0.08)",
        "violet-lg":
          "0 20px 50px -12px rgba(79, 55, 138, 0.25)",
        "violet-xl":
          "0 25px 60px -15px rgba(79, 55, 138, 0.3)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #4f378a, #6750a4)",
        "gradient-hero":
          "linear-gradient(135deg, #4f378a 0%, #6750a4 50%, #7c5cbf 100%)",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(calc(-250px * 8))" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        blob: "blob 7s infinite",
        "carousel-scroll": "scroll 40s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
