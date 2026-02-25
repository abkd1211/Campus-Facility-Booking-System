"use client";

import { motion } from "framer-motion";
import { CalendarDays, Building2, Users, TrendingUp, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { bookings as bookingApi, facilities as facilityApi, users as usersApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import clsx from "clsx";

const ROLE_BADGE: Record<string, string> = {
    VISITOR: "bg-cyan-400/10   border-cyan-400/25   text-cyan-300",
    STAFF: "bg-purple-400/10 border-purple-400/25 text-purple-300",
    STUDENT: "bg-teal-400/10   border-teal-400/25   text-teal-300",
    ADMIN: "bg-amber-400/10  border-amber-400/25  text-amber-300",
};

export default function AdminOverview() {
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [bookingCount, setBookingCount] = useState("—");
    const [facCount, setFacCount] = useState("—");
    const [userCount, setUserCount] = useState("—");
    const [confirmedCount, setConfirmedCount] = useState("—");
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const [allBookings, allFac, allUsers] = await Promise.allSettled([
            bookingApi.all(),
            facilityApi.list(),
            usersApi.list(),
        ]);
        if (allBookings.status === "fulfilled") {
            const bookings = allBookings.value;
            setBookingCount(String(bookings.length));
            setConfirmedCount(String(bookings.filter((b) => b.status === "CONFIRMED").length));
            setRecentBookings(bookings.slice(0, 5));
        }
        if (allFac.status === "fulfilled") setFacCount(String(allFac.value.length));
        if (allUsers.status === "fulfilled") setUserCount(String(allUsers.value.length));
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const stats = [
        { label: "Confirmed Bookings", value: loading ? "…" : confirmedCount, icon: CalendarDays, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", href: "/admin/bookings" },
        { label: "Total Bookings", value: bookingCount, icon: CalendarDays, color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20", href: "/admin/bookings" },
        { label: "Active Facilities", value: facCount, icon: Building2, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", href: "/admin/facilities" },
        { label: "Registered Users", value: userCount, icon: Users, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", href: "/admin/users" },
    ];

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-400/70 uppercase tracking-widest mb-1">Administrator</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">System <span className="gradient-text-admin">Overview</span></h1>
                    <p className="text-sm text-white/35">University of Ghana, Legon · Facility Management</p>
                </div>
                <button onClick={load} disabled={loading}
                    className="glass px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5 self-start sm:mt-1">
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </motion.div>

            {/* Stat cards */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {stats.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.06 }}>
                        <Link href={s.href}>
                            <div className={clsx("glass-card rounded-2xl p-3 sm:p-5 cursor-pointer group border", s.border)}>
                                <div className={clsx("w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-4", s.bg)}>
                                    <s.icon size={16} className={s.color} />
                                </div>
                                <p className={clsx("text-xl sm:text-2xl font-bold mb-0.5", s.color)}>{s.value}</p>
                                <p className="text-[10px] sm:text-xs text-white/50 font-medium">{s.label}</p>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Recent bookings quick-view */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
                    <div className="glass-card rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <CalendarDays size={16} className="text-teal-400" /> Recent Bookings
                            </h2>
                            <Link href="/admin/bookings">
                                <span className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium">View all</span>
                            </Link>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                            {recentBookings.length === 0 ? (
                                <div className="px-6 py-8 text-center text-white/30 text-sm">
                                    {loading ? "Loading..." : "No bookings yet"}
                                </div>
                            ) : recentBookings.map((b) => (
                                <div key={b.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white/90 truncate">{b.facility?.name}</p>
                                        <p className="text-xs text-white/40 truncate">
                                            {b.user?.name} · {b.date} {b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={clsx(
                                            "text-[10px] px-2 py-1 rounded-full border font-semibold",
                                            ROLE_BADGE[b.user?.role ?? ""] ?? ROLE_BADGE.STUDENT
                                        )}>{b.user?.role}</span>
                                        <span className={clsx(
                                            "text-[10px] px-2 py-1 rounded-full font-semibold",
                                            b.status === "CONFIRMED" ? "badge-confirmed" : "badge-cancelled"
                                        )}>{b.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Info card */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-1">
                    <div className="glass-card rounded-2xl overflow-hidden h-full">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05]">
                            <TrendingUp size={15} className="text-amber-400" />
                            <h2 className="text-sm font-bold text-white">Quick Links</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            {[
                                { href: "/admin/bookings", label: "Browse all bookings", icon: CalendarDays, color: "text-teal-400" },
                                { href: "/admin/facilities", label: "Manage facilities", icon: Building2, color: "text-cyan-400" },
                                { href: "/admin/users", label: "Manage users", icon: Users, color: "text-purple-400" },
                            ].map(({ href, label, icon: Icon, color }) => (
                                <Link key={href} href={href}>
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group">
                                        <Icon size={15} className={color} />
                                        <span className="text-xs text-white/60 group-hover:text-white transition-colors">{label}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
