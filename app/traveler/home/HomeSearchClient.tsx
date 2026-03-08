"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomeSearchClient({ initialKeyword = "" }: { initialKeyword?: string }) {
    const router = useRouter();
    const [keyword, setKeyword] = useState(initialKeyword);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const params = new URLSearchParams(window.location.search);
        if (keyword.trim()) {
            params.set('q', keyword);
        } else {
            params.delete('q');
        }

        router.push(`/traveler/home?${params.toString()}`, { scroll: false });
    };

    return (
        <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-2xl border border-white/20 relative z-20 group transition-all duration-300 hover:bg-white/20 focus-within:bg-white/20">
            <div className="flex-1 flex items-center px-4 py-3 sm:py-0">
                <Search className="w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="도시, 테마 또는 가이드 이름 검색..."
                    className="w-full h-12 sm:h-14 pl-3 bg-transparent text-white placeholder:text-white/50 focus:outline-none placeholder:font-light text-lg"
                />
            </div>
            <Button type="submit" size="lg" className="h-12 sm:h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all font-bold text-lg border-0">
                탐색하기
            </Button>
        </form>
    );
}
