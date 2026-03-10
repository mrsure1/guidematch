"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { login } from "./actions";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ForgotPasswordModal } from "@/components/ui/ForgotPasswordModal";
import { BrandLogo } from "@/components/brand/BrandLogo";

function LoginForm() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
        const supabase = createClient();
        if (supabase) {
            // Store only a validated role in cookie so OAuth callback can restore intent safely.
            const roleParam = searchParams.get('role');
            const role = roleParam === 'guide' || roleParam === 'traveler' ? roleParam : 'traveler';
            document.cookie = `oauth_role=${role}; path=/; max-age=3600; samesite=lax`;

            // Use a stable callback URL. Passing arbitrary query strings can trigger invalid path errors.
            const appOrigin = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
            const callbackUrl = `${appOrigin}/auth/callback`;

            await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: callbackUrl
                }
            });
        }
    };

    return (
        <form className="space-y-6" action={login}>
            <input type="hidden" name="role" value={searchParams.get('role') || ''} />
            {message && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                    {message}
                </div>
            )}
            <div>
                <Input
                    label="이메일 주소"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="your@email.com"
                    className="bg-white/50 focus:bg-white transition-colors"
                />
            </div>

            <div>
                <Input
                    label="비밀번호"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="bg-white/50 focus:bg-white transition-colors"
                />
            </div>

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 transition-colors cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 cursor-pointer select-none">
                        로그인 유지
                    </label>
                </div>

                <div className="text-sm">
                    <button 
                        type="button" 
                        onClick={(e) => {
                            e.preventDefault();
                            setIsForgotPasswordOpen(true);
                        }}
                        className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        비밀번호를 잊으셨나요?
                    </button>
                </div>
            </div>

            <div className="pt-2">
                <Button fullWidth size="lg" className="rounded-xl py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 border-0 text-base font-semibold hover:-translate-y-0.5 transition-all duration-300">
                    로그인
                </Button>
            </div>

            <div className="mt-8">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-transparent px-3 text-slate-500 font-light backdrop-blur-sm">소셜 계정으로 계속하기</span>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" fullWidth className="h-12 text-slate-700 bg-white/60 hover:bg-white border-slate-200 transition-all shadow-sm group px-0" onClick={() => handleOAuthLogin('google')}>
                        <span className="w-5 h-5 mr-1 relative flex items-center justify-center">
                            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                </g>
                            </svg>
                        </span>
                        Google
                    </Button>
                    <Button type="button" variant="outline" fullWidth className="h-12 text-[#381E1F] bg-[#FEE500]/60 hover:bg-[#FEE500] border-transparent transition-all shadow-sm px-0" onClick={() => handleOAuthLogin('kakao')}>
                        <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3C6.47715 3 2 6.47715 2 10.7643C2 13.5133 3.69335 15.932 6.22383 17.2797L5.35821 20.4568C5.23485 20.9088 5.7501 21.2562 6.13601 20.9592L9.89667 18.0673C10.5739 18.239 11.2778 18.3286 12 18.3286C17.5228 18.3286 22 14.8514 22 10.5643C22 6.27715 17.5228 3 12 3Z" />
                        </svg>
                        Kakao
                    </Button>
                </div>
            </div>
            
            <ForgotPasswordModal 
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
        </form>
    );
}

export default function Login() {
    return (
        <main className="flex-1 bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] relative overflow-hidden bg-mesh">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[pulse-slow_7s_ease-in-out_infinite]" />
            <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[pulse-slow_9s_ease-in-out_infinite_1s]" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up relative z-10">
                <div className="flex justify-center mb-6">
                    <BrandLogo href="/" size="lg" tone="dark" variant="signature" showTagline={false} />
                </div>
                <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    계정 로그인
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-light">
                    Korea Guide Match에 처음이신가요?{" "}
                    <Link href="/role-selection" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                        회원가입하기
                    </Link>
                </p>
                <div className="mt-4 flex justify-center gap-4 text-xs text-slate-400 font-light">
                    <Link href="/terms" className="hover:text-slate-600 transition-colors">이용약관</Link>
                    <span className="text-slate-200">|</span>
                    <Link href="/terms?type=privacy" className="hover:text-slate-600 transition-colors">개인정보처리방침</Link>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up animation-delay-200 relative z-10">
                <Card className="premium-card bg-white/80 backdrop-blur-xl border-white/50 shadow-xl overflow-hidden">
                    <CardContent className="pt-8 pb-10 px-6 sm:px-10">
                        <Suspense fallback={<div className="text-center text-sm">Loading form...</div>}>
                            <LoginForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
