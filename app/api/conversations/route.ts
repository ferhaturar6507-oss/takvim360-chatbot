import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ conversations: [] });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  let query = supabase
    .from("chat_conversations")
    .select("*")
    .order("needs_intervention", { ascending: false })
    .order("waiting_min", { ascending: false });

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: error.message, conversations: [] },
      { status: 500 },
    );
  }

  return NextResponse.json({ conversations: data ?? [] });
}

export async function PATCH(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase bağlantısı yapılandırılmamış" },
      { status: 503 },
    );
  }

  const body = await req.json();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Konuşma id zorunludur." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ("status" in body) updates.status = body.status;
  if ("needs_intervention" in body) updates.needs_intervention = body.needs_intervention;
  if ("unread" in body) updates.unread = body.unread;
  if ("waiting_min" in body) updates.waiting_min = body.waiting_min;
  if ("messages" in body) updates.messages = body.messages;
  if ("last_message" in body) updates.last_message = body.last_message;

  const { data, error } = await supabase
    .from("chat_conversations")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data });
}
