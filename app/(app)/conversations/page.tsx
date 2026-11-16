"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Check, Clock, Send, Sparkles } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { useWorkspace } from "@/components/app/workspace-provider";
import type { ChatConversation, ConversationStatus } from "@/lib/agency-types";
import { cn } from "@/lib/utils";

const FILTERS: (ConversationStatus | "all")[] = ["all", "open", "pending", "resolved"];

const CHANNEL_ICON: Record<string, { icon: string; hue: number }> = {
  whatsapp: { icon: "message-circle", hue: 152 },
  instagram: { icon: "at-sign", hue: 320 },
  web: { icon: "globe", hue: 232 },
};

export default function ConversationsPage() {
  const { lang } = useLang();
  const { activeBusinessId, activeBusiness, businesses, refreshBusinesses } =
    useWorkspace();

  const [convs, setConvs] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConversationStatus | "all">("all");
  const [selId, setSelId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const m =
    lang === "tr"
      ? {
          title: activeBusiness ? `${activeBusiness.name} · Konuşmalar` : "Tüm Konuşmalar",
          sub: activeBusiness
            ? "Bu işletmeye gelen mesajlar ve AI yanıt taslakları."
            : "Ajans genelindeki tüm müşteri konuşmaları.",
          filters: { all: "Tümü", open: "Açık", pending: "Bekliyor", resolved: "Çözüldü" },
          empty: "Bu görünümde konuşma yok.",
          suggested: "AI önerisi",
          source: "Kaynak",
          conf: "güven",
          send: "Tek tıkla gönder",
          sendCustom: "Gönder",
          placeholder: "Yanıt yaz ya da AI önerisini kullan…",
          waiting: "dk bekliyor",
          resolved: "Çözüldü olarak işaretle",
        }
      : {
          title: activeBusiness ? `${activeBusiness.name} · Conversations` : "All Conversations",
          sub: activeBusiness
            ? "Inbound messages and AI reply drafts for this business."
            : "All client conversations across the agency.",
          filters: { all: "All", open: "Open", pending: "Pending", resolved: "Resolved" },
          empty: "No conversations in this view.",
          suggested: "AI suggestion",
          source: "Source",
          conf: "confidence",
          send: "Send in one tap",
          sendCustom: "Send",
          placeholder: "Write a reply or use the AI suggestion…",
          waiting: "min waiting",
          resolved: "Mark resolved",
        };

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeBusinessId ? `?businessId=${activeBusinessId}` : "";
      const res = await fetch(`/api/conversations${qs}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list: ChatConversation[] = data.conversations ?? [];
        setConvs(list);
        setSelId((prev) =>
          prev && list.some((c) => c.id === prev) ? prev : (list[0]?.id ?? null),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const visible =
    filter === "all" ? convs : convs.filter((c) => c.status === filter);
  const sel = visible.find((c) => c.id === selId) ?? visible[0] ?? null;

  async function sendReply(text: string) {
    if (!sel || !text.trim()) return;
    setSending(true);
    try {
      const nextMessages = [
        ...(sel.messages ?? []),
        {
          from: "agent" as const,
          text: text.trim(),
          at: new Date().toISOString(),
          ai: text.trim() === sel.suggested_reply,
        },
      ];
      const res = await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sel.id,
          status: "resolved",
          needs_intervention: false,
          unread: false,
          waiting_min: 0,
          last_message: text.trim(),
          messages: nextMessages,
        }),
      });
      if (res.ok) {
        setDraft("");
        await loadConversations();
        await refreshBusinesses();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">{m.title}</h2>
        <p className="text-sm text-muted-foreground">{m.sub}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f === "all" ? convs.length : convs.filter((c) => c.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {m.filters[f]} <span className="tnum opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {lang === "tr" ? "Konuşmalar yükleniyor…" : "Loading conversations…"}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          {m.empty}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-2">
            {visible.map((c) => {
              const ch = CHANNEL_ICON[c.channel] ?? CHANNEL_ICON.whatsapp;
              const bizName = businesses.find((b) => b.id === c.business_id)?.name;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-soft transition-colors",
                    sel?.id === c.id
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/30",
                  )}
                >
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                    {c.customer_initials}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-card ring-1 ring-border"
                      style={{ color: `oklch(56% 0.18 ${ch.hue})` }}
                    >
                      <Icon name={ch.icon} className="h-2.5 w-2.5" />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>
                        {c.customer_name}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground tnum">
                        {c.waiting_min}
                        {lang === "tr" ? "dk" : "m"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {c.last_message}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {!activeBusinessId && bizName && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {bizName}
                        </span>
                      )}
                      {c.needs_intervention && c.status !== "resolved" && (
                        <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          {lang === "tr" ? "Müdahale" : "Intervention"}
                        </span>
                      )}
                      <span className="truncate text-[11px] text-muted-foreground">
                        {c.intent}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {sel.customer_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {sel.customer_phone || sel.channel} · {sel.intent}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {sel.waiting_min} {m.waiting}
                    </span>
                  </div>
                </div>

                <div className="my-5 space-y-3">
                  {(sel.messages ?? []).map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        msg.from === "agent" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          msg.from === "agent"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {sel.suggested_reply && sel.status !== "resolved" && (
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" /> {m.suggested}
                      </span>
                      <span className="text-muted-foreground tnum">
                        %{sel.confidence} {m.conf}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      {sel.suggested_reply}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      {sel.suggested_source && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <BookOpen className="h-3 w-3" /> {m.source}: {sel.suggested_source}
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => void sendReply(sel.suggested_reply!)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" /> {m.send}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendReply(draft);
                }}
                className="mt-5 flex items-center gap-2 border-t border-border pt-4"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={m.placeholder}
                  className="h-10 flex-1 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {m.sendCustom}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
