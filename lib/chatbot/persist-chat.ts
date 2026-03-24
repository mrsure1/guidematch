import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function lastUserContent(messages: { role: string; content: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

/**
 * 로그인 사용자 챗봇 턴을 DB에 저장. 반환값은 다음 요청에 넣을 conversation id.
 */
export async function persistChatbotTurn(opts: {
  messages: { role: string; content: string }[];
  locale: string;
  conversationId: string | null | undefined;
  assistantAnswer: string;
  usedModel: boolean | null;
}): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const lastUser = lastUserContent(opts.messages);
  if (!lastUser.trim()) return null;

  const email = user.email ?? null;
  let cid =
    opts.conversationId && UUID_RE.test(String(opts.conversationId).trim())
      ? String(opts.conversationId).trim()
      : null;

  if (cid) {
    const { data: owned } = await supabase
      .from("chatbot_conversations")
      .select("id")
      .eq("id", cid)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!owned) {
      const { data: created, error: cErr } = await supabase
        .from("chatbot_conversations")
        .insert({
          id: cid,
          user_id: user.id,
          locale: opts.locale,
          user_email: email,
        })
        .select("id")
        .single();
      if (cErr || !created) {
        cid = null;
      }
    }
  }

  if (!cid) {
    const { data: created, error: cErr } = await supabase
      .from("chatbot_conversations")
      .insert({
        user_id: user.id,
        locale: opts.locale,
        user_email: email,
      })
      .select("id")
      .single();
    if (cErr || !created) {
      console.error("[chatbot] conversation create", cErr);
      return null;
    }
    cid = created.id;
  }

  const { error: mErr } = await supabase.from("chatbot_messages").insert([
    {
      conversation_id: cid,
      user_id: user.id,
      role: "user",
      content: lastUser.slice(0, 12000),
      used_model: null,
    },
    {
      conversation_id: cid,
      user_id: user.id,
      role: "assistant",
      content: opts.assistantAnswer.slice(0, 12000),
      used_model: opts.usedModel,
    },
  ]);

  if (mErr) {
    console.error("[chatbot] messages insert", mErr);
    return cid;
  }

  await supabase.from("chatbot_conversations").update({ updated_at: new Date().toISOString() }).eq("id", cid);

  return cid;
}
