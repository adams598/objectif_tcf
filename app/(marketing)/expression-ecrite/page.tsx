import type { Metadata } from "next";
import { SkillGuidePublicPage } from "@/modules/marketing/components/skill-guide-public-page";
import { ensureSkillGuide } from "@/lib/guides/ensure";
import { serializeTopicSet } from "@/lib/guides/structure";

export const metadata: Metadata = {
  title: "Expression écrite | Objectif TCF",
  description:
    "Méthode d’expression écrite TCF/TEF et sujets récents par mois, organisés en combinaisons comme à l’examen.",
};

export default async function ExpressionEcritePage() {
  const guide = await ensureSkillGuide("EXPRESSION_ECRITE");
  return (
    <SkillGuidePublicPage
      skill="EXPRESSION_ECRITE"
      title={guide.title}
      intro={guide.intro}
      subtitle="Méthode, conseils, puis les sujets récents mois par mois."
      topicSets={guide.topicSets
        .filter((set) => set.isPublished)
        .map((set) => {
          const serialized = serializeTopicSet(set);
          return {
            id: serialized.id,
            year: serialized.year,
            month: serialized.month,
            title: serialized.title,
            combinationCount: serialized.combinations.length,
          };
        })}
    />
  );
}
