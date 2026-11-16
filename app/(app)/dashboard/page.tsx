"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquareWarning,
  MessagesSquare,
  Plus,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useWorkspace } from "@/components/app/workspace-provider";
import { useLang } from "@/components/i18n/language-provider";
import type { ChatConversation, KnowledgeArticle } from "@/lib/agency-types";
import { cn } from "@/lib/utils";

function WhatsAppBadge({ status, lang }: { status: string; lang: "tr" | "en" }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <Wifi className="h-3 w-3" />
        {lang === "tr" ? "Bağlı" : "Connected"}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/12 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400">
        <WifiOff className="h-3 w-3" />
        {lang === "tr" ? "Bağlantı Hatası" : "Connection Error"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
      <Clock className="h-3 w-3" />
      {lang === "tr" ? "Kurulum Bekliyor" : "Setup Pending"}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { lang } = useLang();
  const {
    businesses,
    loading,
    activeBusinessId,
    activeBusiness,
    setActiveBusinessId,
    setAddModalOpen,
  } = useWorkspace();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadDetails() {
      const qs = activeBusinessId ? `?businessId=${activeBusinessId}` : "";
      const [cRes, kRes] = await Promise.all([
        fetch(`/api/conversations${qs}`, { cache: "no-store" }),
        fetch(`/api/knowledge${qs}`, { cache: "no-store" }),
      ]);
      if (cancelled) return;
      if (cRes.ok) {
        const cData = await cRes.json();
        setConversations(cData.conversations ?? []);
      }
      if (kRes.ok) {
        const kData = await kRes.json();
        setArticles(kData.articles ?? []);
      }
    }
    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [activeBusinessId, businesses.length]);

  const agencyStats = useMemo(() => {
    const totalBusinesses = businesses.length;
    const activeBots = businesses.filter(
      (b) => b.whatsapp_status === "connected" && b.bot_active,
    ).length;
    const pendingOrErrorBots = businesses.filter(
      (b) => b.whatsapp_status !== "connected" || !b.bot_active,
    ).length;
    const interventionConvs = conversations.filter(
      (c) => c.needs_intervention && c.status !== "resolved",
    );
    return {
      totalBusinesses,
      activeBots,
      pendingOrErrorBots,
      interventionCount: interventionConvs.length,
      interventionConvs,
    };
  }, [businesses, conversations]);

  const todoAlerts = useMemo(() => {
    const items: {
      id: string;
      severity: "error" | "warning" | "info";
      title: string;
      desc: string;
      businessId: string;
      businessName: string;
      href: string;
      cta: string;
    }[] = [];

    for (const c of agencyStats.interventionConvs) {
      const biz = businesses.find((b) => b.id === c.business_id);
      if (!biz) continue;
      items.push({
        id: `conv-${c.id}`,
        severity: "error",
        title:
          lang === "tr"
            ? `Müdahale Bekleyen Konuşma: ${c.customer_name}`
            : `Intervention Needed: ${c.customer_name}`,
        desc: c.last_message,
        businessId: biz.id,
        businessName: biz.name,
        href: "/conversations",
        cta: lang === "tr" ? "Konuşmayı Aç →" : "Open Chat →",
      });
    }

    for (const b of businesses) {
      if (b.whatsapp_status === "error" || b.whatsapp_status === "pending") {
        items.push({
          id: `wa-${b.id}`,
          severity: b.whatsapp_status === "error" ? "error" : "warning",
          title:
            b.whatsapp_status === "error"
              ? lang === "tr"
                ? `WhatsApp Bot Hatası: ${b.name}`
                : `WhatsApp Bot Error: ${b.name}`
              : lang === "tr"
                ? `WhatsApp Kurulumu Tamamlanmamış: ${b.name}`
                : `WhatsApp Setup Pending: ${b.name}`,
          desc:
            lang === "tr"
              ? "Müşteri mesajlarının akması için WhatsApp numarasını bağlayın ve botu aktifleştirin."
              : "Connect a WhatsApp number and activate the bot to start handling messages.",
          businessId: b.id,
          businessName: b.name,
          href: "/settings",
          cta: lang === "tr" ? "Ayarları Aç →" : "Open Settings →",
        });
      }

      const count = b.article_count ?? 0;
      if (count < 2) {
        items.push({
          id: `kb-${b.id}`,
          severity: "warning",
          title:
            lang === "tr"
              ? `Eksik Bilgi Tabanı: ${b.name} (${count} makale)`
              : `Incomplete Knowledge Base: ${b.name} (${count} articles)`,
          desc:
            lang === "tr"
              ? "AI botun doğru yanıt verebilmesi için en az 2 SSS veya fiyat/politika makalesi ekleyin."
              : "Add at least 2 FAQ or policy articles so the AI bot can answer accurately.",
          businessId: b.id,
          businessName: b.name,
          href: "/knowledge",
          cta: lang === "tr" ? "Bilgi Tabanına Git →" : "Go to Knowledge →",
        });
      }
    }

    return items;
  }, [agencyStats.interventionConvs, businesses, lang]);

  function openWorkspace(businessId: string, href = "/dashboard") {
    setActiveBusinessId(businessId);
    if (href !== "/dashboard") {
      router.push(href);
    }
  }

  // ── 1. BUSINESS WORKSPACE VIEW ──────────────────────────────────────────────
  if (activeBusiness) {
    const openConvs = conversations.filter((c) => c.status !== "resolved");
    const interventionCount = openConvs.filter((c) => c.needs_intervention).length;

    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveBusinessId(null)}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {lang === "tr" ? "Ajans Genel Bakışına Dön" : "Back to Agency Overview"}
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {activeBusiness.name}
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {activeBusiness.sector}
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {activeBusiness.package_type}
              </span>
              <WhatsAppBadge status={activeBusiness.whatsapp_status} lang={lang} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              {lang === "tr" ? "Bilgi Tabanı" : "Knowledge Base"}
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              {lang === "tr" ? "Bot Ayarları" : "Bot Settings"}
            </Link>
            <Link
              href="/conversations"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <MessagesSquare className="h-4 w-4" />
              {lang === "tr" ? "Konuşmalar" : "Conversations"}
            </Link>
          </div>
        </div>

        {/* Business KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-medium text-muted-foreground">
              {lang === "tr" ? "Açık Konuşmalar" : "Open Chats"}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tnum">
              {openConvs.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === "tr" ? "aktif müşteri talebi" : "active customer threads"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-medium text-muted-foreground">
              {lang === "tr" ? "Müdahale Bekleyen" : "Needs Intervention"}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tnum text-rose-500">
              {interventionCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === "tr" ? "insan onayı gerekiyor" : "human review needed"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-medium text-muted-foreground">
              {lang === "tr" ? "Bilgi Tabanı" : "Knowledge Base"}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tnum text-primary">
              {articles.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === "tr" ? "aktif makale" : "published articles"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-medium text-muted-foreground">
              {lang === "tr" ? "AI Bot Durumu" : "AI Bot Status"}
            </p>
            <p className="mt-2 flex items-center gap-2 font-display text-2xl font-semibold">
              <Bot className={cn("h-6 w-6", activeBusiness.bot_active ? "text-emerald-500" : "text-amber-500")} />
              {activeBusiness.bot_active
                ? lang === "tr"
                  ? "Aktif"
                  : "Active"
                : lang === "tr"
                  ? "Pasif"
                  : "Paused"}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {activeBusiness.whatsapp_number || (lang === "tr" ? "Numara tanımlanmadı" : "No number set")}
            </p>
          </div>
        </div>

        {/* Two columns: Recent Conversations & Knowledge Articles */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="font-display text-base font-semibold">
                  {lang === "tr" ? "Son Konuşmalar & AI Önerileri" : "Recent Chats & AI Drafts"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lang === "tr"
                    ? "Bu işletmeye gelen son müşteri mesajları"
                    : "Latest customer messages for this business"}
                </p>
              </div>
              <Link
                href="/conversations"
                className="text-xs font-semibold text-primary hover:underline"
              >
                {lang === "tr" ? "Tümünü Gör →" : "View All →"}
              </Link>
            </div>

            {conversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {lang === "tr"
                  ? "Bu işletme için henüz konuşma kaydı yok."
                  : "No conversations yet for this business."}
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border p-4 transition hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {c.customer_initials}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{c.customer_name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.intent}</p>
                        </div>
                      </div>
                      {c.needs_intervention && c.status !== "resolved" && (
                        <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                          {lang === "tr" ? "Müdahale Bekliyor" : "Needs Intervention"}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{c.last_message}</p>
                    {c.suggested_reply && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-primary/5 p-2.5 text-xs">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="text-foreground/90">{c.suggested_reply}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="font-display text-base font-semibold">
                  {lang === "tr" ? "Bilgi Tabanı Makaleleri" : "Knowledge Base Articles"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lang === "tr"
                    ? "AI botun yanıt üretirken kullandığı kaynaklar"
                    : "Sources used by the AI bot to draft replies"}
                </p>
              </div>
              <Link
                href="/knowledge"
                className="text-xs font-semibold text-primary hover:underline"
              >
                {lang === "tr" ? "Yönet →" : "Manage →"}
              </Link>
            </div>

            {articles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {lang === "tr"
                    ? "Henüz bilgi tabanı makalesi eklenmemiş."
                    : "No knowledge base articles added yet."}
                </p>
                <Link
                  href="/knowledge"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "tr" ? "İlk Makaleyi Ekle" : "Add First Article"}
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {articles.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-border p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {a.category}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {a.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // ── 2. AGENCY COMMAND CENTER (TOP-LEVEL OVERVIEW) ───────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Layers className="h-3.5 w-3.5" />
            {lang === "tr" ? "Takvim 360 · B2B AI Ajans" : "Takvim 360 · B2B AI Agency"}
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {lang === "tr" ? "Ajans Komuta Merkezi" : "Agency Command Center"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === "tr"
              ? "Yönettiğiniz tüm müşteri işletmeleri, WhatsApp bot durumları ve müdahale gerektiren konuşmalar tek ekranda."
              : "All managed client businesses, WhatsApp bot statuses, and conversations needing intervention in one view."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {lang === "tr" ? "İşletme Ekle" : "Add Business"}
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === "tr" ? "Toplam İşletme Sayısı" : "Total Businesses"}
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-semibold tnum">
            {loading ? "—" : agencyStats.totalBusinesses}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {agencyStats.activeBots}
            </span>{" "}
            {lang === "tr" ? "aktif WhatsApp AI botu çalışıyor" : "active WhatsApp AI bots"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === "tr"
                ? "Kurulum Bekleyen / Hatalı Botlar"
                : "Pending / Faulty Bots"}
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-semibold tnum text-amber-600 dark:text-amber-400">
            {loading ? "—" : agencyStats.pendingOrErrorBots}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {lang === "tr"
              ? "WhatsApp bağlantısı veya aktivasyon bekliyor"
              : "Awaiting WhatsApp connection or activation"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === "tr"
                ? "Bugün Müdahale Gerektiren Konuşmalar"
                : "Interventions Needed Today"}
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400">
              <MessageSquareWarning className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-semibold tnum text-rose-600 dark:text-rose-400">
            {loading ? "—" : agencyStats.interventionCount}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {lang === "tr"
              ? "müşteri temsilcisi onayı veya yanıtı bekliyor"
              : "waiting for human review or reply"}
          </p>
        </div>
      </div>

      {/* Middle: Managed Businesses Table */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h3 className="font-display text-base font-semibold">
              {lang === "tr" ? "Yönetilen Müşteri İşletmeleri" : "Managed Client Businesses"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "tr"
                ? "Bir işletmenin gelen kutusunu, bilgi tabanını ve bot ayarlarını yönetmek için çalışma alanını açın."
                : "Open a business workspace to manage its inbox, knowledge base, and bot settings."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {lang === "tr" ? "İşletmeler yükleniyor…" : "Loading businesses…"}
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">
              {lang === "tr" ? "Henüz kayıtlı işletme yok" : "No businesses registered yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === "tr"
                ? "İlk müşteri işletmenizi ekleyerek ajans komuta merkezini başlatın."
                : "Add your first client business to get started."}
            </p>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              {lang === "tr" ? "İlk İşletmeyi Ekle" : "Add First Business"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3.5">
                    {lang === "tr" ? "İşletme Adı" : "Business Name"}
                  </th>
                  <th className="px-4 py-3.5">
                    {lang === "tr" ? "Sektör" : "Sector"}
                  </th>
                  <th className="px-4 py-3.5">
                    {lang === "tr" ? "Paket Tipi" : "Package"}
                  </th>
                  <th className="px-4 py-3.5">
                    {lang === "tr" ? "WhatsApp Durumu" : "WhatsApp Status"}
                  </th>
                  <th className="px-4 py-3.5">
                    {lang === "tr" ? "Bilgi / Kuyruk" : "KB / Queue"}
                  </th>
                  <th className="px-6 py-3.5 text-right">
                    {lang === "tr" ? "İşlem" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {businesses.map((b) => (
                  <tr key={b.id} className="transition hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 font-semibold text-primary">
                          {b.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.whatsapp_number || b.phone || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{b.sector}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
                        {b.package_type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <WhatsAppBadge status={b.whatsapp_status} lang={lang} />
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground tnum">
                      <span>{b.article_count ?? 0} {lang === "tr" ? "makale" : "articles"}</span>
                      <span className="mx-1.5">·</span>
                      <span className={cn((b.intervention_count ?? 0) > 0 && "font-semibold text-rose-500")}>
                        {b.open_conversations ?? 0} {lang === "tr" ? "açık" : "open"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openWorkspace(b.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                      >
                        {lang === "tr" ? "Çalışma Alanını Aç" : "Open Workspace"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom: Today's To-Do & Missing Knowledge Base Alerts */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h3 className="font-display text-base font-semibold">
              {lang === "tr"
                ? "Bugün Yapılması Gerekenler / Eksik Bilgi Tabanı Uyarıları"
                : "Today's Action Items & Missing Knowledge Base Alerts"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "tr"
                ? "Tüm portföy genelinde acil müdahale, kurulum ve bilgi tabanı eksiklikleri"
                : "Urgent interventions, setup tasks, and knowledge gaps across your portfolio"}
            </p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tnum">
            {todoAlerts.length}
          </span>
        </div>

        {todoAlerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              {lang === "tr"
                ? "Harika! Tüm işletmelerin botları bağlı, bilgi tabanları hazır ve bekleyen acil müdahale yok."
                : "All client bots are connected, knowledge bases are ready, and no urgent interventions remain."}
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todoAlerts.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-border p-4 transition hover:bg-muted/30 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      item.severity === "error"
                        ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {item.businessName}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openWorkspace(item.businessId, item.href)}
                  className="shrink-0 cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary"
                >
                  {item.cta}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
