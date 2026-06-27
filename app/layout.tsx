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
    default: "Objectif Canada TCF — Le goût des C2 🍁",
    template: "%s | Objectif Canada",
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
  authors: [{ name: "Objectif Canada TCF" }],
  creator: "Objectif Canada TCF",
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Objectif Canada TCF — Le goût des C2 🍁",
    description:
      "La plateforme d'entraînement la plus avancée pour le TCF Canada, TEF Canada et IELTS.",
    siteName: "Objectif Canada",
  },
  twitter: {
    card: "summary_large_image",
    title: "Objectif Canada TCF — Le goût des C2 🍁",
    description:
      "La plateforme d'entraînement la plus avancée pour le TCF Canada, TEF Canada et IELTS.",
  },
  robots: {
    index: true,
    follow: true,
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
    <html lang="fr-CA" className="light" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${geist.variable} ${inter.variable} bg-background text-on-background font-sans overflow-x-hidden antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
