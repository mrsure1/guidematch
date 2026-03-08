import Link from "next/link";
import { ChevronLeft, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TermsPage({
    searchParams,
}: {
    searchParams: { type?: string };
}) {
    const isPrivacy = searchParams.type === 'privacy';

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden animate-fade-in">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none -z-10" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">

                {/* Header */}
                <div className="mb-10 text-center md:text-left">
                    <Link href="/support" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-6 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200/60">
                        <ChevronLeft className="w-4 h-4" /> 고객센터로 돌아가기
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0 mx-auto md:mx-0 ${isPrivacy ? 'bg-emerald-500' : 'bg-accent'}`}>
                            {isPrivacy ? <ShieldCheck className="w-7 h-7 text-white" /> : <FileText className="w-7 h-7 text-white" />}
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                {isPrivacy ? '개인정보처리방침' : '서비스 이용약관'}
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">KOREA GUIDE MATCH 서비스의 투명하고 안전한 운영 원칙</p>
                        </div>
                    </div>
                </div>

                {/* Content Container */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 md:p-14 shadow-lg shadow-slate-200/50">
                    <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            시행일자: 2026년 2월 1일
                        </p>
                        <div className="text-sm text-slate-400 font-medium">
                            v1.0
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none 
                        prose-h2:text-xl prose-h2:font-extrabold prose-h2:text-slate-900 prose-h2:mt-10 prose-h2:mb-4 prose-h2:flex prose-h2:items-center prose-h2:gap-2
                        prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-600 prose-p:font-medium
                        prose-li:text-slate-600 prose-li:font-medium prose-li:marker:text-accent
                        prose-strong:text-slate-900 prose-strong:font-bold">

                        {isPrivacy ? (
                            <>
                                <h2><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>제 1 조 (목적)</h2>
                                <p>본 방침은 KOREA GUIDE MATCH 서비스(이하 서비스)를 이용하는 회원(이하 이용자)의 개인정보를 적극적으로 보호하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 모든 관련 법령을 준수하기 위함입니다.</p>
                                <p>회사는 이용자의 기본적 인권 침해의 우려가 있는 민감한 개인정보(인종 및 민족, 사상 및 신조, 출신지 및 본적지, 정치적 성향 및 범죄기록, 건강상태 및 성생활 등)는 수집하지 않습니다.</p>

                                <h2><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>제 2 조 (수집하는 개인정보의 항목)</h2>
                                <p>회사는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
                                <ul>
                                    <li><strong>필수항목:</strong> 이름, 이메일 주소, 비밀번호, 프로필 사진</li>
                                    <li><strong>선택항목:</strong> 관심 지역, 구사 가능 언어, 전화번호 등</li>
                                    <li><strong>자동수집항목:</strong> 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보, 결제기록</li>
                                </ul>

                                <h2><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>제 3 조 (개인정보의 보유 및 이용기간)</h2>
                                <p>회원 탈퇴 시까지 원칙적으로 보유하며, 관련 법령에 의하여 보존할 필요가 있는 경우에는 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.</p>
                                <ul>
                                    <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                    <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                    <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <h2><span className="w-2 h-2 rounded-full bg-accent block"></span>제 1 조 (목적)</h2>
                                <p>본 약관은 KOREA GUIDE MATCH가 제공하는 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

                                <h2><span className="w-2 h-2 rounded-full bg-accent block"></span>제 2 조 (회원의 정의)</h2>
                                <p>1. <strong>회원</strong>이란 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</p>
                                <p>2. 회원은 그 역할에 따라 <strong>여행자</strong>와 <strong>가이드</strong>로 구분되며, 각 역할에 따른 권한과 책임이 부여됩니다. 여행자는 플랫폼을 통해 투어를 예약하고 이용하는 자를, 가이드는 자신의 전문 지식을 바탕으로 투어 상품을 기획하고 제공하는 자를 일컫습니다.</p>

                                <h2><span className="w-2 h-2 rounded-full bg-accent block"></span>제 3 조 (가이드의 의무와 책임)</h2>
                                <p>가이드는 등록된 투어 상품을 성실히 이행할 의무가 있으며, 허위 정보 제공이나 부적절한 언행으로 인한 모든 불이익에 대해 책임을 집니다. 회사는 가이드의 자격을 유지하기 위해 최소한의 서비스 품질 기준을 요구할 수 있으며, 이를 지속적으로 위반할 경우 계정 이용이 제한될 수 있습니다.</p>

                                <h2><span className="w-2 h-2 rounded-full bg-accent block"></span>제 4 조 (결제 및 환불)</h2>
                                <p>모든 결제는 플랫폼 내 안전 시스템을 통해 이루어지며, 무통장 입금이나 개인간 직접 거래는 엄격히 금지됩니다. 환불 규정은 각 가이드가 설정한 개별 상품의 환불 정책을 우선적으로 따르되, 플랫폼의 기본 환불 정책에 부합해야 합니다.</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-12 text-center flex flex-col items-center gap-4">
                    <p className="text-slate-500 text-sm font-medium">더 궁금한 점이 있으신가요?</p>
                    <Link href="/support">
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 h-12 rounded-xl shadow-md">
                            고객센터 문의하기
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
