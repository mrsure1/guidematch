import { InfoHeader } from "@/components/layout/InfoHeader";
import { ShieldCheck, Map, Users, Sparkles, ArrowRight, HeartHandshake, Globe2 } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "가이드매치 소개 | GuideMatch",
  description: "당신만의 완벽한 로컬 가이드를 만나는 가장 쉬운 방법. 가이드매치의 비전과 서비스를 소개합니다.",
};

export default function AboutPage() {
  return (
    <>
      <InfoHeader />
      <main className="min-h-screen bg-slate-50">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
          {/* Background decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full blur-3xl mix-blend-screen" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-200 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>로컬 여행의 패러다임을 바꿉니다</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-8 hero-title">
              당신만의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">완벽한 가이드</span>를<br className="hidden sm:block" />
              만나는 가장 쉬운 방법
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              가이드매치는 검증된 로컬 전문가와 특별한 여행을 꿈꾸는 여행자를 직접 연결하여, 
              중간 마진 없이 투명하고 신뢰할 수 있는 진짜 여행 생태계를 만들어갑니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-colors shadow-lg">
                인기 투어 찾아보기
              </Link>
              <Link href="/guide/apply" className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 hover:bg-slate-700 transition-colors">
                가이드로 합류하기
              </Link>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">우리가 추구하는 가치</h2>
            <p className="text-lg text-slate-500">여행자와 가이드 모두가 평등하게 만족하는 여행 플랫폼</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">투명한 신뢰 (Trust)</h3>
              <p className="text-slate-600 leading-relaxed">
                숨겨진 수수료나 패키지 쇼핑 강요 없이, 약속된 일정과 비용 그대로 안전한 여행을 보장합니다.
              </p>
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 w-0 group-hover:w-full transition-all duration-500" />
            </div>

            {/* Value 2 */}
            <div className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">상생 (Coexistence)</h3>
              <p className="text-slate-600 leading-relaxed">
                업계 최저 수준의 합리적인 수수료율을 통해 파트너 가이드의 전문성과 열정에 합당한 보상을 제공해 드립니다.
              </p>
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 w-0 group-hover:w-full transition-all duration-500" />
            </div>

            {/* Value 3 */}
            <div className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Globe2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">로컬 경험 (Local)</h3>
              <p className="text-slate-600 leading-relaxed">
                단순한 유명 관광지 방문을 넘어, 현지인만 아는 진짜 이야기와 생생한 문화를 여행자에게 선사합니다.
              </p>
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-400 w-0 group-hover:w-full transition-all duration-500" />
            </div>
          </div>
        </section>

        {/* Info Stats or Banner */}
        <section className="bg-white border-y border-slate-200 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
                  여행의 스토리는<br />
                  <span className="text-blue-600">누구와 함께하느냐</span>에 따라 달라집니다
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  가이드매치는 단순한 여행 포털이 아닙니다. 엄격한 심사를 거친 검증된 로컬 전문가들의 
                  프로필과 실제 여행자들의 생생한 리뷰를 바탕으로, 내 취향에 딱 맞는 동반자를 직접 선택할 수 있습니다.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-slate-700 font-medium tracking-tight">철저한 가이드 신원 및 자격 증명 검증 시스템</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Map className="w-4 h-4" />
                    </div>
                    <span className="text-slate-700 font-medium tracking-tight">전 세계 다양한 도시 글로벌 네트워크 활성화</span>
                  </li>
                </ul>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-cyan-50 rounded-[3rem] transform rotate-3 scale-105 -z-10" />
                <div className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[3rem] shadow-xl">
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xl">✈️</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-1">여행자를 위해</p>
                        <p className="text-slate-600 text-sm leading-relaxed">1:1 맞춤형 전담 투어부터 알찬 소규모 그룹 투어까지, 안전하고 편리한 간편 결제를 지원합니다.</p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-slate-100" />
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xl">💼</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-1">파트너 가이드를 위해</p>
                        <p className="text-slate-600 text-sm leading-relaxed">내 맘대로 일정을 관리하고 나만의 특별한 투어 상품을 기획하여 정당한 수준의 수익을 창출하세요.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 tracking-tight">지금 바로 새로운 여행을 시작해 볼까요?</h2>
            <p className="text-lg text-slate-600 mb-10">가이드매치와 함께 평생 잊지 못할 당신만의 특별한 추억을 만들어보세요.</p>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-500/30"
            >
              어디로 떠나고 싶으신가요? <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
