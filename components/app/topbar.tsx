"use client";

import { usePathname } from "next/navigation";
import { Bell, Building2, Layers, Search } from "lucide-react";
import appConfig from "@/app.config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/components/i18n/language-provider";
import { useWorkspace } from "@/components/app/workspace-provider";

export function Topbar() {
  const pathname = usePathname();
  const { lang, t, ui } = useLang();
  const { activeBusiness, setActiveBusinessId } = useWorkspace();

  const current = appConfig.nav.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  );

  const pageTitle =
    !activeBusiness && pathname === "/dashboard"
      ? lang === "tr"
        ? "Ajans Komuta Merkezi"
        : "Agency Command Center"
      : current
        ? t(current.label)
        : "";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate font-display text-lg font-semibold tracking-tight">
          {pageTitle}
        </h1>

        {activeBusiness ? (
          <div className="hidden items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
            <Building2 className="h-3.5 w-3.5" />
            <span className="max-w-[180px] truncate">{activeBusiness.name}</span>
            <button
              type="button"
              onClick={() => setActiveBusinessId(null)}
              className="ml-1 cursor-pointer rounded-full px-1.5 py-0.5 text-[10px] font-semibold hover:bg-primary/15"
              title={lang === "tr" ? "Ajans Genel Bakışına Dön" : "Back to Agency Overview"}
            >
              ×
            </button>
          </div>
        ) : (
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 sm:inline-flex">
            <Layers className="h-3 w-3" />
            {lang === "tr" ? "Ajans Genel Bakış" : "Agency Overview"}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground lg:flex">
          <Search className="h-4 w-4" />
          <span>{ui.search}</span>
          <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </div>
        <LanguageToggle className="mr-1" />
        <button
          aria-label="Notifications"
          className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
