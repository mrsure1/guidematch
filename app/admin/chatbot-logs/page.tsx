import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminChatbotLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/");

  const { data: convos, error } = await supabase
    .from("chatbot_conversations")
    .select("id, user_id, user_email, locale, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[admin/chatbot-logs]", error);
  }

  const rows = convos ?? [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black text-slate-900">
              <MessageSquare className="h-8 w-8 text-rose-500" />
              챗봇 대화 로그
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              로그인한 사용자의 챗봇 문의만 저장됩니다. 마지막 활동 기준 30일이 지난 대화는 자동 삭제됩니다.
            </p>
          </div>
          <Link href="/admin/dashboard" className="text-sm font-bold text-blue-600 hover:underline">
            ← 대시보드
          </Link>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700">최근 활동</th>
                <th className="px-4 py-3 font-bold text-slate-700">사용자</th>
                <th className="px-4 py-3 font-bold text-slate-700">언어</th>
                <th className="px-4 py-3 font-bold text-slate-700">대화 ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    저장된 대화가 없습니다. Supabase에{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">supabase/migrations/20260321120000_chatbot_logs.sql</code>{" "}
                    을 적용했는지 확인하세요.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-slate-600">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString("ko-KR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/chatbot-logs/${row.id}`} className="font-medium text-blue-600 hover:underline">
                        {row.user_email || `${row.user_id?.slice(0, 8) ?? "?"}…`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.locale}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
