"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    CheckSquare, LayoutDashboard, CalendarDays, Building2,
    Users, LogOut, Menu, X, ShieldCheck, PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { approvals as approvalApi } from "@/lib/api";

const ADMIN_NAV = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview" },
    { href: "/admin/approvals", icon: CheckSquare, label: "Approvals" },
    { href: "/admin/bookings", icon: CalendarDays, label: "All Bookings" },
    { href: "/admin/facilities", icon: Building2, label: "Facilities" },
    { href: "/admin/users", icon: Users, label: "Users" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        approvalApi.pending().then((list) => setPendingCount(list.length)).catch(() => { });
        const id = setInterval(() => {
            approvalApi.pending().then((list) => setPendingCount(list.length)).catch(() => { });
        }, 60_000);
        return () => clearInterval(id);
    }, []);

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
        : "AD";

    return (
        <>
            <button className="fixed top-4 left-4 z-50 glass rounded-xl p-2.5 lg:hidden"
                onClick={() => setOpen(true)} aria-label="Open admin menu">
                <Menu size={20} className="text-amber-400" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)} />
                )}
            </AnimatePresence>

            <aside className={clsx(
                "fixed top-0 left-0 h-full z-50 w-64 flex flex-col py-8 px-4",
                "transition-transform duration-300 ease-in-out lg:translate-x-0",
                open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                "bg-[rgba(15,10,5,0.75)] backdrop-blur-[32px] border-r border-amber-500/[0.10]",
                "shadow-[4px_0_40px_0_rgba(0,0,0,0.6)]"
            )}>
                <div className="flex items-center justify-between mb-10 px-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <ShieldCheck size={17} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white leading-tight">Admin Portal</p>
                            <p className="text-[10px] text-white/30">UG Facility System</p>
                        </div>
                    </div>
                    <button className="lg:hidden glass rounded-lg p-1.5" onClick={() => setOpen(false)}>
                        <X size={16} className="text-white/40" />
                    </button>
                </div>

                <nav className="flex-1 space-y-0.5">
                    {/* ─── Create Booking CTA ─── */}
                    <Link href="/admin/bookings/new" onClick={() => setOpen(false)}>
                        <motion.div
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2.5 px-3 py-3 rounded-2xl mb-3 cursor-pointer
                                       bg-gradient-to-r from-amber-500/80 to-orange-500/80
                                       border border-amber-400/30 shadow-lg shadow-amber-500/20
                                       text-white font-semibold text-sm"
                        >
                            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                                <PlusCircle size={16} className="text-white" />
                            </div>
                            Create Booking
                        </motion.div>
                    </Link>

                    {ADMIN_NAV.map(({ href, icon: Icon, label }) => {
                        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                        const badge = label === "Approvals" && pendingCount > 0 ? pendingCount : 0;
                        return (
                            <Link key={href} href={href} onClick={() => setOpen(false)}>
                                <span className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full",
                                    active ? "admin-nav-active" : "text-white/40 hover:text-white/75 hover:bg-white/[0.03]"
                                )}>
                                    <Icon size={17} />
                                    <span className="flex-1">{label}</span>
                                    {badge > 0 && (
                                        <span className="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/25 rounded-full px-1.5 py-0.5 font-bold leading-none animate-pulse">
                                            {badge}
                                        </span>
                                    )}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-4 border-t border-white/[0.06]">
                    <div className="px-3 mb-3">
                        <span className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest">Admin Portal</span>
                    </div>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-semibold text-white/90 truncate">{user?.name ?? "Admin"}</p>
                            <p className="text-[10px] text-white/30 truncate">{user?.email ?? ""}</p>
                        </div>
                        <LogOut size={13} className="text-white/20 group-hover:text-red-400 transition-colors flex-shrink-0" />
                    </button>
                </div>
            </aside>
        </>
    );
}
