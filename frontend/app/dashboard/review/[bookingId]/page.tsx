"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowLeft, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { bookings as bookingApi, reviews as reviewApi } from "@/lib/api";
import type { Booking } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import clsx from "clsx";

const PLACEHOLDER: Record<string, string> = {
    "Lecture Hall": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
    "Computer Laboratory": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "Auditorium": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    "Sports Facility": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "Conference Room": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    default: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80",
};

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function ReviewPage({ params }: { params: Promise<{ bookingId: string }> }) {
    const { bookingId: rawId } = use(params);
    const bookingId = Number(rawId);
    const { user } = useAuth();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        bookingApi.my()
            .then((list) => setBooking(list.find((b) => b.id === bookingId) ?? null))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [bookingId]);

    const handleSubmit = async () => {
        if (!booking || !user || rating === 0) return;
        setSubmitting(true); setError(null);
        try {
            await reviewApi.submit({
                facility: { id: booking.facility.id },
                user: { id: user.id },
                booking: { id: booking.id },
                rating,
                comment: comment || undefined,
            });
            setSubmitted(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Review submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
        </div>
    );

    if (!booking) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <p className="text-white/50 text-sm">Booking not found or not eligible for review.</p>
            <Link href="/dashboard/bookings">
                <button className="btn-glass px-5 py-2.5 rounded-xl text-sm font-semibold text-white">Back to Bookings</button>
            </Link>
        </div>
    );

    if (booking.status !== "COMPLETED") return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <p className="text-white/50 text-sm">Reviews can only be submitted for completed bookings.</p>
            <Link href="/dashboard/bookings">
                <button className="btn-glass px-5 py-2.5 rounded-xl text-sm font-semibold text-white">Back to Bookings</button>
            </Link>
        </div>
    );

    const typeName = booking.facility?.facilityType?.name ?? "";
    const imgSrc = booking.facility?.imageUrl || PLACEHOLDER[typeName] || PLACEHOLDER.default;

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-strong rounded-3xl p-12 text-center max-w-sm"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/30"
                    >
                        <Star size={28} className="text-white fill-white" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white mb-2">Review Submitted</h2>
                    <p className="text-sm text-white/50 mb-2">
                        Thank you for rating <span className="text-white font-medium">{booking.facility.name}</span>.
                    </p>
                    <div className="flex justify-center gap-0.5 my-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={20} className={i < rating ? "fill-amber-400 text-amber-400" : "text-white/20"} />
                        ))}
                    </div>
                    <Link href="/dashboard/bookings">
                        <button className="btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white mt-2">Back to My Bookings</button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 lg:p-8 flex flex-col items-center">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="mb-6 self-start">
                <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to My Bookings
                </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
                <div className="glass-strong rounded-3xl overflow-hidden">
                    <div className="relative h-44">
                        <Image src={imgSrc} alt={booking.facility.name} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-5">
                            <h1 className="text-xl font-bold text-white">{booking.facility.name}</h1>
                            <p className="text-xs text-white/50 mt-0.5">
                                {booking.date}  ·  {booking.startTime.slice(0, 5)} – {booking.endTime.slice(0, 5)}
                            </p>
                        </div>
                    </div>

                    <div className="p-7">
                        <h2 className="text-base font-bold text-white mb-1">How was your experience?</h2>
                        <p className="text-xs text-white/40 mb-7">Your review helps other students book better.</p>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                                {error}
                            </div>
                        )}

                        {/* Stars */}
                        <div className="flex flex-col items-center gap-3 mb-8">
                            <div className="flex items-center gap-2">
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const val = i + 1;
                                    return (
                                        <motion.button key={val}
                                            whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.9 }}
                                            onMouseEnter={() => setHovered(val)}
                                            onMouseLeave={() => setHovered(0)}
                                            onClick={() => setRating(val)}
                                            className="transition-transform cursor-pointer"
                                        >
                                            <Star size={36} className={clsx(
                                                "transition-colors",
                                                val <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-white/20"
                                            )} />
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <AnimatePresence mode="wait">
                                {(hovered || rating) > 0 && (
                                    <motion.p key={hovered || rating}
                                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                                        className="text-sm font-semibold text-amber-400">
                                        {LABELS[hovered || rating]}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs text-white/50 mb-2 block">Tell us more (optional)</label>
                            <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)}
                                placeholder="Was the facility clean? Did the equipment work well? Any suggestions..."
                                className="input-glass w-full px-4 py-3 rounded-2xl text-sm resize-none" />
                            <p className="text-[10px] text-white/25 mt-1.5 text-right">{comment.length}/500</p>
                        </div>

                        <button disabled={rating === 0 || submitting} onClick={handleSubmit}
                            className={clsx(
                                "btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2",
                                (rating === 0 || submitting) && "opacity-40 cursor-not-allowed"
                            )}>
                            {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Submit Review</>}
                        </button>
                        {rating === 0 && <p className="text-[10px] text-white/30 text-center mt-2">Select a star rating to submit</p>}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
