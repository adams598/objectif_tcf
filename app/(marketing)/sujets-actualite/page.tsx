import type { Metadata } from "next";
import { NewsTopicsPage } from "@/modules/marketing/components/news-topics-page";

export const metadata: Metadata = {
  title: "Sujets d'actualité | Objectif TCF",
  description:
    "Sujets d'actualité canadiens pour vous entraîner à l'expression écrite et orale.",
};

export default function Page() {
  return <NewsTopicsPage />;
}
