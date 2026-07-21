"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  ALL_EXAM_TYPES,
  EXAM_TYPE_LABELS,
} from "@/lib/exams/catalog";

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
  subscriptions: Array<{
    id: string;
    plan: string;
    examType: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
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

const ROLE_OPTIONS: Array<{ value: AdminUser["role"]; label: string }> = [
  { value: "USER", label: "Apprenant" },
  { value: "CORRECTOR", label: "Correcteur" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super admin" },
];

export function UtilisateursAdminView() {
  const queryClient = useQueryClient();
  const { role: currentRole } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grantForm, setGrantForm] = useState({
    examType: "TCF_CANADA" as (typeof ALL_EXAM_TYPES)[number],
    plan: "PRO" as "STARTER" | "PRO" | "ELITE",
    days: 30,
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

  const selected = query.data?.users.find((u) => u.id === selectedId) ?? null;

  const updateUser = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ role: string; isActive: boolean }>;
    }) =>
      fetchJson(`/api/admin/utilisateurs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Utilisateur mis à jour");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour"
      );
    },
  });

  const grantSubscription = useMutation({
    mutationFn: (payload: { userId: string; examType: string; plan: string; days: number }) =>
      fetchJson(`/api/admin/utilisateurs/${payload.userId}`, {
        method: "POST",
        body: JSON.stringify({
          examType: payload.examType,
          plan: payload.plan,
          days: payload.days,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Abonnement accordé");
    },
    onError: () => toast.error("Erreur lors de l'attribution"),
  });

  const { users = [], meta = { total: 0, page: 1, totalPages: 1 } } = query.data ?? {};

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md font-bold text-on-surface mb-xs">
          Utilisateurs
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Gérez les comptes, rôles et abonnements ({meta.total} utilisateurs).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-md">
        <Input
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
        <select
          className="rounded-xl border border-outline-variant px-md py-sm bg-surface font-label-sm max-w-xs"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">Tous les rôles</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl overflow-hidden">
          {query.isLoading ? (
            <div className="p-xl text-center text-on-surface-variant animate-pulse">
              Chargement…
            </div>
          ) : users.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    {["Utilisateur", "Rôle", "Statut", "Abonnements", "Activité"].map((h) => (
                      <th
                        key={h}
                        className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedId(user.id)}
                      className={cn(
                        "border-b border-outline-variant/50 cursor-pointer hover:bg-surface-container-low/50",
                        selectedId === user.id && "bg-primary/5"
                      )}
                    >
                      <td className="px-md py-sm">
                        <div className="flex items-center gap-sm">
                          <Avatar
                            src={user.avatarUrl ?? undefined}
                            name={user.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-label-md text-label-md">{user.name}</p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-md py-sm">
                        <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                      </td>
                      <td className="px-md py-sm">
                        <Badge variant={user.isActive ? "success" : "error"}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="px-md py-sm font-label-sm text-label-sm">
                        {user.subscriptions.length > 0
                          ? user.subscriptions.map((s) => s.examType.replace("_", " ")).join(", ")
                          : "—"}
                      </td>
                      <td className="px-md py-sm font-label-sm text-label-sm text-on-surface-variant">
                        {user._count.attempts} examens
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-sm p-md border-t border-outline-variant">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <span className="px-md py-xs font-label-sm text-on-surface-variant">
                Page {page} / {meta.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl p-lg">
          {selected ? (
            <div className="flex flex-col gap-md">
              <div className="flex items-center gap-md">
                <Avatar src={selected.avatarUrl ?? undefined} name={selected.name} size="lg" />
                <div>
                  <h2 className="font-headline-lg text-[18px] font-bold">{selected.name}</h2>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {selected.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md">Compte actif</span>
                <Switch
                  checked={selected.isActive}
                  onCheckedChange={(checked) =>
                    updateUser.mutate({ id: selected.id, data: { isActive: checked } })
                  }
                />
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-xs block">
                  Rôle
                </label>
                <select
                  value={selected.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as AdminUser["role"];
                    if (
                      nextRole === "SUPER_ADMIN" &&
                      currentRole !== "SUPER_ADMIN"
                    ) {
                      toast.error("Seul un super admin peut attribuer ce rôle");
                      return;
                    }
                    updateUser.mutate({ id: selected.id, data: { role: nextRole } });
                  }}
                  className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface font-label-md"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option
                      key={role.value}
                      value={role.value}
                      disabled={
                        role.value === "SUPER_ADMIN" &&
                        currentRole !== "SUPER_ADMIN"
                      }
                    >
                      {role.label}
                    </option>
                  ))}
                </select>
                {currentRole !== "SUPER_ADMIN" && (
                  <p className="font-label-sm text-[11px] text-on-surface-variant mt-xs">
                    Seul un super admin peut promouvoir un super admin.
                  </p>
                )}
              </div>

              {selected.subscriptions.length > 0 && (
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-sm">
                    Abonnements actifs
                  </p>
                  {selected.subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="text-sm p-sm rounded-lg bg-surface-container-low mb-xs"
                    >
                      {sub.examType} — {sub.plan} jusqu&apos;au{" "}
                      {new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR")}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-outline-variant pt-md">
                <p className="font-label-md text-label-md font-semibold mb-sm">
                  Accorder un abonnement
                </p>
                <div className="flex flex-col gap-sm">
                  <select
                    value={grantForm.examType}
                    onChange={(e) =>
                      setGrantForm((f) => ({
                        ...f,
                        examType: e.target.value as (typeof ALL_EXAM_TYPES)[number],
                      }))
                    }
                    className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface"
                  >
                    {ALL_EXAM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EXAM_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={grantForm.plan}
                    onChange={(e) =>
                      setGrantForm((f) => ({
                        ...f,
                        plan: e.target.value as "STARTER" | "PRO" | "ELITE",
                      }))
                    }
                    className="w-full px-md py-sm rounded-xl border border-outline-variant bg-surface"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ELITE">Elite</option>
                  </select>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={grantForm.days}
                    onChange={(e) =>
                      setGrantForm((f) => ({ ...f, days: parseInt(e.target.value, 10) || 30 }))
                    }
                    label="Durée (jours)"
                  />
                  <Button
                    onClick={() =>
                      grantSubscription.mutate({
                        userId: selected.id,
                        ...grantForm,
                      })
                    }
                    disabled={grantSubscription.isPending}
                  >
                    Accorder l&apos;abonnement
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-on-surface-variant text-center py-xl">
              Sélectionnez un utilisateur pour voir les détails.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
