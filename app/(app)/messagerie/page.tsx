import type { Metadata } from "next";
import { MessagerieView } from "@/modules/messagerie/components/messagerie-view";

export const metadata: Metadata = { title: "Messagerie" };

export default function MessagériePage() {
  return <MessagerieView />;
}
