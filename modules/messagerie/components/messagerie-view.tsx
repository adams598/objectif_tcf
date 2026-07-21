"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/api/fetch-json";
import { useTranslation } from "@/components/providers/locale-provider";
import { useRealtimeStream } from "@/lib/hooks/use-realtime-stream";

interface Conversation {
  contactId: string;
  contactName: string;
  contactAvatar: string | null;
  contactRole: string;
  lastMessage: string;
  lastMessageAt: string;
  time: string;
  unread: number;
}

interface ThreadMessage {
  id: string;
  from: "me" | "other";
  text: string;
  time: string;
}

interface ThreadResponse {
  contact: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  } | null;
  messages: ThreadMessage[];
}

export function MessagerieView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useRealtimeStream();

  const contactsQuery = useQuery({
    queryKey: ["message-contacts", contactSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (contactSearch.trim()) params.set("search", contactSearch.trim());
      return fetchJson<{
        contacts: Array<{
          id: string;
          name: string;
          avatarUrl: string | null;
          role: string;
          email: string;
        }>;
      }>(`/api/messagerie/contacts?${params}`);
    },
    enabled: showNewMessage,
  });

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: () =>
      fetchJson<{ conversations: Conversation[] }>("/api/messagerie").then(
        (res) => res.conversations
      ),
  });

  const threadQuery = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () =>
      fetchJson<ThreadResponse>(`/api/messagerie/${activeId}`),
    enabled: Boolean(activeId),
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      fetchJson("/api/messagerie", {
        method: "POST",
        body: JSON.stringify({ receiverId: activeId, content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setInputText("");
    },
    onError: () => toast.error(t("messaging.sendError")),
  });

  const conversations = conversationsQuery.data ?? [];
  const filteredConversations = conversations.filter((conv) =>
    conv.contactName.toLowerCase().includes(search.toLowerCase())
  );

  const activeConv = conversations.find((c) => c.contactId === activeId);
  const messages = threadQuery.data?.messages ?? [];
  const contact = threadQuery.data?.contact;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!inputText.trim() || !activeId) return;
    sendMutation.mutate(inputText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] rounded-2xl overflow-hidden border border-outline-variant shadow-violet-sm bg-surface">
      <div className="w-80 flex-shrink-0 border-r border-outline-variant flex flex-col bg-surface-container-lowest">
        <div className="p-md border-b border-outline-variant space-y-sm">
          <button
            type="button"
            onClick={() => setShowNewMessage(true)}
            className="w-full flex items-center justify-center gap-sm px-md py-sm rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit_square</span>
            Nouveau message
          </button>
          <div className="flex items-center gap-sm bg-surface-container rounded-xl px-md py-sm">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              className="flex-1 outline-none bg-transparent font-body-md text-body-md placeholder:text-on-surface-variant/50"
              placeholder={t("messaging.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="p-md space-y-md">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-md">
              <EmptyState
                icon="chat"
                title={t("messaging.noConversations")}
                description={t("messaging.noConversationsDesc")}
                className="py-lg"
              />
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.contactId}
                type="button"
                onClick={() => setActiveId(conv.contactId)}
                className={cn(
                  "w-full flex items-start gap-md p-md hover:bg-surface-container transition-colors text-left",
                  activeId === conv.contactId && "bg-secondary-container"
                )}
              >
                <Avatar
                  src={conv.contactAvatar}
                  name={conv.contactName}
                  size="default"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-xs">
                    <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                      {conv.contactName}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant ml-sm flex-shrink-0">
                      {conv.time}
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unread > 0 && (
                  <span className="bg-primary text-on-primary rounded-full w-5 h-5 flex items-center justify-center font-label-sm text-[10px] flex-shrink-0">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {activeConv && activeId ? (
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-outline-variant flex items-center gap-md px-lg">
            <Avatar
              src={contact?.avatarUrl ?? activeConv.contactAvatar}
              name={activeConv.contactName}
              size="default"
            />
            <div>
              <div className="font-label-md text-label-md font-semibold text-on-surface">
                {activeConv.contactName}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">
                {contact?.role ?? activeConv.contactRole}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-lg space-y-md">
            {threadQuery.isLoading ? (
              <div className="space-y-md">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-surface-container rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                icon="chat_bubble"
                title={t("messaging.noMessages")}
                description={t("messaging.noMessagesDesc")}
                className="h-full border-none bg-transparent"
              />
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-sm",
                      msg.from === "me" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {msg.from === "other" && (
                      <Avatar name={activeConv.contactName} size="sm" />
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] px-md py-sm rounded-2xl font-body-md text-body-md",
                        msg.from === "me"
                          ? "bg-primary text-on-primary rounded-tr-sm"
                          : "bg-surface-container text-on-surface rounded-tl-sm"
                      )}
                    >
                      {msg.text}
                      <div
                        className={cn(
                          "font-label-sm text-[10px] mt-xs",
                          msg.from === "me"
                            ? "text-on-primary/60 text-right"
                            : "text-on-surface-variant"
                        )}
                      >
                        {msg.time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-md border-t border-outline-variant flex gap-md items-end">
            <div className="flex-1 flex items-center gap-sm bg-surface-container rounded-2xl px-md py-sm">
              <input
                className="flex-1 outline-none bg-transparent font-body-md text-body-md placeholder:text-on-surface-variant/50"
                placeholder={t("messaging.inputPlaceholder")}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() || sendMutation.isPending}
              className="w-11 h-11 flex items-center justify-center bg-primary rounded-full text-on-primary disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="forum"
            title={t("messaging.selectConversation")}
            description={
              conversations.length === 0
                ? t("messaging.selectConversationEmpty")
                : t("messaging.selectConversationPick")
            }
            className="border-none bg-transparent max-w-md"
          />
        </div>
      )}

      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md">
          <div className="bg-surface rounded-2xl border border-outline-variant w-full max-w-md p-lg shadow-violet-md">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-headline-lg text-[18px] font-bold">Nouveau message</h2>
              <button
                type="button"
                onClick={() => setShowNewMessage(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <input
              className="w-full mb-md px-md py-sm rounded-xl border border-outline-variant bg-surface-container font-body-md"
              placeholder="Rechercher un contact…"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-xs">
              {contactsQuery.isLoading ? (
                <p className="text-center text-on-surface-variant py-md animate-pulse">
                  Chargement…
                </p>
              ) : (contactsQuery.data?.contacts.length ?? 0) === 0 ? (
                <p className="text-center text-on-surface-variant py-md">
                  Aucun contact trouvé.
                </p>
              ) : (
                contactsQuery.data?.contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setActiveId(contact.id);
                      setShowNewMessage(false);
                      setContactSearch("");
                    }}
                    className="w-full flex items-center gap-sm p-sm rounded-xl hover:bg-surface-container text-left"
                  >
                    <Avatar src={contact.avatarUrl} name={contact.name} size="sm" />
                    <div>
                      <p className="font-label-md font-semibold">{contact.name}</p>
                      <p className="font-label-sm text-on-surface-variant">{contact.role}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
