"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, XSquare, Users, Clock, CalendarDays, BadgeCheck, MessageSquare, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { approvals as approvalApi } from "@/lib/api";
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

const ROLE_BADGE: Record<string, string> = {
    VISITOR: "bg-cyan-400/12   border-cyan-400/25   text-cyan-300",
    STAFF: "bg-purple-400/12 border-purple-400/25 text-purple-300",
    STUDENT: "bg-teal-400/12   border-teal-400/25   text-teal-300",
};

export default function AdminApprovalsPage() {
    const [pending, setPending] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [remarks, setRemarks] = useState<Record<number, string>>({});
    const [decided, setDecided] = useState<Record<number, "APPROVED" | "REJECTED">>({});
    const [actioning, setActioning] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);

    const [approvedCount, setApprovedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);

    const load = () => {
        setLoading(true); setError(null);
        approvalApi.pending()
            .then(setPending)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load approvals."))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const decide = async (bookingId: number, decision: "APPROVED" | "REJECTED") => {
        setActioning(bookingId);
        try {
            const remark = remarks[bookingId] ?? "";
            if (decision === "APPROVED") await approvalApi.approve(bookingId, remark);
            else await approvalApi.reject(bookingId, remark);
            setDecided((prev) => ({ ...prev, [bookingId]: decision }));
            if (decision === "APPROVED") setApprovedCount((c) => c + 1);
            else setRejectedCount((c) => c + 1);
            setTimeout(() => setPending((prev) => prev.filter((b) => b.id !== bookingId)), 750);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Action failed.");
        } finally {
            setActioning(null);
        }
    };

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-1">Admin</p>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BadgeCheck className="text-amber-400" size={28} />
                        Booking <span className="gradient-text-admin">Approvals</span>
                    </h1>
                    <p className="text-sm text-white/35 mt-1">Review and action pending facility booking requests</p>
                </div>
                <button onClick={load} disabled={loading}
                    className="glass px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5 mt-1">
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </motion.div>

            {/* Stats pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3 mb-8 flex-wrap">
                {[
                    { label: "Pending", value: pending.length, cls: "bg-amber-400/10   border-amber-400/25   text-amber-300" },
                    { label: "Approved", value: approvedCount, cls: "bg-emerald-400/10 border-emerald-400/25 text-emerald-300" },
                    { label: "Rejected", value: rejectedCount, cls: "bg-red-400/10     border-red-400/25     text-red-300" },
                ].map((s) => (
                    <div key={s.label} className={clsx("flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border glass", s.cls)}>
                        <span className="text-xl font-bold">{s.value}</span>
                        <span className="text-xs font-medium">{s.label}</span>
                    </div>
                ))}
            </motion.div>

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
                <div className="space-y-4 max-w-4xl">
                    <AnimatePresence>
                        {pending.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-28 glass-card rounded-3xl">
                                <BadgeCheck size={48} className="text-emerald-400/40 mx-auto mb-4" />
                                <p className="text-white/60 font-semibold">All requests reviewed.</p>
                                <p className="text-white/25 text-sm mt-1">New requests will appear here automatically.</p>
                            </motion.div>
                        ) : (
                            pending.map((b, i) => {
                                const dec = decided[b.id];
                                const isOpen = expanded === b.id;
                                const actioning_this = actioning === b.id;
                                const typeName = b.facility?.facilityType?.name ?? "";
                                const imgSrc = b.facility?.imageUrl || PLACEHOLDER[typeName] || PLACEHOLDER.default;

                                return (
                                    <motion.div
                                        key={b.id} layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: dec ? 0.45 : 1, y: 0, scale: dec ? 0.98 : 1 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ delay: i * 0.04, duration: 0.35 }}
                                        className="glass-card rounded-2xl overflow-hidden border border-white/[0.06] hover:border-amber-500/15"
                                    >
                                        <div className="flex gap-4 p-5">
                                            <div className="relative w-28 h-24 rounded-xl overflow-hidden flex-shrink-0 hidden sm:block">
                                                <Image src={imgSrc} alt={b.facility?.name ?? ""} fill className="object-cover" unoptimized />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                            <h3 className="font-bold text-white">{b.facility?.name}</h3>
                                                            {dec && (
                                                                <span className={clsx(
                                                                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                                                                    dec === "APPROVED" ? "bg-emerald-500/18 text-emerald-400" : "bg-red-500/18 text-red-400"
                                                                )}>{dec}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-xs text-white/65 font-medium">{b.user?.name}</span>
                                                            <span className="text-white/20">·</span>
                                                            <span className="text-[11px] text-white/35">{b.user?.email}</span>
                                                            <span className={clsx(
                                                                "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                                                                ROLE_BADGE[b.user?.role ?? ""] ?? ROLE_BADGE.STUDENT
                                                            )}>{b.user?.role}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setExpanded(isOpen ? null : b.id)}
                                                        className="text-[11px] glass px-3 py-1.5 rounded-lg text-white/45 hover:text-white/80 transition-colors shrink-0">
                                                        {isOpen ? "Hide" : "Details"}
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap gap-3 text-xs text-white/45 mb-3">
                                                    <span className="flex items-center gap-1"><CalendarDays size={11} />{b.date}</span>
                                                    <span className="flex items-center gap-1"><Clock size={11} />{b.startTime.slice(0, 5)} – {b.endTime.slice(0, 5)}</span>
                                                    <span className="flex items-center gap-1"><Users size={11} />{b.attendees} attendees</span>
                                                </div>
                                                <p className="text-xs text-white/55 italic mb-4 leading-relaxed">&ldquo;{b.purpose}&rdquo;</p>

                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mb-4 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1.5"
                                                        >
                                                            {[
                                                                ["Booking ID", `#${b.id}`],
                                                                ["Location", b.facility?.location ?? "—"],
                                                                ["Submitted", new Date(b.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })],
                                                                ...(b.notes ? [["Notes", b.notes]] : []),
                                                            ].map(([k, v]) => (
                                                                <div key={k} className="flex justify-between text-xs">
                                                                    <span className="text-white/35 font-medium">{k}</span>
                                                                    <span className="text-white/65">{v}</span>
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {!dec && (
                                                    <div className="flex gap-2 flex-wrap items-center">
                                                        <div className="relative flex-1 min-w-[180px]">
                                                            <MessageSquare size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                                                            <input type="text" placeholder="Remarks (optional)"
                                                                value={remarks[b.id] ?? ""}
                                                                onChange={(e) => setRemarks((prev) => ({ ...prev, [b.id]: e.target.value }))}
                                                                className="input-glass w-full pl-8 pr-3 py-2 rounded-xl text-xs" />
                                                        </div>
                                                        <button disabled={actioning_this}
                                                            onClick={() => decide(b.id, "APPROVED")}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-500/75 hover:bg-emerald-500 transition-colors">
                                                            {actioning_this ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <CheckSquare size={13} />}
                                                            Approve
                                                        </button>
                                                        <button disabled={actioning_this}
                                                            onClick={() => decide(b.id, "REJECTED")}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-500/65 hover:bg-red-500 transition-colors">
                                                            {actioning_this ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <XSquare size={13} />}
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
