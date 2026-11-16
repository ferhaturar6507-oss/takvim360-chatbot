"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Layers,
  LogOut,
  Plus,
} from "lucide-react";
import appConfig from "@/app.config";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { useWorkspace } from "@/components/app/workspace-provider";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, t, ui } = useLang();
  const {
    businesses,
    activeBusinessId,
    activeBusiness,
    setActiveBusinessId,
    setAddModalOpen,
  } = useWorkspace();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const agencyLabel =
    lang === "tr" ? "Ajans Genel Bakış" : "Agency Overview";
  const addLabel = lang === "tr" ? "İşletme Ekle" : "Add Business";
  const switcherHint =
    lang === "tr" ? "Çalışma Alanı Seçici" : "Workspace Switcher";

  function handleSelect(id: string | null) {
    setActiveBusinessId(id);
    setSwitcherOpen(false);
    if (id === null && (pathname === "/knowledge" || pathname === "/automations")) {
      router.push("/dashboard");
    }
  }

  const navItems = activeBusinessId
    ? appConfig.nav
    : appConfig.nav.filter((item) =>
        ["/dashboard", "/conversations", "/settings"].includes(item.href),
      );

  return (
    <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-68 md:flex-col">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <Link
          href="/dashboard"
          onClick={() => setActiveBusinessId(null)}
          className="flex items-center gap-2"
        >
          <Logo />
        </Link>
        <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Agency
        </span>
      </div>

      {/* + İşletme Ekle & İşletme Seçici (Workspace Switcher) */}
      <div className="space-y-2.5 border-b border-sidebar-border px-3 py-3.5">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>

        <div ref={dropdownRef} className="relative">
          <p className="label-mono px-1 pb-1 text-[10px] text-sidebar-muted">
            {switcherHint}
          </p>
          <button
            type="button"
            onClick={() => setSwitcherOpen((o) => !o)}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-sidebar-border bg-muted/60 px-3 py-2 text-left text-sm transition hover:bg-muted"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                  activeBusiness
                    ? "bg-primary/15 text-primary"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                )}
              >
                {activeBusiness ? (
                  <Building2 className="h-3.5 w-3.5" />
                ) : (
                  <Layers className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">
                  {activeBusiness ? activeBusiness.name : agencyLabel}
                </p>
                <p className="truncate text-[10px] text-sidebar-muted">
                  {activeBusiness
                    ? activeBusiness.sector
                    : `${businesses.length} ${lang === "tr" ? "yönetilen işletme" : "managed clients"}`}
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-sidebar-muted transition-transform",
                switcherOpen && "rotate-180",
              )}
            />
          </button>

          {switcherOpen && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-pop">
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition",
                  activeBusinessId === null
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Layers className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="flex-1 truncate font-semibold">
                  {agencyLabel}
                </span>
                {activeBusinessId === null && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </button>

              {businesses.length > 0 && (
                <div className="my-1 border-t border-border" />
              )}

              {businesses.map((b) => {
                const selected = b.id === activeBusinessId;
                const dotColor =
                  b.whatsapp_status === "connected"
                    ? "bg-emerald-500"
                    : b.whatsapp_status === "error"
                      ? "bg-rose-500"
                      : "bg-amber-500";
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelect(b.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition",
                      selected
                        ? "bg-primary/12 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {b.name}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {b.sector} · {b.package_type}
                      </p>
                    </div>
                    {selected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="label-mono px-3 pb-2 pt-1 text-sidebar-muted">
          {activeBusiness
            ? lang === "tr"
              ? "İşletme Menüsü"
              : "Workspace Menu"
            : lang === "tr"
              ? "Ajans Menüsü"
              : "Agency Menu"}
        </p>
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const label =
            !activeBusinessId && item.href === "/dashboard"
              ? agencyLabel
              : t(item.label);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-muted hover:bg-muted hover:text-sidebar-foreground",
              )}
            >
              <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
            T3
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Takvim 360</p>
            <p className="truncate text-xs text-sidebar-muted">
              {lang === "tr" ? "B2B AI Ajansı" : "B2B AI Agency"}
            </p>
          </div>
          <Link
            href="/login"
            aria-label={ui.logout}
            className="grid h-8 w-8 place-items-center rounded-md text-sidebar-muted transition-colors hover:bg-muted hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
