import type { Metadata } from "next";
import { ContactPage } from "@/modules/marketing/components/contact-page";

export const metadata: Metadata = {
  title: "Contact | Objectif TCF",
  description:
    "Contactez l'équipe Objectif TCF pour toute question sur la préparation TCF, TEF ou IELTS.",
};

export default function Page() {
  return <ContactPage />;
}
