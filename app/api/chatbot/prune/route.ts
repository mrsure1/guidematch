import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/** 30일 지난 챗봇 대화·메시지 삭제 (CASCADE). Vercel Cron + CRON_SECRET 권장. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_URL 미설정" },
      { status: 500 },
    );
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createClient(url, serviceKey);

  const { data: stale, error: selErr } = await supabase
    .from("chatbot_conversations")
    .select("id")
    .lt("updated_at", cutoff);

  if (selErr) {
    console.error("[chatbot/prune] select", selErr);
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  const ids = (stale ?? []).map((r) => r.id as string);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, deletedConversations: 0 });
  }

  const BATCH = 150;
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const { error: delErr } = await supabase.from("chatbot_conversations").delete().in("id", chunk);
    if (delErr) {
      console.error("[chatbot/prune] delete", delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, deletedConversations: ids.length });
}
