"use client";

import { motion } from "framer-motion";
import {
    ArrowLeft, Building2, User, Calendar, Clock,
    Users, FileText, CheckCircle, Search,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { facilities as facilityApi, users as usersApi, bookings as bookingApi } from "@/lib/api";
import type { Facility, User as ApiUser, TimeSlot } from "@/lib/api";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const PLACEHOLDER: Record<string, string> = {
    "Lecture Hall": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
    "Computer Laboratory": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "Auditorium": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    "Sports Facility": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "Conference Room": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    default: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80",
};

export default function AdminCreateBookingPage() {
    const router = useRouter();

    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [allUsers, setAllUsers] = useState<ApiUser[]>([]);

    const [facilitySearch, setFacilitySearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);

    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [startSlot, setStartSlot] = useState<string | null>(null);
    const [endSlot, setEndSlot] = useState<string | null>(null);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const [purpose, setPurpose] = useState("");
    const [attendees, setAttendees] = useState(1);
    const [notes, setNotes] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [bookingStatus, setBookingStatus] = useState<string>("PENDING");

    // Load facilities + users
    useEffect(() => {
        facilityApi.list().then(setFacilities).catch(() => { });
        usersApi.list().then(setAllUsers).catch(() => { });
    }, []);

    // Load slots when facility + date changes
    useEffect(() => {
        if (!selectedFacility) return;
        setSlotsLoading(true); setStartSlot(null); setEndSlot(null);
        facilityApi.availability(selectedFacility.id, date)
            .then((r) => setSlots(r.slots))
            .catch(() => setSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [selectedFacility, date]);

    const handleSlotClick = (slot: string) => {
        if (!startSlot) { setStartSlot(slot); return; }
        if (slot === startSlot) { setStartSlot(null); setEndSlot(null); return; }
        if (!endSlot) { setEndSlot(slot); return; }
        setStartSlot(slot); setEndSlot(null);
    };

    const isSelected = (slot: string) =>
        slot === startSlot || slot === endSlot ||
        (startSlot && endSlot && slot > startSlot && slot < endSlot);

    const filteredFacilities = facilities.filter((f) =>
        f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.location.toLowerCase().includes(facilitySearch.toLowerCase())
    );

    const filteredUsers = allUsers.filter((u) =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const canSubmit = selectedFacility && selectedUser && startSlot && endSlot && purpose.trim().length > 3;

    const handleSubmit = async () => {
        if (!canSubmit || !selectedFacility || !selectedUser) return;
        setSubmitting(true); setError(null);
        try {
            const booking = await bookingApi.create({
                facility: { id: selectedFacility.id },
                user: { id: selectedUser.id },
                date,
                startTime: `${startSlot}:00`,
                endTime: `${endSlot}:00`,
                purpose,
                attendees,
                notes: notes || undefined,
            });
            setBookingStatus(booking.status);
            setSubmitted(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Booking creation failed.");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Success screen ───────────────────────────────────────────────────────
    if (submitted) return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-strong rounded-3xl p-12 text-center max-w-md">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                    <CheckCircle size={36} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Booking Created</h2>
                <p className="text-sm text-white/60 mb-2">
                    Booking for <span className="font-medium text-white">{selectedUser?.name}</span> at{" "}
                    <span className="font-medium text-white">{selectedFacility?.name}</span> on {date} has been created.
                </p>
                <span className={clsx(
                    "inline-flex px-3 py-1.5 rounded-full text-xs font-semibold mt-1",
                    bookingStatus === "PENDING" ? "badge-pending" : "badge-confirmed"
                )}>
                    {bookingStatus}
                </span>
                <div className="flex gap-3 mt-8">
                    <Link href="/admin/bookings" className="flex-1">
                        <button className="btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white">View All Bookings</button>
                    </Link>
                    <button onClick={() => { setSubmitted(false); setSelectedFacility(null); setSelectedUser(null); setStartSlot(null); setEndSlot(null); setPurpose(""); setNotes(""); }}
                        className="flex-1 glass py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors">
                        New Booking
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
                <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to All Bookings
                </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-1">Admin</p>
                <h1 className="text-3xl font-bold text-white">Create <span className="gradient-text-admin">Booking</span></h1>
                <p className="text-sm text-white/35 mt-1">Create a booking on behalf of any registered user</p>
            </motion.div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
                {/* ─── Step 1: Select Facility ─── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="glass-card rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Building2 size={15} className="text-amber-400" /> Select Facility
                        {selectedFacility && <span className="text-xs text-emerald-400 font-medium ml-auto">Selected</span>}
                    </h2>

                    <div className="relative mb-3">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input type="text" placeholder="Search facilities..." value={facilitySearch}
                            onChange={(e) => setFacilitySearch(e.target.value)}
                            className="input-glass w-full pl-8 pr-3 py-2 rounded-xl text-xs" />
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {filteredFacilities.map((f) => {
                            const typeName = f.facilityType?.name ?? "";
                            const imgSrc = f.imageUrl || PLACEHOLDER[typeName] || PLACEHOLDER.default;
                            return (
                                <button key={f.id} onClick={() => setSelectedFacility(f)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                        selectedFacility?.id === f.id
                                            ? "border-amber-500/50 bg-amber-500/10"
                                            : "border-white/[0.06] hover:border-amber-500/20 hover:bg-white/[0.03]"
                                    )}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imgSrc} alt={f.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-white truncate">{f.name}</p>
                                        <p className="text-[10px] text-white/40 truncate">{f.location} · {f.capacity} seats</p>
                                    </div>
                                    {selectedFacility?.id === f.id && (
                                        <CheckCircle size={14} className="text-amber-400 flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ─── Step 2: Select User ─── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <User size={15} className="text-amber-400" /> Select User
                        {selectedUser && <span className="text-xs text-emerald-400 font-medium ml-auto">Selected</span>}
                    </h2>

                    <div className="relative mb-3">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input type="text" placeholder="Search by name or email..." value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="input-glass w-full pl-8 pr-3 py-2 rounded-xl text-xs" />
                    </div>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {filteredUsers.slice(0, 20).map((u) => (
                            <button key={u.id} onClick={() => setSelectedUser(u)}
                                className={clsx(
                                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                    selectedUser?.id === u.id
                                        ? "border-amber-500/50 bg-amber-500/10"
                                        : "border-white/[0.06] hover:border-amber-500/20 hover:bg-white/[0.03]"
                                )}>
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                                    u.role === "ADMIN" ? "bg-gradient-to-br from-amber-400 to-orange-500"
                                        : u.role === "VISITOR" ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                                            : "bg-gradient-to-br from-teal-500 to-cyan-500"
                                )}>
                                    {u.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                                    <p className="text-[10px] text-white/40 truncate">{u.email} · {u.role}</p>
                                </div>
                                {selectedUser?.id === u.id && (
                                    <CheckCircle size={14} className="text-amber-400 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ─── Step 3: Date + Slots ─── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="glass-card rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar size={15} className="text-amber-400" /> Date &amp; Time Slot
                    </h2>

                    <div className="mb-4">
                        <label className="text-xs text-white/50 mb-1.5 block">Date</label>
                        <input type="date" value={date} min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setDate(e.target.value)}
                            className="input-glass px-4 py-2.5 rounded-xl text-sm" />
                    </div>

                    {!selectedFacility ? (
                        <p className="text-white/30 text-xs text-center py-6">Select a facility first to see slots</p>
                    ) : slotsLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                        </div>
                    ) : slots.length === 0 ? (
                        <p className="text-white/30 text-xs text-center py-6">No availability data for this date</p>
                    ) : (
                        <>
                            <p className="text-[10px] text-white/40 mb-2">Click start slot, then end slot</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                                {slots.map((slot) => (
                                    <button key={slot.startTime} disabled={!slot.available}
                                        onClick={() => slot.available && handleSlotClick(slot.startTime)}
                                        className={clsx(
                                            "py-2 px-1.5 rounded-lg text-[10px] font-medium text-center transition-all",
                                            !slot.available ? "slot-booked" :
                                                isSelected(slot.startTime) ? "bg-amber-500/25 border border-amber-500/60 text-amber-300 ring-1 ring-amber-400/40" :
                                                    "slot-available"
                                        )}>
                                        {slot.startTime}<br />
                                        <span className="opacity-50 text-[9px]">{slot.endTime}</span>
                                    </button>
                                ))}
                            </div>
                            {startSlot && (
                                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
                                    <p className="text-[10px] text-amber-300">
                                        {!endSlot ? `Start: ${startSlot} — now select end slot` : `Selected: ${startSlot} to ${endSlot}`}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>

                {/* ─── Step 4: Details + Submit ─── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText size={15} className="text-amber-400" /> Booking Details
                    </h2>

                    <div>
                        <label className="text-xs text-white/50 mb-1.5 block">Purpose *</label>
                        <textarea rows={3} placeholder="Describe the booking purpose..."
                            value={purpose} onChange={(e) => setPurpose(e.target.value)}
                            className="input-glass w-full px-4 py-3 rounded-xl text-sm resize-none" />
                    </div>

                    <div>
                        <label className="text-xs text-white/50 mb-1.5 block">Number of Attendees</label>
                        <div className="relative">
                            <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                            <input type="number" min={1} max={selectedFacility?.capacity ?? 999}
                                value={attendees} onChange={(e) => setAttendees(Number(e.target.value))}
                                className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                        </div>
                        {selectedFacility && (
                            <p className="text-[10px] text-white/30 mt-1">Max capacity: {selectedFacility.capacity}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs text-white/50 mb-1.5 block">Notes (optional)</label>
                        <textarea rows={2} placeholder="Special requirements..."
                            value={notes} onChange={(e) => setNotes(e.target.value)}
                            className="input-glass w-full px-4 py-3 rounded-xl text-sm resize-none" />
                    </div>

                    {/* Summary */}
                    {(selectedFacility || selectedUser || startSlot) && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                            {selectedFacility && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40 flex items-center gap-1"><Building2 size={10} /> Facility</span>
                                    <span className="text-white/80 font-medium">{selectedFacility.name}</span>
                                </div>
                            )}
                            {selectedUser && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40 flex items-center gap-1"><User size={10} /> User</span>
                                    <span className="text-white/80 font-medium">{selectedUser.name}</span>
                                </div>
                            )}
                            {startSlot && endSlot && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40 flex items-center gap-1"><Clock size={10} /> Time</span>
                                    <span className="text-white/80 font-medium">{date}, {startSlot}–{endSlot}</span>
                                </div>
                            )}
                            {selectedFacility?.facilityType?.requiresApproval && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Approval</span>
                                    <span className="text-amber-400 font-medium">Required → PENDING</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className={clsx(
                            "btn-amber w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2",
                            (!canSubmit || submitting) && "opacity-40 cursor-not-allowed"
                        )}>
                        {submitting
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><CheckCircle size={16} /> Create Booking</>
                        }
                    </button>
                    {!canSubmit && (
                        <p className="text-[10px] text-white/25 text-center">
                            {!selectedFacility ? "Select a facility" : !selectedUser ? "Select a user" : !startSlot || !endSlot ? "Select a time slot" : "Enter a purpose"}
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
