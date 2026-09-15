import Link from "next/link";
import {
  MarketingPageHero,
  MarketingPageShell,
} from "@/components/marketing/marketing-page";
import type { GuideSkill } from "@/lib/guides/defaults";
import { guideMonthHref } from "@/lib/guides/structure";

type TopicSummary = {
  id: string;
  year: number;
  month: number;
  title: string;
  combinationCount: number;
};

export function SkillGuidePublicPage({
  skill,
  title,
  intro,
  subtitle,
  topicSets,
}: {
  skill: GuideSkill;
  title: string;
  intro: string;
  subtitle: string;
  topicSets: TopicSummary[];
}) {
  return (
    <MarketingPageShell>
      <MarketingPageHero title={title} subtitle={subtitle} />

      <div className="bg-surface rounded-2xl border border-outline-variant p-lg md:p-xl mb-xl whitespace-pre-line font-body-md text-body-md text-on-surface leading-relaxed">
        {intro}
      </div>

      <h2
        id="sujets-recents"
        className="font-headline-md text-headline-md font-bold mb-md"
      >
        Sujets récents
      </h2>
      <p className="font-body-md text-on-surface-variant mb-lg max-w-2xl">
        Choisissez un mois pour ouvrir les combinaisons tombées récemment, avec
        les tâches et les sujets à préparer.
      </p>

      {topicSets.length === 0 ? (
        <p className="text-on-surface-variant">
          Les sujets du mois seront ajoutés ici très bientôt.
        </p>
      ) : (
        <nav aria-label="Sujets récents par mois" className="flex flex-col gap-sm">
          {topicSets.map((set) => (
            <Link
              key={set.id}
              href={guideMonthHref(skill, set.year, set.month)}
              className="flex items-center justify-between gap-md rounded-2xl border border-outline-variant bg-surface px-lg py-md hover:border-primary/40 hover:shadow-violet-sm transition-all"
            >
              <span className="font-label-md font-bold text-on-surface">
                {set.title}
              </span>
              <span className="font-label-sm text-on-surface-variant shrink-0">
                {set.combinationCount === 0
                  ? "À compléter"
                  : `${set.combinationCount} combinaison${set.combinationCount > 1 ? "s" : ""}`}
              </span>
            </Link>
          ))}
        </nav>
      )}
    </MarketingPageShell>
  );
}
