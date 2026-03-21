"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { createTourAction } from "../actions";
import { uploadFile } from "@/lib/supabase/storage";
import { translateTourForm } from "@/lib/tours/translate-tour-form";

type ImageItem = {
  file: File | null;
  url: string;
};

export default function TourCreateForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<any>(null);
  const [includedInput, setIncludedInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    region: "",
    meetingPoint: "",
    duration: "",
    price: "",
    maxGuests: "4",
    includedItems: [] as string[],
  });

  // 입력값을 공통적으로 갱신합니다.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 이미지를 선택하면 미리보기 URL을 만듭니다.
  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));

    setSelectedImages((prev) => [...prev, ...newImages]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e.target.files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files: File[] = [];

    for (const item of e.clipboardData.items) {
      if (item.type.includes("image")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length === 0) return;

    setSelectedImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const next = [...prev];
      const removed = next[index];
      if (removed?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
      }
      next.splice(index, 1);
      return next;
    });
  };

  const addIncludedItem = () => {
    const value = includedInput.trim();
    if (!value) return;

    setFormData((prev) => {
      if (prev.includedItems.includes(value)) return prev;
      return { ...prev, includedItems: [...prev.includedItems, value] };
    });

    setIncludedInput("");
  };

  const removeIncludedItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      includedItems: prev.includedItems.filter((_: string, i: number) => i !== index),
    }));
  };

  const handleTranslatePreview = async () => {
    if (!formData.title || !formData.description || !formData.region) {
      alert("번역을 위해 제목, 소개, 지역을 먼저 입력해 주세요.");
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateTourForm({
        title: formData.title,
        description: formData.description,
        region: formData.region,
        meetingPoint: formData.meetingPoint,
        includedItems: formData.includedItems,
      });
      setTranslations(result);
    } catch (error: any) {
      console.error(error);
      alert(`번역 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.region || !formData.duration || !formData.price) {
      alert("필수 항목을 모두 입력해 주세요.");
      return;
    }

    if (selectedImages.length === 0) {
      alert("최소 1장의 대표 이미지를 업로드해 주세요.");
      return;
    }

    setIsPending(true);
    setUploading(true);

    try {
      // 1. 이미 번역된 내용이 있으면 그것을 사용하고, 없으면 새로 번역합니다.
      let finalTranslations = translations;
      if (!finalTranslations) {
        finalTranslations = await translateTourForm({
          title: formData.title,
          description: formData.description,
          region: formData.region,
          meetingPoint: formData.meetingPoint,
          includedItems: formData.includedItems,
        });
      }

      // 2. 이미지를 Supabase Storage에 업로드합니다.
      const imageUrls: string[] = [];
      const timestamp = Date.now();

      for (let i = 0; i < selectedImages.length; i++) {
        const item = selectedImages[i];
        if (item.file) {
          const ext = item.file.name.split(".").pop() || "jpg";
          const path = `new/${timestamp}_${i}.${ext}`;
          const url = await uploadFile(item.file, path);
          imageUrls.push(url);
        } else {
          imageUrls.push(item.url);
        }
      }

      // 3. 한국어 원문과 영어 번역본을 동시에 저장합니다.
      await createTourAction(
        {
          ...formData,
          img: imageUrls.join(","),
          includedItems: formData.includedItems,
        },
        finalTranslations,
      );

      alert("새 투어가 등록되었습니다.");
      router.push("/guide/tours");
    } catch (error: any) {
      console.error(error);
      alert(`투어 등록 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsPending(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-8 p-6 md:p-8">
      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">투어 제목</label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="예: 서울 야경 + 한강 피크닉"
            className="h-12 border-slate-200 focus:border-accent"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">투어 소개</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="투어의 흐름, 매력, 분위기를 한국어로 적어 주세요."
            className="min-h-[120px] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">지역</label>
            <Input
              name="region"
              value={formData.region}
              onChange={handleChange}
              placeholder="예: 서울"
              className="h-12 border-slate-200 focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">미팅 장소</label>
            <Input
              name="meetingPoint"
              value={formData.meetingPoint}
              onChange={handleChange}
              placeholder="예: 홍대입구역 9번 출구"
              className="h-12 border-slate-200 focus:border-accent"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">소요 시간</label>
            <Input
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="예: 4"
              className="h-12 border-slate-200 focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">최대 인원</label>
            <Input
              name="maxGuests"
              value={formData.maxGuests}
              onChange={handleChange}
              placeholder="예: 4"
              className="h-12 border-slate-200 focus:border-accent"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">가격</label>
            <Input
              name="price"
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                setFormData((prev) => ({ ...prev, price: value ? Number(value).toLocaleString("ko-KR") : "" }));
              }}
              placeholder="예: 80,000"
              className="h-12 border-slate-200 focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">포함 항목</label>
            <div className="flex gap-2">
              <Input
                value={includedInput}
                onChange={(e) => setIncludedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIncludedItem();
                  }
                }}
                placeholder="예: 생수, 간단한 간식"
                className="h-12 border-slate-200 focus:border-accent"
              />
              <Button
                type="button"
                onClick={addIncludedItem}
                className="h-12 w-12 shrink-0 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {formData.includedItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.includedItems.map((item: string, index: number) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeIncludedItem(index)}
                  className="rounded-full p-0.5 text-accent/60 transition-colors hover:bg-accent/10 hover:text-accent"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">투어 이미지</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-accent hover:underline"
            >
              이미지 추가
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {selectedImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {selectedImages.map((image, index) => (
                <div key={`${image.url}-${index}`} className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <img src={image.url} alt={`미리보기 ${index + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="absolute left-2 top-2 rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                      대표 이미지
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-accent/50 hover:bg-slate-100"
            >
              <ImagePlus className="mb-3 h-6 w-6" />
              <p className="text-sm font-bold text-slate-600">클릭하거나 이미지를 붙여넣으세요</p>
              <p className="mt-1 text-xs text-slate-400">최소 1장 필요</p>
            </div>
          )}
        </div>
      </div>

      {/* 번역 미리보기 영역 */}
      {(translations || isTranslating) && (
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-900">영문 번역 미리보기 (AI 자동 생성)</h3>
            {isTranslating && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          </div>
          
          {translations ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">English Title</div>
                <div className="text-sm font-bold text-slate-900">{translations.title}</div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">English Description</div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{translations.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Region</div>
                  <div className="text-sm font-bold text-slate-900">{translations.region}</div>
                </div>
                {translations.meetingPoint && (
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meeting Point</div>
                    <div className="text-sm font-bold text-slate-900">{translations.meetingPoint}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-blue-400 italic">
              번역을 생성하고 있습니다...
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 border-t border-slate-100 pt-6">
        <Button
          type="button"
          variant="outline"
          className="h-14 flex-1 border-slate-200 bg-white font-bold text-slate-600"
          onClick={() => router.push("/guide/tours")}
          disabled={isPending || uploading || isTranslating}
        >
          취소
        </Button>
        
        {!translations && (
          <Button
            type="button"
            onClick={handleTranslatePreview}
            className="h-14 flex-1 bg-blue-600 font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
            disabled={isPending || uploading || isTranslating}
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                번역 중...
              </>
            ) : (
              "번역 미리보기"
            )}
          </Button>
        )}

        <Button
          type="submit"
          className={`h-14 flex-1 font-bold text-white shadow-lg transition-all ${
            translations 
              ? "bg-accent hover:bg-blue-600 shadow-accent/20" 
              : "bg-slate-400 cursor-not-allowed opacity-50"
          }`}
          disabled={isPending || uploading || isTranslating || (!translations)}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              업로드 중...
            </>
          ) : (
            "최종 등록하기"
          )}
        </Button>
      </div>
    </form>
  );
}
