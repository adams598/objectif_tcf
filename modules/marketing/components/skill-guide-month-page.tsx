import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  MarketingPageHero,
  MarketingPageShell,
} from "@/components/marketing/marketing-page";
import type { GuideSkill } from "@/lib/guides/defaults";
import {
  GUIDE_SKILL_PATH,
  taskHeading,
  type SerializedTopicSet,
} from "@/lib/guides/structure";

function combinationAnchor(order: number) {
  return `combinaison-${order}`;
}

export function SkillGuideMonthPage({
  skill,
  skillTitle,
  topicSet,
}: {
  skill: GuideSkill;
  skillTitle: string;
  topicSet: SerializedTopicSet;
}) {
  const isOral = skill === "EXPRESSION_ORALE";

  return (
    <MarketingPageShell narrow>
      <p className="font-label-sm text-on-surface-variant mb-md">
        <Link
          href={GUIDE_SKILL_PATH[skill]}
          className="text-primary hover:underline"
        >
          ← {skillTitle}
        </Link>
      </p>

      <MarketingPageHero
        title={`${skillTitle} — ${topicSet.title}`}
        subtitle={
          isOral
            ? "Chaque combinaison reprend une session type : tâche 2 (entretien) puis tâche 3 (opinion)."
            : "Chaque combinaison reprend une session type : tâche 1, tâche 2, puis tâche 3 avec deux documents."
        }
      />

      {topicSet.combinations.length === 0 ? (
        <p className="text-on-surface-variant">
          Les combinaisons de ce mois seront ajoutées très bientôt.
        </p>
      ) : (
        <>
          <nav
            aria-label="Sommaire des combinaisons"
            className="bg-surface rounded-2xl border border-outline-variant p-lg mb-xl"
          >
            <p className="font-label-md font-bold mb-sm">Sommaire</p>
            <ol className="flex flex-col gap-xs">
              {topicSet.combinations.map((combination) => (
                <li key={combination.id}>
                  <a
                    href={`#${combinationAnchor(combination.order)}`}
                    className="font-label-sm text-primary hover:underline"
                  >
                    {combination.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-col gap-2xl">
            {topicSet.combinations.map((combination) => (
              <section
                key={combination.id}
                id={combinationAnchor(combination.order)}
                className="scroll-mt-32"
              >
                <h2 className="font-headline-md text-headline-md font-bold mb-lg">
                  {combination.title}
                </h2>
                <div className="flex flex-col gap-lg">
                  {combination.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-outline-variant bg-surface p-lg"
                    >
                      <div className="flex flex-wrap items-center gap-sm mb-md">
                        <Badge variant="primary">
                          {taskHeading(task.taskNumber)}
                        </Badge>
                        {task.heading ? (
                          <p className="font-label-md font-bold">{task.heading}</p>
                        ) : null}
                      </div>

                      {task.prompt ? (
                        <p className="whitespace-pre-line font-body-md text-on-surface leading-relaxed mb-md">
                          {task.prompt}
                        </p>
                      ) : null}

                      {task.items.length > 0 ? (
                        <div className="flex flex-col gap-md">
                          {task.items.map((item, index) => (
                            <article
                              key={`${task.id}-${index}`}
                              className="rounded-xl border border-outline-variant bg-surface-container-low p-md"
                            >
                              <p className="font-label-sm font-bold text-primary mb-xs">
                                {item.title ||
                                  (isOral
                                    ? `Sujet ${index + 1}`
                                    : `Document ${index + 1}`)}
                              </p>
                              <p className="whitespace-pre-line font-body-md text-on-surface leading-relaxed">
                                {item.content}
                              </p>
                            </article>
                          ))}
                        </div>
                      ) : null}

                      {!task.prompt && task.items.length === 0 ? (
                        <p className="font-body-sm text-on-surface-variant">
                          Consigne à venir.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </MarketingPageShell>
  );
}
