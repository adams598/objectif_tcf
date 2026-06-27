---
name: L'Avant-Garde Canadien
colors:
  surface: '#fdf7ff'
  surface-dim: '#ded8e0'
  surface-bright: '#fdf7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2fa'
  surface-container: '#f2ecf4'
  surface-container-high: '#ece6ee'
  surface-container-highest: '#e6e0e9'
  on-surface: '#1d1b20'
  on-surface-variant: '#494551'
  inverse-surface: '#322f35'
  inverse-on-surface: '#f5eff7'
  outline: '#7a7582'
  outline-variant: '#cbc4d2'
  surface-tint: '#6750a4'
  primary: '#4f378a'
  on-primary: '#ffffff'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#cfbcff'
  secondary: '#63597c'
  on-secondary: '#ffffff'
  secondary-container: '#e1d4fd'
  on-secondary-container: '#645a7d'
  tertiary: '#765b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fdf7ff'
  on-background: '#1d1b20'
  surface-variant: '#e6e0e9'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-md:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  2xl: 3rem
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is engineered for a high-stakes educational environment, balancing the rigorous demands of Canadian immigration testing with a premium, frictionless SaaS experience. The brand personality is **authoritative yet encouraging**, blending the technical precision of developer tools with the gamified engagement of modern language learning platforms.

The aesthetic follows a **Modern Corporate** direction with **Minimalist** foundations. It leverages heavy whitespace and a restricted, high-contrast palette to reduce cognitive load during intense study sessions. Design elements are inspired by the clarity of Linear and the modularity of Notion, while borrowing the vibrant, progress-oriented feedback loops found in Duolingo. The result is a UI that feels like an elite workspace for personal advancement.

## Colors
This design system utilizes a sophisticated palette centered around a **Violet-to-Indigo gradient** that signifies intelligence and ambition. 

- **Primary Gradient:** Used for main actions, active states, and progress indicators.
- **Success (C2 Proficiency):** Emerald green is reserved for "Mastery" states and correct answers, providing immediate positive reinforcement.
- **Canada Accent:** A vibrant Red is used sparingly for high-impact branding elements (like flag badges or "Submit" actions) to maintain a connection to the destination.
- **Neutrals:** A Slate-based scale provides a cool, professional backdrop that prevents eye strain. 

In Dark Mode, the background shifts to `Slate-950` to maintain depth, while borders remain subtle to preserve the "layered" UI feel.

## Typography
The typography strategy maximizes legibility for dense educational content. **Geist** is employed for display headings to provide a technical, sharp edge that feels modern and precise. **Inter** is used for all UI components and body copy to ensure readability across all devices.

A consistent **tight tracking (letter-spacing)** is applied to headlines to achieve the "SaaS-premium" look. For body text, the line height is generous (1.5–1.6) to facilitate long-form reading of French exam passages.

## Layout & Spacing
This design system uses a **Fluid Grid** model with a 12-column structure for desktop and a single-column layout for mobile. 

- **Desktop:** 12 columns, 24px gutters, and 40px side margins.
- **Mobile:** 16px margins, fluid containers.
- **Spacing Rhythm:** Based on a 4px baseline grid. Use `md` (16px) for standard component grouping and `xl` (32px) for section vertical spacing.

Sidebar navigation should be fixed at 280px on desktop, collapsing to a bottom navigation bar or a full-screen overlay on mobile devices to prioritize the "Test Canvas" area.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Soft Layered Shadows**. Surfaces do not simply float; they occupy specific tiers:

1.  **Level 0 (Background):** Slate-50.
2.  **Level 1 (Cards/Sidebar):** White surface with a 1px Slate-200 border.
3.  **Level 2 (Popovers/Active Modals):** White surface with a "Violet-Tinted" shadow.

**Shadow Specification:** Shadows should be extremely soft, using `rgba(109, 40, 217, 0.1)` (Violet-500 at 10% opacity) for the Y-offset. Avoid pure black shadows to maintain the premium, clean aesthetic.

## Shapes
The shape language is friendly but structured. We use a hierarchical rounding system to differentiate between structural containers and interactive elements:

- **Cards/Main Containers:** `rounded-2xl` (1.5rem) to create a soft, inviting frame for study content.
- **Buttons/Inputs:** `rounded-xl` (0.75rem) for a modern, tactile feel.
- **Pills/Badges:** `rounded-full` to distinguish them from interactive buttons.

A subtle **Maple Leaf motif** can be used as a low-opacity background watermark (2-3% opacity) in the top-right corner of dashboard cards to reinforce the Canadian theme without distracting the user.

## Components
- **Buttons:** Primary buttons use the Violet-to-Indigo gradient with white text. Secondary buttons use a white background with a Slate-200 border and Slate-900 text. Use `xl` roundedness.
- **Inputs:** Focus states must use a 2px Violet border and a very soft Violet outer glow. Labels should be `label-md` in Slate-600.
- **Progress Bars:** Use a thick 8px track (`Slate-200`). The fill should be the Primary Gradient. For "C2 Mastery" sections, the fill switches to Emerald-500.
- **Radar Charts:** Used for "Competency Profiles" (Listening, Speaking, Reading, Writing). Use a semi-transparent Violet fill (`opacity: 0.2`) with a solid Violet stroke.
- **Flag Badges:** For language selection or "Target: Canada" indicators, use a small circular clip for the flag icon, paired with `label-sm` caps text.
- **Sidebar Navigation:** Use Lucide icons (1.5px stroke). Active states should feature a 4px vertical "pill" indicator in Violet on the left edge of the menu item.
- **French Tone:** All labels must use French (FR-CA). Example: "Tableau de bord" (Dashboard), "Commencer l'examen" (Start Exam), "Progression" (Progress).