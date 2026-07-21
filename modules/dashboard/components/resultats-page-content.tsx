"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadGuestResult } from "@/lib/examen/guest-results";
import { GuestResultsView } from "@/modules/preparation/components/guest-results-view";
import { ResultatsView } from "@/modules/dashboard/components/resultats-view";
import { parseExamTab } from "@/lib/pricing/constants";

export function ResultatsPageContent() {
  const searchParams = useSearchParams();
  const skillParam = searchParams.get("skill") ?? undefined;
  const [showExamResult, setShowExamResult] = useState(false);
  const [examTab, setExamTab] = useState<ReturnType<typeof parseExamTab>>("tcf");

  useEffect(() => {
    const result = loadGuestResult();
    if (result && skillParam && result.skill === skillParam) {
      setExamTab(parseExamTab(result.examTab));
      setShowExamResult(true);
    }
  }, [skillParam]);

  if (showExamResult && skillParam) {
    return <GuestResultsView examTab={examTab} skillParam={skillParam} />;
  }

  return <ResultatsView />;
}
