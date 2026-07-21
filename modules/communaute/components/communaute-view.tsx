"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useTranslation } from "@/components/providers/locale-provider";
import { PostCard, type CommunityPost } from "./post-card";

const FILTER_DEFS = [
  { id: "all", tag: null, labelKey: "community.filterAll" },
  { id: "tcf", tag: "TCF Canada", labelKey: "community.filterTcf" },
  { id: "tef", tag: "TEF Canada", labelKey: "community.filterTef" },
  { id: "ielts", tag: "IELTS", labelKey: "community.filterIelts" },
  { id: "visa", tag: "Visa", labelKey: "community.filterVisa" },
  { id: "studies", tag: "Études", labelKey: "community.filterStudies" },
] as const;

interface CommunityStats {
  memberCount: number;
  postCount: number;
  activeMembers: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    country: string;
    level: string | null;
  }>;
  activeThisWeek: number;
}

export function CommunauteView() {
  const queryClient = useQueryClient();
  const { profile } = useUserPreferences();
  const { displayName, avatarUrl } = useCurrentUser();
  const { t, locale } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");
  const [postContent, setPostContent] = useState("");

  const activeFilterDef = FILTER_DEFS.find((f) => f.id === activeFilter)!;

  const postsQuery = useQuery({
    queryKey: ["community-posts", activeFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "20" });
      if (activeFilterDef.tag) params.set("tag", activeFilterDef.tag);
      return fetchJson<{
        posts: CommunityPost[];
        pagination: { total: number };
      }>(`/api/communaute/posts?${params.toString()}`);
    },
  });

  const statsQuery = useQuery({
    queryKey: ["community-stats"],
    queryFn: () => fetchJson<CommunityStats>("/api/communaute/stats"),
  });

  const createPostMutation = useMutation({
    mutationFn: (content: string) =>
      fetchJson<CommunityPost>("/api/communaute/posts", {
        method: "POST",
        body: JSON.stringify({
          content,
          tags: [activeFilterDef.tag ?? "TCF Canada"],
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["community-stats"] });
      setPostContent("");
      toast.success(t("community.postCreated"));
    },
    onError: () => toast.error(t("community.postError")),
  });

  const handlePost = () => {
    if (!postContent.trim()) return;
    createPostMutation.mutate(postContent.trim());
  };

  const posts = postsQuery.data?.posts ?? [];
  const stats = statsQuery.data;
  const userName = displayName || profile?.email || t("community.you");

  return (
    <div className="flex flex-col gap-xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          {t("community.title")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("community.subtitle")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <div className="lg:col-span-8 flex flex-col gap-lg">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
          >
            <div className="flex gap-md">
              <Avatar
                src={avatarUrl ?? profile?.avatarUrl}
                name={userName}
                size="default"
              />
              <div className="flex-1">
                <Textarea
                  placeholder={t("community.postPlaceholder")}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end mt-sm">
                  <Button
                    size="default"
                    onClick={handlePost}
                    disabled={
                      !postContent.trim() || createPostMutation.isPending
                    }
                  >
                    {createPostMutation.isPending
                      ? t("community.publishing")
                      : t("community.publish")}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-sm overflow-x-auto pb-xs">
            {FILTER_DEFS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "px-md py-xs rounded-full font-label-sm text-label-sm whitespace-nowrap transition-all",
                  activeFilter === filter.id
                    ? "bg-primary text-on-primary shadow-violet-sm"
                    : "bg-surface border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                )}
              >
                {t(filter.labelKey)}
              </button>
            ))}
          </div>

          {postsQuery.isLoading ? (
            <div className="space-y-md">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-2xl p-lg border border-outline-variant h-40 animate-pulse"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="forum"
              title={t("community.noPosts")}
              description={t("community.noPostsDesc")}
            />
          ) : (
            <div className="flex flex-col gap-md">
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  filterKey={activeFilter}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:flex lg:col-span-4 flex-col gap-lg">
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
          >
            <h3 className="font-headline-lg text-[18px] text-on-surface font-bold mb-lg">
              {t("community.activeMembers")}
            </h3>
            {(stats?.activeMembers.length ?? 0) === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("community.noActiveMembers")}
              </p>
            ) : (
              <div className="space-y-md">
                {stats!.activeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-sm">
                      <Avatar
                        src={member.avatarUrl}
                        name={member.name}
                        size="sm"
                      />
                      <div>
                        <p className="font-label-md text-label-md text-on-surface font-semibold">
                          {member.name}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {member.country}
                        </p>
                      </div>
                    </div>
                    {member.level && (
                      <Badge variant="default">{member.level}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-lg text-on-primary"
          >
            <h3 className="font-headline-lg text-[18px] font-bold mb-md">
              {t("community.statsTitle")}
            </h3>
            <div className="space-y-sm">
              {[
                {
                  value: (stats?.memberCount ?? 0).toLocaleString(locale),
                  label: t("community.membersRegistered"),
                },
                {
                  value: String(stats?.postCount ?? 0),
                  label: t("community.posts"),
                },
                {
                  value: String(stats?.activeThisWeek ?? 0),
                  label: t("community.activeThisWeek"),
                },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between">
                  <span className="font-label-md text-label-md text-on-primary/70">
                    {stat.label}
                  </span>
                  <span className="font-label-md text-label-md font-bold">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
