"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, MapPin, Clock, Eye, EyeOff, Edit, Tag, TrendingUp, Sparkles, ImagePlus } from "lucide-react";
import Link from "next/link";
import { getMyTours, toggleTourStatus } from "./actions";
import { useRouter } from "next/navigation";

export default function GuideToursClient() {
  const router = useRouter();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTours = async () => {
    const data = await getMyTours();
    setTours(data);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleTourStatus(id, currentStatus);
      await refreshTours();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("상태를 변경하지 못했습니다.");
    }
  };

  useEffect(() => {
    const fetchTours = async () => {
      try {
        await refreshTours();
      } catch (error) {
        console.error("Failed to fetch tours:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-10">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="font-medium text-slate-500">투어 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 p-6 md:p-8 animate-fade-in">
      <div className="absolute right-1/4 top-0 -z-10 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">투어 상품 관리</h1>
          <p className="mt-2 text-lg text-slate-500">한국어 원문 기준으로 상품을 관리하고, 영어 번역본은 자동으로 저장됩니다.</p>
        </div>
        <Link href="/guide/tours/new">
          <Button className="flex h-11 items-center gap-2 bg-accent px-6 text-sm font-bold shadow-md shadow-accent/20 transition-all hover:scale-[1.02] hover:bg-blue-600">
            <Plus className="h-4 w-4" /> 새 투어 등록
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-slate-200/60 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-accent">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">전체 투어</p>
              <p className="text-2xl font-extrabold text-slate-900">{tours.length}개</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">노출 중</p>
              <p className="text-2xl font-extrabold text-slate-900">{tours.filter((tour) => tour.is_active).length}개</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 bg-white shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">최근 등록 투어</p>
              <p className="max-w-[150px] truncate text-lg font-bold leading-tight text-slate-900">
                {tours.length > 0 ? tours[0].title_ko || tours[0].title || "-" : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour, idx) => {
          const title = tour.title_ko || tour.title || "";
          const region = tour.region_ko || tour.region || "";

          return (
            <Card key={tour.id || idx} className="group relative flex flex-col overflow-hidden border-slate-200/60 bg-white shadow-md transition-all hover:shadow-lg">
              <div className="cursor-pointer flex h-full flex-col" onClick={() => router.push(`/guide/tours/${tour.id}`)}>
                <div className="relative h-48 w-full overflow-hidden bg-slate-200">
                  {tour.photo ? (
                    <img src={tour.photo.split(',')[0]} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                      <ImagePlus className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute right-4 top-4 z-10">
                    <span
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-extrabold shadow-sm backdrop-blur-sm ${
                        tour.is_active
                          ? "border-emerald-600 bg-emerald-500/90 text-white"
                          : "border-slate-700 bg-slate-800/80 text-white"
                      }`}
                    >
                      {tour.is_active ? "노출 중" : "비공개"}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 z-10 pr-8">
                    <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white">{title}</h3>
                  </div>
                </div>

                <CardContent className="flex-1 space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                    <span className="flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
                      <MapPin className="h-3 w-3 text-emerald-500" /> {region}
                    </span>
                    <span className="flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
                      <Clock className="h-3 w-3 text-accent" /> {tour.duration}시간
                    </span>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">가격</p>
                    <p className="text-xl font-black text-slate-900">₩ {tour.price?.toLocaleString()}</p>
                  </div>
                </CardContent>
              </div>

              <div className="relative z-10 mt-auto flex gap-2 px-5 pb-5 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 flex-1 border-slate-200 text-xs font-bold text-slate-600 transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/guide/tours/${tour.id}/edit`);
                  }}
                >
                  <Edit className="mr-1 h-3.5 w-3.5" /> 수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-10 flex-1 text-xs font-bold transition-all ${
                    tour.is_active
                      ? "border-amber-100 text-amber-600 hover:bg-amber-50"
                      : "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(tour.id, tour.is_active);
                  }}
                >
                  {tour.is_active ? (
                    <>
                      <EyeOff className="mr-1 h-3.5 w-3.5" /> 비공개
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3.5 w-3.5" /> 노출
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}

        <Link href="/guide/tours/new" className="block rounded-xl focus:outline-none focus:ring-4 ring-accent/20">
          <Card className="flex min-h-[400px] flex-col border-2 border-dashed border-slate-300 bg-slate-50/50 shadow-none transition-all hover:border-accent/50 hover:bg-slate-50">
            <CardContent className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all group-hover:text-accent group-hover:scale-110">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">새 투어 아이디어가 있나요?</h3>
              <p className="mb-8 max-w-[220px] text-sm leading-relaxed text-slate-500">
                한국어로 먼저 작성하면 영어 번역본은 자동으로 저장됩니다.
              </p>
              <Button className="flex items-center gap-2 bg-slate-900 px-6 font-bold text-white shadow-md hover:bg-accent hover:shadow-accent/20">
                <Plus className="h-4 w-4" /> 바로 만들기
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
