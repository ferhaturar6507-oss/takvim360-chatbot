"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, X } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace-provider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useLang } from "@/components/i18n/language-provider";

const SECTORS = [
  "Sağlık & Estetik",
  "Sağlık & Diş",
  "E-Ticaret & Tekstil",
  "Spor & Wellness",
  "Güzellik & Kuaför",
  "Eğitim & Danışmanlık",
  "Restoran & Kafe",
  "Otomotiv",
  "Diğer",
];

const PACKAGES = ["Başlangıç", "Ekip", "İşletme"] as const;

export function AddBusinessModal() {
  const router = useRouter();
  const { lang } = useLang();
  const {
    addModalOpen,
    setAddModalOpen,
    refreshBusinesses,
    setActiveBusinessId,
  } = useWorkspace();

  const [name, setName] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [packageType, setPackageType] = useState<string>("Ekip");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [adminName, setAdminName] = useState("");
  const [aiTone, setAiTone] = useState(
    "Samimi, profesyonel, çözüm odaklı ve net Türkçe.",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!addModalOpen) return null;

  const m =
    lang === "tr"
      ? {
          title: "Yeni Müşteri İşletme Ekle",
          sub: "Ajans portföyünüze yeni bir işletme ekleyin ve çalışma alanını hemen başlatın.",
          name: "İşletme Adı *",
          namePh: "Örn. Aura Güzellik Merkezi",
          sector: "Sektör",
          pkg: "Paket Tipi",
          wa: "WhatsApp Numarası",
          waPh: "+90 5XX XXX XX XX",
          admin: "Yetkili Kişi",
          adminPh: "Örn. Ayşe Yılmaz",
          tone: "AI Bot İletişim Tonu",
          cancel: "Vazgeç",
          create: "İşletmeyi Oluştur ve Aç",
          creating: "Oluşturuluyor…",
        }
      : {
          title: "Add New Client Business",
          sub: "Add a new client to your agency portfolio and launch their workspace.",
          name: "Business Name *",
          namePh: "e.g. Aura Beauty Studio",
          sector: "Sector",
          pkg: "Package Tier",
          wa: "WhatsApp Number",
          waPh: "+90 5XX XXX XX XX",
          admin: "Contact Person",
          adminPh: "e.g. Ayşe Yılmaz",
          tone: "AI Bot Brand Tone",
          cancel: "Cancel",
          create: "Create & Open Workspace",
          creating: "Creating…",
        };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(lang === "tr" ? "İşletme adı zorunludur." : "Business name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sector,
          package_type: packageType,
          whatsapp_number: whatsappNumber.trim(),
          phone: whatsappNumber.trim(),
          whatsapp_status: whatsappNumber.trim() ? "connected" : "pending",
          bot_active: Boolean(whatsappNumber.trim()),
          admin_name: adminName.trim() || "Yönetici",
          ai_tone: aiTone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bir hata oluştu.");
        return;
      }
      await refreshBusinesses();
      if (data.business?.id) {
        setActiveBusinessId(data.business.id);
      }
      setName("");
      setWhatsappNumber("");
      setAdminName("");
      setAddModalOpen(false);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-pop">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {m.title}
              </h2>
              <p className="text-xs text-muted-foreground">{m.sub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAddModalOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label>{m.name}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.namePh}
              required
              autoFocus
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{m.sector}</Label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>{m.pkg}</Label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {PACKAGES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{m.wa}</Label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder={m.waPh}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{m.admin}</Label>
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder={m.adminPh}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{m.tone}</Label>
            <Input
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              disabled={submitting}
            >
              {m.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {m.creating}
                </>
              ) : (
                m.create
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
