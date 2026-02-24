"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Users, Clock, RefreshCw, CheckCircle2, XCircle,
    Wifi, Wind, Monitor, Tv, Volume2, Accessibility,
    ToggleLeft, ToggleRight, Trash2, MoreVertical,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { facilities as facilityApi } from "@/lib/api";
import type { Facility } from "@/lib/api";
import clsx from "clsx";

const PLACEHOLDER: Record<string, string> = {
    "Lecture Hall": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
    "Computer Laboratory": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "Auditorium": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    "Sports Facility": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "Conference Room": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    "Workshop Room": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    default: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80",
};

/* ─── Per-card action menu ──────────────────────────────────────────────────── */
function FacilityActions({
    facility,
    onUpdate,
    onRemove,
}: {
    facility: Facility;
    onUpdate: (f: Facility) => void;
    onRemove: (id: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const act = async (label: string, fn: () => Promise<Facility | void>) => {
        setBusy(label); setError(null);
        try {
            const res = await fn();
            if (res) onUpdate(res); else onRemove(facility.id);
            setOpen(false);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Action failed");
        } finally { setBusy(null); }
    };

    const isAvail = facility.isAvailable;

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                {busy ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin block" /> : <MoreVertical size={14} />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
                        className="absolute right-0 top-8 z-30 glass-strong rounded-xl py-1.5 min-w-[160px] shadow-xl">
                        {error && <p className="text-[10px] text-red-400 px-3 pb-1">{error}</p>}
                        <button onClick={() => act("Toggle", () => facilityApi.toggleAvailability(facility.id))}
                            className={clsx("flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-white/[0.07] transition-colors",
                                isAvail ? "text-amber-400" : "text-emerald-400")}>
                            {isAvail ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                            {isAvail ? "Mark Unavailable" : "Mark Available"}
                        </button>
                        <button onClick={() => act("Delete", () => facilityApi.remove(facility.id))}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-white/[0.07] transition-colors text-red-400">
                            <Trash2 size={13} /> Delete Facility
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Availability toggle button (inline on card) ─────────────────────────── */
function AvailToggle({ facility, onUpdate }: { facility: Facility; onUpdate: (f: Facility) => void }) {
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        setBusy(true);
        try { onUpdate(await facilityApi.toggleAvailability(facility.id)); }
        catch { /* silently fail */ }
        finally { setBusy(false); }
    };

    return (
        <button onClick={toggle} disabled={busy}
            className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all",
                facility.isAvailable
                    ? "badge-available hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                    : "badge-booked   hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400"
            )}>
            {busy
                ? <span className="w-2 h-2 border border-current/40 border-t-current rounded-full animate-spin" />
                : <span className={clsx("w-1.5 h-1.5 rounded-full", facility.isAvailable ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
            }
            {facility.isAvailable ? "Available" : "Unavailable"}
        </button>
    );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function AdminFacilitiesPage() {
    const [items, setItems] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true); setError(null);
        facilityApi.list()
            .then(setItems)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load facilities."))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const handleUpdate = (f: Facility) => setItems(prev => prev.map(x => x.id === f.id ? f : x));
    const handleRemove = (id: number) => setItems(prev => prev.filter(x => x.id !== id));

    const available = items.filter(f => f.isAvailable).length;
    const unavailable = items.length - available;

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-1">Admin</p>
                    <h1 className="text-3xl font-bold text-white">Facility <span className="gradient-text-admin">Management</span></h1>
                    <p className="text-sm text-white/35 mt-1">
                        {items.length} facilities · <span className="text-emerald-400">{available} available</span> · <span className="text-red-400">{unavailable} unavailable</span>
                    </p>
                </div>
                <button onClick={load} disabled={loading}
                    className="glass px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5 mt-1">
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {items.map((f, i) => {
                        const typeName = f.facilityType?.name ?? "";
                        const imgSrc = f.imageUrl || PLACEHOLDER[typeName] || PLACEHOLDER.default;
                        const amenities = [
                            { icon: Monitor, label: "Projector", active: f.hasProjector },
                            { icon: Wifi, label: "Wi-Fi", active: f.hasWifi },
                            { icon: Wind, label: "A/C", active: f.hasAirConditioning },
                            { icon: Tv, label: "Video Conf", active: f.hasVideoConferencing },
                            { icon: Volume2, label: "PA System", active: f.hasPaSystem },
                            { icon: Accessibility, label: "Wheelchair", active: f.isWheelchairAccessible },
                        ].filter(a => a.active);

                        return (
                            <motion.div key={f.id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="glass-card rounded-2xl overflow-hidden flex flex-col">
                                {/* Image */}
                                <div className="relative h-40">
                                    <Image src={imgSrc} alt={f.name} fill className="object-cover" unoptimized />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    <div className="absolute top-3 right-3">
                                        <FacilityActions facility={f} onUpdate={handleUpdate} onRemove={handleRemove} />
                                    </div>
                                    {f.facilityType?.requiresApproval && (
                                        <div className="absolute top-3 left-3 glass px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-300 border border-amber-400/25">
                                            Needs Approval
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight">{f.name}</p>
                                            <p className="text-[10px] text-white/60">{typeName}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex flex-col gap-3 flex-1">
                                    <div className="flex items-center gap-3 text-xs text-white/50">
                                        <span className="flex items-center gap-1"><MapPin size={11} />{f.location}</span>
                                        <span className="flex items-center gap-1"><Users size={11} />{f.capacity}</span>
                                        <span className="flex items-center gap-1"><Clock size={11} />{f.openingTime.slice(0, 5)}–{f.closingTime.slice(0, 5)}</span>
                                    </div>

                                    {/* Amenities */}
                                    {amenities.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {amenities.map(({ icon: Icon, label }) => (
                                                <span key={label} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300">
                                                    <Icon size={9} /> {label}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Availability toggle — always visible, one-click */}
                                    <div className="mt-auto pt-1">
                                        <AvailToggle facility={f} onUpdate={handleUpdate} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
