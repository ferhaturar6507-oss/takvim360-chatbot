import { NextResponse } from "next/server";
import {
  getSupabaseConfig,
  getSupabaseServerClient,
  INIT_SCHEMA_SQL,
  REQUIRED_TABLES,
} from "@/lib/supabase";

export async function GET() {
  const cfg = getSupabaseConfig();
  if (!cfg.configured) {
    return NextResponse.json({
      configured: false,
      ready: false,
      keySource: cfg.keySource,
      missingTables: [...REQUIRED_TABLES],
      initSql: INIT_SCHEMA_SQL,
      message:
        "Ortam değişkenlerinde Supabase URL ve anahtarı bulunamadı. .env.local dosyasını kontrol edin.",
    });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      configured: false,
      ready: false,
      keySource: cfg.keySource,
      missingTables: [...REQUIRED_TABLES],
      initSql: INIT_SCHEMA_SQL,
    });
  }

  const missingTables: string[] = [];
  const tableStatus: Record<string, boolean> = {};

  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error && (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("schema cache"))) {
      tableStatus[table] = false;
      missingTables.push(table);
    } else {
      tableStatus[table] = !error;
    }
  }

  return NextResponse.json({
    configured: true,
    ready: missingTables.length === 0,
    keySource: cfg.keySource,
    tableStatus,
    missingTables,
    initSql: missingTables.length > 0 ? INIT_SCHEMA_SQL : undefined,
  });
}
