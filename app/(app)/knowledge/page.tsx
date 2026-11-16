"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { useWorkspace } from "@/components/app/workspace-provider";
import type { KnowledgeArticle } from "@/lib/agency-types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function KnowledgePage() {
  const { lang } = useLang();
  const { activeBusinessId, activeBusiness, businesses, refreshBusinesses } =
    useWorkspace();

  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Genel");
  const [content, setContent] = useState("");
  const [targetBizId, setTargetBizId] = useState("");
  const [saving, setSaving] = useState(false);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeBusinessId ? `?businessId=${activeBusinessId}` : "";
      const res = await fetch(`/api/knowledge${qs}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    setTargetBizId(activeBusinessId || businesses[0]?.id || "");
  }, [activeBusinessId, businesses]);

  const filtered = articles.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const bizId = activeBusinessId || targetBizId;
    if (!bizId || !title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: bizId,
          title: title.trim(),
          category: category.trim() || "Genel",
          content: content.trim(),
        }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setModalOpen(false);
        await loadArticles();
        await refreshBusinesses();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadArticles();
      await refreshBusinesses();
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {activeBusiness
              ? `${activeBusiness.name} · ${lang === "tr" ? "Bilgi Tabanı" : "Knowledge Base"}`
              : lang === "tr"
                ? "Bilgi Tabanı"
                : "Knowledge Base"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === "tr"
              ? "AI yanıtları yalnızca buradaki makalelerden beslenir."
              : "AI replies are strictly grounded in these articles."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={businesses.length === 0}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {lang === "tr" ? "Makale Ekle" : "Add Article"}
        </button>
      </div>

      <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={lang === "tr" ? "Makalelerde ara…" : "Search articles…"}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {lang === "tr" ? "Makaleler yükleniyor…" : "Loading articles…"}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          {lang === "tr"
            ? "Bu işletme için henüz bilgi tabanı makalesi bulunmuyor."
            : "No knowledge base articles found for this business."}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((a) => {
            const bizName = businesses.find((b) => b.id === a.business_id)?.name;
            return (
              <article
                key={a.id}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-pop"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold tracking-tight">
                        {a.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => void handleDelete(a.id)}
                        className="cursor-pointer rounded-md p-1 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title={lang === "tr" ? "Sil" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {a.category}
                      </span>
                      {!activeBusinessId && bizName && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {bizName}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {a.content}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-pop">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                {lang === "tr" ? "Yeni Bilgi Tabanı Makalesi" : "New Knowledge Article"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              {!activeBusinessId && (
                <div className="space-y-1.5">
                  <Label>{lang === "tr" ? "İşletme" : "Business"}</Label>
                  <select
                    value={targetBizId}
                    onChange={(e) => setTargetBizId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{lang === "tr" ? "Başlık *" : "Title *"}</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={lang === "tr" ? "Örn. İade Politikası" : "e.g. Refund Policy"}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "tr" ? "Kategori" : "Category"}</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Genel, Fiyatlandırma, Randevu…"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{lang === "tr" ? "İçerik *" : "Content *"}</Label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    lang === "tr"
                      ? "Botun müşterilere vereceği kesin ve doğru bilgiyi yazın…"
                      : "Write the exact policy or FAQ details the bot should use…"
                  }
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  {lang === "tr" ? "Vazgeç" : "Cancel"}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {lang === "tr" ? "Kaydediliyor…" : "Saving…"}
                    </>
                  ) : lang === "tr" ? (
                    "Makaleyi Kaydet"
                  ) : (
                    "Save Article"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
