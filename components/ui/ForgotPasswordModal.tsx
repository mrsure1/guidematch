"use client";

import { useState, useEffect } from "react";
import { Mail, ArrowRight, X, Loader2 } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { createClient } from "@/lib/supabase/client";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastEmailSent, setLastEmailSent] = useState("");

  // 모달이 새로 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMessage("");
      // 이전에 입력했던 이메일을 유지하고 싶지 않다면 이메일도 초기화
      setEmail(""); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client is not available");

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/update-password`;
      
      console.log("[ForgotPassword] Requesting reset for:", email, "Redirecting to:", redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) {
        console.error("[ForgotPassword] Error from Supabase:", error);
        throw error;
      }

      console.log("[ForgotPassword] Reset email sent successfully");
      setStatus("success");
    } catch (error: any) {
      console.error("Password reset error:", error);
      setStatus("error");
      
      // 구체적인 에러 메시지 제공
      let msg = "비밀번호 재설정 이메일 전송에 실패했습니다.";
      if (error.status === 429) {
        msg = "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요. (시간당 최대 3회)";
      } else if (error.message?.includes("Email not found")) {
        msg = "가입되지 않은 이메일 주소입니다.";
      } else {
        msg = error.message || msg;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <Mail className="w-6 h-6" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-2">비밀번호 찾기</h3>
          
          {status === "success" ? (
            <div className="mt-4 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                <p className="text-emerald-800 text-sm leading-relaxed space-y-2">
                  <span><span className="font-bold">{email}</span> 주소로 비밀번호 재설정 링크가 포함된 이메일을 발송했습니다.</span><br/>
                  <span className="block mt-2 text-xs opacity-90">
                    * 가입되지 않은 이메일이거나, 시간당 발송 한도(3회) 초과 시 메일이 발송되지 않습니다.<br/>
                    * 메일이 오지 않는다면 <b>스팸 메일함</b>을 확인하시거나, 가입하신 이메일이 맞는지 다시 한 번 확인해주세요.
                  </span>
                </p>
              </div>
              <Button fullWidth size="lg" className="rounded-xl h-12 font-bold" onClick={onClose}>
                메인으로 돌아가기
              </Button>
            </div>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                가입하신 이메일 주소를 입력해주세요. 
                해당 이메일로 비밀번호 재설정 링크를 보내드립니다.
              </p>

              {status === "error" && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm p-3 rounded-xl mb-4">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input 
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-50"
                  />
                </div>
                <Button 
                  type="submit" 
                  fullWidth 
                  size="lg" 
                  className="rounded-xl h-12 font-bold group"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      이메일 전송
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
