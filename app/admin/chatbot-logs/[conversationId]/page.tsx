import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

type Props = { params: Promise<{ conversationId: string }> };

export default async function AdminChatbotLogDetailPage({ params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/");

  const { data: convo, error: cErr } = await supabase
    .from("chatbot_conversations")
    .select("id, user_id, user_email, locale, created_at, updated_at")
    .eq("id", conversationId)
    .maybeSingle();

  if (cErr || !convo) notFound();

  const { data: msgs, error: mErr } = await supabase
    .from("chatbot_messages")
    .select("id, role, content, used_model, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (mErr) {
    console.error("[admin/chatbot-logs/detail]", mErr);
  }

  const list = msgs ?? [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/chatbot-logs" className="text-sm font-bold text-blue-600 hover:underline">
            ← 목록
          </Link>
        </div>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black text-slate-900">대화 상세</h1>
          <dl className="mt-4 grid gap-2 text-sm text-slate-600">
            <div>
              <dt className="font-bold text-slate-800">이메일</dt>
              <dd>{convo.user_email || "—"}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-800">언어</dt>
              <dd>{convo.locale}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-800">대화 ID</dt>
              <dd className="font-mono text-xs break-all">{convo.id}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-800">기간</dt>
              <dd>
                {convo.created_at ? new Date(convo.created_at).toLocaleString("ko-KR") : "—"} ~{" "}
                {convo.updated_at ? new Date(convo.updated_at).toLocaleString("ko-KR") : "—"}
              </dd>
            </div>
          </dl>
        </header>

        <div className="space-y-3">
          <h2 className="text-lg font-black text-slate-800">메시지 ({list.length})</h2>
          {list.length === 0 ? (
            <p className="text-sm text-slate-500">메시지가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "ml-8 border-slate-200 bg-slate-900 text-white"
                      : "mr-8 border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide opacity-70">
                    <span>{m.role === "user" ? "사용자" : "도우미"}</span>
                    {m.used_model != null ? <span>{m.used_model ? "LLM" : "폴백"}</span> : null}
                    <span>{m.created_at ? new Date(m.created_at).toLocaleString("ko-KR") : ""}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
