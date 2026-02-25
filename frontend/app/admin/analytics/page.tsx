"use client";

import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import { bookings as bookingApi, facilities as facilityApi, users as usersApi } from "@/lib/api";
import type { Booking, Facility, User } from "@/lib/api";
import { RefreshCw, TrendingUp, CalendarDays, Users, Building2, Clock } from "lucide-react";
import clsx from "clsx";

// ── Colour palette ──────────────────────────────────────────────────────────
const TEAL = "#2dd4bf";
const CYAN = "#22d3ee";
const AMBER = "#fbbf24";
const PURPLE = "#a78bfa";
const ROSE = "#fb7185";
const EMERALD = "#34d399";

const ROLE_COLORS: Record<string, string> = {
    STUDENT: TEAL,
    STAFF: PURPLE,
    VISITOR: CYAN,
    ADMIN: AMBER,
    SECURITY: ROSE,
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function parseHour(time: string): number {
    return parseInt(time.split(":")[0], 10);
}

function durationHours(start: string, end: string): number {
    return Math.max(0, parseHour(end) - parseHour(start));
}

/** Group bookings into the last N days, bucketed by day */
function bookingsPerDay(bookings: Booking[], days = 30) {
    type Entry = { day: string; count: number; _key: string };
    const result: Entry[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const _key = d.toISOString().split("T")[0];
        const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        result.push({ day, count: 0, _key });
    }
    bookings.forEach((b) => {
        const match = result.find((r) => r._key === b.date);
        if (match) match.count++;
    });
    return result.map(({ day, count }) => ({ day, count }));
}

/** Count bookings per facility name, return top N */
function topFacilities(bookings: Booking[], n = 8) {
    const map: Record<string, number> = {};
    bookings.forEach((b) => {
        const name = b.facility?.name ?? "Unknown";
        map[name] = (map[name] ?? 0) + 1;
    });
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([name, count]) => ({ name: name.length > 22 ? name.slice(0, 20) + "…" : name, count }));
}

/** Booking count per user role */
function roleBreakdown(bookings: Booking[]) {
    const map: Record<string, number> = {};
    bookings.forEach((b) => {
        const role = b.user?.role ?? "UNKNOWN";
        map[role] = (map[role] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
}

/** Heat-map: [day-of-week][hour] → count  (Mon=0 … Sun=6, hours 6-22) */
function peakHeatmap(bookings: Booking[]) {
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 – 22:00
    const grid: number[][] = DAYS.map(() => HOURS.map(() => 0));

    bookings.forEach((b) => {
        const dow = (new Date(b.date).getDay() + 6) % 7; // Mon=0
        const startH = parseHour(b.startTime);
        const endH = parseHour(b.endTime);
        for (let h = startH; h < endH && h <= 22; h++) {
            const col = HOURS.indexOf(h);
            if (col >= 0) grid[dow][col]++;
        }
    });

    return { DAYS, HOURS, grid };
}

// ── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: {
    active?: boolean; payload?: { name: string; value: number }[]; label?: string
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass px-3 py-2 rounded-xl text-xs shadow-xl border border-white/10">
            {label && <p className="text-white/50 mb-1">{label}</p>}
            {payload.map((p) => (
                <p key={p.name} className="text-white font-semibold">{p.value} bookings</p>
            ))}
        </div>
    );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
    label: string; value: string; icon: React.ElementType; color: string; sub?: string
}) {
    return (
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", `bg-[${color}]/10`)}>
                <Icon size={19} style={{ color }} />
            </div>
            <div>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-white/50 font-medium">{label}</p>
                {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, iconColor, children }: {
    title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode
}) {
    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.05]">
                <Icon size={16} style={{ color: iconColor }} />
                <h2 className="text-sm font-bold text-white">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<7 | 14 | 30>(30);

    const load = async () => {
        setLoading(true);
        const [b, f, u] = await Promise.allSettled([
            bookingApi.all(),
            facilityApi.list(),
            usersApi.list(),
        ]);
        if (b.status === "fulfilled") setAllBookings(b.value);
        if (f.status === "fulfilled") setAllFacilities(f.value);
        if (u.status === "fulfilled") setAllUsers(u.value);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    // ── Derived metrics ────────────────────────────────────────────────────
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7); // "YYYY-MM"

    const bookingsThisMonth = useMemo(
        () => allBookings.filter((b) => b.date?.startsWith(thisMonth)),
        [allBookings, thisMonth]
    );

    const confirmed = useMemo(() => allBookings.filter((b) => b.status === "CONFIRMED").length, [allBookings]);
    const cancelled = useMemo(() => allBookings.filter((b) => b.status === "CANCELLED").length, [allBookings]);
    const completed = useMemo(() => allBookings.filter((b) => b.status === "COMPLETED").length, [allBookings]);

    const avgDuration = useMemo(() => {
        const withDuration = allBookings.filter((b) => b.startTime && b.endTime);
        if (!withDuration.length) return "—";
        const avg = withDuration.reduce((s, b) => s + durationHours(b.startTime, b.endTime), 0) / withDuration.length;
        return `${avg.toFixed(1)}h`;
    }, [allBookings]);

    const cancelRate = useMemo(() => {
        if (!allBookings.length) return "—";
        return `${((cancelled / allBookings.length) * 100).toFixed(1)}%`;
    }, [allBookings, cancelled]);

    const dayData = useMemo(() => bookingsPerDay(allBookings, timeRange), [allBookings, timeRange]);
    const facData = useMemo(() => topFacilities(allBookings), [allBookings]);
    const roleData = useMemo(() => roleBreakdown(allBookings), [allBookings]);
    const heatmap = useMemo(() => peakHeatmap(allBookings), [allBookings]);

    const maxHeat = useMemo(() => Math.max(1, ...heatmap.grid.flat()), [heatmap]);
    const maxFac = useMemo(() => Math.max(1, ...facData.map((f) => f.count)), [facData]);

    return (
        <div className="min-h-screen p-6 lg:p-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-1">Admin</p>
                    <h1 className="text-3xl font-bold text-white">
                        Booking <span className="gradient-text-admin">Analytics</span>
                    </h1>
                    <p className="text-sm text-white/35 mt-1">
                        {allBookings.length} total bookings · {allFacilities.length} facilities · {allUsers.length} users
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <button onClick={load} disabled={loading}
                        className="glass px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-40">
                    <div className="w-10 h-10 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ── Summary stats row ─────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCard label="Bookings This Month" value={String(bookingsThisMonth.length)}
                            icon={CalendarDays} color={TEAL} />
                        <StatCard label="Confirmed" value={String(confirmed)}
                            icon={TrendingUp} color={EMERALD} />
                        <StatCard label="Completed" value={String(completed)}
                            icon={CalendarDays} color={CYAN} />
                        <StatCard label="Avg Duration" value={avgDuration}
                            icon={Clock} color={PURPLE} />
                        <StatCard label="Cancellation Rate" value={cancelRate}
                            icon={Users} color={ROSE} sub={`${cancelled} cancelled`} />
                    </motion.div>

                    {/* ── Bookings over time ────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Section title="Bookings Over Time" icon={TrendingUp} iconColor={TEAL}>
                            {/* Range toggle */}
                            <div className="flex gap-2 mb-5">
                                {([7, 14, 30] as const).map((d) => (
                                    <button key={d} onClick={() => setTimeRange(d)}
                                        className={clsx(
                                            "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                                            timeRange === d
                                                ? "bg-teal-500/20 border border-teal-500/40 text-teal-300"
                                                : "glass text-white/40 hover:text-white/70"
                                        )}>
                                        {d}d
                                    </button>
                                ))}
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={dayData} barCategoryGap="35%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                                        tickLine={false} axisLine={false}
                                        interval={timeRange === 7 ? 0 : timeRange === 14 ? 1 : 4} />
                                    <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                                        tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                                    <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                    <Bar dataKey="count" name="Bookings" fill={TEAL}
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Section>
                    </motion.div>

                    {/* ── Top facilities + Role pie ─────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="grid lg:grid-cols-5 gap-6">

                        {/* Top facilities – custom horizontal bar */}
                        <div className="lg:col-span-3">
                            <Section title="Most Booked Facilities" icon={Building2} iconColor={AMBER}>
                                {facData.length === 0 ? (
                                    <p className="text-white/30 text-sm text-center py-8">No booking data yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {facData.map((f, i) => (
                                            <div key={f.name}>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-white/70 font-medium truncate max-w-[60%]">{f.name}</span>
                                                    <span className="text-white/40 shrink-0 ml-2">{f.count} bookings</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(f.count / maxFac) * 100}%` }}
                                                        transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                                                        className="h-full rounded-full"
                                                        style={{
                                                            background: `linear-gradient(90deg, ${AMBER}, ${TEAL})`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Section>
                        </div>

                        {/* Role pie */}
                        <div className="lg:col-span-2">
                            <Section title="Bookings by Role" icon={Users} iconColor={PURPLE}>
                                {roleData.length === 0 ? (
                                    <p className="text-white/30 text-sm text-center py-8">No data.</p>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie
                                                    data={roleData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={52} outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {roleData.map((entry) => (
                                                        <Cell key={entry.name}
                                                            fill={ROLE_COLORS[entry.name] ?? CYAN} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        background: "rgba(10,15,25,0.9)",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        borderRadius: 12,
                                                        fontSize: 11,
                                                        color: "#fff",
                                                    }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Legend */}
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            {roleData.map((r) => (
                                                <div key={r.name} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-sm"
                                                            style={{ background: ROLE_COLORS[r.name] ?? CYAN }} />
                                                        <span className="text-white/60">{r.name}</span>
                                                    </div>
                                                    <span className="font-semibold text-white/80">{r.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </Section>
                        </div>
                    </motion.div>

                    {/* ── Peak hours heatmap ────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Section title="Peak Hours Heatmap" icon={Clock} iconColor={ROSE}>
                            <p className="text-xs text-white/35 mb-4">
                                Hour-by-hour usage across the week — darker = more bookings
                            </p>
                            <div className="overflow-x-auto">
                                <div className="min-w-[540px]">
                                    {/* Hour labels */}
                                    <div className="flex mb-1 pl-10">
                                        {heatmap.HOURS.map((h) => (
                                            <div key={h} className="flex-1 text-center text-[9px] text-white/30 font-medium">
                                                {h.toString().padStart(2, "0")}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Grid rows */}
                                    {heatmap.DAYS.map((day, di) => (
                                        <div key={day} className="flex items-center gap-0 mb-1">
                                            <span className="w-10 text-[10px] text-white/35 font-medium shrink-0">{day}</span>
                                            {heatmap.HOURS.map((h, hi) => {
                                                const val = heatmap.grid[di][hi];
                                                const intensity = val / maxHeat;
                                                return (
                                                    <div key={h} className="flex-1 mx-0.5"
                                                        title={`${day} ${h}:00 — ${val} booking${val !== 1 ? "s" : ""}`}>
                                                        <div
                                                            className="h-5 rounded-sm transition-all"
                                                            style={{
                                                                background: intensity === 0
                                                                    ? "rgba(255,255,255,0.04)"
                                                                    : `rgba(251,191,36,${0.15 + intensity * 0.85})`,
                                                                boxShadow: intensity > 0.5
                                                                    ? `0 0 6px rgba(251,191,36,${intensity * 0.4})`
                                                                    : undefined,
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    {/* Scale legend */}
                                    <div className="flex items-center gap-2 mt-3 pl-10">
                                        <span className="text-[9px] text-white/25">Low</span>
                                        <div className="flex gap-0.5">
                                            {[0.1, 0.25, 0.45, 0.65, 0.85, 1].map((v) => (
                                                <div key={v} className="w-6 h-2 rounded-sm"
                                                    style={{ background: `rgba(251,191,36,${0.15 + v * 0.85})` }} />
                                            ))}
                                        </div>
                                        <span className="text-[9px] text-white/25">High</span>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </motion.div>

                    {/* ── Status breakdown ─────────────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <Section title="Booking Status Breakdown" icon={CalendarDays} iconColor={CYAN}>
                            {(() => {
                                const STATUS_COLORS: Record<string, string> = {
                                    CONFIRMED: EMERALD,
                                    COMPLETED: TEAL,
                                    CANCELLED: ROSE,
                                    EXPIRED: PURPLE,
                                    REJECTED: "#f97316",
                                };
                                const statusData = Object.entries(
                                    allBookings.reduce((acc, b) => {
                                        acc[b.status] = (acc[b.status] ?? 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>)
                                ).map(([status, count]) => ({ status, count }))
                                    .sort((a, b) => b.count - a.count);

                                const total = allBookings.length || 1;

                                return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {statusData.map(({ status, count }) => (
                                            <div key={status}
                                                className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02] flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                        style={{
                                                            color: STATUS_COLORS[status] ?? CYAN,
                                                            background: `${STATUS_COLORS[status] ?? CYAN}20`,
                                                        }}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-white">{count}</p>
                                                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                                    <div className="h-full rounded-full"
                                                        style={{
                                                            width: `${(count / total) * 100}%`,
                                                            background: STATUS_COLORS[status] ?? CYAN,
                                                        }} />
                                                </div>
                                                <p className="text-[10px] text-white/30">
                                                    {((count / total) * 100).toFixed(1)}% of total
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </Section>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
