"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Home, CalendarDays, User, LogOut, Menu, X, Waves, PlusCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/dashboard/bookings", icon: CalendarDays, label: "My Bookings" },
    { href: "/dashboard/profile", icon: User, label: "Profile" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
        : "??";

    return (
        <>
            <button
                className="fixed top-4 left-4 z-50 glass rounded-xl p-2.5 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
            >
                <Menu size={20} className="text-teal-300" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            <aside className={clsx(
                "fixed top-0 left-0 h-full z-50 w-64 glass-strong flex flex-col py-8 px-4",
                "transition-transform duration-300 ease-in-out",
                "lg:translate-x-0",
                open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex items-center justify-between mb-10 px-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                            <Waves size={17} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white leading-tight">UG Facilities</p>
                            <p className="text-[10px] text-white/35">Legon Campus</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <NotificationBell accent="teal" />
                        <button className="lg:hidden glass rounded-lg p-1.5" onClick={() => setOpen(false)}>
                            <X size={16} className="text-white/50" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 space-y-0.5">
                    {/* ─── Book CTA ─── */}
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                        <motion.div
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2.5 px-3 py-3 rounded-2xl mb-3 cursor-pointer
                                       bg-gradient-to-r from-teal-500/80 to-cyan-500/80
                                       border border-teal-400/30 shadow-lg shadow-teal-500/20
                                       text-white font-semibold text-sm"
                        >
                            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                                <PlusCircle size={16} className="text-white" />
                            </div>
                            Book a Facility
                        </motion.div>
                    </Link>

                    {NAV.map(({ href, icon: Icon, label }) => {
                        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                        return (
                            <Link key={href} href={href} onClick={() => setOpen(false)}>
                                <span className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full",
                                    active ? "nav-item-active" : "text-white/45 hover:text-white/80 hover:bg-white/[0.035]"
                                )}>
                                    <Icon size={17} />
                                    <span className="flex-1">{label}</span>
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-4 border-t border-white/[0.07]">
                    <div className="px-3 mb-3">
                        <span className="text-[10px] font-bold text-teal-400/70 uppercase tracking-widest">
                            {user?.role ?? "Student"} Portal
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.035] transition-all cursor-pointer group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-teal-500/20">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-semibold text-white/90 truncate">{user?.name ?? "Loading..."}</p>
                            <p className="text-[10px] text-white/35 truncate">{user?.email ?? ""}</p>
                        </div>
                        <LogOut size={13} className="text-white/25 group-hover:text-red-400 transition-colors flex-shrink-0" />
                    </button>
                </div>
            </aside>
        </>
    );
}
