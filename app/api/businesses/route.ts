import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase bağlantısı yapılandırılmamış", businesses: [], needsInit: true },
      { status: 200 },
    );
  }

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message, businesses: [], needsInit: error.code === "42P01" },
      { status: 500 },
    );
  }

  const [{ data: articles }, { data: convs }] = await Promise.all([
    supabase.from("knowledge_articles").select("id, business_id"),
    supabase
      .from("chat_conversations")
      .select("id, business_id, status, needs_intervention"),
  ]);

  const enriched = (businesses ?? []).map((b) => {
    const bArticles = (articles ?? []).filter((a) => a.business_id === b.id);
    const bConvs = (convs ?? []).filter((c) => c.business_id === b.id);
    return {
      ...b,
      article_count: bArticles.length,
      open_conversations: bConvs.filter((c) => c.status !== "resolved").length,
      intervention_count: bConvs.filter(
        (c) => c.needs_intervention && c.status !== "resolved",
      ).length,
    };
  });

  return NextResponse.json({ businesses: enriched });
}

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase bağlantısı yapılandırılmamış" },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "İşletme adı zorunludur." },
        { status: 400 },
      );
    }

    const payload = {
      name,
      sector: String(body.sector ?? "Diğer").trim() || "Diğer",
      phone: String(body.phone ?? "").trim(),
      whatsapp_number: String(body.whatsapp_number ?? body.phone ?? "").trim(),
      package_type: String(body.package_type ?? "Ekip").trim() || "Ekip",
      whatsapp_status: String(body.whatsapp_status ?? "pending").trim(),
      bot_active: Boolean(body.bot_active ?? false),
      auto_reply: Boolean(body.auto_reply ?? false),
      admin_name: String(body.admin_name ?? "Yönetici").trim() || "Yönetici",
      ai_tone:
        String(body.ai_tone ?? "").trim() ||
        "Samimi, profesyonel, çözüm odaklı ve net Türkçe.",
      system_prompt: String(body.system_prompt ?? "").trim(),
    };

    const { data, error } = await supabase
      .from("businesses")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        business: {
          ...data,
          article_count: 0,
          open_conversations: 0,
          intervention_count: 0,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek" },
      { status: 400 },
    );
  }
}
