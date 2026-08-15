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
import { EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
import { EXAM_TAB_LABELS, type ExamTab } from "@/lib/pricing/constants";
import { useTranslation } from "@/components/providers/locale-provider";

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

const ROLE_KEYS: Role[] = ["USER", "ADMIN", "SUPER_ADMIN", "CORRECTOR"];

const EXAM_TABS: ExamTab[] = ["tcf", "tef", "ielts"];
const TAB_TO_EXAM: Record<ExamTab, string> = {
  tcf: "TCF_CANADA",
  tef: "TEF_CANADA",
  ielts: "IELTS",
};

const cellInputClass =
  "w-full min-w-[120px] h-8 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-[12px] leading-tight text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

const selectClassName =
  "w-full min-w-[110px] h-8 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-[12px] leading-tight text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

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

function FilterPills({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-sm">
      <span className="font-label-sm text-label-sm text-on-surface-variant w-[7.5rem] shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-sm">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-md py-xs rounded-full font-label-sm text-label-sm border transition-all",
              value === opt.value
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface border-outline-variant text-on-surface-variant hover:border-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function UtilisateursAdminView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { role: currentRole } = useCurrentUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [subscriptionFilter, setSubscriptionFilter] = useState<
    "ALL" | "with" | "without"
  >("ALL");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "active" | "inactive">(
    "ALL"
  );
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
  const [deleteTargets, setDeleteTargets] = useState<AdminUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPanel, setBulkPanel] = useState<"role" | "offer" | null>(null);
  const [bulkRole, setBulkRole] = useState<Role>("USER");
  const [bulkOfferId, setBulkOfferId] = useState("");

  const query = useQuery({
    queryKey: [
      "admin-users",
      search,
      page,
      roleFilter,
      subscriptionFilter,
      activeFilter,
    ],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (subscriptionFilter === "with" || subscriptionFilter === "without") {
        params.set("subscription", subscriptionFilter);
      }
      if (activeFilter === "active") params.set("active", "true");
      if (activeFilter === "inactive") params.set("active", "false");
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

  // Reset sélection quand la page / filtres changent
  React.useEffect(() => {
    setSelectedIds([]);
    setBulkPanel(null);
  }, [search, page, roleFilter, subscriptionFilter, activeFilter]);

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.includes(u.id)),
    [users, selectedIds]
  );
  const allPageSelected =
    users.length > 0 && users.every((u) => selectedIds.includes(u.id));
  const somePageSelected = users.some((u) => selectedIds.includes(u.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !users.some((u) => u.id === id))
      );
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        users.forEach((u) => next.add(u.id));
        return [...next];
      });
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkPanel(null);
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
      toast.success(t("admin.toastCreated"));
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : t("admin.toastCreateError")),
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
            t("admin.toastPasswordShort", { email: user.email })
          );
        }
        if (
          draft.role === "SUPER_ADMIN" &&
          currentRole !== "SUPER_ADMIN" &&
          draft.role !== user.role
        ) {
          throw new Error(
            t("admin.toastSuperAdminOnly", { email: user.email })
          );
        }
      }

      let ok = 0;
      let fail = 0;
      let grantedOffers = 0;
      let emailsSent = 0;
      let emailErrors: string[] = [];
      const errors: string[] = [];

      for (const user of targets) {
        const draft = drafts[user.id]!;
        try {
          const body = buildPatchBody(user, draft);
          if (Object.keys(body).length > 0) {
            const updated = await fetchJson<{
              accessEmailSent?: boolean;
              accessEmailError?: string | null;
              grantedOfferName?: string | null;
            }>(`/api/admin/utilisateurs/${user.id}`, {
              method: "PATCH",
              body: JSON.stringify(body),
            });
            if (draft.offerId) {
              grantedOffers += 1;
              if (updated.accessEmailSent) {
                emailsSent += 1;
              } else if (updated.accessEmailError) {
                emailErrors.push(`${user.email}: ${updated.accessEmailError}`);
              } else if (updated.grantedOfferName) {
                emailErrors.push(
                  `${user.email}: ${t("admin.toastAccessNoEmail")}`
                );
              }
            }
          }
          for (const examType of draft.revokeExamTypes.slice(1)) {
            await fetchJson(`/api/admin/utilisateurs/${user.id}`, {
              method: "PATCH",
              body: JSON.stringify({ revokeExamType: examType }),
            });
          }
          ok += 1;
        } catch (error) {
          fail += 1;
          errors.push(
            error instanceof Error
              ? error.message
              : t("admin.toastFailUser", { email: user.email })
          );
        }
      }

      if (fail > 0 && ok === 0) {
        throw new Error(errors[0] ?? t("admin.toastSaveError"));
      }
      return { ok, fail, errors, grantedOffers, emailsSent, emailErrors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDrafts({});
      setCreatedAccount(null);
      if (result.fail > 0) {
        toast.warning(
          `${t("admin.toastPartial", { ok: result.ok, fail: result.fail })}${
            result.errors?.[0] ? ` — ${result.errors[0]}` : ""
          }`
        );
      } else if (result.grantedOffers > 0) {
        if (result.emailsSent === result.grantedOffers) {
          toast.success(
            result.grantedOffers > 1
              ? t("admin.toastAccessEmails", {
                  ok: result.ok,
                  n: result.emailsSent,
                })
              : t("admin.toastAccessGranted")
          );
        } else {
          toast.warning(
            `${t("admin.toastAccessNoEmail")}${
              result.emailErrors?.[0] ? ` — ${result.emailErrors[0]}` : ""
            }`
          );
        }
      } else {
        toast.success(
          result.ok > 1
            ? t("admin.toastUpdatedN", { n: result.ok })
            : t("admin.toastSaved")
        );
      }
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : t("admin.toastSaveError")
      ),
  });

  const removeLearners = useMutation({
    mutationFn: async ({
      ids,
      mode,
    }: {
      ids: string[];
      mode: "archive" | "permanent";
    }) => {
      let ok = 0;
      let fail = 0;
      const errors: string[] = [];
      for (const id of ids) {
        try {
          await fetchJson(`/api/admin/utilisateurs/${id}?mode=${mode}`, {
            method: "DELETE",
          });
          ok += 1;
        } catch (error) {
          fail += 1;
          errors.push(
            error instanceof Error
              ? error.message
              : t("admin.toastFailUser", { email: id })
          );
        }
      }
      if (fail > 0 && ok === 0) {
        throw new Error(errors[0] ?? t("admin.toastDeleteError"));
      }
      return { ok, fail, errors, mode };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDrafts((prev) => {
        const next = { ...prev };
        variables.ids.forEach((id) => delete next[id]);
        return next;
      });
      setDeleteTargets([]);
      clearSelection();
      if (result.fail > 0) {
        toast.warning(
          `${t("admin.toastPartial", { ok: result.ok, fail: result.fail })}${
            result.errors[0] ? ` — ${result.errors[0]}` : ""
          }`
        );
      } else {
        toast.success(
          result.mode === "permanent"
            ? t("admin.toastDeleted", { n: result.ok })
            : t("admin.toastArchived", { n: result.ok })
        );
      }
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : t("admin.toastDeleteError")
      ),
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({
      ids,
      body,
    }: {
      ids: string[];
      body: Record<string, unknown>;
    }) => {
      let ok = 0;
      let fail = 0;
      let emailsSent = 0;
      const emailErrors: string[] = [];
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const updated = await fetchJson<{
            accessEmailSent?: boolean;
            accessEmailError?: string | null;
            email?: string;
          }>(`/api/admin/utilisateurs/${id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          });
          ok += 1;
          if (body.offerId) {
            if (updated.accessEmailSent) emailsSent += 1;
            else if (updated.accessEmailError) {
              emailErrors.push(
                `${updated.email ?? id}: ${updated.accessEmailError}`
              );
            }
          }
        } catch (error) {
          fail += 1;
          errors.push(
            error instanceof Error
              ? error.message
              : t("admin.toastFailUser", { email: id })
          );
        }
      }
      if (fail > 0 && ok === 0) {
        throw new Error(errors[0] ?? t("admin.toastSaveError"));
      }
      return {
        ok,
        fail,
        errors,
        emailsSent,
        emailErrors,
        grantedOffers: body.offerId ? ok : 0,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setBulkPanel(null);
      setBulkOfferId("");
      clearSelection();
      if (result.fail > 0) {
        toast.warning(
          `${t("admin.toastPartial", { ok: result.ok, fail: result.fail })}${
            result.errors[0] ? ` — ${result.errors[0]}` : ""
          }`
        );
      } else if (result.grantedOffers > 0) {
        if (result.emailsSent === result.grantedOffers) {
          toast.success(
            t("admin.toastAccessEmails", {
              ok: result.ok,
              n: result.emailsSent,
            })
          );
        } else {
          toast.warning(
            `${t("admin.toastAccessNoEmail")}${
              result.emailErrors[0] ? ` — ${result.emailErrors[0]}` : ""
            }`
          );
        }
      } else {
        toast.success(t("admin.toastUpdatedN", { n: result.ok }));
      }
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : t("admin.toastSaveError")
      ),
  });

  const from = meta.total === 0 ? 0 : (page - 1) * (meta.limit || 20) + 1;
  const to = Math.min(page * (meta.limit || 20), meta.total);
  const activeSubsCount = users.filter((u) => u.subscriptions.length > 0).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  return (
    <div
      className={cn(
        "flex flex-col gap-lg",
        (dirtyUsers.length > 0 || selectedIds.length > 0) && "pb-28"
      )}
    >
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-md">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface font-bold">
            {t("admin.usersTitle")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            {t("admin.usersSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              className="w-full bg-surface border border-outline-variant rounded-xl py-sm pl-10 pr-md font-body-md text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-[0_4px_20px_rgba(79,55,138,0.04)]"
              placeholder={t("admin.searchUsers")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            onClick={() => {
              setCreatedAccount(null);
              setCreateForm({ email: "", firstName: "", lastName: "" });
              setShowCreate(true);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t("admin.add")}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {[
          {
            label: t("admin.kpiTotal"),
            value: meta.total,
            hint: t("admin.kpiFilteredAccounts"),
          },
          {
            label: t("admin.kpiWithSub"),
            value: activeSubsCount,
            hint: t("admin.kpiOnPage"),
          },
          {
            label: t("admin.kpiInactive"),
            value: inactiveCount,
            hint: t("admin.kpiOnPage"),
          },
          {
            label: t("admin.kpiPendingEdits"),
            value: dirtyUsers.length,
            hint: dirtyUsers.length ? t("admin.kpiToSave") : t("admin.kpiNone"),
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

      <div className="flex flex-col gap-md p-md rounded-2xl border border-outline-variant bg-surface shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
        <FilterPills
          label={t("admin.filterRole")}
          value={roleFilter}
          options={[
            { value: "ALL", label: t("admin.all") },
            { value: "USER", label: t("admin.roleLearners") },
            { value: "ADMIN", label: t("admin.roleAdmins") },
            { value: "CORRECTOR", label: t("admin.roleCorrectors") },
            ...(currentRole === "SUPER_ADMIN"
              ? [{ value: "SUPER_ADMIN", label: t("admin.roleSuperAdmins") }]
              : []),
          ]}
          onChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
        />
        <FilterPills
          label={t("admin.filterSubscription")}
          value={subscriptionFilter}
          options={[
            { value: "ALL", label: t("admin.all") },
            { value: "with", label: t("admin.filterWithSub") },
            { value: "without", label: t("admin.filterWithoutSub") },
          ]}
          onChange={(value) => {
            setSubscriptionFilter(value as "ALL" | "with" | "without");
            setPage(1);
          }}
        />
        <FilterPills
          label={t("admin.filterStatus")}
          value={activeFilter}
          options={[
            { value: "ALL", label: t("admin.all") },
            { value: "active", label: t("admin.filterActive") },
            { value: "inactive", label: t("admin.filterInactive") },
          ]}
          onChange={(value) => {
            setActiveFilter(value as "ALL" | "active" | "inactive");
            setPage(1);
          }}
        />
      </div>

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
                <DialogTitle>{t("admin.accountCreated")}</DialogTitle>
                <DialogDescription>
                  {t("admin.accountCreatedDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-md space-y-sm">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {t("admin.colEmail")}
                </p>
                <p className="font-label-md text-label-md font-semibold break-all">
                  {createdAccount.email}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant pt-xs">
                  {t("admin.colPassword")}
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
                    toast.success(t("admin.passwordCopied"));
                  }}
                >
                  {t("admin.copyPwdShort")}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreate(false);
                    setCreatedAccount(null);
                  }}
                >
                  {t("admin.close")}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("admin.createLearner")}</DialogTitle>
                <DialogDescription>
                  {t("admin.createLearnerDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-md">
                <Input
                  label={t("admin.emailRequired")}
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, email: e.target.value }))
                  }
                  autoFocus
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <Input
                    label={t("admin.firstName")}
                    value={createForm.firstName}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                  />
                  <Input
                    label={t("admin.lastName")}
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
                  {t("admin.cancel")}
                </Button>
                <Button
                  onClick={() => createLearner.mutate()}
                  disabled={!createForm.email.trim() || createLearner.isPending}
                  loading={createLearner.isPending}
                >
                  {t("admin.createAccount")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(79,55,138,0.05)]">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-sm">
          <h2 className="font-headline-lg text-[18px] md:text-[20px] font-semibold text-on-surface">
            {t("admin.listTitle")}
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {t("admin.listMeta", { n: meta.total })}
          </span>
        </div>

        {query.isLoading ? (
          <div className="p-2xl text-center text-on-surface-variant animate-pulse">
            {t("admin.loading")}
          </div>
        ) : users.length === 0 ? (
          <div className="p-2xl text-center text-on-surface-variant">
            {t("admin.noUsers")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface">
                  <th className="px-sm py-sm w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                      checked={allPageSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            somePageSelected && !allPageSelected;
                        }
                      }}
                      onChange={toggleSelectAllPage}
                      title={t("admin.selectAllPage")}
                    />
                  </th>
                  {[
                    t("admin.colUser"),
                    t("admin.colEmail"),
                    t("admin.colRole"),
                    t("admin.colActive"),
                    t("admin.colSubs"),
                    t("admin.colPassword"),
                    t("admin.colActivity"),
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
                  const selected = selectedIds.includes(user.id);
                  const visibleSubs = user.subscriptions.filter(
                    (s) => !draft.revokeExamTypes.includes(s.examType)
                  );

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-b border-outline-variant/60 align-top transition-colors",
                        selected && "bg-primary/8",
                        dirty && !selected && "bg-primary/5",
                        !selected &&
                          !dirty &&
                          "hover:bg-surface-container-low",
                        !draft.isActive &&
                          !dirty &&
                          !selected &&
                          "bg-error-container/10"
                      )}
                    >
                      <td className="px-sm py-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                          checked={selected}
                          onChange={() => toggleSelect(user.id)}
                        />
                      </td>
                      <td className="px-sm py-sm">
                        <div className="flex items-start gap-sm min-w-[180px]">
                          <Link
                            href={`/admin/utilisateurs/${user.id}`}
                            className="shrink-0 rounded-full ring-offset-2 hover:ring-2 hover:ring-primary/40 transition-all"
                            title={t("admin.statsTitle")}
                          >
                            <Avatar
                              src={user.avatarUrl ?? undefined}
                              name={
                                [draft.firstName, draft.lastName]
                                  .filter(Boolean)
                                  .join(" ") || user.name
                              }
                              size="sm"
                            />
                          </Link>
                          <div className="flex flex-col gap-1 flex-1">
                            <input
                              className={cellInputClass}
                              placeholder={t("admin.firstName")}
                              value={draft.firstName}
                              onChange={(e) =>
                                updateDraft(user.id, user, {
                                  firstName: e.target.value,
                                })
                              }
                            />
                            <input
                              className={cellInputClass}
                              placeholder={t("admin.lastName")}
                              value={draft.lastName}
                              onChange={(e) =>
                                updateDraft(user.id, user, {
                                  lastName: e.target.value,
                                })
                              }
                            />
                            {dirty && (
                              <span className="text-[10px] text-primary font-semibold">
                                {t("admin.kpiPendingEdits")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-sm py-sm">
                        <input
                          type="email"
                          className={cn(cellInputClass, "min-w-[160px]")}
                          value={draft.email}
                          onChange={(e) =>
                            updateDraft(user.id, user, { email: e.target.value })
                          }
                        />
                      </td>

                      <td className="px-sm py-sm">
                        <select
                          className={selectClassName}
                          value={draft.role}
                          onChange={(e) => {
                            const nextRole = e.target.value as Role;
                            if (
                              nextRole === "SUPER_ADMIN" &&
                              currentRole !== "SUPER_ADMIN"
                            ) {
                              toast.error(t("admin.onlySuperAdminRole"));
                              return;
                            }
                            updateDraft(user.id, user, { role: nextRole });
                          }}
                        >
                          {ROLE_KEYS.map((value) => (
                            <option
                              key={value}
                              value={value}
                              disabled={
                                value === "SUPER_ADMIN" &&
                                currentRole !== "SUPER_ADMIN"
                              }
                            >
                              {t(`admin.roles.${value}`)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-sm py-sm">
                        <div className="flex flex-col items-start gap-1">
                          <Switch
                            checked={draft.isActive}
                            onCheckedChange={(checked) =>
                              updateDraft(user.id, user, { isActive: checked })
                            }
                          />
                          <span
                            className={cn(
                              "text-[11px]",
                              draft.isActive
                                ? "text-on-surface-variant"
                                : "text-error"
                            )}
                          >
                            {draft.isActive
                              ? t("admin.colActive")
                              : t("admin.colInactive")}
                          </span>
                        </div>
                      </td>

                      <td className="px-sm py-sm min-w-[200px]">
                        <div className="flex flex-col gap-1">
                          {visibleSubs.length === 0 ? (
                            <span className="text-[11px] text-on-surface-variant">
                              —
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {visibleSubs.map((sub) => (
                                <span
                                  key={sub.id}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold"
                                >
                                  {EXAM_TYPE_LABELS[
                                    sub.examType as keyof typeof EXAM_TYPE_LABELS
                                  ] ?? sub.examType}
                                  <button
                                    type="button"
                                    title={t("admin.revokeOnSave")}
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
                                    <span className="material-symbols-outlined text-[12px]">
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
                              className="text-[10px] text-on-surface-variant hover:text-primary text-left"
                              onClick={() =>
                                updateDraft(user.id, user, {
                                  revokeExamTypes: [],
                                })
                              }
                            >
                              {t("admin.revokeOnSave")} ({draft.revokeExamTypes.length})
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
                            <option value="">{t("admin.grantOffer")}</option>
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

                      <td className="px-sm py-sm min-w-[140px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <p className="font-mono text-[11px] text-on-surface-variant truncate max-w-[100px]">
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
                                  <span className="material-symbols-outlined text-[14px]">
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
                                    toast.success(t("admin.passwordCopied"));
                                  }}
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    content_copy
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                          <input
                            className={cellInputClass}
                            placeholder={t("admin.newPasswordPlaceholder")}
                            value={draft.password}
                            onChange={(e) =>
                              updateDraft(user.id, user, {
                                password: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>

                      <td className="px-sm py-sm whitespace-nowrap">
                        <div className="flex items-center gap-1 text-on-surface-variant text-[11px]">
                          <span className="material-symbols-outlined text-[16px]">
                            history
                          </span>
                          {user._count.attempts > 1
                            ? t("admin.examCountPlural", {
                                n: user._count.attempts,
                              })
                            : t("admin.examCount", {
                                n: user._count.attempts,
                              })}
                        </div>
                      </td>

                      <td className="px-sm py-sm">
                        <div className="flex items-center gap-0.5">
                          <Link
                            href={`/admin/utilisateurs/${user.id}`}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title={t("admin.statsTitle")}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              analytics
                            </span>
                          </Link>
                          {(user.role === "USER" ||
                            currentRole === "SUPER_ADMIN") && (
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors"
                              title={t("admin.archiveOrDelete")}
                              onClick={() => setDeleteTargets([user])}
                            >
                              <span className="material-symbols-outlined text-[18px]">
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
            {t("admin.showingUsers", {
              from,
              to,
              total: meta.total,
            })}
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

      {(selectedIds.length > 0 || dirtyUsers.length > 0) && (
        <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
          <div className="max-w-7xl mx-auto px-md pb-md flex flex-col gap-sm pointer-events-auto">
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-md rounded-2xl border border-primary/25 bg-surface px-lg py-md shadow-[0_-8px_40px_rgba(79,55,138,0.18)]">
                <div>
                  <p className="font-label-md text-label-md font-semibold text-on-surface">
                    {selectedIds.length > 1
                      ? t("admin.selectedNPlural", { n: selectedIds.length })
                      : t("admin.selectedN", { n: selectedIds.length })}
                  </p>
                  <p className="font-label-sm text-[11px] text-on-surface-variant">
                    {t("admin.bulkActions")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-sm">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setBulkRole("USER");
                      setBulkPanel("role");
                    }}
                    disabled={bulkUpdate.isPending || removeLearners.isPending}
                  >
                    {t("admin.changeRole")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setBulkOfferId("");
                      setBulkPanel("offer");
                    }}
                    disabled={bulkUpdate.isPending || removeLearners.isPending}
                  >
                    {t("admin.grantOfferBtn")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setDeleteTargets(
                        selectedUsers.length > 0
                          ? selectedUsers
                          : users.filter((u) => selectedIds.includes(u.id))
                      )
                    }
                    disabled={bulkUpdate.isPending || removeLearners.isPending}
                    className="text-error border-error/30"
                  >
                    {t("admin.archiveDelete")}
                  </Button>
                  <Button variant="secondary" onClick={clearSelection}>
                    {t("admin.deselectAll")}
                  </Button>
                </div>
              </div>
            )}
            {dirtyUsers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-md rounded-2xl border border-primary/20 bg-surface px-lg py-md shadow-[0_-8px_40px_rgba(79,55,138,0.18)]">
                <div>
                  <p className="font-label-md text-label-md font-semibold text-on-surface">
                    {dirtyUsers.length > 1
                      ? t("admin.pendingEditsPlural", { n: dirtyUsers.length })
                      : t("admin.pendingEdits", { n: dirtyUsers.length })}
                  </p>
                  <p className="font-label-sm text-[11px] text-on-surface-variant">
                    {t("admin.pendingEditsHint")}
                  </p>
                </div>
                <div className="flex items-center gap-sm">
                  <Button
                    variant="secondary"
                    onClick={discardDrafts}
                    disabled={saveAll.isPending}
                  >
                    {t("admin.cancel")}
                  </Button>
                  <Button
                    onClick={() => saveAll.mutate()}
                    loading={saveAll.isPending}
                    disabled={saveAll.isPending}
                  >
                    {t("admin.saveAll")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open && !removeLearners.isPending) setDeleteTargets([]);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTargets.length > 1
                ? t("admin.deleteTitleN", { n: deleteTargets.length })
                : t("admin.deleteTitle")}
            </DialogTitle>
            <DialogDescription>
              {deleteTargets.length === 1
                ? `${deleteTargets[0].name} (${deleteTargets[0].email}). `
                : `${t("admin.deleteUsersSelected", { n: deleteTargets.length })} `}
              {t("admin.deleteDescAccess")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-sm">
            <button
              type="button"
              disabled={removeLearners.isPending || deleteTargets.length === 0}
              onClick={() =>
                removeLearners.mutate({
                  ids: deleteTargets.map((u) => u.id),
                  mode: "archive",
                })
              }
              className="w-full text-left rounded-xl border border-outline-variant bg-surface-container-low p-md hover:border-primary transition-colors disabled:opacity-50"
            >
              <p className="font-label-md text-sm font-semibold text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  inventory_2
                </span>
                {t("admin.archive")}
              </p>
              <p className="font-label-sm text-[12px] text-on-surface-variant mt-xs">
                {t("admin.archiveDesc")}
              </p>
            </button>
            <button
              type="button"
              disabled={removeLearners.isPending || deleteTargets.length === 0}
              onClick={() =>
                removeLearners.mutate({
                  ids: deleteTargets.map((u) => u.id),
                  mode: "permanent",
                })
              }
              className="w-full text-left rounded-xl border border-error/30 bg-error/5 p-md hover:border-error transition-colors disabled:opacity-50"
            >
              <p className="font-label-md text-sm font-semibold text-error flex items-center gap-sm">
                <span className="material-symbols-outlined text-[20px]">
                  delete_forever
                </span>
                {t("admin.deleteForever")}
              </p>
              <p className="font-label-sm text-[12px] text-on-surface-variant mt-xs">
                {t("admin.deleteForeverDesc")}
              </p>
            </button>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              disabled={removeLearners.isPending}
              onClick={() => setDeleteTargets([])}
            >
              {t("admin.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkPanel === "role"}
        onOpenChange={(open) => !open && setBulkPanel(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.changeRole")}</DialogTitle>
            <DialogDescription>
              {selectedIds.length > 1
                ? t("admin.applyRolePlural", { n: selectedIds.length })
                : t("admin.applyRole", { n: selectedIds.length })}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="font-label-sm text-[12px] text-on-surface-variant mb-xs block">
              {t("admin.newRole")}
            </label>
            <select
              className={selectClassName}
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value as Role)}
            >
              {ROLE_KEYS.map((value) => (
                <option
                  key={value}
                  value={value}
                  disabled={
                    value === "SUPER_ADMIN" && currentRole !== "SUPER_ADMIN"
                  }
                >
                  {t(`admin.roles.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBulkPanel(null)}>
              {t("admin.cancel")}
            </Button>
            <Button
              loading={bulkUpdate.isPending}
              disabled={bulkUpdate.isPending}
              onClick={() => {
                if (
                  bulkRole === "SUPER_ADMIN" &&
                  currentRole !== "SUPER_ADMIN"
                ) {
                  toast.error(t("admin.onlySuperAdminRole"));
                  return;
                }
                bulkUpdate.mutate({
                  ids: selectedIds,
                  body: { role: bulkRole },
                });
              }}
            >
              {t("admin.changeRole")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkPanel === "offer"}
        onOpenChange={(open) => !open && setBulkPanel(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.grantOfferBtn")}</DialogTitle>
            <DialogDescription>
              {t("admin.toastAccessGranted")}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="font-label-sm text-[12px] text-on-surface-variant mb-xs block">
              {t("admin.grantOfferBtn")}
            </label>
            <select
              className={selectClassName}
              value={bulkOfferId}
              onChange={(e) => setBulkOfferId(e.target.value)}
            >
              <option value="">{t("admin.grantOffer")}</option>
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
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBulkPanel(null)}>
              {t("admin.cancel")}
            </Button>
            <Button
              loading={bulkUpdate.isPending}
              disabled={!bulkOfferId || bulkUpdate.isPending}
              onClick={() =>
                bulkUpdate.mutate({
                  ids: selectedIds,
                  body: { offerId: bulkOfferId },
                })
              }
            >
              {t("admin.grantOfferBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
