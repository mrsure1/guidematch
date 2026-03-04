"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { NotificationPopup } from "@/components/notification/NotificationPopup";
import { Button } from "@/components/ui/Button";
import { LayoutDashboard, Search, Map, Calendar, User, ShoppingBag, Menu, X, Landmark } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
    profile: any;
}

export function Navbar({ profile }: NavbarProps) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isGuide = profile?.role === "guide" || profile?.role === "admin";

    const travelerLinks = [
        { href: "/traveler/home", label: "투어 찾기", icon: Map },
        { href: "/traveler/search", label: "가이드 찾기", icon: Search },
        { href: "/traveler/bookings", label: "내 예약", icon: Calendar },
        { href: "/traveler/profile", label: "마이페이지", icon: User },
    ];

    const guideLinks = [
        { href: "/traveler/home", label: "투어 찾기", icon: Map },
        { href: "/traveler/search", label: "가이드 찾기", icon: Search },
        { href: "/guide/tours", label: "내 상품 관리", icon: ShoppingBag },
        { href: "/guide/dashboard", label: "가이드 대시보드", icon: LayoutDashboard },
        { href: "/guide/profile", label: "마이페이지", icon: User },
        ...(profile?.role === "admin" ? [{ href: "/admin/dashboard", label: "관리자 대시보드", icon: Search }] : []),
    ];

    const links = isGuide ? guideLinks : travelerLinks;

    return (
        <header className={cn(
            "sticky top-0 z-50 transition-all duration-300 border-b",
            scrolled
                ? "bg-white/90 backdrop-blur-xl border-slate-200/60 shadow-sm py-2"
                : "bg-white border-transparent py-4"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group shrink-0">
                    <div className="relative w-8 h-8 group-hover:scale-105 transition-transform">
                        <Image
                            src="/logo.png"
                            alt="GuideMatch Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-slate-900 hidden sm:block">
                        Guide<span className="text-accent">Match</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 mx-4">
                    {links.map((link) => {
                        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                    isActive
                                        ? "bg-white text-accent shadow-sm ring-1 ring-slate-100"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-accent" : "text-slate-400")} />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-3">


                    <div className="hidden sm:block">
                        <NotificationPopup />
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

                    <Link href={isGuide ? "/guide/profile" : "/traveler/profile"} className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md hover:ring-2 ring-accent transition-all cursor-pointer">
                            <img
                                src={profile?.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(profile?.full_name || 'User')}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </Link>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-2xl animate-in slide-in-from-top duration-300">
                    <nav className="p-4 space-y-2">
                        {links.map((link) => {
                            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl text-base font-bold transition-all",
                                        isActive
                                            ? "bg-blue-50 text-accent"
                                            : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-slate-400")} />
                                    {link.label}
                                </Link>
                            );
                        })}

                    </nav>
                </div>
            )}
        </header>
    );
}
