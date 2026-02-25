"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, MapPin, Clock, Users, XCircle, ChevronDown, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { bookings as bookingApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import clsx from "clsx";

const STATUS_FILTER = ["ALL", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED", "EXPIRED"] as const;

const PLACEHOLDER: Record<string, string> = {
    "Lecture Hall": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
    "Computer Laboratory": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "Auditorium": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    "Sports Facility": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "Conference Room": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    "Workshop Room": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    default: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80",
};

function statusClass(s: string) {
    switch (s) {
        case "CONFIRMED": return "badge-confirmed";
        case "COMPLETED": return "badge-completed";
        case "CANCELLED": return "badge-cancelled";
        case "REJECTED": return "badge-cancelled";
        default: return "badge-cancelled";
    }
}

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<typeof STATUS_FILTER[number]>("ALL");
    const [cancelling, setCancelling] = useState<number | null>(null);

    const load = () => {
        setLoading(true); setError(null);
        bookingApi.my()
            .then(setBookings)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load bookings."))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const cancel = async (id: number) => {
        if (!confirm("Cancel this booking?")) return;
        setCancelling(id);
        try {
            const updated = await bookingApi.cancel(id);
            setBookings((prev) => prev.map((b) => b.id === id ? updated : b));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to cancel booking.");
        } finally {
            setCancelling(null);
        }
    };

    const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

    const stats = [
        { label: "Total", count: bookings.length, color: "text-white/70" },
        { label: "Confirmed", count: bookings.filter((b) => b.status === "CONFIRMED").length, color: "text-teal-400" },
        { label: "Completed", count: bookings.filter((b) => b.status === "COMPLETED").length, color: "text-emerald-400" },
        { label: "Cancelled", count: bookings.filter((b) => b.status === "CANCELLED").length, color: "text-red-400" },
    ];

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-2xl font-bold text-white">My Bookings</h1>
                <p className="text-sm text-white/45 mt-0.5">Track and manage all your facility reservations</p>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="grid grid-cols-4 gap-3 mb-6">
                {stats.map(({ label, count, color }) => (
                    <div key={label} className="glass-card rounded-2xl p-4 text-center">
                        <p className={clsx("text-xl font-bold", color)}>{count}</p>
                        <p className="text-xs text-white/40 mt-0.5">{label}</p>
                    </div>
                ))}
            </motion.div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
                {STATUS_FILTER.map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={clsx(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                            filter === s ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md" : "glass text-white/50 hover:text-white"
                        )}>
                        {s === "ALL" ? "All Bookings" : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-24">
                    <p className="text-red-400 text-sm mb-3">{error}</p>
                    <button onClick={load} className="btn-glass px-5 py-2.5 rounded-xl text-sm font-medium text-white">Retry</button>
                </div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                    <CalendarDays size={48} className="text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">
                        {filter === "ALL" ? "No bookings yet. Browse facilities to get started." : `No ${filter.toLowerCase()} bookings.`}
                    </p>
                    {filter === "ALL" && (
                        <Link href="/dashboard" className="btn-glass px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-4 inline-block">
                            Browse Facilities
                        </Link>
                    )}
                </motion.div>
            ) : (
                <AnimatePresence>
                    <div className="space-y-4">
                        {filtered.map((booking, i) => {
                            const typeName = booking.facility?.facilityType?.name ?? "";
                            const imgSrc = booking.facility?.imageUrl || PLACEHOLDER[typeName] || PLACEHOLDER.default;
                            const canCancel = booking.status === "CONFIRMED";
                            const isCompleted = booking.status === "COMPLETED";

                            return (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass-card rounded-2xl overflow-hidden flex flex-col sm:flex-row"
                                >
                                    <div className="relative w-full sm:w-40 h-32 sm:h-auto flex-shrink-0">
                                        <Image src={imgSrc} alt={booking.facility?.name ?? ""} fill className="object-cover" unoptimized />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
                                    </div>
                                    <div className="flex-1 p-5 flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-bold text-white text-sm">{booking.facility?.name}</h3>
                                                <div className="flex items-center gap-1 text-white/40 text-xs mt-0.5">
                                                    <MapPin size={11} />{booking.facility?.location}
                                                </div>
                                            </div>
                                            <span className={clsx("text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0", statusClass(booking.status))}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-xs text-white/50">
                                            <span className="flex items-center gap-1"><CalendarDays size={11} />{booking.date}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} />{booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}
                                            </span>
                                            <span className="flex items-center gap-1"><Users size={11} />{booking.attendees} people</span>
                                        </div>
                                        <p className="text-xs text-white/40 line-clamp-1">{booking.purpose}</p>
                                        <div className="flex gap-2 mt-1">
                                            {canCancel && (
                                                <button
                                                    onClick={() => cancel(booking.id)}
                                                    disabled={cancelling === booking.id}
                                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors glass px-3 py-1.5 rounded-lg"
                                                >
                                                    {cancelling === booking.id ? (
                                                        <span className="w-3 h-3 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                                                    ) : (
                                                        <XCircle size={13} />
                                                    )}
                                                    Cancel
                                                </button>
                                            )}
                                            {isCompleted && (
                                                <Link href={`/dashboard/review/${booking.id}`}>
                                                    <button className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors glass px-3 py-1.5 rounded-lg">
                                                        <Star size={13} /> Leave Review
                                                    </button>
                                                </Link>
                                            )}
                                            <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors glass px-3 py-1.5 rounded-lg ml-auto">
                                                <ChevronDown size={13} /> Details
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
}
