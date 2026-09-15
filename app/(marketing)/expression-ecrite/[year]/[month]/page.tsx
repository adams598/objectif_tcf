import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SkillGuideMonthPage } from "@/modules/marketing/components/skill-guide-month-page";
import { ensureSkillGuide } from "@/lib/guides/ensure";
import { serializeTopicSet } from "@/lib/guides/structure";

type PageProps = {
  params: Promise<{ year: string; month: string }>;
};

function parseYearMonth(yearRaw: string, monthRaw: string) {
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, month } = await params;
  const parsed = parseYearMonth(year, month);
  const guide = await ensureSkillGuide("EXPRESSION_ECRITE");
  const set = parsed
    ? guide.topicSets.find(
        (topic) =>
          topic.isPublished &&
          topic.year === parsed.year &&
          topic.month === parsed.month
      )
    : null;
  return {
    title: set
      ? `${guide.title} — ${set.title} | Objectif TCF`
      : "Expression écrite | Objectif TCF",
  };
}

export default async function ExpressionEcriteMonthPage({ params }: PageProps) {
  const { year, month } = await params;
  const parsed = parseYearMonth(year, month);
  if (!parsed) notFound();

  const guide = await ensureSkillGuide("EXPRESSION_ECRITE");
  const set = guide.topicSets.find(
    (topic) =>
      topic.isPublished &&
      topic.year === parsed.year &&
      topic.month === parsed.month
  );
  if (!set) notFound();

  return (
    <SkillGuideMonthPage
      skill="EXPRESSION_ECRITE"
      skillTitle={guide.title}
      topicSet={serializeTopicSet(set)}
    />
  );
}
