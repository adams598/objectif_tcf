"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { formatRelativeTime } from "@/lib/dashboard/stats";
import { useTranslation } from "@/components/providers/locale-provider";

export interface CommunityPost {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  likedByMe: boolean;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  _count: { likes: number; comments: number };
}

interface CommunityComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

interface PostCardProps {
  post: CommunityPost;
  index: number;
  filterKey: string;
}

export function PostCard({ post, index, filterKey }: PostCardProps) {
  const queryClient = useQueryClient();
  const { t, locale } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const getAuthorName = (author: CommunityPost["author"]) =>
    [author.firstName, author.lastName].filter(Boolean).join(" ") ||
    t("community.member");

  const likeMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ liked: boolean; likesCount: number }>(
        `/api/communaute/posts/${post.id}/like`,
        { method: "POST" }
      ),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["community-posts", filterKey],
      });
      const previous = queryClient.getQueryData<{
        posts: CommunityPost[];
      }>(["community-posts", filterKey]);

      queryClient.setQueryData<{ posts: CommunityPost[] }>(
        ["community-posts", filterKey],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            posts: old.posts.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    likedByMe: !p.likedByMe,
                    _count: {
                      ...p._count,
                      likes: p.likedByMe
                        ? p._count.likes - 1
                        : p._count.likes + 1,
                    },
                  }
                : p
            ),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["community-posts", filterKey],
          context.previous
        );
      }
      toast.error(t("community.likeError"));
    },
  });

  const commentsQuery = useQuery({
    queryKey: ["community-comments", post.id],
    queryFn: () =>
      fetchJson<{ comments: CommunityComment[] }>(
        `/api/communaute/posts/${post.id}/comments`
      ),
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      fetchJson<CommunityComment>(
        `/api/communaute/posts/${post.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["community-comments", post.id],
      });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      setCommentText("");
      toast.success(t("community.replyPosted"));
    },
    onError: () => toast.error(t("community.replyError")),
  });

  const handleToggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const comments = commentsQuery.data?.comments ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      className="bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm"
    >
      <div className="flex items-start gap-md mb-md">
        <Avatar
          src={post.author.avatarUrl}
          name={getAuthorName(post.author)}
          size="default"
        />
        <div className="flex-1">
          <div className="flex items-center gap-sm flex-wrap">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              {getAuthorName(post.author)}
            </span>
            {post.tags[0] && (
              <Badge variant="default" className="text-[10px]">
                {post.tags[0]}
              </Badge>
            )}
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {formatRelativeTime(new Date(post.createdAt), locale)}
          </span>
        </div>
      </div>

      <p className="font-body-md text-body-md text-on-surface mb-md leading-relaxed">
        {post.content}
      </p>

      <div className="flex items-center gap-lg pt-md border-t border-outline-variant">
        <button
          type="button"
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={cn(
            "flex items-center gap-xs font-label-sm text-label-sm transition-colors",
            post.likedByMe
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-[20px]",
              post.likedByMe && "filled"
            )}
          >
            favorite
          </span>
          {post._count.likes}
        </button>
        <button
          type="button"
          onClick={handleToggleComments}
          className={cn(
            "flex items-center gap-xs font-label-sm text-label-sm transition-colors",
            showComments
              ? "text-primary"
              : "text-on-surface-variant hover:text-primary"
          )}
        >
          <span className="material-symbols-outlined text-[20px]">
            chat_bubble_outline
          </span>
          {post._count.comments}
        </button>
      </div>

      {showComments && (
        <div className="mt-md pt-md border-t border-outline-variant space-y-md">
          {commentsQuery.isLoading ? (
            <div className="space-y-sm">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-surface-container animate-pulse"
                />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t("community.noComments")}
            </p>
          ) : (
            <div className="space-y-md">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-sm">
                  <Avatar
                    src={comment.author.avatarUrl}
                    name={getAuthorName(comment.author)}
                    size="sm"
                  />
                  <div className="flex-1 bg-surface-container rounded-xl px-md py-sm">
                    <div className="flex items-center gap-sm flex-wrap mb-xs">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        {getAuthorName(comment.author)}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {formatRelativeTime(
                          new Date(comment.createdAt),
                          locale
                        )}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-sm">
            <Textarea
              placeholder={t("community.replyPlaceholder")}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[60px] flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmitComment();
                }
              }}
            />
            <Button
              size="default"
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || commentMutation.isPending}
              className="self-end"
            >
              {commentMutation.isPending
                ? t("community.replying")
                : t("community.reply")}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
