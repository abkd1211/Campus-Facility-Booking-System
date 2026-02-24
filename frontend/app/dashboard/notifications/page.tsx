"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Trash2, CalendarDays, AlertCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { notifications as notifApi } from "@/lib/api";
import type { Notification } from "@/lib/api";
import clsx from "clsx";

const TYPE_ICON: Record<string, string> = {
    BOOKING_CONFIRMED: "bg-emerald-500/20 border-emerald-500/30",
    BOOKING_PENDING: "bg-amber-500/20  border-amber-500/30",
    BOOKING_CANCELLED: "bg-red-500/20    border-red-500/30",
    BOOKING_REJECTED: "bg-red-500/20    border-red-500/30",
    WAITLIST_PROMOTED: "bg-teal-500/20   border-teal-500/30",
    SYSTEM: "bg-white/[0.06]  border-white/[0.12]",
};

function typeIcon(type: string) {
    switch (type) {
        case "BOOKING_CONFIRMED": return <CalendarDays size={14} className="text-emerald-400" />;
        case "BOOKING_PENDING": return <AlertCircle size={14} className="text-amber-400" />;
        case "BOOKING_CANCELLED": return <AlertCircle size={14} className="text-red-400" />;
        case "BOOKING_REJECTED": return <AlertCircle size={14} className="text-red-400" />;
        default: return <Info size={14} className="text-white/50" />;
    }
}

export default function NotificationsPage() {
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    const load = () => {
        setLoading(true); setError(null);
        notifApi.my()
            .then(setNotifs)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load notifications."))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const markRead = async (id: number) => {
        await notifApi.markRead(id).catch(() => { });
        setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    };

    const remove = async (id: number) => {
        await notifApi.delete(id).catch(() => { });
        setNotifs((prev) => prev.filter((n) => n.id !== id));
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        await notifApi.markAllRead().catch(() => { });
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setMarkingAll(false);
    };

    const unreadCount = notifs.filter((n) => !n.isRead).length;

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    <p className="text-sm text-white/45 mt-0.5">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        disabled={markingAll}
                        className="flex items-center gap-1.5 glass px-4 py-2 rounded-xl text-xs font-medium text-teal-300 hover:text-teal-200 transition-colors"
                    >
                        {markingAll ? <span className="w-3 h-3 border border-teal-400/40 border-t-teal-400 rounded-full animate-spin" /> : <CheckCheck size={14} />}
                        Mark all read
                    </button>
                )}
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-24">
                    <p className="text-red-400 text-sm mb-3">{error}</p>
                    <button onClick={load} className="btn-glass px-5 py-2.5 rounded-xl text-sm font-medium text-white">Retry</button>
                </div>
            ) : notifs.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                    <Bell size={48} className="text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">No notifications yet.</p>
                </motion.div>
            ) : (
                <div className="space-y-2 max-w-2xl">
                    <AnimatePresence>
                        {notifs.map((notif, i) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 40, height: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => !notif.isRead && markRead(notif.id)}
                                className={clsx(
                                    "glass-card rounded-2xl p-4 flex gap-3 cursor-pointer transition-all",
                                    !notif.isRead && "border-l-2 border-teal-500"
                                )}
                            >
                                <div className={clsx(
                                    "w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5",
                                    TYPE_ICON[notif.type] ?? TYPE_ICON["SYSTEM"]
                                )}>
                                    {typeIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-white leading-snug">{notif.title}</p>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); remove(notif.id); }}
                                                className="text-white/20 hover:text-red-400 transition-colors p-0.5"
                                                aria-label="Delete notification"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{notif.message}</p>
                                    <p className="text-[10px] text-white/25 mt-2">
                                        {new Date(notif.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
