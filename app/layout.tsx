import type { Metadata } from "next";
// ── FONTS ─────────────────────────────────────────────────────────────────
// Replio — calm geometric. Plus Jakarta Sans (display) + Inter (sans) +
// JetBrains Mono (numerals/labels). Keep the CSS variable names
// (--font-sans-app / --font-display-app / --font-mono-app) so globals.css
// picks them up.
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import appConfig from "@/app.config";
import { DEFAULT_LANG } from "@/lib/i18n/config";

const sans = Inter({
  variable: "--font-sans-app",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const display = Plus_Jakarta_Sans({
  variable: "--font-display-app",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-app",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${appConfig.name} — ${appConfig.tagline[DEFAULT_LANG]}`,
  description: appConfig.description[DEFAULT_LANG],
  applicationName: appConfig.name,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={DEFAULT_LANG}
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full`}
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `a[href*="netlify"], [id*="netlify"], [class*="netlify"], iframe[src*="netlify"], div[style*="z-index: 2147483647"] { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; width: 0 !important; height: 0 !important; }`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var needles = ["powered by netlify", "netlify.com"];
  function hasNeedle(str) {
    if (!str) return false;
    var low = String(str).toLowerCase();
    return needles.some(function(n){ return low.indexOf(n) !== -1; });
  }
  function cleanNode(root) {
    if (!root || !root.querySelectorAll) return;
    var sel = 'a[href*="netlify"], [id*="netlify"], [class*="netlify"], iframe[src*="netlify"], div[style*="z-index: 2147483647"]';
    root.querySelectorAll(sel).forEach(function(el){ el.remove(); });
    var all = root.querySelectorAll('*');
    all.forEach(function(el){
      if (!el || !el.isConnected) return;
      var tag = el.tagName;
      if (tag === 'HTML' || tag === 'HEAD' || tag === 'BODY' || tag === 'SCRIPT' || tag === 'STYLE') return;
      if (el.shadowRoot) {
        if (hasNeedle(el.shadowRoot.innerHTML)) {
          el.remove();
          return;
        }
        cleanNode(el.shadowRoot);
      }
      if (el.children.length === 0 && hasNeedle(el.innerText || el.textContent)) {
        var host = el.closest('div[style*="fixed"], aside, footer, a, [id*="netlify"], [class*="netlify"]') || el;
        if (host && host.tagName !== 'BODY' && host.tagName !== 'HTML') {
          host.remove();
        } else {
          el.remove();
        }
      }
    });
  }
  function run(){ cleanNode(document); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  var obs = new MutationObserver(function(muts){
    for (var i = 0; i < muts.length; i++) {
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node && node.nodeType === 1) {
          cleanNode(node.parentNode || document);
        }
      }
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();`,
          }}
        />
      </body>
    </html>
  );
}
