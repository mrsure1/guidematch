"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { isHoliday, getHoliday } from "@/lib/holidays";

export type CalendarMode = 'single' | 'range' | 'multiple';

interface CalendarProps {
    mode?: CalendarMode;
    selected?: string | string[] | { from: string; to: string };
    onSelect?: (val: any) => void;
    disabledDates?: string[];
    minDate?: string;
    maxDate?: string;
    className?: string;
    renderDay?: (fullDate: string, isCurrentMonth: boolean) => React.ReactNode;
    defaultMonth?: Date;
}

export function Calendar({
    mode = 'single',
    selected,
    onSelect,
    disabledDates = [],
    minDate,
    maxDate,
    className = "",
    renderDay,
    defaultMonth
}: CalendarProps) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(defaultMonth || new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const formatDate = (y: number, m: number, d: number) => {
        const mm = String(m + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${y}-${mm}-${dd}`;
    };

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const days = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const prevMonthDays = getDaysInMonth(year, month - 1);

        const dates = [];

        // Prev month
        for (let i = firstDay - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const fullDate = formatDate(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d);
            dates.push({ date: d, fullDate, type: 'prev' });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const fullDate = formatDate(year, month, i);
            dates.push({ date: i, fullDate, type: 'current' });
        }

        // Next month
        const remaining = 42 - dates.length;
        for (let i = 1; i <= remaining; i++) {
            const fullDate = formatDate(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, i);
            dates.push({ date: i, fullDate, type: 'next' });
        }

        return dates;
    }, [year, month]);

    const handleDateClick = (fullDate: string) => {
        if (!onSelect) return;

        if (mode === 'single') {
            onSelect(fullDate);
        } else if (mode === 'multiple') {
            const current = Array.isArray(selected) ? (selected as string[]) : [];
            if (current.includes(fullDate)) {
                onSelect(current.filter(d => d !== fullDate));
            } else {
                onSelect([...current, fullDate]);
            }
        } else if (mode === 'range') {
            const current = selected as { from: string; to: string } || { from: "", to: "" };
            if (!current.from || (current.from && current.to)) {
                onSelect({ from: fullDate, to: "" });
            } else {
                if (fullDate < current.from) {
                    onSelect({ from: fullDate, to: current.from });
                } else {
                    onSelect({ from: current.from, to: fullDate });
                }
            }
        }
    };

    const isSelected = (fullDate: string) => {
        if (mode === 'single') return selected === fullDate;
        if (mode === 'multiple') return Array.isArray(selected) && selected.includes(fullDate);
        if (mode === 'range') {
            const range = selected as { from: string; to: string };
            if (!range) return false;
            if (range.from === fullDate || range.to === fullDate) return true;
            if (range.from && range.to) {
                return fullDate > range.from && fullDate < range.to;
            }
        }
        return false;
    };

    const isDayDisabled = (fullDate: string) => {
        if (disabledDates.includes(fullDate)) return true;
        if (minDate && fullDate < minDate) return true;
        if (maxDate && fullDate > maxDate) return true;
        return false;
    };

    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));

    return (
        <div className={`p-4 bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.preventDefault(); setViewDate(new Date()); }}
                        className="text-[10px] font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-500 mr-1"
                    >오늘</button>
                    <span className="font-bold text-slate-900">{year}년 {month + 1}월</span>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={(e) => { e.preventDefault(); prevMonth(); }}
                        className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); nextMonth(); }}
                        className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                    <div key={day} className={`text-[11px] font-bold text-center py-1 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-400'}`}>
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                    const selected = isSelected(d.fullDate);
                    const disabled = isDayDisabled(d.fullDate);
                    const holiday = getHoliday(d.fullDate);
                    const isSunday = new Date(d.fullDate).getDay() === 0;
                    const isSaturday = new Date(d.fullDate).getDay() === 6;

                    const isToday = d.fullDate === formatDate(today.getFullYear(), today.getMonth(), today.getDate());

                    let textColor = "text-slate-900";
                    if (d.type !== 'current') textColor = "text-slate-300";
                    else if (holiday || isSunday) textColor = "text-red-500";
                    else if (isSaturday) textColor = "text-blue-500";

                    if (disabled) textColor = "text-slate-200";
                    if (selected) textColor = "text-white";

                    return (
                        <div
                            key={i}
                            onClick={() => !disabled && handleDateClick(d.fullDate)}
                            className={`
                                relative min-h-[48px] flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all
                                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'}
                                ${selected ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20' : ''}
                                ${isToday && !selected ? 'ring-2 ring-blue-500/20 ring-inset' : ''}
                            `}
                        >
                            <span className={textColor}>{d.date}</span>
                            {renderDay && renderDay(d.fullDate, d.type === 'current')}
                            {holiday && d.type === 'current' && !renderDay && (
                                <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-red-400'}`} title={holiday.name} />
                            )}
                            {selected && mode === 'range' && (
                                <div className="absolute inset-0 bg-blue-500/10 rounded-xl -z-10" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
