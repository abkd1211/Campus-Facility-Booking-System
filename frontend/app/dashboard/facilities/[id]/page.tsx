"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Users, Clock, Star, Wifi, Wind, Monitor, CheckCircle2, XCircle, Calendar, Tv, Volume2, Accessibility } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { facilities as facilityApi, reviews as reviewApi } from "@/lib/api";
import type { Facility, TimeSlot, Review, RatingSummary } from "@/lib/api";
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

export default function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = use(params);
    const facilityId = Number(rawId);

    const [facility, setFacility] = useState<Facility | null>(null);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [revList, setRevList] = useState<Review[]>([]);
    const [rating, setRating] = useState<RatingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"slots" | "reviews">("slots");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            facilityApi.get(facilityId),
            reviewApi.forFacility(facilityId),
            reviewApi.rating(facilityId),
        ]).then(([fac, rev, rat]) => {
            setFacility(fac);
            setRevList(rev);
            setRating(rat);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [facilityId]);

    useEffect(() => {
        if (!facility) return;
        setSlotsLoading(true);
        facilityApi.availability(facilityId, selectedDate)
            .then((r) => setSlots(r.slots))
            .catch(() => setSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [facilityId, selectedDate, facility]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
        </div>
    );

    if (!facility) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-white/50">Facility not found.</p>
        </div>
    );

    const typeName = facility.facilityType?.name ?? "";
    const imgSrc = facility.imageUrl || PLACEHOLDER[typeName] || PLACEHOLDER.default;

    const amenities = [
        { icon: Monitor, label: "Projector", active: facility.hasProjector },
        { icon: Wifi, label: "Wi-Fi", active: facility.hasWifi },
        { icon: Wind, label: "Air Cond.", active: facility.hasAirConditioning },
        { icon: Tv, label: "Video Conf.", active: facility.hasVideoConferencing },
        { icon: Volume2, label: "PA System", active: facility.hasPaSystem },
        { icon: Accessibility, label: "Wheelchair", active: facility.isWheelchairAccessible },
    ];

    const requiresApproval = facility.facilityType?.requiresApproval;

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to Facilities
                </Link>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-5">
                    {/* Hero */}
                    <div className="relative h-72 rounded-3xl overflow-hidden">
                        <Image src={imgSrc} alt={facility.name} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className={clsx(
                            "absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md",
                            facility.isAvailable ? "badge-available" : "badge-booked"
                        )}>
                            <span className={clsx("w-2 h-2 rounded-full", facility.isAvailable ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                            {facility.isAvailable ? "Available" : "Fully Booked"}
                        </div>
                        {rating && (
                            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 glass px-3 py-1.5 rounded-full">
                                <Star size={13} className="fill-amber-400 text-amber-400" />
                                <span className="text-sm font-bold text-white">{rating.averageRating.toFixed(1)}</span>
                                <span className="text-xs text-white/60">({rating.totalReviews} reviews)</span>
                            </div>
                        )}
                    </div>

                    {/* Meta */}
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">{facility.name}</h1>
                                <div className="flex items-center gap-1.5 text-white/50 text-sm">
                                    <MapPin size={14} /><span>{facility.location}</span>
                                </div>
                            </div>
                            <div className="glass px-3 py-1.5 rounded-xl text-xs font-medium text-teal-300 shrink-0">{typeName}</div>
                        </div>
                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-white/60">
                            <span className="flex items-center gap-1.5"><Users size={14} />{facility.capacity} capacity</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} />{facility.openingTime.slice(0, 5)} – {facility.closingTime.slice(0, 5)}</span>
                        </div>
                        {facility.description && (
                            <p className="text-sm text-white/60 leading-relaxed mb-4">{facility.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {amenities.filter(a => a.active || !a.active).map(({ icon: Icon, label, active }) => (
                                <span key={label} className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                                    active ? "bg-teal-500/15 border border-teal-500/25 text-teal-300"
                                        : "bg-white/[0.03] border border-white/[0.06] text-white/30 line-through"
                                )}>
                                    {active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}<Icon size={12} />{label}
                                </span>
                            ))}
                        </div>
                        {facility.rules && (
                            <div className="mt-4 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                                <p className="text-xs text-amber-400/80 font-medium">{facility.rules}</p>
                            </div>
                        )}
                    </div>

                    {/* Slots + Reviews */}
                    <div className="glass-card rounded-2xl overflow-hidden">
                        <div className="flex border-b border-white/[0.06]">
                            {(["slots", "reviews"] as const).map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={clsx(
                                        "flex-1 py-4 text-sm font-semibold capitalize transition-all",
                                        activeTab === tab ? "text-teal-300 border-b-2 border-teal-500 -mb-px" : "text-white/40 hover:text-white/70"
                                    )}>
                                    {tab === "slots" ? "Availability" : `Reviews (${rating?.totalReviews ?? revList.length})`}
                                </button>
                            ))}
                        </div>
                        <div className="p-5">
                            {activeTab === "slots" ? (
                                <div>
                                    <div className="flex items-center gap-3 mb-5">
                                        <Calendar size={16} className="text-teal-400" />
                                        <input type="date" value={selectedDate}
                                            min={new Date().toISOString().split("T")[0]}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="input-glass px-4 py-2 rounded-xl text-sm" />
                                    </div>
                                    {slotsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <p className="text-white/40 text-sm text-center py-8">No availability data for this date.</p>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {slots.map((slot) => (
                                                <div key={slot.startTime} className={clsx(
                                                    "py-2 px-2 rounded-xl text-xs font-medium text-center",
                                                    slot.available ? "slot-available" : "slot-booked"
                                                )}>
                                                    {slot.startTime}<br />
                                                    <span className="opacity-60 text-[10px]">{slot.endTime}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-4 mt-4 text-xs text-white/40">
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />Available</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/10 border border-red-500/20" />Booked</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {revList.length === 0 ? (
                                        <p className="text-white/40 text-sm text-center py-8">No reviews yet. Be the first!</p>
                                    ) : revList.map((rev) => (
                                        <div key={rev.id} className="glass rounded-2xl p-4">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                                                        {rev.user?.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() ?? "?"}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{rev.user?.name ?? "Anonymous"}</p>
                                                        <p className="text-[10px] text-white/40">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} size={12} className={i < rev.rating ? "fill-amber-400 text-amber-400" : "text-white/20"} />
                                                    ))}
                                                </div>
                                            </div>
                                            {rev.comment && <p className="text-sm text-white/60 leading-relaxed">{rev.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Right: Quick Book panel */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-1">
                    <div className="glass-strong rounded-2xl p-6 sticky top-6">
                        <h2 className="text-base font-bold text-white mb-4">Book This Facility</h2>

                        {!facility.isAvailable && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                                <p className="text-xs text-red-400">This facility is currently showing as fully booked. You can still submit a booking request — choose an available time slot on the next step.</p>
                            </div>
                        )}

                        {requiresApproval && (
                            <div className="mb-4 p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20">
                                <p className="text-xs text-amber-400">This venue requires admin approval. Your booking will be set to PENDING until reviewed.</p>
                            </div>
                        )}

                        <Link href={`/dashboard/book/${facility.id}`}>
                            <button className="btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2">
                                <Calendar size={16} /> Proceed to Booking
                            </button>
                        </Link>

                        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                            {[
                                ["Booking Fee", "Free"],
                                ["Min Duration", "30 minutes"],
                                ["Max Extensions", "2 x 30 min"],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between text-xs">
                                    <span className="text-white/40">{k}</span>
                                    <span className="text-white/70 font-medium">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
