"use client";

import { motion } from "framer-motion";
import { MapPin, Users, Clock, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { Facility } from "@/lib/api";

const PLACEHOLDER: Record<string, string> = {
    "Lecture Hall": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
    "Computer Laboratory": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "Auditorium": "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
    "Sports Facility": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    "Conference Room": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    "Workshop Room": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    default: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80",
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.07, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
};

interface Props {
    facility: Facility;
    index?: number;
}

export default function FacilityCard({ facility, index = 0 }: Props) {
    const {
        id, name, location, capacity, facilityType,
        openingTime, closingTime, isAvailable, imageUrl,
    } = facility;

    const typeName = facilityType?.name ?? "";
    const imgSrc = imageUrl || PLACEHOLDER[typeName] || PLACEHOLDER.default;

    return (
        <motion.div
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
            className="glass-card rounded-2xl overflow-hidden group relative flex flex-col"
        >
            {/* Image */}
            <div className="relative h-44 overflow-hidden flex-shrink-0">
                <Image
                    src={imgSrc} alt={name} fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Availability badge */}
                <div className={clsx(
                    "absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md",
                    isAvailable ? "badge-available" : "badge-booked"
                )}>
                    <span className={clsx("w-1.5 h-1.5 rounded-full", isAvailable ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                    {isAvailable ? "Available" : "Fully Booked"}
                </div>

                {/* Type chip */}
                <div className="absolute top-3 right-3 glass px-2 py-1 rounded-lg text-[10px] font-medium text-white/80">
                    {typeName}
                </div>

            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                    <h3 className="text-sm font-bold text-white leading-tight mb-1 group-hover:text-teal-300 transition-colors">
                        {name}
                    </h3>
                    <div className="flex items-center gap-1 text-white/40 text-xs">
                        <MapPin size={11} /><span className="truncate">{location}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/50">
                    <span className="flex items-center gap-1"><Users size={11} />{capacity} seats</span>
                    <span className="flex items-center gap-1">
                        <Clock size={11} />{openingTime.slice(0, 5)} – {closingTime.slice(0, 5)}
                    </span>
                </div>

                {/* Action buttons */}
                <div className="mt-auto pt-1 flex gap-2">
                    <Link href={`/dashboard/facilities/${id}`} className="flex-1">
                        <button className="w-full py-2 px-3 rounded-xl text-xs font-medium text-white/60 glass hover:text-white transition-colors">
                            Details
                        </button>
                    </Link>
                    <Link href={`/dashboard/book/${id}`} className="flex-1">
                        <button className={clsx(
                            "btn-glass w-full py-2 px-3 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                        )}>
                            <CalendarDays size={12} />
                            Book Now
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
