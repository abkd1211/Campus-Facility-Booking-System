"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Users, FileText, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { facilities as facilityApi, bookings as bookingApi } from "@/lib/api";
import type { Facility, TimeSlot } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const PLACEHOLDER: Record<string, string> = {
    "Lecture Hall": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
    "Computer Laboratory": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "Auditorium": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    "Sports Facility": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "Conference Room": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    "Workshop Room": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    default: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80",
};

export default function BookingFormPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = use(params);
    const facilityId = Number(rawId);
    const { user } = useAuth();
    const router = useRouter();

    const [facility, setFacility] = useState<Facility | null>(null);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loadingFac, setLoadingFac] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [resultStatus, setResultStatus] = useState<"CONFIRMED" | "PENDING">("CONFIRMED");

    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [startSlot, setStartSlot] = useState<string | null>(null);
    const [endSlot, setEndSlot] = useState<string | null>(null);
    const [purpose, setPurpose] = useState("");
    const [attendees, setAttendees] = useState<number>(1);
    const [notes, setNotes] = useState("");
    const [step, setStep] = useState<1 | 2 | 3>(1);

    useEffect(() => {
        facilityApi.get(facilityId).then(setFacility).catch(() => { }).finally(() => setLoadingFac(false));
    }, [facilityId]);

    useEffect(() => {
        if (!facility) return;
        setSlotsLoading(true);
        facilityApi.availability(facilityId, date)
            .then((r) => setSlots(r.slots))
            .catch(() => setSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [facilityId, date, facility]);

    const handleSlotClick = (slot: string) => {
        if (!startSlot) { setStartSlot(slot); return; }
        if (slot === startSlot) { setStartSlot(null); setEndSlot(null); return; }
        if (!endSlot) { setEndSlot(slot); return; }
        setStartSlot(slot); setEndSlot(null);
    };

    const isSelected = (slot: string) =>
        slot === startSlot || slot === endSlot ||
        (startSlot && endSlot && slot > startSlot && slot < endSlot);

    const canProceed =
        (step === 1 && startSlot && endSlot) ||
        (step === 2 && purpose.trim().length > 3 && attendees >= 1);

    const handleSubmit = async () => {
        if (!facility || !user || !startSlot || !endSlot) return;
        setSubmitting(true); setError(null);
        try {
            const booking = await bookingApi.create({
                facility: { id: facility.id },
                user: { id: user.id },
                date,
                startTime: `${startSlot}:00`,
                endTime: `${endSlot}:00`,
                purpose,
                attendees,
                notes: notes || undefined,
            });
            setResultStatus(booking.status === "PENDING" ? "PENDING" : "CONFIRMED");
            setSubmitted(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Booking failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingFac) return (
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

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-strong rounded-3xl p-12 text-center max-w-md"
                >
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
                    >
                        <CheckCircle size={36} className="text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">Booking Submitted</h2>
                    <p className="text-sm text-white/60 mb-4">
                        {resultStatus === "PENDING"
                            ? "Your request is pending admin approval. You will be notified once reviewed."
                            : `Your booking for ${facility.name} on ${date} at ${startSlot} is confirmed.`}
                    </p>
                    <span className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                        resultStatus === "PENDING" ? "badge-pending" : "badge-confirmed"
                    )}>
                        {resultStatus === "PENDING" ? "PENDING APPROVAL" : "CONFIRMED"}
                    </span>
                    <div className="flex gap-3 mt-8">
                        <Link href="/dashboard/bookings" className="flex-1">
                            <button className="btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white">View My Bookings</button>
                        </Link>
                        <button onClick={() => router.push("/dashboard")} className="flex-1 glass py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Browse More
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
                <Link href={`/dashboard/facilities/${facility.id}`} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to {facility.name}
                </Link>
            </motion.div>

            {/* Step indicator */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-8">
                {["Select Slot", "Details", "Confirm"].map((label, i) => {
                    const s = (i + 1) as 1 | 2 | 3;
                    return (
                        <div key={label} className="flex items-center gap-2">
                            <div className={clsx(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                step > s ? "bg-emerald-500 text-white" :
                                    step === s ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/40" :
                                        "glass text-white/30"
                            )}>
                                {step > s ? "✓" : s}
                            </div>
                            <span className={clsx("text-xs font-medium hidden sm:block", step === s ? "text-white" : "text-white/30")}>{label}</span>
                            {i < 2 && <div className="w-8 h-px bg-white/10 mx-1" />}
                        </div>
                    );
                })}
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <Calendar size={18} className="text-teal-400" /> Select Date and Time
                            </h2>
                            <p className="text-sm text-white/40 mb-5">Choose your date then select start and end slots.</p>
                            <div className="mb-5">
                                <label className="text-xs text-white/50 mb-1.5 block">Date</label>
                                <input type="date" value={date} min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => { setDate(e.target.value); setStartSlot(null); setEndSlot(null); }}
                                    className="input-glass px-4 py-3 rounded-xl text-sm" />
                            </div>
                            {slotsLoading ? (
                                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" /></div>
                            ) : slots.length === 0 ? (
                                <p className="text-white/40 text-sm text-center py-8">No availability data for this date.</p>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs text-white/50 font-medium">Available Slots — click start, then end</p>
                                        <div className="flex gap-3 text-[10px] text-white/40">
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />Available</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-500/40 border border-teal-500/60" />Selected</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/10 border border-red-500/20" />Booked</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {slots.map((slot) => (
                                            <button key={slot.startTime} disabled={!slot.available}
                                                onClick={() => slot.available && handleSlotClick(slot.startTime)}
                                                className={clsx(
                                                    "py-2 px-2 rounded-xl text-xs font-medium text-center transition-all",
                                                    !slot.available ? "slot-booked" :
                                                        isSelected(slot.startTime) ? "bg-teal-500/25 border border-teal-500/60 text-teal-300 ring-1 ring-teal-400/40" :
                                                            "slot-available"
                                                )}>
                                                {slot.startTime}<br />
                                                <span className="opacity-60 text-[10px]">{slot.endTime}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {startSlot && (
                                        <div className="mt-4 p-3 rounded-xl bg-teal-500/[0.08] border border-teal-500/20">
                                            <p className="text-xs text-teal-300">
                                                {!endSlot ? `Start: ${startSlot} — select your end slot` : `Selected: ${startSlot} to ${endSlot}`}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-2xl p-6 space-y-5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={18} className="text-teal-400" /> Booking Details
                            </h2>
                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">Purpose of Booking *</label>
                                <textarea rows={3} placeholder="Describe the purpose of your booking..."
                                    value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                    className="input-glass w-full px-4 py-3 rounded-xl text-sm resize-none" />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">Number of Attendees *</label>
                                <div className="relative">
                                    <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input type="number" min={1} max={facility.capacity}
                                        value={attendees} onChange={(e) => setAttendees(Number(e.target.value))}
                                        className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                                </div>
                                <p className="text-[10px] text-white/30 mt-1">Max capacity: {facility.capacity}</p>
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">Additional Notes (optional)</label>
                                <textarea rows={2} placeholder="Any special requirements..."
                                    value={notes} onChange={(e) => setNotes(e.target.value)}
                                    className="input-glass w-full px-4 py-3 rounded-xl text-sm resize-none" />
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-5">Confirm Booking</h2>
                            <div className="space-y-3">
                                {[
                                    { label: "Facility", value: facility.name },
                                    { label: "Date", value: date },
                                    { label: "Time", value: `${startSlot} – ${endSlot}` },
                                    { label: "Attendees", value: `${attendees} people` },
                                    { label: "Purpose", value: purpose },
                                    { label: "Status", value: facility.facilityType?.requiresApproval ? "Will be PENDING" : "Auto CONFIRMED" },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-start gap-4 py-3 border-b border-white/[0.05] last:border-0">
                                        <span className="text-xs text-white/40 font-medium w-24 shrink-0">{label}</span>
                                        <span className="text-sm text-white/90 text-right">{value}</span>
                                    </div>
                                ))}
                            </div>
                            {notes && (
                                <div className="mt-3 p-3 rounded-xl glass">
                                    <p className="text-xs text-white/40 font-medium mb-1">Notes</p>
                                    <p className="text-sm text-white/70">{notes}</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    <div className="flex gap-3 mt-4">
                        {step > 1 && (
                            <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                                className="glass px-6 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors">
                                Back
                            </button>
                        )}
                        {step < 3 ? (
                            <button disabled={!canProceed}
                                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                                className={clsx("btn-glass flex-1 py-3 rounded-xl text-sm font-semibold text-white", !canProceed && "opacity-40 cursor-not-allowed")}>
                                Continue
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={submitting}
                                className="btn-glass flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2">
                                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Booking"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary card */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
                    <div className="glass-strong rounded-2xl overflow-hidden sticky top-6">
                        <div className="relative h-36">
                            <Image src={imgSrc} alt={facility.name} fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <p className="absolute bottom-3 left-3 text-sm font-bold text-white">{facility.name}</p>
                        </div>
                        <div className="p-5 space-y-3">
                            {[
                                { k: "Date", v: date },
                                { k: "Time", v: startSlot && endSlot ? `${startSlot} – ${endSlot}` : "—" },
                                { k: "Attendees", v: String(attendees) },
                                { k: "Approval", v: facility.facilityType?.requiresApproval ? "Required" : "Auto", color: facility.facilityType?.requiresApproval ? "text-amber-400" : "text-emerald-400" },
                            ].map(({ k, v, color }) => (
                                <div key={k} className="flex justify-between text-xs">
                                    <span className="text-white/40">{k}</span>
                                    <span className={clsx("font-medium", color ?? "text-white")}>{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
