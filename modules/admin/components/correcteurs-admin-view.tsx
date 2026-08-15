"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/api/fetch-json";

interface Corrector {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { corrections: number };
}

interface CorrectorsResponse {
  correctors: Corrector[];
  pendingCount: number;
}

export function CorrecteursAdminView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });

  const query = useQuery({
    queryKey: ["admin-correctors"],
    queryFn: () => fetchJson<CorrectorsResponse>("/api/admin/correcteurs"),
  });

  const createCorrector = useMutation({
    mutationFn: () =>
      fetchJson("/api/admin/correcteurs", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-correctors"] });
      setShowForm(false);
      setForm({ email: "", firstName: "", lastName: "", password: "" });
      toast.success(t("admin.gradersCreated"));
    },
    onError: () => toast.error(t("admin.gradersCreateError")),
  });

  const updateCorrector = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetchJson(`/api/admin/correcteurs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-correctors"] });
      toast.success(t("admin.gradersUpdated"));
    },
  });

  const { correctors = [], pendingCount = 0 } = query.data ?? {};

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h1 className="font-display-md text-display-md font-bold text-on-surface mb-xs">
            {t("admin.gradersTitle")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {pendingCount !== 1
              ? t("admin.gradersSubtitlePlural", { n: pendingCount })
              : t("admin.gradersSubtitle", { n: pendingCount })}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          {t("admin.gradersNew")}
        </Button>
      </div>

      {showForm && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-lg grid grid-cols-1 md:grid-cols-2 gap-md">
          <Input
            label={t("admin.firstName")}
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
          <Input
            label={t("admin.lastName")}
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
          <Input
            label={t("admin.colEmail")}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label={t("admin.gradersTempPassword")}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <div className="md:col-span-2 flex justify-end gap-sm">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              {t("admin.cancel")}
            </Button>
            <Button
              onClick={() => createCorrector.mutate()}
              disabled={createCorrector.isPending}
            >
              {t("admin.createAccount")}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {query.isLoading ? (
          <div className="col-span-full p-xl text-center text-on-surface-variant animate-pulse">
            {t("admin.loading")}
          </div>
        ) : correctors.length === 0 ? (
          <div className="col-span-full p-xl text-center text-on-surface-variant">
            {t("admin.gradersNone")}
          </div>
        ) : (
          correctors.map((c) => (
            <div
              key={c.id}
              className="bg-surface border border-outline-variant rounded-2xl p-lg"
            >
              <div className="flex items-start justify-between mb-md">
                <div className="flex items-center gap-sm">
                  <Avatar src={c.avatarUrl ?? undefined} name={c.name} size="lg" />
                  <div>
                    <p className="font-label-md text-label-md font-semibold">{c.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {c.email}
                    </p>
                  </div>
                </div>
                <Badge variant={c.isActive ? "success" : "error"}>
                  {c.isActive ? t("admin.colActive") : t("admin.colInactive")}
                </Badge>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-md">
                {c._count.corrections !== 1
                  ? t("admin.gradersCorrectionsPlural", {
                      n: c._count.corrections,
                    })
                  : t("admin.gradersCorrections", { n: c._count.corrections })}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm">
                  {t("admin.gradersActiveAccount")}
                </span>
                <Switch
                  checked={c.isActive}
                  onCheckedChange={(checked) =>
                    updateCorrector.mutate({ id: c.id, isActive: checked })
                  }
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
