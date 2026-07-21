import type { Metadata, Viewport } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Objectif TCF",
    template: "%s | Objectif TCF",
  },
  description:
    "La plateforme d'entraînement la plus avancée pour le TCF Canada, TEF Canada et IELTS. Des simulations réelles, un feedback instantané et votre passeport pour le Canada.",
  keywords: [
    "TCF Canada",
    "TEF Canada",
    "IELTS",
    "NCLC",
    "immigration Canada",
    "test français",
    "préparation TCF",
    "résidence permanente",
  ],
  authors: [{ name: "Objectif TCF" }],
  creator: "Objectif TCF",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Objectif TCF — Le goût des C2 🍁",
    description:
      "La plateforme d'entraînement la plus avancée pour le TCF Canada, TEF Canada et IELTS.",
    siteName: "Objectif TCF",
    images: [
      {
        url: "/images/logo-nav.png",
        width: 390,
        height: 150,
        alt: "Objectif TCF",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Objectif TCF🍁",
    description:
      "La plateforme d'entraînement la plus avancée pour le TCF Canada, TEF Canada et IELTS.",
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo-icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#4f378a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-FR" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${inter.variable} bg-background text-on-background font-sans overflow-x-hidden antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
