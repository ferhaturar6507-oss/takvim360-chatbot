import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase bağlantısı yapılandırılmamış" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const body = await req.json();

  const allowedKeys = [
    "name",
    "sector",
    "phone",
    "whatsapp_number",
    "package_type",
    "whatsapp_status",
    "bot_active",
    "auto_reply",
    "admin_name",
    "ai_tone",
    "system_prompt",
  ] as const;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const key of allowedKeys) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business: data });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase bağlantısı yapılandırılmamış" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const { error } = await supabase.from("businesses").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
