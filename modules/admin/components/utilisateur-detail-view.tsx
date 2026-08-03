"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchJson } from "@/lib/api/fetch-json";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
import type { AdminUserAnalytics } from "@/lib/admin/user-analytics";
import { formatPaymentAmount } from "@/lib/payments/methods";
import type { PaymentCurrency } from "@prisma/client";
import { CompetencyRadarChart } from "@/modules/dashboard/components/competency-radar-chart";

const ROLE_LABELS: Record<string, string> = {
  USER: "Apprenant",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
  CORRECTOR: "Correcteur",
};

const SKILL_LABELS: Record<string, string> = {
  COMPREHENSION_ORALE: "Compréhension orale",
  COMPREHENSION_ECRITE: "Compréhension écrite",
  EXPRESSION_ECRITE: "Expression écrite",
  EXPRESSION_ORALE: "Expression orale",
  LEXIQUE: "Lexique",
  CO: "CO",
  CE: "CE",
  EE: "EE",
  EO: "EO",
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--inverse-surface, #1c1b1f)",
  border: "none",
  borderRadius: "8px",
  color: "var(--inverse-on-surface, #e6e1e5)",
  fontSize: "12px",
};

function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function formatMonth(key: string): string {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-md shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          "font-display-md text-[26px] font-bold mt-xs",
          accent ? "text-primary" : "text-on-surface"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="font-label-sm text-[11px] text-on-surface-variant mt-xs">
          {sub}
        </p>
      )}
    </div>
  );
}

export function UtilisateurDetailView({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ["admin-user-analytics", userId],
    queryFn: () =>
      fetchJson<AdminUserAnalytics>(
        `/api/admin/utilisateurs/${userId}/analytics`
      ),
  });

  if (query.isLoading) {
    return (
      <div className="p-2xl text-center text-on-surface-variant animate-pulse">
        Chargement de la progression…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-col gap-md items-start">
        <Link href="/admin/utilisateurs">
          <Button variant="secondary">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Retour
          </Button>
        </Link>
        <div className="w-full p-xl text-center text-error rounded-2xl border border-error/30 bg-error/5">
          Impossible de charger cet utilisateur
          {query.error instanceof Error ? ` : ${query.error.message}` : ""}
        </div>
      </div>
    );
  }

  const data = query.data;
  const { profile, overview } = data;
  const chartActivity = data.activityByMonth.map((row) => ({
    ...row,
    label: formatMonth(row.month),
  }));
  const skillBars = data.skillStats.map((s) => ({
    name: SKILL_LABELS[s.skill] ?? s.skill,
    average: s.average,
    count: s.count,
  }));

  return (
    <div className="flex flex-col gap-lg pb-xl">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div className="flex items-start gap-md min-w-0">
          <Link href="/admin/utilisateurs">
            <Button variant="secondary" className="shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
            </Button>
          </Link>
          <Avatar
            src={profile.avatarUrl}
            name={profile.name}
            size="xl"
          />
          <div className="min-w-0">
            <h1 className="font-display-md text-display-md text-on-surface font-bold truncate">
              {profile.name}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant truncate">
              {profile.email}
            </p>
            <div className="flex flex-wrap gap-xs mt-sm">
              <span className="inline-flex px-sm py-xs rounded-md bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-xs px-sm py-xs rounded-md font-label-sm text-label-sm font-semibold",
                  profile.isActive
                    ? "bg-[#10b981]/15 text-[#059669]"
                    : "bg-error/10 text-error"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    profile.isActive ? "bg-[#10b981]" : "bg-error"
                  )}
                />
                {profile.isActive ? "Actif" : "Inactif"}
              </span>
              {profile.country && (
                <span className="inline-flex px-sm py-xs rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  {profile.country}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="font-label-sm text-label-sm text-on-surface-variant space-y-xs text-right">
          <p>
            Inscrit le{" "}
            {new Date(profile.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {profile.targetExamDate && (
            <p>
              Objectif examen :{" "}
              {new Date(profile.targetExamDate).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <KpiCard
          label="NCLC global"
          value={overview.globalNclc > 0 ? overview.globalNclc : "—"}
          sub={`${overview.progressPercent}% vers NCLC ${overview.targetNclc}`}
          accent
        />
        <KpiCard
          label="Examens"
          value={overview.completedAttempts}
          sub={`${overview.totalAttempts} tentatives · ${overview.completionRate}% complétés`}
        />
        <KpiCard
          label="Temps d'étude"
          value={formatMinutes(overview.totalStudyMinutes)}
          sub={`Aujourd'hui ${formatMinutes(overview.studyMinutesToday)} · Semaine ${formatMinutes(overview.studyMinutesWeek)}`}
        />
        <KpiCard
          label="Série"
          value={`${overview.currentStreak} j`}
          sub={`Record ${overview.longestStreak} j · Score moy. ${overview.avgPercentage ?? "—"}%`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
        <section className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
          <h2 className="font-headline-lg text-[18px] font-semibold text-on-surface mb-md">
            Profil de compétences
          </h2>
          {data.competencies.some((c) => c.score > 0) ? (
            <div className="h-[280px]">
              <CompetencyRadarChart
                competencies={data.competencies}
                notEvaluatedLabel="Non évalué"
                currentLevelLabel="Niveau actuel"
                targetLabel="Objectif"
              />
            </div>
          ) : (
            <p className="font-body-md text-on-surface-variant py-xl text-center">
              Pas encore assez de résultats pour le radar NCLC.
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm mt-md">
            {data.competencies.map((c) => (
              <div
                key={c.subject}
                className="rounded-xl bg-surface-container-low border border-outline-variant px-sm py-sm text-center"
              >
                <p className="font-label-sm text-[11px] text-on-surface-variant">
                  {c.subject}
                </p>
                <p className="font-label-md text-label-md font-bold text-primary">
                  {c.score > 0 ? `NCLC ${c.score}` : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
          <h2 className="font-headline-lg text-[18px] font-semibold text-on-surface mb-md">
            Activité (12 mois)
          </h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartActivity}>
                <defs>
                  <linearGradient id="userAttemptsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6750a4" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6750a4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="attempts"
                  name="Examens"
                  stroke="#6750a4"
                  fill="url(#userAttemptsFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
        <section className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
          <h2 className="font-headline-lg text-[18px] font-semibold text-on-surface mb-md">
            Moyennes par compétence
          </h2>
          {skillBars.length === 0 ? (
            <p className="text-on-surface-variant text-center py-xl">
              Aucune statistique de compétence.
            </p>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillBars} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey="average"
                    name="Moyenne %"
                    fill="#6750a4"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
          <h2 className="font-headline-lg text-[18px] font-semibold text-on-surface mb-md">
            Lacunes prioritaires
          </h2>
          {data.skillGaps.length === 0 ? (
            <p className="text-on-surface-variant text-center py-xl">
              Pas de lacune calculée pour le moment.
            </p>
          ) : (
            <div className="space-y-sm">
              {data.skillGaps.map((gap) => (
                <div
                  key={gap.subject}
                  className="flex items-center justify-between gap-md rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm"
                >
                  <div>
                    <p className="font-label-md text-label-md font-semibold">
                      {gap.subject}
                    </p>
                    <p className="font-label-sm text-[11px] text-on-surface-variant">
                      NCLC {gap.score} / objectif {gap.target} ·{" "}
                      {gap.attemptsCount} examen
                      {gap.attemptsCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-sm py-xs rounded-md font-label-sm text-[11px] font-semibold",
                      gap.priority === "high" && "bg-error/10 text-error",
                      gap.priority === "medium" &&
                        "bg-tertiary-container/40 text-tertiary",
                      gap.priority === "low" &&
                        "bg-surface-container text-on-surface-variant"
                    )}
                  >
                    Écart {gap.gap}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
        <section className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low">
            <h2 className="font-headline-lg text-[18px] font-semibold text-on-surface">
              Abonnements
            </h2>
          </div>
          {data.subscriptions.length === 0 ? (
            <p className="p-lg text-on-surface-variant">Aucun abonnement</p>
          ) : (
            <ul className="divide-y divide-outline-variant/60">
              {data.subscriptions.map((sub) => (
                <li
                  key={sub.id}
                  className="px-lg py-md flex flex-wrap items-center justify-between gap-sm"
                >
                  <div>
                    <p className="font-label-md text-label-md font-semibold">
                      {EXAM_TYPE_LABELS[
                        sub.examType as keyof typeof EXAM_TYPE_LABELS
                      ] ?? sub.examType}{" "}
                      · {sub.plan}
                    </p>
                    <p className="font-label-sm text-[11px] text-on-surface-variant">
                      {new Date(sub.currentPeriodStart).toLocaleDateString(
                        "fr-FR"
                      )}{" "}
                      →{" "}
                      {new Date(sub.currentPeriodEnd).toLocaleDateString(
                        "fr-FR"
                      )}
                      {sub.cancelAtPeriodEnd ? " · fin de période" : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-sm py-xs rounded-md font-label-sm text-[11px] font-semibold",
                      sub.status === "ACTIVE"
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-container text-on-surface-variant"
                    )}
                  >
                    {sub.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low">
            <h2 className="font-headline-lg text-[18px] font-semibold text-on-surface">
              Paiements
            </h2>
          </div>
          {data.payments.length === 0 ? (
            <p className="p-lg text-on-surface-variant">Aucun paiement</p>
          ) : (
            <ul className="divide-y divide-outline-variant/60">
              {data.payments.map((p) => (
                <li
                  key={p.id}
                  className="px-lg py-md flex flex-wrap items-center justify-between gap-sm"
                >
                  <div>
                    <p className="font-label-md text-label-md font-semibold">
                      {formatPaymentAmount(
                        p.amount,
                        p.currency as PaymentCurrency
                      )}
                    </p>
                    <p className="font-label-sm text-[11px] text-on-surface-variant">
                      {p.description || p.method || p.provider || "—"} ·{" "}
                      {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data.revenueByCurrency.length > 0 && (
            <div className="px-lg py-md border-t border-outline-variant bg-surface-container-low/50 flex flex-wrap gap-md">
              {data.revenueByCurrency.map((r) => (
                <p key={r.currency} className="font-label-sm text-label-sm">
                  Total réussi :{" "}
                  <strong>
                    {formatPaymentAmount(
                      r.amount,
                      r.currency as PaymentCurrency
                    )}
                  </strong>
                </p>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <h2 className="font-headline-lg text-[18px] font-semibold text-on-surface">
            Historique des résultats
          </h2>
        </div>
        {data.attempts.length === 0 ? (
          <p className="p-lg text-on-surface-variant">Aucun examen complété</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-outline-variant">
                  {[
                    "Série",
                    "Compétence",
                    "Score",
                    "NCLC",
                    "Durée",
                    "Date",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-md py-sm font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-outline-variant/60 hover:bg-surface-container-low"
                  >
                    <td className="px-md py-md font-label-md text-label-md font-semibold">
                      {a.series.title}
                    </td>
                    <td className="px-md py-md font-label-sm text-on-surface-variant">
                      {SKILL_LABELS[a.series.skill] ?? a.series.skill}
                    </td>
                    <td className="px-md py-md">
                      {a.percentage != null ? (
                        <span className="font-semibold text-primary">
                          {a.percentage}%
                        </span>
                      ) : a.score != null ? (
                        `${a.score}${a.maxScore != null ? `/${a.maxScore}` : ""}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-md py-md font-label-sm">
                      {a.nclcLevel?.replace("NCLC_", "NCLC ") ??
                        a.result?.nclcLevel?.replace("NCLC_", "NCLC ") ??
                        "—"}
                    </td>
                    <td className="px-md py-md font-label-sm text-on-surface-variant">
                      {a.durationSec != null
                        ? formatMinutes(Math.floor(a.durationSec / 60) || 1)
                        : "—"}
                    </td>
                    <td className="px-md py-md font-label-sm text-on-surface-variant whitespace-nowrap">
                      {a.completedAt
                        ? new Date(a.completedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
