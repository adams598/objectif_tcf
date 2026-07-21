"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/api/fetch-json";
import {
  MarketingPageHero,
  MarketingPageShell,
} from "@/components/marketing/marketing-page";
import { useTranslation } from "@/components/providers/locale-provider";

export function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/contact", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      toast.success(t("marketingPages.contact.success"));
      setForm({ name: "", email: "", phone: "", message: "" });
    },
    onError: () => toast.error(t("marketingPages.contact.error")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    mutation.mutate();
  };

  const channels = [
    {
      title: t("marketingPages.contact.channel1Title"),
      desc: t("marketingPages.contact.channel1Desc"),
      action: { label: t("marketingPages.contact.channel1Action"), href: "/faq" },
    },
    {
      title: t("marketingPages.contact.channel2Title"),
      desc: t("marketingPages.contact.channel2Desc"),
      badge: t("marketingPages.contact.channel2Badge"),
      phone: "+237 686 87 68 73",
    },
    {
      title: t("marketingPages.contact.channel3Title"),
      desc: t("marketingPages.contact.channel3Desc"),
    },
  ];

  return (
    <MarketingPageShell>
      <div className="mb-2xl">
        <p className="font-label-md text-label-md font-bold text-primary uppercase tracking-wide mb-xs">
          {t("marketingPages.contact.channelsTitle")}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
          {t("marketingPages.contact.channelsSubtitle")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {channels.map((channel, i) => (
            <div
              key={i}
              className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
            >
              <h3 className="font-label-md text-label-md font-bold text-on-surface mb-sm">
                {channel.title}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
                {channel.desc}
              </p>
              {channel.action && (
                <Link
                  href={channel.action.href}
                  className="font-label-sm text-label-sm text-primary hover:underline"
                >
                  {channel.action.label} →
                </Link>
              )}
              {channel.phone && (
                <div className="flex items-center gap-sm">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    {channel.phone}
                  </span>
                  {channel.badge && (
                    <span className="px-sm py-xs rounded-full bg-green-100 text-green-800 font-label-sm text-label-sm">
                      {channel.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2xl">
        <div>
          <MarketingPageHero title={t("marketingPages.contact.formTitle")} />
          <div className="space-y-md">
            {[
              {
                icon: "location_on",
                title: t("marketingPages.contact.office"),
                value: "Canada · Cameroun",
              },
              {
                icon: "call",
                title: t("marketingPages.contact.phone"),
                value: "Canada : +1 (418) 554-2131\nCameroun : +237 686 87 68 73",
              },
              {
                icon: "schedule",
                title: t("marketingPages.contact.hours"),
                value: t("marketingPages.contact.hoursValue"),
              },
              {
                icon: "mail",
                title: "Email",
                value: "contact@objectifcanada-tcf.com",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-md">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">
                    {item.icon}
                  </span>
                </div>
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    {item.title}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-line">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-2xl p-xl border border-outline-variant shadow-violet-md space-y-md"
        >
          <Input
            placeholder={t("marketingPages.contact.namePlaceholder")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            type="email"
            placeholder={t("marketingPages.contact.emailPlaceholder")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            placeholder={t("marketingPages.contact.phonePlaceholder")}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Textarea
            placeholder={t("marketingPages.contact.messagePlaceholder")}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="min-h-[140px]"
            required
          />
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? t("marketingPages.contact.sending")
              : t("marketingPages.contact.send")}
          </Button>
        </form>
      </div>
    </MarketingPageShell>
  );
}
