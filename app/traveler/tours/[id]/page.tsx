import { getTourById } from "@/app/guide/tours/actions";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import TourDetailClient from "./TourDetailClient";

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tour = await getTourById(id);

    if (!tour) {
        notFound();
    }

    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">로딩 중...</div>}>
            <TourDetailClient tour={tour} />
        </Suspense>
    );
}

