import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import {
  GUIDE_DEFAULTS,
  type GuideSkill,
} from "@/lib/guides/defaults";
import { GUIDE_TOPIC_INCLUDE } from "@/lib/guides/structure";

export const ensureSkillGuide = cache(async (skill: GuideSkill) => {
  const defaults = GUIDE_DEFAULTS[skill];
  return prisma.skillGuide.upsert({
    where: { skill },
    create: {
      skill,
      title: defaults.title,
      intro: defaults.intro,
    },
    update: {},
    include: {
      topicSets: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: GUIDE_TOPIC_INCLUDE,
      },
    },
  });
});
