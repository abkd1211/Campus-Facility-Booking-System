"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Shield, GraduationCap, Briefcase, Globe, RefreshCw,
    MoreVertical, UserCheck, UserX, Trash2, ChevronDown,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { users as usersApi } from "@/lib/api";
import type { User } from "@/lib/api";
import clsx from "clsx";

const ROLES = ["STUDENT", "STAFF", "ADMIN", "SECURITY", "VISITOR"] as const;
type Role = typeof ROLES[number];

const ROLE_ICONS: Record<Role, React.ReactNode> = {
    STUDENT: <GraduationCap size={12} />,
    STAFF: <Briefcase size={12} />,
    ADMIN: <Shield size={12} />,
    SECURITY: <Shield size={12} />,
    VISITOR: <Globe size={12} />,
};

const ROLE_STYLE: Record<Role, string> = {
    STUDENT: "bg-teal-400/10   border-teal-400/25   text-teal-300",
    STAFF: "bg-purple-400/10 border-purple-400/25 text-purple-300",
    ADMIN: "bg-amber-400/10  border-amber-400/25  text-amber-300",
    SECURITY: "bg-orange-400/10 border-orange-400/25 text-orange-300",
    VISITOR: "bg-cyan-400/10   border-cyan-400/25   text-cyan-300",
};

/* ─── Role change dropdown ─────────────────────────────────────────────────── */
function RoleDropdown({ user, onUpdate }: { user: User; onUpdate: (u: User) => void }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const changeRole = async (role: Role) => {
        if (role === user.role) { setOpen(false); return; }
        setBusy(true);
        try {
            const updated = await usersApi.changeRole(user.id, role);
            onUpdate(updated);
        } catch { /* silently ignore – error shown via toast if added */ }
        finally { setBusy(false); setOpen(false); }
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className={clsx(
                    "flex items-center gap-1 w-fit px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-colors hover:opacity-80",
                    ROLE_STYLE[user.role as Role] ?? ROLE_STYLE.VISITOR
                )}>
                {ROLE_ICONS[user.role as Role]}
                {user.role}
                {busy ? <span className="w-2.5 h-2.5 border border-current/40 border-t-current rounded-full animate-spin ml-0.5" />
                    : <ChevronDown size={9} className="ml-0.5 opacity-60" />}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
                        className="absolute left-0 top-7 z-30 glass-strong rounded-xl py-1.5 min-w-[120px] shadow-xl">
                        {ROLES.map(r => (
                            <button key={r} onClick={() => changeRole(r)}
                                className={clsx(
                                    "flex items-center gap-2 w-full px-3 py-2 text-[11px] font-medium hover:bg-white/[0.07] transition-colors",
                                    r === user.role ? "text-white" : "text-white/50"
                                )}>
                                {ROLE_ICONS[r]} {r}
                                {r === user.role && <span className="ml-auto text-[8px] text-emerald-400">current</span>}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Actions menu ─────────────────────────────────────────────────────────── */
function UserActions({
    user,
    onUpdate,
    onRemove,
}: {
    user: User;
    onUpdate: (u: User) => void;
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

    const act = async (label: string, fn: () => Promise<User | void>) => {
        setBusy(label); setError(null);
        try {
            const res = await fn();
            if (res) onUpdate(res); else onRemove(user.id);
            setOpen(false);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Action failed");
        } finally {
            setBusy(null);
        }
    };

    const actions = [
        user.isActive
            ? { label: "Deactivate", icon: UserX, fn: () => usersApi.deactivate(user.id), color: "text-amber-400" }
            : { label: "Activate", icon: UserCheck, fn: () => usersApi.activate(user.id), color: "text-emerald-400" },
        { label: "Delete", icon: Trash2, fn: () => usersApi.remove(user.id), color: "text-red-400" },
    ];

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                {busy ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin block" /> : <MoreVertical size={14} />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
                        className="absolute right-0 top-8 z-30 glass-strong rounded-xl py-1.5 min-w-[130px] shadow-xl">
                        {error && <p className="text-[10px] text-red-400 px-3 pb-1">{error}</p>}
                        {actions.map(({ label, icon: Icon, fn, color }) => (
                            <button key={label} onClick={() => act(label, fn)}
                                className={clsx("flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-white/[0.07] transition-colors", color)}>
                                <Icon size={12} /> {label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function AdminUsersPage() {
    const [items, setItems] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState("ALL");

    const load = () => {
        setLoading(true); setError(null);
        usersApi.list()
            .then(setItems)
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load users."))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const handleUpdate = (u: User) => setItems(prev => prev.map(x => x.id === u.id ? u : x));
    const handleRemove = (id: number) => setItems(prev => prev.filter(x => x.id !== id));

    const roleFilters = ["ALL", ...ROLES];
    const filtered = filter === "ALL" ? items : items.filter(u => u.role === filter);

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-1">Admin</p>
                    <h1 className="text-3xl font-bold text-white">User <span className="gradient-text-admin">Management</span></h1>
                    <p className="text-sm text-white/35 mt-1">Change roles, activate/deactivate or delete users ({items.length} total)</p>
                </div>
                <button onClick={load} disabled={loading}
                    className="glass px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5 mt-1">
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </motion.div>

            {/* Role filter */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2 mb-7">
                {roleFilters.map(role => {
                    const count = role === "ALL" ? items.length : items.filter(u => u.role === role).length;
                    return (
                        <button key={role} onClick={() => setFilter(role)}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                                filter === role
                                    ? role === "ALL" ? "bg-amber-500/80 text-white border-amber-500" : ROLE_STYLE[role as Role]
                                    : "glass text-white/40 border-white/10 hover:text-white/70"
                            )}>
                            {role !== "ALL" && ROLE_ICONS[role as Role]}
                            {role === "ALL" ? "All" : role.charAt(0) + role.slice(1).toLowerCase()}
                            <span className="opacity-60">({count})</span>
                        </button>
                    );
                })}
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
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    {["User", "Email", "Role", "Department", "Status", "Actions"].map(h => (
                                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-white/35 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-white/30 text-sm">No users found.</td></tr>
                                ) : filtered.map((u, i) => (
                                    <motion.tr key={u.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.025 }}
                                        className="border-b border-white/[0.035] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                                                    u.role === "ADMIN" ? "bg-gradient-to-br from-amber-400 to-orange-500"
                                                        : u.role === "VISITOR" ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                                                            : "bg-gradient-to-br from-teal-500 to-cyan-500"
                                                )}>
                                                    {u.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                                                </div>
                                                <span className="font-medium text-white/85 text-xs truncate max-w-[130px]">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-white/40">{u.email}</td>
                                        <td className="px-5 py-4">
                                            {/* Clickable role badge opens role-change dropdown */}
                                            <RoleDropdown user={u} onUpdate={handleUpdate} />
                                        </td>
                                        <td className="px-5 py-4 text-xs text-white/40">{u.department?.name ?? "—"}</td>
                                        <td className="px-5 py-4">
                                            <span className={clsx("px-2.5 py-1 rounded-full text-[10px] font-semibold", u.isActive ? "badge-available" : "badge-booked")}>
                                                {u.isActive ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <UserActions user={u} onUpdate={handleUpdate} onRemove={handleRemove} />
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
