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
        // Material Design 3 — semantic tokens via CSS variables
        "on-surface-variant": "var(--on-surface-variant)",
        "surface-variant": "var(--surface-variant)",
        "surface-dim": "var(--surface-dim)",
        "on-surface": "var(--on-surface)",
        "tertiary-fixed": "var(--tertiary-fixed)",
        surface: "var(--surface)",
        "on-tertiary-fixed": "var(--on-tertiary-fixed)",
        "secondary-fixed-dim": "var(--secondary-fixed-dim)",
        "primary-fixed": "var(--primary-fixed)",
        "tertiary-fixed-dim": "var(--tertiary-fixed-dim)",
        "on-secondary-fixed-variant": "var(--on-secondary-fixed-variant)",
        "surface-container-high": "var(--surface-container-high)",
        "error-container": "var(--error-container)",
        "surface-bright": "var(--surface-bright)",
        "on-primary-fixed": "var(--on-primary-fixed)",
        "inverse-on-surface": "var(--inverse-on-surface)",
        "surface-tint": "var(--surface-tint)",
        secondary: "var(--secondary)",
        primary: "var(--primary)",
        "on-tertiary-container": "var(--on-tertiary-container)",
        "on-tertiary-fixed-variant": "var(--on-tertiary-fixed-variant)",
        "tertiary-container": "var(--tertiary-container)",
        "on-primary-container": "var(--on-primary-container)",
        "on-error-container": "var(--on-error-container)",
        "on-primary-fixed-variant": "var(--on-primary-fixed-variant)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "secondary-fixed": "var(--secondary-fixed)",
        outline: "var(--outline)",
        "on-error": "var(--on-error)",
        error: "var(--error)",
        "on-background": "var(--on-background)",
        "inverse-primary": "var(--inverse-primary)",
        "secondary-container": "var(--secondary-container)",
        "outline-variant": "var(--outline-variant)",
        "surface-container-low": "var(--surface-container-low)",
        tertiary: "var(--tertiary)",
        "on-secondary-container": "var(--on-secondary-container)",
        "on-tertiary": "var(--on-tertiary)",
        "on-primary": "var(--on-primary)",
        background: "var(--background)",
        "surface-container": "var(--surface-container)",
        "primary-container": "var(--primary-container)",
        "surface-container-highest": "var(--surface-container-highest)",
        "inverse-surface": "var(--inverse-surface)",
        "on-secondary": "var(--on-secondary)",
        "primary-fixed-dim": "var(--primary-fixed-dim)",
        "on-secondary-fixed": "var(--on-secondary-fixed)",

        // Shadcn UI compatibility
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        foreground: "var(--foreground)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },

        // Success / Emerald for C2 mastery
        success: "var(--success)",
        "success-container": "var(--success-container)",
        "on-success": "var(--on-success)",
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
        "2xl": "2.5rem",
        sm: "0.5rem",
        md: "0.875rem",
        lg: "1.25rem",
        xl: "1.75rem",
        gutter: "20px",
        base: "4px",
        "container-max": "1280px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        display: ["var(--font-geist)", ...fontFamily.sans],
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
          "16px",
          { lineHeight: "1.55", letterSpacing: "-0.01em", fontWeight: "400" },
        ],
        "label-sm": [
          "12px",
          { lineHeight: "1.35", letterSpacing: "0.02em", fontWeight: "600" },
        ],
        "display-md": [
          "28px",
          { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        "display-lg": [
          "38px",
          { lineHeight: "1.12", letterSpacing: "-0.04em", fontWeight: "700" },
        ],
        "headline-lg": [
          "22px",
          { lineHeight: "1.35", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "headline-lg-mobile": [
          "20px",
          { lineHeight: "1.35", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "body-md": [
          "14px",
          { lineHeight: "1.5", letterSpacing: "-0.005em", fontWeight: "400" },
        ],
        "label-md": [
          "13px",
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
