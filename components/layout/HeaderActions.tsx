"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Calendar, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationPopup } from "@/components/notification/NotificationPopup";

interface HeaderActionsProps {
    className?: string;
    variant?: "light" | "dark";
}

export function HeaderActions({ className, variant = "dark" }: HeaderActionsProps) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchCounts = async (uid: string) => {
            // 알림 개수 조회 (읽지 않은 것)
            const { count: nCount, error: nError } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', uid)
                .eq('is_read', false);

            if (!nError && nCount !== null) {
                setUnreadCount(nCount);
            }

            // 예정된 예약 개수 조회 (확정된 예약 중 오늘 이후)
            const today = new Date().toISOString().split('T')[0];
            const { count: bCount, error: bError } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('traveler_id', uid)
                .eq('status', 'confirmed')
                .gte('start_date', today);

            if (!bError && bCount !== null) {
                setUpcomingBookingsCount(bCount);
            }
        };

        const setup = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchCounts(user.id);

                // 알림 실시간 구독
                const nChannel = supabase
                    .channel(`public:notifications:count:${user.id}`)
                    .on(
                        'postgres_changes' as any,
                        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                        () => fetchCounts(user.id)
                    )
                    .subscribe();

                // 예약 실시간 구독
                const bChannel = supabase
                    .channel(`public:bookings:count:${user.id}`)
                    .on(
                        'postgres_changes' as any,
                        { event: '*', schema: 'public', table: 'bookings', filter: `traveler_id=eq.${user.id}` },
                        () => fetchCounts(user.id)
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(nChannel);
                    supabase.removeChannel(bChannel);
                };
            }
        };

        setup();
    }, []);

    const iconClass = cn(
        "relative p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 group",
        variant === "light" 
            ? "text-white/80 hover:bg-white/10 hover:text-white" 
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

    const badgeClass = "absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 bg-[#ff385c] rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm animate-in zoom-in duration-300";

    if (!userId) return null;

    return (
        <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
            {/* 예정된 여행 (Trips) */}
            <Link href="/traveler/bookings" title="예정된 여행">
                <button className={iconClass}>
                    <Calendar className="w-[22px] h-[22px]" strokeWidth={1.8} />
                    {upcomingBookingsCount > 0 && (
                        <span className={badgeClass}>
                            {upcomingBookingsCount}
                        </span>
                    )}
                </button>
            </Link>

            {/* 알림 (Notifications) */}
            <div className="flex items-center">
                <NotificationPopup 
                    customTrigger={
                        <button className={iconClass} title="최근 알림">
                            <Bell className="w-[22px] h-[22px]" strokeWidth={1.8} />
                            {unreadCount > 0 && (
                                <span className={badgeClass}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    }
                />
            </div>
        </div>
    );
}
