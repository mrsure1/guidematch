"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { signup } from "./actions";
import { User } from "lucide-react";

function SignupForm() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message');
    const success = searchParams.get('success');
    const registeredEmail = searchParams.get('email');
    const roleParam = searchParams.get("role");
    const role = (roleParam === "guide" || roleParam === "traveler") ? roleParam : "traveler";

    const [isExistingUser, setIsExistingUser] = useState(false);
    const [existingProfile, setExistingProfile] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleOAuthSignup = async (provider: 'google' | 'kakao') => {
        const supabase = createClient();
        if (supabase) {
            // Store the role in a cookie so it survives the OAuth redirect flow
            document.cookie = `oauth_role=${role}; path=/; max-age=3600`;

            await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
                }
            });
        }
    };



    useEffect(() => {
        // 이미 로그인된 사용자가 역할 카드를 클릭한 경우 대응
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // 현재 프로필 정보 가져오기
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (data) {
                    setExistingProfile(data);

                    // 이미 해당 역할이라면 즉시 이동 (루프 방지)
                    if (data.role === role) {
                        window.location.href = role === 'guide' ? '/guide/dashboard' : '/traveler/home';
                        return;
                    }

                    // 역할이 가이드이거나 어드민인 경우, 모든 역할 접근 허용
                    if ((data.role === 'guide' || data.role === 'admin') && (role === 'traveler' || role === 'guide')) {
                        window.location.href = role === 'guide' ? '/guide/dashboard' : '/traveler/home';
                        return;
                    }

                    // 역할이 여행자인데 가이드로 가입하려고 하는 경우만 전환 의사(새 계정 안내) 묻기
                    setIsExistingUser(true);
                } else {
                    // 세션은 있으나 프로필이 없는 특이 케이스
                    setIsExistingUser(false);
                }
            }
        };
        checkSession();
    }, [role]);

    if (success === 'true') {
        return (
            <div className="w-full sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up relative z-10">
                <Card className="premium-card bg-white/80 backdrop-blur-xl border-white/50 shadow-xl overflow-hidden mt-8">
                    <CardContent className="pt-10 pb-12 px-6 sm:px-10 text-center">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3">이메일을 확인해주세요!</h3>
                        <p className="text-slate-600 leading-relaxed mb-8">
                            <span className="font-bold text-blue-600">{registeredEmail}</span>(으)로 인증 링크가 발송되었습니다.<br />
                            링크를 클릭하시면 가입이 완료됩니다.
                        </p>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/60 rounded-2xl text-xs text-slate-500 text-left border border-white">
                                <p className="font-bold text-slate-700 mb-1">💡 이메일이 오지 않았나요?</p>
                                <ul className="list-disc ml-4 space-y-1">
                                    <li>스팸 메일함(Spam)을 확인해주세요.</li>
                                    <li>이메일 주소를 오타 없이 입력했는지 확인해주세요.</li>
                                    <li>인증 메일은 최대 5분까지 소요될 수 있습니다.</li>
                                </ul>
                            </div>
                            <Link href="/login" className="block w-full">
                                <Button fullWidth variant="outline" className="h-14 rounded-2xl mt-4 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold">
                                    로그인 화면으로 돌아가기
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up relative z-10">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    계정 만들기
                </h2>
                <div className="mt-3 flex justify-center items-center gap-2">
                    <span className="text-sm text-slate-600 font-light">
                        현재 선택된 역할:
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${role === "guide"
                        ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                        : "bg-blue-50 text-blue-700 ring-blue-600/20"
                        }`}>
                        {role === "guide" ? "가이드" : "여행자"}
                    </span>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up animation-delay-200 relative z-10">
                {isExistingUser ? (
                    <Card className="premium-card bg-white/90 backdrop-blur-xl border-blue-200/50 shadow-2xl overflow-hidden ring-1 ring-blue-500/10">
                        <CardContent className="pt-10 pb-12 px-6 sm:px-10 text-center">
                            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30 rotate-3">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">가이드 등록 안내</h3>
                            <p className="text-slate-600 leading-relaxed mb-8 font-light break-keep">
                                <span className="font-bold text-slate-900">{existingProfile?.full_name || '회원'}</span>님은 현재 <span className="font-bold text-blue-600">여행자</span> 계정입니다.<br />
                                가이드 활동을 위해서는 전문 가이드용 <span className="font-bold text-emerald-600">새 계정 가입</span>이 필요합니다.
                            </p>

                            <div className="space-y-4">
                                <Button
                                    fullWidth
                                    size="lg"
                                    onClick={async () => {
                                        setIsProcessing(true);
                                        const supabase = createClient();
                                        await supabase.auth.signOut();
                                        window.location.href = "/signup?role=guide";
                                    }}
                                    disabled={isProcessing}
                                    className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
                                >
                                    {isProcessing ? "로그아웃 중..." : "로그아웃 후 새 가이드 계정 만들기"}
                                </Button>

                                <Link href="/traveler/home" className="block">
                                    <Button fullWidth variant="ghost" className="h-12 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium">
                                        여행자 홈으로 돌아가기
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="premium-card bg-white/80 backdrop-blur-xl border-white/50 shadow-xl overflow-hidden">
                        <CardContent className="pt-8 pb-10 px-6 sm:px-10">
                            <form className="space-y-5" action={signup}>
                                <input type="hidden" name="role" value={role} />

                                {message && (
                                    <div className="p-4 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-bold">알림</span>
                                        </div>
                                        <p className="leading-relaxed opacity-90">{message}</p>
                                    </div>
                                )}

                                <div>
                                    <Input
                                        label="이름"
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        placeholder="홍길동"
                                        className="bg-white/50 focus:bg-white transition-colors"
                                    />
                                </div>

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
                                        autoComplete="new-password"
                                        required
                                        placeholder="••••••••"
                                        className="bg-white/50 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <Input
                                        label="비밀번호 확인"
                                        id="password-confirm"
                                        name="password-confirm"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        placeholder="••••••••"
                                        className="bg-white/50 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="flex items-center mt-4">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        required
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 transition-colors cursor-pointer"
                                    />
                                    <label htmlFor="terms" className="ml-2 block text-sm text-slate-700 cursor-pointer">
                                        <Link href="/terms" target="_blank" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">이용약관</Link> 및{" "}
                                        <Link href="/terms?type=privacy" target="_blank" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">개인정보처리방침</Link>에 동의합니다.
                                    </label>
                                </div>

                                <div className="pt-4">
                                    <Button fullWidth size="lg" className="rounded-xl py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 border-0 text-base font-semibold hover:-translate-y-0.5 transition-all duration-300">
                                        가입 완료하기
                                    </Button>
                                </div>

                                <div className="mt-8">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-200" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="bg-transparent px-3 text-slate-500 font-light backdrop-blur-sm">소셜 계정으로 빠른 가입</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <Button type="button" variant="outline" fullWidth className="h-12 text-slate-700 bg-white/60 hover:bg-white border-slate-200 transition-all shadow-sm group px-0" onClick={() => handleOAuthSignup('google')}>
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
                                        <Button type="button" variant="outline" fullWidth className="h-12 text-[#381E1F] bg-[#FEE500]/60 hover:bg-[#FEE500] border-transparent transition-all shadow-sm px-0" onClick={() => handleOAuthSignup('kakao')}>
                                            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 3C6.47715 3 2 6.47715 2 10.7643C2 13.5133 3.69335 15.932 6.22383 17.2797L5.35821 20.4568C5.23485 20.9088 5.7501 21.2562 6.13601 20.9592L9.89667 18.0673C10.5739 18.3286 11.2778 18.3286 12 18.3286C17.5228 18.3286 22 14.8514 22 10.5643C22 6.27715 17.5228 3 12 3Z" />
                                            </svg>
                                            Kakao
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-10 mb-6 group">
                    <Link href={`/login${role ? `?role=${role}` : ''}`} className="block">
                        <div className="p-4 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl text-center hover:bg-white/60 hover:shadow-md transition-all duration-300">
                            <p className="text-sm text-slate-600 font-medium mb-1">
                                이미 가입하셨나요?
                            </p>
                            <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
                                <span>안전하게 로그인하기</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function Signup() {
    return (
        <main className="flex-1 bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] relative overflow-hidden bg-mesh">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[pulse-slow_7s_ease-in-out_infinite]" />
            <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[pulse-slow_9s_ease-in-out_infinite_1s]" />

            <Suspense fallback={<div className="min-h-screen flex items-center justify-center relative z-10">Loading...</div>}>
                <SignupForm />
            </Suspense>
        </main>
    );
}
