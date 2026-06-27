"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  from: "me" | "other";
  text: string;
  time: string;
}

interface Conversation {
  id: number;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

const conversations: Conversation[] = [
  {
    id: 1,
    name: "Sophie Berger",
    role: "Correctrice certifiée",
    avatar: "",
    lastMessage: "Votre lettre de motivation est très bien rédigée !",
    time: "14:32",
    unread: 2,
    messages: [
      { id: 1, from: "other", text: "Bonjour ! J'ai terminé la correction de votre EE.", time: "14:10" },
      { id: 2, from: "other", text: "Votre lettre de motivation est très bien rédigée !", time: "14:32" },
      { id: 3, from: "me", text: "Merci beaucoup Sophie ! Des points à améliorer ?", time: "14:35" },
    ],
  },
  {
    id: 2,
    name: "Ahmed Benali",
    role: "Étudiant · NCLC 8",
    avatar: "",
    lastMessage: "Tu as des ressources pour la CE ?",
    time: "12:15",
    unread: 0,
    messages: [
      { id: 1, from: "other", text: "Salut ! Tu as des ressources pour la CE ?", time: "12:15" },
    ],
  },
  {
    id: 3,
    name: "Équipe Objectif Canada",
    role: "Support",
    avatar: "",
    lastMessage: "Votre abonnement a été renouvelé avec succès.",
    time: "Hier",
    unread: 0,
    messages: [
      { id: 1, from: "other", text: "Votre abonnement a été renouvelé avec succès.", time: "Hier" },
    ],
  },
];

export function MessagerieView() {
  const [activeId, setActiveId] = useState<number>(conversations[0].id);
  const [inputText, setInputText] = useState("");
  const [allConvs, setAllConvs] = useState(conversations);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = allConvs.find((c) => c.id === activeId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setAllConvs((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage: inputText,
              time: "À l'instant",
              messages: [
                ...c.messages,
                { id: Date.now(), from: "me", text: inputText, time: "À l'instant" },
              ],
            }
          : c
      )
    );
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] rounded-2xl overflow-hidden border border-outline-variant shadow-violet-sm bg-surface">
      {/* Sidebar: conversation list */}
      <div className="w-80 flex-shrink-0 border-r border-outline-variant flex flex-col bg-surface-container-lowest">
        {/* Search */}
        <div className="p-md border-b border-outline-variant">
          <div className="flex items-center gap-sm bg-surface-container rounded-xl px-md py-sm">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
            <input
              className="flex-1 outline-none bg-transparent font-body-md text-body-md placeholder:text-on-surface-variant/50"
              placeholder="Rechercher..."
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {allConvs.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={cn(
                "w-full flex items-start gap-md p-md hover:bg-surface-container transition-colors text-left",
                activeId === conv.id && "bg-secondary-container"
              )}
            >
              <Avatar name={conv.name} size="default" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-xs">
                  <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                    {conv.name}
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
          ))}
        </div>
      </div>

      {/* Chat panel */}
      {activeConv ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="h-16 border-b border-outline-variant flex items-center gap-md px-lg">
            <Avatar name={activeConv.name} size="default" />
            <div>
              <div className="font-label-md text-label-md font-semibold text-on-surface">
                {activeConv.name}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">
                {activeConv.role}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-lg space-y-md">
            <AnimatePresence initial={false}>
              {activeConv.messages.map((msg) => (
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
                    <Avatar name={activeConv.name} size="sm" />
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
                        msg.from === "me" ? "text-on-primary/60 text-right" : "text-on-surface-variant"
                      )}
                    >
                      {msg.time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-md border-t border-outline-variant flex gap-md items-end">
            <div className="flex-1 flex items-center gap-sm bg-surface-container rounded-2xl px-md py-sm">
              <input
                className="flex-1 outline-none bg-transparent font-body-md text-body-md placeholder:text-on-surface-variant/50"
                placeholder="Écrivez un message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-11 h-11 flex items-center justify-center bg-primary rounded-full text-on-primary disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-on-surface-variant">
          Sélectionnez une conversation
        </div>
      )}
    </div>
  );
}
