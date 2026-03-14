"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Notification {
    id: string;
    user_id: string;
    type: 'booking' | 'message' | 'system';
    title: string;
    content: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationPopupProps {
    customTrigger?: React.ReactNode;
}

export function NotificationPopup({ customTrigger }: NotificationPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const popupRef = useRef<HTMLDivElement>(null);

    // 알림 목록 페칭
    const fetchNotifications = async (uid: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
        }
    };

    useEffect(() => {
        const setup = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchNotifications(user.id);

                // 실시간 구독 설정
                const channel = supabase
                    .channel(`public:notifications:user_id=eq.${user.id}`)
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${user.id}`
                        },
                        (payload) => {
                            if (payload.eventType === 'INSERT') {
                                setNotifications(prev => [payload.new as Notification, ...prev]);
                            } else if (payload.eventType === 'UPDATE') {
                                setNotifications(prev => prev.map(n =>
                                    n.id === payload.new.id ? payload.new as Notification : n
                                ));
                            } else if (payload.eventType === 'DELETE') {
                                setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                            }
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        };

        setup();
    }, []);

    // 알림 읽음 처리 및 이동
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notification.id);
        }

        if (notification.link) {
            router.push(notification.link);
        }
        setIsOpen(false);
    };

    // 모두 읽음 처리
    const markAllAsRead = async () => {
        if (!userId) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={popupRef}>
            {/* Trigger Rendering */}
            {customTrigger ? (
                <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                    {customTrigger}
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 text-slate-600 hover:text-accent transition-colors focus:outline-none"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 z-[100] overflow-hidden animate-fade-in origin-top-right">
                    <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">알림</h3>
                        {unreadCount > 0 && (
                            <button
                                className="text-xs text-accent hover:text-blue-700 font-medium"
                                onClick={markAllAsRead}
                            >
                                모두 읽음 처리
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">새로운 알림이 없습니다.</div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {notifications.map(notification => (
                                    <li
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${notification.is_read ? 'opacity-70' : 'bg-blue-50/20'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 shrink-0">
                                                {notification.type === 'booking' && <div className="p-1.5 bg-green-100 text-green-600 rounded-full"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                                                {notification.type === 'message' && <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>}
                                                {notification.type === 'system' && <div className="p-1.5 bg-amber-100 text-amber-600 rounded-full"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className={`text-sm font-bold truncate ${notification.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{notification.title}</p>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ko })}
                                                    </span>
                                                </div>
                                                <p className={`text-xs line-clamp-2 ${notification.is_read ? 'text-slate-500' : 'text-slate-600'}`}>{notification.content}</p>
                                            </div>
                                            {!notification.is_read && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5"></div>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-3 border-t border-slate-100 text-center bg-slate-50">
                        <Button variant="ghost" size="sm" className="text-xs text-slate-500 w-full hover:text-slate-900" onClick={() => { setIsOpen(false); router.push('/notifications'); }}>모든 알림 보기</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

