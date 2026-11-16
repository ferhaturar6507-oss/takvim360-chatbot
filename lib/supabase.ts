import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseEnvConfig {
  configured: boolean;
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  activeServerKey: string;
  keySource: "service_role" | "anon" | "publishable" | "none";
}

/**
 * Flexible Supabase environment resolver.
 * Supports all common Next.js / Supabase env variable variations:
 * - NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
 */
export function getSupabaseConfig(): SupabaseEnvConfig {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();

  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim();

  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    ""
  ).trim();

  const activeServerKey = serviceRoleKey || anonKey;
  const keySource: SupabaseEnvConfig["keySource"] = serviceRoleKey
    ? "service_role"
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
      ? "anon"
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
        ? "publishable"
        : "none";

  return {
    configured: Boolean(url && activeServerKey),
    url,
    anonKey,
    serviceRoleKey,
    activeServerKey,
    keySource,
  };
}

let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

/** Server-side Supabase client (uses service_role if present, else anon/publishable). */
export function getSupabaseServerClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.configured) return null;
  if (!serverClient) {
    serverClient = createClient(cfg.url, cfg.activeServerKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}

/** Client-side Supabase client (uses NEXT_PUBLIC_* keys). */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient(url, key);
  }
  return browserClient;
}

export const REQUIRED_TABLES = [
  "businesses",
  "knowledge_articles",
  "chat_conversations",
] as const;

export const INIT_SCHEMA_SQL = `-- Takvim 360 / Replio Multi-Tenant Agency Schema
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS package_type text NOT NULL DEFAULT 'Ekip',
  ADD COLUMN IF NOT EXISTS whatsapp_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS whatsapp_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bot_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS system_prompt text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Genel',
  content text NOT NULL DEFAULT '',
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_initials text NOT NULL DEFAULT 'M',
  customer_phone text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'open',
  needs_intervention boolean NOT NULL DEFAULT false,
  intent text NOT NULL DEFAULT 'Genel',
  last_message text NOT NULL DEFAULT '',
  waiting_min integer NOT NULL DEFAULT 0,
  unread boolean NOT NULL DEFAULT true,
  suggested_reply text,
  suggested_source text,
  confidence integer NOT NULL DEFAULT 85,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`;
