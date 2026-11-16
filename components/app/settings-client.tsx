"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Database, Loader2, Save } from "lucide-react";
import appConfig from "@/app.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { useWorkspace } from "@/components/app/workspace-provider";

export function SettingsClient({ connected }: { connected: Record<string, boolean> }) {
  const { lang, ui } = useLang();
  const { activeBusiness, refreshBusinesses, dbHealth } = useWorkspace();

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState("pending");
  const [packageType, setPackageType] = useState("Ekip");
  const [botActive, setBotActive] = useState(false);
  const [autoReply, setAutoReply] = useState(false);
  const [aiTone, setAiTone] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (activeBusiness) {
      setWhatsappNumber(activeBusiness.whatsapp_number || "");
      setWhatsappStatus(activeBusiness.whatsapp_status || "pending");
      setPackageType(activeBusiness.package_type || "Ekip");
      setBotActive(Boolean(activeBusiness.bot_active));
      setAutoReply(Boolean(activeBusiness.auto_reply));
      setAiTone(activeBusiness.ai_tone || "");
      setSystemPrompt(activeBusiness.system_prompt || "");
      setSavedMsg(false);
    }
  }, [activeBusiness]);

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!activeBusiness) return;
    setSaving(true);
    setSavedMsg(false);
    try {
      const res = await fetch(`/api/businesses/${activeBusiness.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_number: whatsappNumber.trim(),
          whatsapp_status: whatsappStatus,
          package_type: packageType,
          bot_active: botActive,
          auto_reply: autoReply,
          ai_tone: aiTone.trim(),
          system_prompt: systemPrompt.trim(),
        }),
      });
      if (res.ok) {
        await refreshBusinesses();
        setSavedMsg(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {activeBusiness && (
        <form onSubmit={handleSaveBusiness}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeBusiness.name} ·{" "}
                {lang === "tr" ? "Bot & WhatsApp Ayarları" : "Bot & WhatsApp Settings"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {lang === "tr"
                  ? "Bu işletmenin WhatsApp hattını, paketini ve AI sistem talimatlarını yönetin."
                  : "Manage this client's WhatsApp line, package tier, and AI instructions."}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>{lang === "tr" ? "WhatsApp Numarası" : "WhatsApp Number"}</Label>
                  <Input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "tr" ? "Bağlantı Durumu" : "Connection Status"}</Label>
                  <select
                    value={whatsappStatus}
                    onChange={(e) => setWhatsappStatus(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="connected">{lang === "tr" ? "Bağlı" : "Connected"}</option>
                    <option value="pending">{lang === "tr" ? "Kurulum Bekliyor" : "Pending"}</option>
                    <option value="error">{lang === "tr" ? "Hata" : "Error"}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "tr" ? "Paket Tipi" : "Package"}</Label>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="Başlangıç">Başlangıç</option>
                    <option value="Ekip">Ekip</option>
                    <option value="İşletme">İşletme</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3.5">
                  <div>
                    <p className="text-sm font-medium">
                      {lang === "tr" ? "WhatsApp Botu Aktif" : "WhatsApp Bot Active"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lang === "tr"
                        ? "Gelen mesajlara AI taslağı üret"
                        : "Draft AI replies for inbound messages"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={botActive}
                    onChange={(e) => setBotActive(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3.5">
                  <div>
                    <p className="text-sm font-medium">
                      {lang === "tr" ? "Tam Otomatik Yanıt" : "Auto-Reply Mode"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lang === "tr"
                        ? "Yüksek güvenli yanıtları onaysız gönder"
                        : "Send high-confidence replies automatically"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoReply}
                    onChange={(e) => setAutoReply(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>{lang === "tr" ? "Marka İletişim Tonu" : "Brand Tone"}</Label>
                <Input
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{lang === "tr" ? "Sistem Talimatı (System Prompt)" : "System Prompt"}</Label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedMsg ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {lang === "tr" ? "Değişiklikler Supabase'e kaydedildi." : "Saved to Supabase."}
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {lang === "tr" ? "Kaydediliyor…" : "Saving…"}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {ui.saveChanges}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Supabase & Database Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {lang === "tr" ? "Veritabanı & Altyapı Durumu" : "Database & Infrastructure Status"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang === "tr"
              ? "Multi-tenant Supabase tabloları ve bağlantı durumu."
              : "Multi-tenant Supabase tables and connection health."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Supabase PostgreSQL</p>
              <p className="text-xs text-muted-foreground">
                {dbHealth?.ready
                  ? lang === "tr"
                    ? "businesses, knowledge_articles ve chat_conversations tabloları aktif ve hazır."
                    : "businesses, knowledge_articles, and chat_conversations tables are active."
                  : lang === "tr"
                    ? "Tablo durumu kontrol ediliyor…"
                    : "Checking table status…"}
              </p>
            </div>
            {connected.supabase && dbHealth?.ready ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {ui.connected}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <CircleDashed className="h-4 w-4" /> {dbHealth?.configured ? "Checking" : ui.demoMode}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>{ui.integrations}</CardTitle>
          <p className="text-sm text-muted-foreground">{ui.integrationsHint}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {appConfig.integrations.map((it) => (
            <div key={it.key} className="flex items-center gap-4 rounded-lg border border-border p-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon name="plug" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{it.name}</p>
                  {it.required && <Badge tone="warning">{ui.required}</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">{it.purpose}</p>
              </div>
              {connected[it.key] ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> {ui.connected}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <CircleDashed className="h-4 w-4" /> {ui.demoMode}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
