"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const filters = ["Tout", "TCF Canada", "TEF Canada", "IELTS", "Visa", "Études"];

const posts = [
  {
    id: 1,
    author: "Amina S.",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1aPStS1FcgYTFya9L7jZNHwaW6kTIzRXgynI9VqXtryLL9LDTvPHOJhZ_sLJFt143BtPN-kfKPEWMgjvo8oLWNKmqBA5DFL8FIB6Dx7a4SWvpgZ9YCvi34KyYyF2inZKFmI1SXI96HtCgc-6vynNxKroxkuRoUh2M_qsW2mi52xNqREfOlr7uHwX7NXSpCzSEQu9O3Ydylv5AT9XIppLz-Zz0IYvEj6MCBVkAU7nzYR3s5B_omut96QZYnq-0JBZsdo5VJQCWsfQ",
    country: "🇨🇮",
    time: "Il y a 2 heures",
    tag: "TCF Canada",
    content:
      "J'ai obtenu mon NCLC 9 hier ! Je voulais partager ma stratégie pour la compréhension orale : j'ai écouté RFI chaque matin et fait au moins 2 exercices de CO par jour pendant 3 mois. La clé c'est la régularité ! 🎉",
    likes: 47,
    comments: 12,
    isLiked: false,
  },
  {
    id: 2,
    author: "Karim M.",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAuKhw3Kzh-2kOZWdQDqKqSlzv6m_h2CM_VmYZncKh6f5TTm13vWf-qqveCZq-Bl1Sw0M_en5Rz9D6bcf2etMGbjP-uJcWxiamoqFKMrEeAsWPoxmhK48Tce8zJuee6AnEAZRE26804VqykqpUF8ZflY9m-IA_RjNni5Ks3Yki1N-PoVbnWd75ALQYb6SHfRqestg4_3PE-6U3ZXz_5qkwiGENu0drpUtaL3lLU-qXWfEzuK0NkHS_HXyvucRTBqUP-SaI0eHQK50",
    country: "🇲🇦",
    time: "Il y a 5 heures",
    tag: "TEF Canada",
    content:
      "Question pour ceux qui ont passé le TEF : la section lexique est-elle vraiment plus difficile que le TCF ? Je prépare les deux pour maximiser mes chances. Merci d'avance !",
    likes: 23,
    comments: 8,
    isLiked: true,
  },
  {
    id: 3,
    author: "Marie L.",
    avatar: "",
    country: "🇫🇷",
    time: "Il y a 1 jour",
    tag: "TCF Canada",
    content:
      "Correctrice certifiée ici 👋 Je remarque que beaucoup d'étudiants perdent des points en EE à cause de la structure. Rappel : introduction (contexte + prise de position) → 2-3 développements → conclusion. Ne négligez pas les connecteurs logiques !",
    likes: 89,
    comments: 31,
    isLiked: false,
  },
];

const activeMembers = [
  { name: "Sophie K.", nclc: "NCLC 10", country: "🇩🇿" },
  { name: "Thomas B.", nclc: "NCLC 9", country: "🇸🇳" },
  { name: "Fatima Z.", nclc: "NCLC 8", country: "🇨🇲" },
  { name: "Olivier M.", nclc: "NCLC 11", country: "🇭🇹" },
];

export function CommunauteView() {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [postContent, setPostContent] = useState("");
  const [localPosts, setLocalPosts] = useState(posts.map((p) => ({ ...p })));

  const handlePost = () => {
    if (!postContent.trim()) return;
    setLocalPosts((prev) => [
      {
        id: Date.now(),
        author: "Vous",
        avatar: "",
        country: "🌍",
        time: "À l'instant",
        tag: activeFilter === "Tout" ? "TCF Canada" : activeFilter,
        content: postContent,
        likes: 0,
        comments: 0,
        isLiked: false,
      },
      ...prev,
    ]);
    setPostContent("");
  };

  const handleLike = (id: number) => {
    setLocalPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          Communauté
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Échangez avec des milliers de candidats qui préparent leur avenir au Canada.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Main feed */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          {/* Composer */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
          >
            <div className="flex gap-md">
              <Avatar name="Vous" size="default" />
              <div className="flex-1">
                <Textarea
                  placeholder="Partagez votre expérience, posez une question..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-between items-center mt-sm">
                  <div className="flex gap-sm">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">image</span>
                    </button>
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">tag</span>
                    </button>
                  </div>
                  <Button
                    size="default"
                    onClick={handlePost}
                    disabled={!postContent.trim()}
                  >
                    Publier
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="flex gap-sm overflow-x-auto pb-xs scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-md py-xs rounded-full font-label-sm text-label-sm whitespace-nowrap transition-all",
                  activeFilter === filter
                    ? "bg-primary text-on-primary shadow-violet-sm"
                    : "bg-surface border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="flex flex-col gap-md">
            {localPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
              >
                <div className="flex items-start gap-md mb-md">
                  <Avatar
                    src={post.avatar || undefined}
                    name={post.author}
                    size="default"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-sm">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        {post.author}
                      </span>
                      <span className="text-sm">{post.country}</span>
                      <Badge variant="default" className="text-[10px]">
                        {post.tag}
                      </Badge>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {post.time}
                    </span>
                  </div>
                </div>

                <p className="font-body-md text-body-md text-on-surface mb-md leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center gap-lg pt-md border-t border-outline-variant">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={cn(
                      "flex items-center gap-xs font-label-sm text-label-sm transition-colors",
                      post.isLiked ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    )}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{
                        fontVariationSettings: post.isLiked ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      favorite
                    </span>
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors ml-auto">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    Partager
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-lg">
          {/* Active members */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
          >
            <h3 className="font-headline-lg text-[18px] text-on-surface font-bold mb-lg">
              Membres actifs
            </h3>
            <div className="space-y-md">
              {activeMembers.map((member) => (
                <div key={member.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <Avatar name={member.name} size="sm" />
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-semibold">
                        {member.name}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {member.country}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">{member.nclc}</Badge>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-lg text-on-primary"
          >
            <h3 className="font-headline-lg text-[18px] font-bold mb-md">
              La communauté en chiffres
            </h3>
            <div className="space-y-sm">
              {[
                { value: "12 847", label: "Membres actifs" },
                { value: "94%", label: "Taux de réussite" },
                { value: "47", label: "Pays représentés" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between">
                  <span className="font-label-md text-label-md text-on-primary/70">{stat.label}</span>
                  <span className="font-label-md text-label-md font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
