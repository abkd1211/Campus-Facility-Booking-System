"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarDays, MapPin, Users, Clock, RefreshCw,
    PlusCircle, LogIn, LogOut, XCircle, Trash2,
    ChevronDown, MoreVertical,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { bookings as bookingApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import clsx from "clsx";

const PLACEHOLDER: Record<string, string> = {
    "Lecture Hall": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
    "Computer Laboratory": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "Auditorium": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    "Sports Facility": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "Conference Room": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    default: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80",
};

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
    CONFIRMED: { cls: "badge-confirmed", label: "Confirmed" },
    PENDING: { cls: "badge-pending", label: "Pending" },
    COMPLETED: { cls: "badge-completed", label: "Completed" },
    CANCELLED: { cls: "badge-cancelled", label: "Cancelled" },
    REJECTED: { cls: "badge-cancelled", label: "Rejected" },
    EXPIRED: { cls: "badge-cancelled", label: "Expired" },
    ACTIVE: { cls: "badge-confirmed", label: "Active" },
};

/* ─── inline action menu ─────────────────────────────────────────────────── */
function BookingActions({
    booking,
    onUpdate,
    onRemove,
}: {
    booking: Booking;
    onUpdate: (b: Booking) => void;
    onRemove: (id: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    // close on outside click
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const act = async (label: string, fn: () => Promise<Booking | void>) => {
        setBusy(label); setError(null);
        try {
            const result = await fn();
            if (result) onUpdate(result);
            else onRemove(booking.id);
            setOpen(false);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Action failed");
        } finally {
            setBusy(null);
        }
    };

    const s = booking.status;

    const actions = [
        { label: "Check In", icon: LogIn, show: s === "CONFIRMED", fn: () => bookingApi.checkIn(booking.id), color: "text-teal-400" },
        { label: "Check Out", icon: LogOut, show: s === "ACTIVE" || s === "CONFIRMED", fn: () => bookingApi.checkOut(booking.id), color: "text-cyan-400" },
        { label: "Cancel", icon: XCircle, show: s !== "COMPLETED" && s !== "CANCELLED" && s !== "REJECTED", fn: () => bookingApi.cancel(booking.id), color: "text-amber-400" },
        { label: "Delete", icon: Trash2, show: true, fn: () => bookingApi.remove(booking.id), color: "text-red-400" },
    ].filter(a => a.show);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                {busy ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin block" /> : <MoreVertical size={14} />}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
                        className="absolute right-0 top-8 z-30 glass-strong rounded-xl py-1.5 min-w-[140px] shadow-xl">
                        {error && <p className="text-[10px] text-red-400 px-3 pb-1">{error}</p>}
                        {actions.map(({ label, icon: Icon, fn, color }) => (
                            <button key={label} onClick={() => act(label, fn)}
                                className={clsx("flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-white/[0.07] transition-colors", color)}>
                                <Icon size={12} /> {label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function AdminAllBookings() {
    const [items, setItems] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState("ALL");

    const load = () => {
        setLoading(true); setError(null);
        bookingApi.all()
            .then(setItems)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load bookings."))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const handleUpdate = (updated: Booking) =>
        setItems(prev => prev.map(b => b.id === updated.id ? updated : b));
    const handleRemove = (id: number) =>
        setItems(prev => prev.filter(b => b.id !== id));

    const statuses = ["ALL", ...Array.from(new Set(items.map(b => b.status)))];
    const filtered = filter === "ALL" ? items : items.filter(b => b.status === filter);

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-1">Admin</p>
                    <h1 className="text-3xl font-bold text-white">All <span className="gradient-text-admin">Bookings</span></h1>
                    <p className="text-sm text-white/35 mt-1">Manage every booking — check-in, check-out, cancel or delete ({items.length} total)</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <Link href="/admin/bookings/new">
                        <button className="btn-amber px-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5">
                            <PlusCircle size={13} /> Create Booking
                        </button>
                    </Link>
                    <button onClick={load} disabled={loading}
                        className="glass px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </motion.div>

            {/* Status filter */}
            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
                {statuses.map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={clsx(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                            filter === s ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md" : "glass text-white/50 hover:text-white"
                        )}>
                        {s === "ALL" ? `All (${items.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${items.filter(b => b.status === s).length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-24">
                    <p className="text-red-400 text-sm mb-3">{error}</p>
                    <button onClick={load} className="btn-glass px-5 py-2.5 rounded-xl text-sm font-medium text-white">Retry</button>
                </div>
            ) : (
                <div className="space-y-3 max-w-4xl">
                    {filtered.length === 0 && (
                        <p className="text-center text-white/30 py-16 text-sm">No bookings found for this filter.</p>
                    )}
                    {filtered.map((b, i) => {
                        const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.CONFIRMED;
                        const typeName = b.facility?.facilityType?.name ?? "";
                        const imgSrc = b.facility?.imageUrl || PLACEHOLDER[typeName] || PLACEHOLDER.default;
                        return (
                            <motion.div key={b.id}
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.035 }}
                                className="glass-card rounded-2xl flex gap-4 p-5 items-start">
                                <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 hidden sm:block">
                                    <Image src={imgSrc} alt={b.facility?.name ?? ""} fill className="object-cover" unoptimized />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-1">
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{b.facility?.name}</h3>
                                            <p className="text-xs text-white/40">{b.user?.name} · <span className="text-white/25">{b.user?.email}</span></p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={clsx("px-2.5 py-1 rounded-full text-[10px] font-semibold", cfg.cls)}>{cfg.label}</span>
                                            <BookingActions booking={b} onUpdate={handleUpdate} onRemove={handleRemove} />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-white/45 mb-1">
                                        <span className="flex items-center gap-1"><MapPin size={11} />{b.facility?.location}</span>
                                        <span className="flex items-center gap-1"><CalendarDays size={11} />{b.date}</span>
                                        <span className="flex items-center gap-1"><Clock size={11} />{b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)}</span>
                                        <span className="flex items-center gap-1"><Users size={11} />{b.attendees} attendees</span>
                                    </div>
                                    <p className="text-xs text-white/50 italic truncate">&ldquo;{b.purpose}&rdquo;</p>
                                    {b.checkInTime && (
                                        <p className="text-[10px] text-teal-400 mt-0.5">
                                            Checked in: {new Date(b.checkInTime).toLocaleTimeString()}
                                            {b.checkOutTime && ` · Out: ${new Date(b.checkOutTime).toLocaleTimeString()}`}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
