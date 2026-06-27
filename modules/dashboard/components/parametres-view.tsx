"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ParametresView() {
  const [prenom, setPrenom] = useState("Alexandre");
  const [nom, setNom] = useState("Dupont");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [langue, setLangue] = useState("fr-ca");
  const [notifications, setNotifications] = useState({
    rappels: true,
    resultats: true,
    messages: false,
    hebdomadaire: true,
  });

  const handleSaveProfile = () => {
    toast.success("Profil mis à jour avec succès !");
  };

  const handleSavePassword = () => {
    toast.success("Mot de passe modifié avec succès !");
  };

  const sections = [
    { icon: "account_circle", label: "Profil" },
    { icon: "tune", label: "Préférences" },
    { icon: "notifications", label: "Notifications" },
    { icon: "lock", label: "Sécurité" },
    { icon: "credit_card", label: "Abonnement" },
  ];

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          Paramètres
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Gérez votre compte, vos préférences et vos notifications.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">account_circle</span>
            <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">Profil</h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-lg pb-md mb-md border-b border-outline-variant/30">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-on-primary text-3xl font-bold border-2 border-primary/20">
                AD
              </div>
              <button className="absolute bottom-0 right-0 bg-surface-container-high p-sm rounded-full border border-outline-variant shadow-sm hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>
            <div>
              <h3 className="font-label-md text-label-md text-on-surface font-semibold">
                Avatar de profil
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                JPEG ou PNG recommandé. Max 2MB.
              </p>
              <Button variant="secondary" size="sm" className="mt-sm">
                Changer l&apos;avatar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <Input
              label="Prénom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <Input
              label="Nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
            <div className="md:col-span-2">
              <Input
                label="Adresse courriel"
                type="email"
                value="alexandre.dupont@exemple.ca"
                readOnly
                rightIcon={
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                }
                hint="L'email ne peut pas être modifié directement. Contactez le support."
              />
            </div>
          </div>

          <div className="pt-md flex justify-end">
            <Button size="default" onClick={handleSaveProfile}>
              Enregistrer les modifications
            </Button>
          </div>
        </motion.section>

        {/* Preferences Section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm flex flex-col"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">tune</span>
            <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">Préférences</h2>
          </div>

          <div className="space-y-lg flex-1">
            {/* Language */}
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant block">
                Langue de l&apos;interface
              </label>
              <Select value={langue} onValueChange={setLangue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr-ca">Français (Canada)</SelectItem>
                  <SelectItem value="en-ca">English (Canada)</SelectItem>
                  <SelectItem value="fr-fr">Français (France)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme */}
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant block">
                Thème
              </label>
              <div className="grid grid-cols-2 gap-sm">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-sm py-sm px-md rounded-xl font-label-md text-label-md transition-all ${
                    theme === "light"
                      ? "border-2 border-primary bg-primary/5 text-primary"
                      : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    light_mode
                  </span>
                  Clair
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-sm py-sm px-md rounded-xl font-label-md text-label-md transition-all ${
                    theme === "dark"
                      ? "border-2 border-primary bg-primary/5 text-primary"
                      : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">dark_mode</span>
                  Sombre
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Notifications + Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">Notifications</h2>
          </div>
          <div className="space-y-lg">
            {[
              {
                key: "rappels" as const,
                title: "Rappels d'étude",
                desc: "Recevoir des rappels pour vos sessions prévues.",
              },
              {
                key: "resultats" as const,
                title: "Résultats d'examens",
                desc: "Être notifié dès que vos résultats sont disponibles.",
              },
              {
                key: "messages" as const,
                title: "Nouveaux messages",
                desc: "Alertes pour les messages de vos professeurs.",
              },
              {
                key: "hebdomadaire" as const,
                title: "Rapport hebdomadaire",
                desc: "Résumé de votre progression chaque semaine.",
              },
            ].map((notif) => (
              <div key={notif.key} className="flex items-center justify-between">
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface">
                    {notif.title}
                  </h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                    {notif.desc}
                  </p>
                </div>
                <Switch
                  checked={notifications[notif.key]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [notif.key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </motion.section>

        {/* Security */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
        >
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">lock</span>
            <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">Sécurité</h2>
          </div>
          <div className="space-y-md">
            <Input
              label="Mot de passe actuel"
              type="password"
              placeholder="••••••••"
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="Min. 8 caractères"
              hint="Min. 8 caractères, 1 majuscule, 1 chiffre"
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="Répétez votre nouveau mot de passe"
            />
            <div className="pt-sm flex justify-end">
              <Button size="default" onClick={handleSavePassword}>
                Mettre à jour le mot de passe
              </Button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="mt-xl pt-lg border-t border-outline-variant">
            <h3 className="font-label-md text-label-md text-error font-bold mb-sm">
              Zone dangereuse
            </h3>
            <Button
              variant="destructive"
              size="default"
              className="w-full"
              onClick={() => toast.error("Fonctionnalité en développement")}
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Supprimer mon compte
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
