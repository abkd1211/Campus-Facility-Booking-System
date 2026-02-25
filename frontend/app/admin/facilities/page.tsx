"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Users, Clock, RefreshCw, CheckCircle2, XCircle,
    Wifi, Wind, Monitor, Tv, Volume2, Accessibility,
    Trash2,
    Plus, X, Building2, ImageIcon, Mic2, TreePine,
    PenSquare, ChevronRight, ChevronLeft, Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { facilities as facilityApi, facilityTypes as facilityTypesApi } from "@/lib/api";
import type { Facility, FacilityType } from "@/lib/api";
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

/* ─── Amenity toggle pill ──────────────────────────────────────────────────── */
function AmenityPill({
    icon: Icon,
    label,
    active,
    onToggle,
}: {
    icon: React.ElementType;
    label: string;
    active: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={clsx(
                "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-medium transition-all select-none w-full aspect-square",
                active
                    ? "bg-teal-500/15 border-teal-400/40 text-teal-300 shadow-[0_0_16px_rgba(20,184,166,0.15)]"
                    : "glass border-white/08 text-white/35 hover:text-white/60 hover:border-white/20"
            )}
        >
            <Icon size={18} />
            <span className="text-[10px] leading-tight text-center">{label}</span>
            {active && <CheckCircle2 size={10} className="text-teal-400 absolute top-2 right-2" />}
        </button>
    );
}

/* ─── Step indicator ───────────────────────────────────────────────────────── */
function StepDots({ total, current }: { total: number; current: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={clsx(
                        "rounded-full transition-all duration-300",
                        i === current
                            ? "w-6 h-1.5 bg-amber-400"
                            : i < current
                                ? "w-1.5 h-1.5 bg-amber-400/40"
                                : "w-1.5 h-1.5 bg-white/15"
                    )}
                />
            ))}
        </div>
    );
}

/* ─── Add Facility Modal ───────────────────────────────────────────────────── */
const DEFAULT_FORM = {
    name: "",
    location: "",
    capacity: 30,
    facilityTypeId: 0,
    imageUrl: "",
    description: "",
    rules: "",
    openingTime: "08:00",
    closingTime: "18:00",
    isAvailable: true,
    hasProjector: false,
    hasAirConditioning: false,
    hasWhiteboard: false,
    hasPaSystem: false,
    hasVideoConferencing: false,
    hasWifi: false,
    isOutdoor: false,
    isWheelchairAccessible: false,
};

type FormState = typeof DEFAULT_FORM;

const STEPS = ["Basic Info", "Amenities", "Details"];

function AddFacilityModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (f: Facility) => void;
}) {
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [types, setTypes] = useState<FacilityType[]>([]);
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        facilityTypesApi.list().then(setTypes).catch(() => { });
    }, []);

    useEffect(() => {
        if (open) { setForm(DEFAULT_FORM); setError(null); setStep(0); }
    }, [open]);

    const set = (k: keyof FormState, v: FormState[keyof FormState]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const toggle = (k: keyof FormState) =>
        setForm(prev => ({ ...prev, [k]: !prev[k] }));

    const goNext = () => {
        if (step === 0) {
            if (!form.name.trim()) { setError("Facility name is required."); return; }
            if (!form.location.trim()) { setError("Location is required."); return; }
            if (!form.facilityTypeId) { setError("Please select a facility type."); return; }
            if (form.capacity < 1) { setError("Capacity must be at least 1."); return; }
        }
        setError(null);
        setDirection(1);
        setStep(s => Math.min(s + 1, STEPS.length - 1));
    };

    const goPrev = () => {
        setError(null);
        setDirection(-1);
        setStep(s => Math.max(s - 1, 0));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const created = await facilityApi.create({
                name: form.name.trim(),
                location: form.location.trim(),
                capacity: form.capacity,
                facilityType: { id: form.facilityTypeId },
                imageUrl: form.imageUrl.trim() || undefined,
                description: form.description.trim() || undefined,
                rules: form.rules.trim() || undefined,
                openingTime: form.openingTime + ":00",
                closingTime: form.closingTime + ":00",
                isAvailable: form.isAvailable,
                hasProjector: form.hasProjector,
                hasAirConditioning: form.hasAirConditioning,
                hasWhiteboard: form.hasWhiteboard,
                hasPaSystem: form.hasPaSystem,
                hasVideoConferencing: form.hasVideoConferencing,
                hasWifi: form.hasWifi,
                isOutdoor: form.isOutdoor,
                isWheelchairAccessible: form.isWheelchairAccessible,
            });
            onCreated(created);
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to create facility.");
        } finally {
            setSubmitting(false);
        }
    };

    const amenities: { key: keyof FormState; icon: React.ElementType; label: string }[] = [
        { key: "hasProjector", icon: Monitor, label: "Projector" },
        { key: "hasWifi", icon: Wifi, label: "Wi-Fi" },
        { key: "hasAirConditioning", icon: Wind, label: "Air Con" },
        { key: "hasVideoConferencing", icon: Tv, label: "Video Conf" },
        { key: "hasPaSystem", icon: Mic2, label: "PA System" },
        { key: "hasWhiteboard", icon: PenSquare, label: "Whiteboard" },
        { key: "isOutdoor", icon: TreePine, label: "Outdoor" },
        { key: "isWheelchairAccessible", icon: Accessibility, label: "Accessible" },
    ];

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Centered dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 16 }}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto glass-strong rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
                            style={{ maxHeight: "calc(100vh - 2rem)" }}
                        >
                            {/* ── Header ── */}
                            <div className="relative px-6 pt-6 pb-4">
                                {/* Decorative glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                                            <Building2 size={18} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-white">Add New Facility</h2>
                                            <p className="text-[11px] text-white/35 mt-0.5">{STEPS[step]} · Step {step + 1} of {STEPS.length}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-xl glass hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Step dots */}
                                <div className="mt-4">
                                    <StepDots total={STEPS.length} current={step} />
                                </div>
                            </div>

                            {/* ── Body ── */}
                            <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ minHeight: 0 }}>
                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4"
                                        >
                                            <XCircle size={13} className="shrink-0" /> {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence mode="wait" custom={direction}>
                                    {/* ── Step 0: Basic Info ── */}
                                    {step === 0 && (
                                        <motion.div key="step0"
                                            custom={direction} variants={slideVariants}
                                            initial="enter" animate="center" exit="exit"
                                            transition={{ duration: 0.22, ease: "easeOut" }}
                                            className="space-y-4 pb-4"
                                        >
                                            <Field label="Facility Name" required>
                                                <input
                                                    id="facility-name"
                                                    type="text"
                                                    value={form.name}
                                                    onChange={e => set("name", e.target.value)}
                                                    placeholder="e.g. Great Hall Room A"
                                                    className="input-glass w-full rounded-xl px-4 py-3 text-sm"
                                                    autoFocus
                                                />
                                            </Field>

                                            <Field label="Facility Type" required>
                                                <select
                                                    id="facility-type"
                                                    value={form.facilityTypeId}
                                                    onChange={e => set("facilityTypeId", Number(e.target.value))}
                                                    className="input-glass w-full rounded-xl px-4 py-3 text-sm"
                                                    style={{ background: "rgba(255,255,255,0.046)" }}
                                                >
                                                    <option value={0} disabled>Select a type…</option>
                                                    {types.map(t => (
                                                        <option key={t.id} value={t.id} style={{ background: "#070c14" }}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </Field>

                                            <Field label="Location" required>
                                                <div className="relative">
                                                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                                                    <input
                                                        id="facility-location"
                                                        type="text"
                                                        value={form.location}
                                                        onChange={e => set("location", e.target.value)}
                                                        placeholder="e.g. Block C, Level 2"
                                                        className="input-glass w-full rounded-xl pl-9 pr-4 py-3 text-sm"
                                                    />
                                                </div>
                                            </Field>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Capacity" required>
                                                    <div className="relative">
                                                        <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                                                        <input
                                                            id="facility-capacity"
                                                            type="number" min={1}
                                                            value={form.capacity}
                                                            onChange={e => set("capacity", Number(e.target.value))}
                                                            className="input-glass w-full rounded-xl pl-9 pr-4 py-3 text-sm"
                                                        />
                                                    </div>
                                                </Field>

                                                {/* Availability toggle */}
                                                <Field label="Status">
                                                    <button
                                                        type="button"
                                                        id="facility-availability"
                                                        onClick={() => toggle("isAvailable")}
                                                        className={clsx(
                                                            "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border transition-all",
                                                            form.isAvailable
                                                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                                                : "glass border-white/08 text-white/35"
                                                        )}
                                                    >
                                                        <span className={clsx("w-2 h-2 rounded-full", form.isAvailable ? "bg-emerald-400 animate-pulse" : "bg-white/20")} />
                                                        {form.isAvailable ? "Available" : "Unavailable"}
                                                    </button>
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Opens">
                                                    <div className="relative">
                                                        <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                                                        <input
                                                            id="facility-opening"
                                                            type="time" value={form.openingTime}
                                                            onChange={e => set("openingTime", e.target.value)}
                                                            className="input-glass w-full rounded-xl pl-9 pr-3 py-3 text-sm"
                                                        />
                                                    </div>
                                                </Field>
                                                <Field label="Closes">
                                                    <div className="relative">
                                                        <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                                                        <input
                                                            id="facility-closing"
                                                            type="time" value={form.closingTime}
                                                            onChange={e => set("closingTime", e.target.value)}
                                                            className="input-glass w-full rounded-xl pl-9 pr-3 py-3 text-sm"
                                                        />
                                                    </div>
                                                </Field>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ── Step 1: Amenities ── */}
                                    {step === 1 && (
                                        <motion.div key="step1"
                                            custom={direction} variants={slideVariants}
                                            initial="enter" animate="center" exit="exit"
                                            transition={{ duration: 0.22, ease: "easeOut" }}
                                            className="pb-4"
                                        >
                                            <p className="text-xs text-white/35 mb-4 leading-relaxed">
                                                Select all amenities available in this facility. Tap to toggle.
                                            </p>
                                            <div className="grid grid-cols-4 gap-2.5 relative">
                                                {amenities.map(({ key, icon, label }) => (
                                                    <AmenityPill
                                                        key={key}
                                                        icon={icon}
                                                        label={label}
                                                        active={!!form[key]}
                                                        onToggle={() => toggle(key)}
                                                    />
                                                ))}
                                            </div>

                                            {/* Summary */}
                                            {amenities.some(a => !!form[a.key]) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                    className="mt-4 px-4 py-3 rounded-2xl bg-teal-500/06 border border-teal-500/15"
                                                >
                                                    <p className="text-[10px] text-teal-400/70 font-semibold uppercase tracking-widest mb-1.5">Selected</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {amenities.filter(a => !!form[a.key]).map(a => (
                                                            <span key={a.key} className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/20 text-teal-300">{a.label}</span>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* ── Step 2: Details ── */}
                                    {step === 2 && (
                                        <motion.div key="step2"
                                            custom={direction} variants={slideVariants}
                                            initial="enter" animate="center" exit="exit"
                                            transition={{ duration: 0.22, ease: "easeOut" }}
                                            className="space-y-4 pb-4"
                                        >
                                            <Field label="Image URL" hint="optional">
                                                <div className="relative">
                                                    <ImageIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                                                    <input
                                                        id="facility-image-url"
                                                        type="url" value={form.imageUrl}
                                                        onChange={e => set("imageUrl", e.target.value)}
                                                        placeholder="https://…"
                                                        className="input-glass w-full rounded-xl pl-9 pr-4 py-3 text-sm"
                                                    />
                                                </div>
                                                {form.imageUrl && (
                                                    <div className="mt-2 rounded-xl overflow-hidden h-24 relative">
                                                        <Image src={form.imageUrl} alt="preview" fill className="object-cover" unoptimized
                                                            onError={() => set("imageUrl", "")} />
                                                    </div>
                                                )}
                                            </Field>

                                            <Field label="Description" hint="optional">
                                                <textarea
                                                    id="facility-description"
                                                    rows={3} value={form.description}
                                                    onChange={e => set("description", e.target.value)}
                                                    placeholder="Brief description of the facility…"
                                                    className="input-glass w-full rounded-xl px-4 py-3 text-sm resize-none"
                                                />
                                            </Field>

                                            <Field label="Rules & Guidelines" hint="optional">
                                                <textarea
                                                    id="facility-rules"
                                                    rows={3} value={form.rules}
                                                    onChange={e => set("rules", e.target.value)}
                                                    placeholder="Usage rules and booking guidelines…"
                                                    className="input-glass w-full rounded-xl px-4 py-3 text-sm resize-none"
                                                />
                                            </Field>

                                            {/* Summary card */}
                                            <div className="rounded-2xl glass p-4 space-y-2">
                                                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2">Review Summary</p>
                                                <SummaryRow label="Name" value={form.name} />
                                                <SummaryRow label="Type" value={types.find(t => t.id === form.facilityTypeId)?.name ?? "—"} />
                                                <SummaryRow label="Location" value={form.location} />
                                                <SummaryRow label="Capacity" value={String(form.capacity)} />
                                                <SummaryRow label="Hours" value={`${form.openingTime} – ${form.closingTime}`} />
                                                <SummaryRow label="Status" value={form.isAvailable ? "Available" : "Unavailable"} accent={form.isAvailable ? "emerald" : "red"} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* ── Footer ── */}
                            <div className="px-6 py-4 border-t border-white/06 flex items-center gap-2.5">
                                {step > 0 ? (
                                    <button
                                        type="button"
                                        onClick={goPrev}
                                        className="flex-none glass px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
                                    >
                                        <ChevronLeft size={15} /> Back
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-none glass px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}

                                {step < STEPS.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        id="next-step-facility"
                                        className="flex-1 btn-amber px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                                    >
                                        Continue <ChevronRight size={15} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        id="submit-add-facility"
                                        className="flex-1 btn-amber px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Sparkles size={14} />
                                        )}
                                        {submitting ? "Creating…" : "Create Facility"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/* ─── Small helpers ────────────────────────────────────────────────────────── */
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs text-white/45 mb-1.5">
                {label}
                {required && <span className="text-amber-400 ml-0.5">*</span>}
                {hint && <span className="text-white/22 ml-1">({hint})</span>}
            </label>
            {children}
        </div>
    );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "red" }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-white/35">{label}</span>
            <span className={clsx("font-medium",
                accent === "emerald" ? "text-emerald-400" :
                    accent === "red" ? "text-red-400" :
                        "text-white/70"
            )}>{value || "—"}</span>
        </div>
    );
}

/* ─── Delete button with confirm step ─────────────────────────────────────── */
function DeleteButton({ facilityId, onRemove }: { facilityId: number; onRemove: (id: number) => void }) {
    const [confirm, setConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm) {
            setConfirm(true);
            timer.current = setTimeout(() => setConfirm(false), 2500);
            return;
        }
        if (timer.current) clearTimeout(timer.current);
        setBusy(true);
        try {
            await facilityApi.remove(facilityId);
            onRemove(facilityId);
        } catch { setConfirm(false); }
        finally { setBusy(false); }
    };

    return (
        <motion.button
            onClick={handleClick}
            layout
            className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all",
                confirm
                    ? "bg-red-500/80 border border-red-400/60 text-white shadow-lg shadow-red-500/30"
                    : "glass border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30"
            )}
        >
            {busy
                ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                : <Trash2 size={12} />}
            {confirm ? "Confirm" : "Delete"}
        </motion.button>
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
    const [showAdd, setShowAdd] = useState(false);

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
    const handleCreated = (f: Facility) => setItems(prev => [f, ...prev]);

    const available = items.filter(f => f.isAvailable).length;
    const unavailable = items.length - available;

    return (
        <div className="min-h-screen p-6 lg:p-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-1">Admin</p>
                    <h1 className="text-3xl font-bold text-white">Facility <span className="gradient-text-admin">Management</span></h1>
                    <p className="text-sm text-white/35 mt-1">
                        {items.length} facilities ·{" "}
                        <span className="text-emerald-400">{available} available</span> ·{" "}
                        <span className="text-red-400">{unavailable} unavailable</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <button onClick={load} disabled={loading}
                        className="glass px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button
                        id="open-add-facility"
                        onClick={() => setShowAdd(true)}
                        className="btn-amber px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Add Facility
                    </button>
                </div>
            </motion.div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-24">
                    <p className="text-red-400 text-sm mb-3">{error}</p>
                    <button onClick={load} className="btn-glass px-5 py-2.5 rounded-xl text-sm font-medium text-white">Retry</button>
                </div>
            ) : items.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center">
                        <Building2 size={28} className="text-white/20" />
                    </div>
                    <p className="text-white/30 text-sm">No facilities yet.</p>
                    <button onClick={() => setShowAdd(true)}
                        className="btn-amber px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
                        <Plus size={15} /> Add First Facility
                    </button>
                </motion.div>
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
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.04 }}
                                className="glass-card rounded-2xl overflow-hidden flex flex-col group">
                                {/* Image */}
                                <div className="relative h-40">
                                    <Image src={imgSrc} alt={f.name} fill className="object-cover" unoptimized />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                    {/* Top-right: delete (hover reveal) */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <DeleteButton facilityId={f.id} onRemove={handleRemove} />
                                    </div>


                                    <div className="absolute bottom-3 left-3 right-3">
                                        <p className="text-sm font-bold text-white leading-tight">{f.name}</p>
                                        <p className="text-[10px] text-white/60">{typeName}</p>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex flex-col gap-3 flex-1">
                                    <div className="flex items-center gap-3 text-xs text-white/50">
                                        <span className="flex items-center gap-1"><MapPin size={11} />{f.location}</span>
                                        <span className="flex items-center gap-1"><Users size={11} />{f.capacity}</span>
                                        <span className="flex items-center gap-1"><Clock size={11} />{f.openingTime.slice(0, 5)}–{f.closingTime.slice(0, 5)}</span>
                                    </div>
                                    {amenities.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {amenities.map(({ icon: Icon, label }) => (
                                                <span key={label} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300">
                                                    <Icon size={9} /> {label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-auto pt-1">
                                        <AvailToggle facility={f} onUpdate={handleUpdate} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Modal */}
            <AddFacilityModal
                open={showAdd}
                onClose={() => setShowAdd(false)}
                onCreated={handleCreated}
            />
        </div>
    );
}
