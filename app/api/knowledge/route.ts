import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ articles: [] });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  let query = supabase
    .from("knowledge_articles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message, articles: [] }, { status: 500 });
  }

  return NextResponse.json({ articles: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase bağlantısı yapılandırılmamış" },
      { status: 503 },
    );
  }

  const body = await req.json();
  const businessId = String(body.business_id ?? "").trim();
  const title = String(body.title ?? "").trim();

  if (!businessId || !title) {
    return NextResponse.json(
      { error: "İşletme ve makale başlığı zorunludur." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("knowledge_articles")
    .insert({
      business_id: businessId,
      title,
      category: String(body.category ?? "Genel").trim() || "Genel",
      content: String(body.content ?? "").trim(),
      uses: 0,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ article: data }, { status: 201 });
}

export async function DELETE(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase bağlantısı yapılandırılmamış" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id zorunludur." }, { status: 400 });
  }

  const { error } = await supabase
    .from("knowledge_articles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
