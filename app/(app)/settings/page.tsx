import appConfig from "@/app.config";
import { SettingsClient } from "@/components/app/settings-client";
import { getSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Server side: an integration is "connected" when its env vars exist. */
export default function SettingsPage() {
  const connected: Record<string, boolean> = {};
  for (const it of appConfig.integrations) {
    if (it.key === "supabase") {
      connected[it.key] = getSupabaseConfig().configured;
    } else {
      connected[it.key] = it.envVars.every((v) => !!process.env[v]);
    }
  }
  return <SettingsClient connected={connected} />;
}
