"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { fetchJson } from "@/lib/api/fetch-json";
import { dateLocaleTag } from "@/lib/i18n/locales";

interface AdminPost {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  author: { id: string; name: string; email: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
}

interface PostsResponse {
  posts: AdminPost[];
  meta: { total: number; page: number; totalPages: number };
}

export function CommunauteAdminView() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin-community-posts", page],
    queryFn: () =>
      fetchJson<PostsResponse>(`/api/admin/communaute/posts?page=${page}`),
  });

  const deletePost = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/communaute/posts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-posts"] });
      toast.success(t("admin.communityDeleted"));
    },
    onError: () => toast.error(t("admin.communityDeleteError")),
  });

  const { posts = [], meta = { total: 0, page: 1, totalPages: 1 } } = query.data ?? {};

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md font-bold mb-xs">
          {t("admin.communityTitle")}
        </h1>
        <p className="font-body-md text-on-surface-variant">
          {t("admin.communitySubtitle", { n: meta.total })}
        </p>
      </div>

      <div className="space-y-md">
        {query.isLoading ? (
          <div className="p-xl text-center animate-pulse text-on-surface-variant">
            {t("admin.loading")}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">
            {t("admin.communityNone")}
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-surface border border-outline-variant rounded-2xl p-lg"
            >
              <div className="flex items-start justify-between gap-md mb-md">
                <div className="flex items-center gap-sm">
                  <Avatar src={post.author.avatarUrl ?? undefined} name={post.author.name} size="sm" />
                  <div>
                    <p className="font-label-md font-semibold">{post.author.name}</p>
                    <p className="font-label-sm text-on-surface-variant">{post.author.email}</p>
                  </div>
                </div>
                <span className="font-label-sm text-on-surface-variant">
                  {new Date(post.createdAt).toLocaleDateString(
                    dateLocaleTag(locale)
                  )}
                </span>
              </div>
              <p className="font-body-md mb-md whitespace-pre-wrap">{post.content}</p>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant">
                  {t("admin.communityStats", {
                    likes: post._count.likes,
                    comments: post._count.comments,
                  })}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => deletePost.mutate(post.id)}
                  disabled={deletePost.isPending}
                >
                  {t("admin.delete")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-sm">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t("exam.previous")}
          </Button>
          <span className="px-md py-xs font-label-sm text-on-surface-variant">
            {t("admin.pageOf", { page, total: meta.totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("exam.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
