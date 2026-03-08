"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, Plus, ImagePlus, Loader2 } from "lucide-react";
import { updateTourAction } from "../../actions";

interface TourEditFormProps {
    tour: any;
}

export default function TourEditForm({ tour }: TourEditFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const [formData, setFormData] = useState({
        title: tour.title || "",
        description: tour.description || "",
        region: tour.region || "",
        duration: tour.duration?.toString() || "",
        price: tour.price?.toString() || "",
        maxGuests: tour.max_guests?.toString() || "4",
        img: tour.photo || "",
        includedItems: Array.isArray(tour.included_items) ? tour.included_items : (Array.isArray(tour.includedItems) ? tour.includedItems : [])
    });

    const [includedInput, setIncludedInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert("이미지 파일만 업로드 가능합니다.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setFormData(prev => ({ ...prev, img: e.target?.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) handleImageUpload(file);
                break;
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddIncludedItem = () => {
        const trimmed = includedInput.trim();
        if (!trimmed) return;

        if (formData.includedItems.includes(trimmed)) {
            alert("이미 추가된 항목입니다.");
            return;
        }

        setFormData(prev => ({
            ...prev,
            includedItems: [...prev.includedItems, trimmed]
        }));
        setIncludedInput("");
    };

    const handleRemoveIncludedItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            includedItems: prev.includedItems.filter((_: string, i: number) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 포함 사항 입력창에 텍스트가 남아있으면 자동으로 추가
        const trimmedIncludedInput = includedInput.trim();
        const finalIncludedItems =
            trimmedIncludedInput && !formData.includedItems.includes(trimmedIncludedInput)
                ? [...formData.includedItems, trimmedIncludedInput]
                : formData.includedItems;

        if (!formData.title || !formData.description || !formData.region || !formData.duration || !formData.price || !formData.img) {
            alert("모든 필수 필드를 입력해주세요.");
            return;
        }

        setIsPending(true);
        try {
            await updateTourAction(tour.id, {
                ...formData,
                includedItems: finalIncludedItems
            });
            alert("투어 정보가 성공적으로 수정되었습니다!");
            router.push("/guide/tours");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(`수정 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} onPaste={handlePaste} className="p-6 md:p-8 space-y-8 animate-fade-in-up">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">투어 제목</label>
                    <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="예: 경복궁 및 북촌 프리미엄 해설 투어"
                        className="h-12 border-slate-200 focus:border-accent"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">투어 소개</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="예: 왕실의 역사와 북촌 한옥마을의 아름다움을 전문 가이드와 함께 체험하세요."
                        className="w-full flex min-h-[120px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none transition-colors"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <label className="text-sm font-bold text-slate-700">소요 시간</label>
                        <Input
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="예: 4시간"
                            className="h-12 border-slate-200 focus:border-accent"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">가이드 요금 (1인 기준, ₩)</label>
                        <Input
                            type="text"
                            name="price"
                            value={formData.price}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                if (!rawValue) {
                                    setFormData(prev => ({ ...prev, price: '' }));
                                    return;
                                }
                                const formatted = Number(rawValue).toLocaleString('ko-KR');
                                setFormData(prev => ({ ...prev, price: formatted }));
                            }}
                            placeholder="예: 80,000"
                            className="h-12 border-slate-200 focus:border-accent"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">최대 투어 인원 (명)</label>
                        <Input
                            type="number"
                            name="maxGuests"
                            value={formData.maxGuests}
                            onChange={handleChange}
                            placeholder="예: 4"
                            className="h-12 border-slate-200 focus:border-accent"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <label className="text-sm font-bold text-slate-700">포함 사항</label>
                    <div className="flex gap-2">
                        <Input
                            value={includedInput}
                            onChange={(e) => setIncludedInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddIncludedItem();
                                }
                            }}
                            placeholder="예: 차량 지원, 유적지 입장료 등"
                            className="h-12 border-slate-200 focus:border-accent"
                        />
                        <Button
                            type="button"
                            onClick={handleAddIncludedItem}
                            className="h-12 w-12 shrink-0 bg-slate-900 text-white rounded-xl shadow-sm hover:bg-slate-800"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                    {formData.includedItems.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {formData.includedItems.map((item: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5 bg-accent/10 text-accent font-semibold px-3 py-1.5 rounded-lg text-sm border border-accent/20">
                                    <span>{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveIncludedItem(idx)}
                                        className="text-accent/60 hover:text-accent hover:bg-accent/10 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">썸네일 이미지</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    {formData.img ? (
                        <div className="relative mt-4 rounded-xl overflow-hidden border border-slate-200 h-64 w-full group">
                            <img src={formData.img} alt="미리보기" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-lg"
                                >
                                    이미지 변경
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, img: "" }))}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg"
                                >
                                    삭제
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-accent/50 transition-all flex flex-col items-center justify-center cursor-pointer text-slate-400 group"
                        >
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:text-accent group-hover:scale-110 transition-all">
                                <ImagePlus className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-600 group-hover:text-accent">클릭하여 이미지 업로드</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-14 bg-white border-slate-200 text-slate-600 font-bold"
                    onClick={() => router.push('/guide/tours')}
                    disabled={isPending}
                >
                    취소
                </Button>
                <Button
                    type="submit"
                    className="flex-1 h-14 bg-accent hover:bg-blue-600 text-white font-bold shadow-lg shadow-accent/20"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            저장 중...
                        </>
                    ) : (
                        "투어 정보 수정하기"
                    )}
                </Button>
            </div>
        </form>
    );
}
