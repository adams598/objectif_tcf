"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
import { EXAM_TAB_LABELS, type ExamTab } from "@/lib/pricing/constants";

interface AdminOffer {
  id: string;
  name: string;
  examType: string;
  baseDays: number;
  bonusDays: number;
  isActive: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "CORRECTOR";
  isActive: boolean;
  emailVerified: boolean;
  country: string | null;
  createdAt: string;
  currentStreak: number;
  totalStudyTime: number;
  password: string | null;
  subscriptions: Array<{
    id: string;
    plan: string;
    examType: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    offerId?: string | null;
    renewalDays?: number | null;
  }>;
  _count: { attempts: number; payments: number };
}

interface UsersResponse {
  users: AdminUser[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

type Role = AdminUser["role"];

type RowDraft = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  offerId: string;
  isActive: boolean;
  role: Role;
  revokeExamTypes: string[];
  showPassword: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  USER: "Apprenant",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
  CORRECTOR: "Correcteur",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  USER: "bg-surface-container text-on-surface-variant",
  ADMIN: "bg-secondary-container text-on-secondary-container",
  SUPER_ADMIN: "bg-primary/15 text-primary",
  CORRECTOR: "bg-tertiary-container/30 text-tertiary",
};

const EXAM_TABS: ExamTab[] = ["tcf", "tef", "ielts"];
const TAB_TO_EXAM: Record<ExamTab, string> = {
  tcf: "TCF_CANADA",
  tef: "TEF_CANADA",
  ielts: "IELTS",
};

const cellInputClass =
  "w-full min-w-[140px] rounded-lg border border-outline-variant bg-surface px-sm py-xs font-label-sm text-label-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

const selectClassName =
  "w-full min-w-[120px] rounded-lg border border-outline-variant bg-surface px-sm py-xs font-label-sm text-label-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

function draftFromUser(user: AdminUser): RowDraft {
  return {
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    password: "",
    offerId: "",
    isActive: user.isActive,
    role: user.role,
    revokeExamTypes: [],
    showPassword: false,
  };
}

function isRowDirty(user: AdminUser, draft: RowDraft): boolean {
  return (
    draft.email.trim().toLowerCase() !== user.email.toLowerCase() ||
    draft.firstName !== (user.firstName ?? "") ||
    draft.lastName !== (user.lastName ?? "") ||
    draft.isActive !== user.isActive ||
    draft.role !== user.role ||
    draft.password.trim().length > 0 ||
    draft.offerId.length > 0 ||
    draft.revokeExamTypes.length > 0
  );
}

function buildPatchBody(user: AdminUser, draft: RowDraft) {
  const body: Record<string, unknown> = {};

  if (draft.email.trim().toLowerCase() !== user.email.toLowerCase()) {
    body.email = draft.email.trim();
  }
  if (draft.firstName !== (user.firstName ?? "")) {
    body.firstName = draft.firstName.trim() || null;
  }
  if (draft.lastName !== (user.lastName ?? "")) {
    body.lastName = draft.lastName.trim() || null;
  }
  if (draft.isActive !== user.isActive) {
    body.isActive = draft.isActive;
  }
  if (draft.role !== user.role) {
    body.role = draft.role;
  }
  if (draft.password.trim()) {
    body.password = draft.password.trim();
  }
  if (draft.offerId) {
    body.offerId = draft.offerId;
  }
  if (draft.revokeExamTypes[0]) {
    body.revokeExamType = draft.revokeExamTypes[0];
  }

  return body;
}

export function UtilisateursAdminView() {
  const queryClient = useQueryClient();
  const { role: currentRole } = useCurrentUser();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("USER");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});

  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });
  const [createdAccount, setCreatedAccount] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const query = useQuery({
    queryKey: ["admin-users", search, page, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      return fetchJson<UsersResponse>(`/api/admin/utilisateurs?${params}`);
    },
  });

  const offersQuery = useQuery({
    queryKey: ["admin-offers-all-for-learners"],
    queryFn: async () => {
      const all: AdminOffer[] = [];
      for (const tab of EXAM_TABS) {
        const rows = await fetchJson<AdminOffer[]>(
          `/api/admin/offres?examType=${TAB_TO_EXAM[tab]}`
        );
        all.push(...rows.filter((o) => o.isActive));
      }
      return all;
    },
  });

  const offers = offersQuery.data ?? [];
  const users = query.data?.users ?? [];
  const meta = query.data?.meta ?? {
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 20,
  };

  const getDraft = (user: AdminUser): RowDraft =>
    drafts[user.id] ?? draftFromUser(user);

  const updateDraft = (userId: string, user: AdminUser, patch: Partial<RowDraft>) => {
    setDrafts((prev) => {
      const base = prev[userId] ?? draftFromUser(user);
      return { ...prev, [userId]: { ...base, ...patch } };
    });
  };

  const dirtyUsers = useMemo(
    () => users.filter((u) => drafts[u.id] && isRowDirty(u, drafts[u.id]!)),
    [users, drafts]
  );

  const discardDrafts = () => setDrafts({});

  const createLearner = useMutation({
    mutationFn: () =>
      fetchJson<{ id: string; password: string }>(
        "/api/admin/utilisateurs",
        {
          method: "POST",
          body: JSON.stringify({
            email: createForm.email,
            firstName: createForm.firstName || undefined,
            lastName: createForm.lastName || undefined,
          }),
        }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreatedAccount({
        email: createForm.email.trim().toLowerCase(),
        password: data.password,
      });
      setCreateForm({ email: "", firstName: "", lastName: "" });
      toast.success("Compte créé");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Création impossible"),
  });

  const saveAll = useMutation({
    mutationFn: async () => {
      const targets = users.filter(
        (u) => drafts[u.id] && isRowDirty(u, drafts[u.id]!)
      );
      if (targets.length === 0) return { ok: 0, fail: 0, grantedOffers: 0 };

      for (const user of targets) {
        const draft = drafts[user.id]!;
        if (draft.password.trim() && draft.password.trim().length < 8) {
          throw new Error(
            `Mot de passe trop court pour ${user.email} (min. 8 caractères)`
          );
        }
        if (
          draft.role === "SUPER_ADMIN" &&
          currentRole !== "SUPER_ADMIN" &&
          draft.role !== user.role
        ) {
          throw new Error(
            `Seul un super admin peut attribuer ce rôle (${user.email})`
          );
        }
      }

      let ok = 0;
      let fail = 0;
      let grantedOffers = 0;
      const errors: string[] = [];

      for (const user of targets) {
        const draft = drafts[user.id]!;
        try {
          const body = buildPatchBody(user, draft);
          if (Object.keys(body).length > 0) {
            await fetchJson(`/api/admin/utilisateurs/${user.id}`, {
              method: "PATCH",
              body: JSON.stringify(body),
            });
          }
          for (const examType of draft.revokeExamTypes.slice(1)) {
            await fetchJson(`/api/admin/utilisateurs/${user.id}`, {
              method: "PATCH",
              body: JSON.stringify({ revokeExamType: examType }),
            });
          }
          if (draft.offerId) grantedOffers += 1;
          ok += 1;
        } catch (error) {
          fail += 1;
          errors.push(
            error instanceof Error ? error.message : `Échec pour ${user.email}`
          );
        }
      }

      if (fail > 0 && ok === 0) {
        throw new Error(errors[0] ?? "Enregistrement impossible");
      }
      return { ok, fail, errors, grantedOffers };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDrafts({});
      setCreatedAccount(null);
      if (result.fail > 0) {
        toast.warning(
          `${result.ok} enregistré(s), ${result.fail} échec(s)${
            result.errors?.[0] ? ` — ${result.errors[0]}` : ""
          }`
        );
      } else if (result.grantedOffers > 0) {
        toast.success(
          result.grantedOffers > 1
            ? `${result.ok} mis à jour — ${result.grantedOffers} emails d'accès envoyés`
            : "Accès accordé — email avec identifiants envoyé"
        );
      } else {
        toast.success(
          result.ok > 1
            ? `${result.ok} utilisateurs mis à jour`
            : "Modifications enregistrées"
        );
      }
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible"
      ),
  });

  const deleteLearner = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/utilisateurs/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Utilisateur supprimé");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Suppression impossible"),
  });

  const from = meta.total === 0 ? 0 : (page - 1) * (meta.limit || 20) + 1;
  const to = Math.min(page * (meta.limit || 20), meta.total);
  const activeSubsCount = users.filter((u) => u.subscriptions.length > 0).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  return (
    <div className={cn("flex flex-col gap-lg", dirtyUsers.length > 0 && "pb-24")}>
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-md">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-bold">
            Gestion des Utilisateurs
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Modifiez directement dans le tableau, puis enregistrez toutes les
            modifications d&apos;un coup.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              className="w-full bg-surface border border-outline-variant rounded-xl py-sm pl-10 pr-md font-body-md text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-[0_4px_20px_rgba(79,55,138,0.04)]"
              placeholder="Rechercher un utilisateur…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(showFilters && "border-primary text-primary")}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filtrer
          </Button>
          <Button
            onClick={() => {
              setCreatedAccount(null);
              setCreateForm({ email: "", firstName: "", lastName: "" });
              setShowCreate(true);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Ajouter
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {[
          {
            label: "Total",
            value: meta.total,
            hint: "comptes filtrés",
          },
          {
            label: "Avec abonnement",
            value: activeSubsCount,
            hint: "sur cette page",
          },
          {
            label: "Inactifs",
            value: inactiveCount,
            hint: "sur cette page",
          },
          {
            label: "Modifs en cours",
            value: dirtyUsers.length,
            hint: dirtyUsers.length ? "à enregistrer" : "aucune",
            accent: dirtyUsers.length > 0,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface border border-outline-variant rounded-2xl p-md shadow-[0_4px_20px_rgba(79,55,138,0.05)]"
          >
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {kpi.label}
            </p>
            <p
              className={cn(
                "font-display-md text-[28px] font-bold mt-xs",
                kpi.accent ? "text-primary" : "text-on-surface"
              )}
            >
              {kpi.value}
            </p>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-xs">
              {kpi.hint}
            </p>
          </div>
        ))}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-sm p-md rounded-2xl border border-outline-variant bg-surface shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
          {(
            [
              { value: "USER", label: "Apprenants" },
              { value: "ALL", label: "Tous" },
              { value: "ADMIN", label: "Admins" },
              { value: "CORRECTOR", label: "Correcteurs" },
              ...(currentRole === "SUPER_ADMIN"
                ? [{ value: "SUPER_ADMIN", label: "Super admins" }]
                : []),
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setRoleFilter(opt.value);
                setPage(1);
              }}
              className={cn(
                "px-md py-xs rounded-full font-label-sm text-label-sm border transition-all",
                roleFilter === opt.value
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface border-outline-variant text-on-surface-variant hover:border-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) {
            setCreatedAccount(null);
            setCreateForm({ email: "", firstName: "", lastName: "" });
          }
        }}
      >
        <DialogContent className="max-w-md">
          {createdAccount ? (
            <>
              <DialogHeader>
                <DialogTitle>Compte créé</DialogTitle>
                <DialogDescription>
                  Le mot de passe est visible ci-dessous. Accordez ensuite une
                  offre sur la ligne du tableau pour envoyer l&apos;email
                  d&apos;accès.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md space-y-sm">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Email
                </p>
                <p className="font-label-md text-label-md font-semibold break-all">
                  {createdAccount.email}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant pt-xs">
                  Mot de passe
                </p>
                <p className="font-mono text-lg text-primary font-semibold tracking-wide">
                  {createdAccount.password}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(createdAccount.password);
                    toast.success("Mot de passe copié");
                  }}
                >
                  Copier le mdp
                </Button>
                <Button
                  onClick={() => {
                    setShowCreate(false);
                    setCreatedAccount(null);
                  }}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Créer un compte apprenant</DialogTitle>
                <DialogDescription>
                  Le mot de passe est généré automatiquement. Vous pourrez
                  ensuite accorder une offre directement sur sa ligne.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-md">
                <Input
                  label="Email *"
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, email: e.target.value }))
                  }
                  autoFocus
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <Input
                    label="Prénom"
                    value={createForm.firstName}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                  />
                  <Input
                    label="Nom"
                    value={createForm.lastName}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => createLearner.mutate()}
                  disabled={!createForm.email.trim() || createLearner.isPending}
                  loading={createLearner.isPending}
                >
                  Créer le compte
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-sm">
          <h2 className="font-headline-lg text-[18px] md:text-[20px] font-semibold text-on-surface">
            Liste des utilisateurs
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Édition en ligne · {meta.total} compte{meta.total > 1 ? "s" : ""}
          </span>
        </div>

        {query.isLoading ? (
          <div className="p-2xl text-center text-on-surface-variant animate-pulse">
            Chargement…
          </div>
        ) : users.length === 0 ? (
          <div className="p-2xl text-center text-on-surface-variant">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface">
                  {[
                    "Utilisateur",
                    "Email",
                    "Rôle",
                    "Actif",
                    "Abonnements / offre",
                    "Mot de passe",
                    "Activité",
                    "",
                  ].map((h) => (
                    <th
                      key={h || "actions"}
                      className="px-md py-sm font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const draft = getDraft(user);
                  const dirty = isRowDirty(user, draft);
                  const visibleSubs = user.subscriptions.filter(
                    (s) => !draft.revokeExamTypes.includes(s.examType)
                  );

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-b border-outline-variant/60 align-top transition-colors",
                        dirty
                          ? "bg-primary/5"
                          : "hover:bg-surface-container-low",
                        !draft.isActive && !dirty && "bg-error-container/10"
                      )}
                    >
                      <td className="px-md py-md">
                        <div className="flex items-start gap-sm min-w-[200px]">
                          <Link
                            href={`/admin/utilisateurs/${user.id}`}
                            className="shrink-0 rounded-full ring-offset-2 hover:ring-2 hover:ring-primary/40 transition-all"
                            title="Voir la progression"
                          >
                            <Avatar
                              src={user.avatarUrl ?? undefined}
                              name={
                                [draft.firstName, draft.lastName]
                                  .filter(Boolean)
                                  .join(" ") || user.name
                              }
                              size="default"
                            />
                          </Link>
                          <div className="flex flex-col gap-xs flex-1">
                            <input
                              className={cellInputClass}
                              placeholder="Prénom"
                              value={draft.firstName}
                              onChange={(e) =>
                                updateDraft(user.id, user, {
                                  firstName: e.target.value,
                                })
                              }
                            />
                            <input
                              className={cellInputClass}
                              placeholder="Nom"
                              value={draft.lastName}
                              onChange={(e) =>
                                updateDraft(user.id, user, {
                                  lastName: e.target.value,
                                })
                              }
                            />
                            <Link
                              href={`/admin/utilisateurs/${user.id}`}
                              className="font-label-sm text-[11px] text-primary font-semibold hover:underline inline-flex items-center gap-xs w-fit"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                analytics
                              </span>
                              Progression & stats
                            </Link>
                            {dirty && (
                              <span className="font-label-sm text-[10px] text-primary font-semibold">
                                Modifié
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-md py-md">
                        <input
                          type="email"
                          className={cn(cellInputClass, "min-w-[180px]")}
                          value={draft.email}
                          onChange={(e) =>
                            updateDraft(user.id, user, { email: e.target.value })
                          }
                        />
                      </td>

                      <td className="px-md py-md">
                        <select
                          className={selectClassName}
                          value={draft.role}
                          onChange={(e) => {
                            const nextRole = e.target.value as Role;
                            if (
                              nextRole === "SUPER_ADMIN" &&
                              currentRole !== "SUPER_ADMIN"
                            ) {
                              toast.error(
                                "Seul un super admin peut attribuer ce rôle"
                              );
                              return;
                            }
                            updateDraft(user.id, user, { role: nextRole });
                          }}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option
                              key={value}
                              value={value}
                              disabled={
                                value === "SUPER_ADMIN" &&
                                currentRole !== "SUPER_ADMIN"
                              }
                            >
                              {label}
                            </option>
                          ))}
                        </select>
                        <span
                          className={cn(
                            "mt-xs inline-flex px-sm py-xs rounded-md font-label-sm text-[10px] font-semibold",
                            ROLE_BADGE_CLASS[draft.role]
                          )}
                        >
                          {ROLE_LABELS[draft.role]}
                        </span>
                      </td>

                      <td className="px-md py-md">
                        <div className="flex flex-col items-start gap-xs">
                          <Switch
                            checked={draft.isActive}
                            onCheckedChange={(checked) =>
                              updateDraft(user.id, user, { isActive: checked })
                            }
                          />
                          <span
                            className={cn(
                              "font-label-sm text-label-sm",
                              draft.isActive
                                ? "text-on-surface-variant"
                                : "text-error"
                            )}
                          >
                            {draft.isActive ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </td>

                      <td className="px-md py-md min-w-[220px]">
                        <div className="flex flex-col gap-sm">
                          {visibleSubs.length === 0 ? (
                            <span className="font-label-sm text-on-surface-variant">
                              —
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-xs">
                              {visibleSubs.map((sub) => (
                                <span
                                  key={sub.id}
                                  className="inline-flex items-center gap-xs px-sm py-xs rounded-md bg-primary/10 text-primary font-label-sm text-[11px] font-semibold"
                                >
                                  {EXAM_TYPE_LABELS[
                                    sub.examType as keyof typeof EXAM_TYPE_LABELS
                                  ] ?? sub.examType}
                                  <button
                                    type="button"
                                    title="Retirer à l'enregistrement"
                                    className="hover:text-error"
                                    onClick={() =>
                                      updateDraft(user.id, user, {
                                        revokeExamTypes: [
                                          ...draft.revokeExamTypes,
                                          sub.examType,
                                        ],
                                      })
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[14px]">
                                      close
                                    </span>
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          {draft.revokeExamTypes.length > 0 && (
                            <button
                              type="button"
                              className="font-label-sm text-[11px] text-on-surface-variant hover:text-primary text-left"
                              onClick={() =>
                                updateDraft(user.id, user, {
                                  revokeExamTypes: [],
                                })
                              }
                            >
                              Annuler retraits ({draft.revokeExamTypes.length})
                            </button>
                          )}
                          <select
                            className={selectClassName}
                            value={draft.offerId}
                            onChange={(e) =>
                              updateDraft(user.id, user, {
                                offerId: e.target.value,
                              })
                            }
                          >
                            <option value="">+ Accorder une offre (envoie l’email)…</option>
                            {offers.map((o) => (
                              <option key={o.id} value={o.id}>
                                {EXAM_TAB_LABELS[
                                  (Object.entries(TAB_TO_EXAM).find(
                                    ([, v]) => v === o.examType
                                  )?.[0] as ExamTab) ?? "tcf"
                                ]}{" "}
                                — {o.name} ({o.baseDays + o.bonusDays} j)
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="px-md py-md min-w-[160px]">
                        <div className="flex flex-col gap-xs">
                          <div className="flex items-center gap-xs">
                            <p className="font-mono text-[11px] text-on-surface-variant truncate max-w-[120px]">
                              {user.password
                                ? draft.showPassword
                                  ? user.password
                                  : "••••••••"
                                : "—"}
                            </p>
                            {user.password && (
                              <>
                                <button
                                  type="button"
                                  className="text-primary"
                                  onClick={() =>
                                    updateDraft(user.id, user, {
                                      showPassword: !draft.showPassword,
                                    })
                                  }
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {draft.showPassword
                                      ? "visibility_off"
                                      : "visibility"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className="text-primary"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(
                                      user.password!
                                    );
                                    toast.success("Mot de passe copié");
                                  }}
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    content_copy
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                          <input
                            className={cellInputClass}
                            placeholder="Nouveau mdp…"
                            value={draft.password}
                            onChange={(e) =>
                              updateDraft(user.id, user, {
                                password: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>

                      <td className="px-md py-md whitespace-nowrap">
                        <div className="flex items-center gap-xs text-on-surface-variant font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-[18px]">
                            history
                          </span>
                          {user._count.attempts} examen
                          {user._count.attempts > 1 ? "s" : ""}
                        </div>
                      </td>

                      <td className="px-md py-md">
                        <div className="flex items-center gap-xs">
                          <Link
                            href={`/admin/utilisateurs/${user.id}`}
                            className="p-sm rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Progression & statistiques"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              analytics
                            </span>
                          </Link>
                          {(user.role === "USER" ||
                            currentRole === "SUPER_ADMIN") && (
                            <button
                              type="button"
                              className="p-sm rounded-lg text-error hover:bg-error-container/30 transition-colors"
                              title="Supprimer"
                              onClick={() =>
                                confirm({
                                  title: "Supprimer cet utilisateur ?",
                                  description:
                                    "Le compte sera désactivé (soft-delete).",
                                  confirmLabel: "Supprimer",
                                  destructive: true,
                                  onConfirm: () =>
                                    deleteLearner.mutateAsync(user.id),
                                })
                              }
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-lg py-md border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-sm bg-surface">
          <span className="font-label-md text-label-md text-on-surface-variant">
            Affichage de {from}–{to} sur {meta.total} utilisateurs
          </span>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>
            <span className="min-w-10 h-10 inline-flex items-center justify-center rounded-lg bg-primary text-on-primary font-label-md text-label-md">
              {page}
            </span>
            <span className="font-label-sm text-on-surface-variant px-xs">
              / {Math.max(meta.totalPages, 1)}
            </span>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>

      {dirtyUsers.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
          <div className="max-w-7xl mx-auto px-md pb-md pointer-events-auto">
            <div className="flex flex-wrap items-center justify-between gap-md rounded-2xl border border-primary/20 bg-surface px-lg py-md shadow-[0_-8px_40px_rgba(79,55,138,0.18)]">
              <div>
                <p className="font-label-md text-label-md font-semibold text-on-surface">
                  {dirtyUsers.length} modification
                  {dirtyUsers.length > 1 ? "s" : ""} en attente
                </p>
                <p className="font-label-sm text-[11px] text-on-surface-variant">
                  Les lignes surlignées seront enregistrées ensemble.
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <Button
                  variant="secondary"
                  onClick={discardDrafts}
                  disabled={saveAll.isPending}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => saveAll.mutate()}
                  loading={saveAll.isPending}
                  disabled={saveAll.isPending}
                >
                  Enregistrer tout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
