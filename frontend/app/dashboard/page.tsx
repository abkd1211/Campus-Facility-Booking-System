"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { facilities as facilityApi, facilityTypes as typeApi } from "@/lib/api";
import type { Facility, FacilityType } from "@/lib/api";
import FacilityCard from "@/components/FacilityCard";
import { useAuth } from "@/lib/auth";

const today = new Date().toLocaleString("en-US", { weekday: "long" });
const hour = new Date().getHours();
const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

export default function DashboardHome() {
    const { user } = useAuth();

    const [facilityList, setFacilityList] = useState<Facility[]>([]);
    const [types, setTypes] = useState<FacilityType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [typeId, setTypeId] = useState<number | null>(null);
    const [showFilter, setShowFilter] = useState(false);
    const [minCap, setMinCap] = useState("");
    const [onlyWifi, setOnlyWifi] = useState(false);
    const [onlyProj, setOnlyProj] = useState(false);
    const [onlyAC, setOnlyAC] = useState(false);
    const [onlyAvail, setOnlyAvail] = useState(false);

    useEffect(() => {
        typeApi.list().then(setTypes).catch(() => { });
    }, []);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params: Record<string, string> = {};
            if (search) params.name = search;
            if (typeId) params.typeId = String(typeId);
            if (minCap) params.minCapacity = minCap;
            if (onlyWifi) params.hasWifi = "true";
            if (onlyProj) params.hasProjector = "true";
            if (onlyAC) params.hasAirConditioning = "true";

            const data = Object.keys(params).length
                ? await facilityApi.search(params)
                : await facilityApi.list();

            setFacilityList(onlyAvail ? data.filter((f) => f.isAvailable) : data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load facilities.");
        } finally {
            setLoading(false);
        }
    }, [search, typeId, minCap, onlyWifi, onlyProj, onlyAC, onlyAvail]);

    useEffect(() => { load(); }, [load]);

    const hasFilters = !!(typeId || minCap || onlyWifi || onlyProj || onlyAC || onlyAvail);

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
                <div className="min-w-0">
                    <p className="text-sm text-teal-400 font-medium mb-1">{today}</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                        {greeting}, {user?.name?.split(" ")[0] ?? "there"}
                    </h1>
                    <p className="text-sm text-white/45 mt-0.5">
                        Browse and book campus facilities below
                    </p>
                </div>

                {/* Quick Book CTA */}
                <Link href="/dashboard/bookings" className="shrink-0 sm:mt-1 self-start">
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white
                                   bg-gradient-to-r from-teal-500 to-cyan-500
                                   shadow-lg shadow-teal-500/30 border border-teal-400/30"
                    >
                        <PlusCircle size={16} />
                        New Booking
                    </motion.button>
                </Link>
            </motion.div>

            {/* Search + filter row */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="flex flex-col sm:flex-row gap-3 mb-6"
            >
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search facilities by name..."
                        className="input-glass w-full pl-10 pr-4 py-3 rounded-2xl text-sm"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilter(!showFilter)}
                    className={`glass px-4 py-3 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 ${showFilter ? "border-teal-500/50 text-teal-300" : "text-white/60 hover:text-white"}`}
                >
                    <SlidersHorizontal size={15} />
                    Filters
                    {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
                </button>
            </motion.div>

            {/* Filter panel */}
            {showFilter && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card rounded-2xl p-5 mb-6 space-y-4"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Type filter */}
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block">Facility Type</label>
                            <div className="relative">
                                <select
                                    value={typeId ?? ""}
                                    onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : null)}
                                    className="input-glass w-full px-3 py-2 rounded-xl text-xs appearance-none pr-8"
                                >
                                    <option value="" className="bg-[#071a18]">All Types</option>
                                    {types.map((t) => (
                                        <option key={t.id} value={t.id} className="bg-[#071a18]">{t.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                            </div>
                        </div>
                        {/* Min capacity */}
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block">Min. Capacity</label>
                            <input
                                type="number" min={1} value={minCap}
                                onChange={(e) => setMinCap(e.target.value)}
                                placeholder="e.g. 50"
                                className="input-glass w-full px-3 py-2 rounded-xl text-xs"
                            />
                        </div>
                        {/* Toggle filters */}
                        <div className="sm:col-span-2 flex flex-wrap gap-2 items-end">
                            {[
                                { label: "Available", state: onlyAvail, set: setOnlyAvail },
                                { label: "Wi-Fi", state: onlyWifi, set: setOnlyWifi },
                                { label: "Projector", state: onlyProj, set: setOnlyProj },
                                { label: "Air Cond.", state: onlyAC, set: setOnlyAC },
                            ].map(({ label, state, set }) => (
                                <button
                                    key={label}
                                    onClick={() => set(!state)}
                                    className={`glass px-3 py-1.5 rounded-lg text-xs transition-all ${state ? "border-teal-500/50 text-teal-300" : "text-white/50 hover:text-white"}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {hasFilters && (
                        <button
                            onClick={() => { setTypeId(null); setMinCap(""); setOnlyWifi(false); setOnlyProj(false); setOnlyAC(false); setOnlyAvail(false); }}
                            className="text-teal-400 text-xs hover:text-teal-300 transition-colors"
                        >
                            Clear all filters
                        </button>
                    )}
                </motion.div>
            )}

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-24">
                    <p className="text-red-400 text-sm mb-3">{error}</p>
                    <button onClick={load} className="btn-glass px-5 py-2.5 rounded-xl text-sm font-medium text-white">
                        Retry
                    </button>
                </div>
            ) : facilityList.length === 0 ? (
                <div className="text-center py-24">
                    <p className="text-white/40 text-sm">No facilities match your filters.</p>
                    <button onClick={() => { setSearch(""); setTypeId(null); setMinCap(""); setOnlyWifi(false); setOnlyProj(false); setOnlyAC(false); setOnlyAvail(false); }}
                        className="text-teal-400 text-xs mt-2 block hover:text-teal-300 transition-colors">
                        Clear filters
                    </button>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
                >
                    {facilityList.map((f, i) => (
                        <FacilityCard key={f.id} facility={f} index={i} />
                    ))}
                </motion.div>
            )}
        </div>
    );
}
