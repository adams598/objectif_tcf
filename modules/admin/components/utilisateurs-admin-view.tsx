"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
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

const selectClassName =
  "w-full rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm font-label-md text-label-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

type EditForm = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  offerId: string;
  isActive: boolean;
  role: AdminUser["role"];
};

function formFromUser(user: AdminUser): EditForm {
  return {
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    password: "",
    offerId: "",
    isActive: user.isActive,
    role: user.role,
  };
}

export function UtilisateursAdminView() {
  const queryClient = useQueryClient();
  const { role: currentRole } = useCurrentUser();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("USER");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    offerId: "",
    sendEmail: true,
  });

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
  const expandedUser = users.find((u) => u.id === expandedId) ?? null;

  const openRow = (user: AdminUser) => {
    if (expandedId === user.id) {
      setExpandedId(null);
      setEditForm(null);
      setShowPassword(false);
      return;
    }
    setExpandedId(user.id);
    setEditForm(formFromUser(user));
    setShowPassword(false);
    setShowCreate(false);
  };

  const createLearner = useMutation({
    mutationFn: () =>
      fetchJson<{ id: string; password: string; emailSent: boolean }>(
        "/api/admin/utilisateurs",
        {
          method: "POST",
          body: JSON.stringify({
            email: createForm.email,
            firstName: createForm.firstName || undefined,
            lastName: createForm.lastName || undefined,
            password: createForm.password || undefined,
            offerId: createForm.offerId || null,
            sendEmail: createForm.sendEmail,
          }),
        }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(
        data.emailSent
          ? `Apprenant créé — identifiants envoyés (mdp: ${data.password})`
          : `Apprenant créé — mot de passe: ${data.password}`
      );
      setShowCreate(false);
      setCreateForm({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        offerId: "",
        sendEmail: true,
      });
      setExpandedId(data.id);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Création impossible"),
  });

  const updateLearner = useMutation({
    mutationFn: () => {
      if (!expandedId || !editForm) throw new Error("Aucune ligne sélectionnée");
      return fetchJson(`/api/admin/utilisateurs/${expandedId}`, {
        method: "PATCH",
        body: JSON.stringify({
          email: editForm.email,
          firstName: editForm.firstName || null,
          lastName: editForm.lastName || null,
          isActive: editForm.isActive,
          role: editForm.role,
          ...(editForm.password.trim()
            ? { password: editForm.password.trim() }
            : {}),
          ...(editForm.offerId ? { offerId: editForm.offerId } : {}),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Utilisateur mis à jour");
      setEditForm((f) => (f ? { ...f, password: "", offerId: "" } : f));
      setShowPassword(false);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Mise à jour impossible"),
  });

  const revokeAccess = useMutation({
    mutationFn: (examType: string) =>
      fetchJson(`/api/admin/utilisateurs/${expandedId}`, {
        method: "PATCH",
        body: JSON.stringify({ revokeExamType: examType }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Accès retiré");
    },
    onError: () => toast.error("Impossible de retirer l'accès"),
  });

  const deleteLearner = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/utilisateurs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setExpandedId(null);
      setEditForm(null);
      toast.success("Utilisateur supprimé");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Suppression impossible"),
  });

  const offerLabel = useMemo(() => {
    const map = new Map(offers.map((o) => [o.id, o]));
    return (offerId?: string | null) => {
      if (!offerId) return null;
      const o = map.get(offerId);
      return o ? `${o.name} (${o.baseDays + o.bonusDays} j)` : null;
    };
  }, [offers]);

  const from = meta.total === 0 ? 0 : (page - 1) * (meta.limit || 20) + 1;
  const to = Math.min(page * (meta.limit || 20), meta.total);

  // Resync form when list refreshes for the expanded user
  React.useEffect(() => {
    if (!expandedUser) return;
    setEditForm((prev) => {
      if (!prev) return formFromUser(expandedUser);
      return {
        ...formFromUser(expandedUser),
        password: prev.password,
        offerId: prev.offerId,
      };
    });
  }, [expandedUser]);

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-md">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-bold">
            Gestion des Utilisateurs
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Gérez vos membres, attribuez des rôles et contrôlez les accès aux
            abonnements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              className="w-full bg-surface border border-outline-variant rounded-xl py-sm pl-10 pr-md font-body-md text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
              setShowCreate((v) => !v);
              setExpandedId(null);
              setEditForm(null);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Ajouter
          </Button>
        </div>
      </header>

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

      {showCreate && (
        <section className="bg-surface border border-outline-variant rounded-2xl p-lg space-y-md shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg text-[20px] font-semibold text-on-surface">
              Ajouter un apprenant
            </h2>
            <button
              type="button"
              className="text-on-surface-variant hover:text-on-surface"
              onClick={() => setShowCreate(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
            <Input
              label="Email *"
              type="email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            <Input
              label="Mot de passe (optionnel)"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, password: e.target.value }))
              }
            />
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
            <div className="md:col-span-2 xl:col-span-3">
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-xs block">
                Offre d&apos;accès (optionnel)
              </label>
              <select
                className={selectClassName}
                value={createForm.offerId}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, offerId: e.target.value }))
                }
              >
                <option value="">Sans offre pour le moment</option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {EXAM_TYPE_LABELS[o.examType as keyof typeof EXAM_TYPE_LABELS] ??
                      o.examType}{" "}
                    — {o.name} ({o.baseDays + o.bonusDays} j)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-xs">
              <label className="inline-flex items-center gap-sm font-label-sm text-label-sm">
                <Switch
                  checked={createForm.sendEmail}
                  onCheckedChange={(v) =>
                    setCreateForm((f) => ({ ...f, sendEmail: v }))
                  }
                />
                Envoyer l&apos;email
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-sm">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => createLearner.mutate()}
              disabled={!createForm.email.trim() || createLearner.isPending}
              loading={createLearner.isPending}
            >
              Créer l&apos;apprenant
            </Button>
          </div>
        </section>
      )}

      <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <h2 className="font-headline-lg text-[18px] md:text-[20px] font-semibold text-on-surface">
            Liste des utilisateurs
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Cliquez une ligne pour modifier · {meta.total} compte
            {meta.total > 1 ? "s" : ""}
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface">
                  {[
                    "Utilisateur",
                    "Rôle",
                    "Statut",
                    "Abonnements",
                    "Activité",
                    "",
                  ].map((h) => (
                    <th
                      key={h || "actions"}
                      className="px-md py-sm font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isExpanded = expandedId === user.id;
                  return (
                    <React.Fragment key={user.id}>
                      <tr
                        onClick={() => openRow(user)}
                        className={cn(
                          "cursor-pointer transition-colors border-b border-outline-variant/60 group",
                          isExpanded
                            ? "bg-primary/5 border-b-0"
                            : "hover:bg-surface-container-low",
                          !user.isActive && !isExpanded && "bg-error-container/10"
                        )}
                      >
                        <td className="px-md py-md">
                          <div className="flex items-center gap-md">
                            <Avatar
                              src={user.avatarUrl ?? undefined}
                              name={user.name}
                              size="default"
                            />
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "font-label-md text-label-md font-semibold text-on-surface truncate",
                                  !user.isActive && "line-through opacity-70"
                                )}
                              >
                                {user.name}
                              </p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-md py-md">
                          <span
                            className={cn(
                              "inline-flex px-sm py-xs rounded-md font-label-sm text-label-sm font-semibold",
                              ROLE_BADGE_CLASS[user.role]
                            )}
                          >
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-md py-md">
                          <div className="flex items-center gap-xs">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                user.isActive ? "bg-[#10b981]" : "bg-error"
                              )}
                            />
                            <span
                              className={cn(
                                "font-label-md text-label-md",
                                !user.isActive && "text-error"
                              )}
                            >
                              {user.isActive ? "Actif" : "Inactif"}
                            </span>
                          </div>
                        </td>
                        <td className="px-md py-md">
                          {user.subscriptions.length === 0 ? (
                            <span className="text-on-surface-variant">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-xs">
                              {user.subscriptions.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex px-sm py-xs rounded-md bg-primary/10 text-primary font-label-sm text-label-sm font-semibold"
                                >
                                  {EXAM_TYPE_LABELS[
                                    s.examType as keyof typeof EXAM_TYPE_LABELS
                                  ] ?? s.examType}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-md py-md">
                          <div className="flex items-center gap-xs text-on-surface-variant font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[18px]">
                              history
                            </span>
                            {user._count.attempts} examen
                            {user._count.attempts > 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-md py-md text-right">
                          <span
                            className={cn(
                              "material-symbols-outlined text-on-surface-variant transition-transform",
                              isExpanded && "rotate-180 text-primary"
                            )}
                          >
                            expand_more
                          </span>
                        </td>
                      </tr>

                      {isExpanded && editForm && (
                        <tr className="border-b border-outline-variant bg-surface-container-low/80">
                          <td colSpan={6} className="px-md py-lg">
                            <div
                              className="rounded-2xl border border-outline-variant bg-surface p-lg space-y-md shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-sm">
                                <p className="font-label-md text-label-md font-semibold text-on-surface">
                                  Modifier {user.name}
                                </p>
                                <button
                                  type="button"
                                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface flex items-center gap-xs"
                                  onClick={() => {
                                    setExpandedId(null);
                                    setEditForm(null);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    close
                                  </span>
                                  Fermer
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
                                <Input
                                  label="Email"
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) =>
                                    setEditForm((f) =>
                                      f ? { ...f, email: e.target.value } : f
                                    )
                                  }
                                />
                                <Input
                                  label="Prénom"
                                  value={editForm.firstName}
                                  onChange={(e) =>
                                    setEditForm((f) =>
                                      f ? { ...f, firstName: e.target.value } : f
                                    )
                                  }
                                />
                                <Input
                                  label="Nom"
                                  value={editForm.lastName}
                                  onChange={(e) =>
                                    setEditForm((f) =>
                                      f ? { ...f, lastName: e.target.value } : f
                                    )
                                  }
                                />
                                <div>
                                  <label className="font-label-sm text-label-sm text-on-surface-variant mb-xs block">
                                    Rôle
                                  </label>
                                  <select
                                    className={selectClassName}
                                    value={editForm.role}
                                    onChange={(e) => {
                                      const nextRole = e.target
                                        .value as AdminUser["role"];
                                      if (
                                        nextRole === "SUPER_ADMIN" &&
                                        currentRole !== "SUPER_ADMIN"
                                      ) {
                                        toast.error(
                                          "Seul un super admin peut attribuer ce rôle"
                                        );
                                        return;
                                      }
                                      setEditForm((f) =>
                                        f ? { ...f, role: nextRole } : f
                                      );
                                    }}
                                  >
                                    {Object.entries(ROLE_LABELS).map(
                                      ([value, label]) => (
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
                                      )
                                    )}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md items-end">
                                <div className="rounded-xl bg-surface-container-low border border-outline-variant p-md">
                                  <div className="flex items-center justify-between mb-xs">
                                    <p className="font-label-sm text-label-sm font-semibold">
                                      Mot de passe actuel
                                    </p>
                                    <button
                                      type="button"
                                      className="font-label-sm text-[11px] text-primary font-semibold"
                                      onClick={() => setShowPassword((v) => !v)}
                                    >
                                      {showPassword ? "Masquer" : "Afficher"}
                                    </button>
                                  </div>
                                  <p className="font-mono text-sm break-all">
                                    {user.password
                                      ? showPassword
                                        ? user.password
                                        : "••••••••••"
                                      : "Non disponible"}
                                  </p>
                                  {user.password && (
                                    <button
                                      type="button"
                                      className="mt-xs font-label-sm text-[11px] text-primary flex items-center gap-xs"
                                      onClick={async () => {
                                        await navigator.clipboard.writeText(
                                          user.password!
                                        );
                                        toast.success("Mot de passe copié");
                                      }}
                                    >
                                      <span className="material-symbols-outlined text-[14px]">
                                        content_copy
                                      </span>
                                      Copier
                                    </button>
                                  )}
                                </div>
                                <Input
                                  label="Nouveau mot de passe"
                                  placeholder="Laisser vide pour ne pas changer"
                                  value={editForm.password}
                                  onChange={(e) =>
                                    setEditForm((f) =>
                                      f ? { ...f, password: e.target.value } : f
                                    )
                                  }
                                />
                                <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-md py-md">
                                  <div>
                                    <p className="font-label-md text-label-md font-semibold">
                                      Compte actif
                                    </p>
                                    <p className="font-label-sm text-[11px] text-on-surface-variant">
                                      Suspendre l&apos;accès si désactivé
                                    </p>
                                  </div>
                                  <Switch
                                    checked={editForm.isActive}
                                    onCheckedChange={(checked) =>
                                      setEditForm((f) =>
                                        f ? { ...f, isActive: checked } : f
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                                <div>
                                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-sm font-semibold">
                                    Accès actifs
                                  </p>
                                  {user.subscriptions.length === 0 ? (
                                    <p className="font-label-sm text-on-surface-variant">
                                      Aucun abonnement
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-sm">
                                      {user.subscriptions.map((sub) => (
                                        <div
                                          key={sub.id}
                                          className="inline-flex items-center gap-sm rounded-xl bg-primary/5 border border-primary/15 px-md py-sm"
                                        >
                                          <div>
                                            <p className="font-label-sm text-label-sm font-semibold text-primary">
                                              {EXAM_TYPE_LABELS[
                                                sub.examType as keyof typeof EXAM_TYPE_LABELS
                                              ] ?? sub.examType}{" "}
                                              · {sub.plan}
                                            </p>
                                            <p className="font-label-sm text-[11px] text-on-surface-variant">
                                              jusqu&apos;au{" "}
                                              {new Date(
                                                sub.currentPeriodEnd
                                              ).toLocaleDateString("fr-FR")}
                                              {offerLabel(sub.offerId)
                                                ? ` · ${offerLabel(sub.offerId)}`
                                                : ""}
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            className="text-[11px] font-semibold text-error hover:underline"
                                            onClick={() =>
                                              revokeAccess.mutate(sub.examType)
                                            }
                                          >
                                            Retirer
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-sm block font-semibold">
                                    Accorder / prolonger une offre
                                  </label>
                                  <select
                                    className={selectClassName}
                                    value={editForm.offerId}
                                    onChange={(e) =>
                                      setEditForm((f) =>
                                        f ? { ...f, offerId: e.target.value } : f
                                      )
                                    }
                                  >
                                    <option value="">Choisir une offre…</option>
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
                              </div>

                              <div className="flex flex-wrap justify-end gap-sm pt-sm border-t border-outline-variant">
                                {(user.role === "USER" ||
                                  currentRole === "SUPER_ADMIN") && (
                                  <Button
                                    variant="destructive"
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
                                    Supprimer
                                  </Button>
                                )}
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    setExpandedId(null);
                                    setEditForm(null);
                                  }}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  onClick={() => updateLearner.mutate()}
                                  disabled={
                                    updateLearner.isPending ||
                                    !editForm.email.trim()
                                  }
                                  loading={updateLearner.isPending}
                                >
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
      {confirmDialog}
    </div>
  );
}
