"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, X, CheckCheck, Trash2,
    CalendarDays, AlertCircle, Info, CheckCircle2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { notifications as notifApi } from "@/lib/api";
import type { Notification } from "@/lib/api";
import clsx from "clsx";

/* ── helpers ────────────────────────────────────────────────────────────────── */
function typeColor(type: string) {
    switch (type) {
        case "BOOKING_CONFIRMED": return "bg-emerald-500/15 border-emerald-500/25";
        case "BOOKING_PENDING": return "bg-amber-500/15  border-amber-500/25";
        case "BOOKING_CANCELLED":
        case "BOOKING_REJECTED": return "bg-red-500/15    border-red-500/25";
        case "WAITLIST_PROMOTED": return "bg-teal-500/15   border-teal-500/25";
        default: return "bg-white/[0.05]  border-white/[0.10]";
    }
}

function TypeIcon({ type }: { type: string }) {
    const cls = "flex-shrink-0";
    switch (type) {
        case "BOOKING_CONFIRMED": return <CheckCircle2 size={13} className={clsx(cls, "text-emerald-400")} />;
        case "BOOKING_PENDING": return <AlertCircle size={13} className={clsx(cls, "text-amber-400")} />;
        case "BOOKING_CANCELLED":
        case "BOOKING_REJECTED": return <AlertCircle size={13} className={clsx(cls, "text-red-400")} />;
        case "WAITLIST_PROMOTED": return <CalendarDays size={13} className={clsx(cls, "text-teal-400")} />;
        default: return <Info size={13} className={clsx(cls, "text-white/40")} />;
    }
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

/* ── props ──────────────────────────────────────────────────────────────────── */
interface NotificationBellProps {
    /** "teal" for regular sidebar, "amber" for admin sidebar */
    accent?: "teal" | "amber";
}

export default function NotificationBell({ accent = "teal" }: NotificationBellProps) {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    /* only run on client — avoids SSR/client hydration mismatch */
    useEffect(() => { setMounted(true); }, []);

    /* close on outside click */
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    /* close on Escape */
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, []);

    const fetchNotifs = useCallback(() => {
        setLoading(true);
        notifApi.my()
            .then(setNotifs)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    /* poll unread count every 30s */
    const [unread, setUnread] = useState(0);
    useEffect(() => {
        notifApi.unread().then(r => setUnread(r.count)).catch(() => { });
        const id = setInterval(() => {
            notifApi.unread().then(r => setUnread(r.count)).catch(() => { });
        }, 30_000);
        return () => clearInterval(id);
    }, []);

    /* sync unread from local state */
    useEffect(() => {
        setUnread(notifs.filter(n => !n.isRead).length);
    }, [notifs]);

    const openPanel = () => {
        setOpen(v => !v);
        if (!open) fetchNotifs();
    };

    const markRead = async (id: number) => {
        await notifApi.markRead(id).catch(() => { });
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const remove = async (id: number) => {
        await notifApi.delete(id).catch(() => { });
        setNotifs(prev => prev.filter(n => n.id !== id));
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        await notifApi.markAllRead().catch(() => { });
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
        setMarkingAll(false);
    };

    const accentRing = accent === "amber" ? "ring-amber-400/30" : "ring-teal-400/30";
    const accentBadge = accent === "amber" ? "bg-red-500" : "bg-red-500";
    const accentMark = accent === "amber" ? "text-amber-300 hover:text-amber-200" : "text-teal-300 hover:text-teal-200";
    const accentDot = accent === "amber" ? "bg-amber-400" : "bg-teal-400";

    return (
        <div className="relative" ref={ref}>
            {/* Render nothing interactive until client has hydrated */}
            {!mounted ? (
                <div className="p-2 rounded-xl w-9 h-9" />
            ) : (
                <>
                    {/* ── Bell button ── */}
                    <button
                        id="notification-bell"
                        onClick={openPanel}
                        aria-label="Notifications"
                        className={clsx(
                            "relative p-2 rounded-xl transition-all duration-200",
                            "hover:bg-white/[0.06] active:scale-95",
                            open && "bg-white/[0.06] ring-1 " + accentRing
                        )}
                    >
                        <Bell size={18} className={open ? "text-white" : "text-white/45"} />
                        <AnimatePresence>
                            {unread > 0 && (
                                <motion.span
                                    key="badge"
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                    className={clsx(
                                        "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1",
                                        "rounded-full text-[9px] font-bold text-white leading-4",
                                        "flex items-center justify-center shadow-md",
                                        accentBadge
                                    )}
                                >
                                    {unread > 99 ? "99+" : unread}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    {/* ── Popover ── */}
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className={clsx(
                                    "absolute left-0 top-12 z-[100]",
                                    "w-80 rounded-2xl overflow-hidden shadow-2xl",
                                    "border border-white/[0.10]",
                                )}
                                style={{ background: "rgba(12, 14, 20, 0.97)", backdropFilter: "blur(32px)" }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                                    <div className="flex items-center gap-2">
                                        <Bell size={14} className="text-white/50" />
                                        <span className="text-sm font-semibold text-white">Notifications</span>
                                        {unread > 0 && (
                                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/25 rounded-full px-1.5 font-bold">
                                                {unread} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {unread > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                disabled={markingAll}
                                                className={clsx("flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-colors", accentMark)}
                                            >
                                                {markingAll
                                                    ? <span className="w-2.5 h-2.5 border border-current/40 border-t-current rounded-full animate-spin" />
                                                    : <CheckCheck size={11} />}
                                                All read
                                            </button>
                                        )}
                                        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white transition-colors">
                                            <X size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="max-h-[340px] overflow-y-auto overscroll-contain">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <div className="w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
                                        </div>
                                    ) : notifs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                                            <Bell size={28} className="text-white/10" />
                                            <p className="text-xs text-white/30">You&rsquo;re all caught up!</p>
                                        </div>
                                    ) : (
                                        <AnimatePresence initial={false}>
                                            {notifs.map((n, i) => (
                                                <motion.div
                                                    key={n.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                    transition={{ delay: i * 0.025, duration: 0.18 }}
                                                    onClick={() => !n.isRead && markRead(n.id)}
                                                    className={clsx(
                                                        "flex gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0",
                                                        "transition-colors group",
                                                        !n.isRead
                                                            ? "bg-white/[0.03] cursor-pointer hover:bg-white/[0.06]"
                                                            : "opacity-60 hover:opacity-80 cursor-default"
                                                    )}
                                                >
                                                    {/* type icon */}
                                                    <div className={clsx(
                                                        "w-7 h-7 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5",
                                                        typeColor(n.type)
                                                    )}>
                                                        <TypeIcon type={n.type} />
                                                    </div>

                                                    {/* content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-1.5 justify-between">
                                                            <p className="text-xs font-semibold text-white leading-snug line-clamp-1">{n.title}</p>
                                                            {!n.isRead && (
                                                                <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 animate-pulse", accentDot)} />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2 mt-0.5">{n.message}</p>
                                                        <p className="text-[10px] text-white/22 mt-1">{timeAgo(n.createdAt)}</p>
                                                    </div>

                                                    {/* delete */}
                                                    <button
                                                        onClick={e => { e.stopPropagation(); remove(n.id); }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 p-0.5 flex-shrink-0 mt-0.5"
                                                        aria-label="Delete"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>

                                {/* Footer */}
                                {notifs.length > 0 && (
                                    <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between">
                                        <p className="text-[10px] text-white/25">{notifs.length} notification{notifs.length !== 1 ? "s" : ""}</p>
                                        <button
                                            onClick={async () => {
                                                const ids = notifs.map(n => n.id);
                                                setNotifs([]);
                                                await Promise.allSettled(ids.map(id => notifApi.delete(id)));
                                            }}
                                            className="text-[10px] text-white/25 hover:text-red-400/70 transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
