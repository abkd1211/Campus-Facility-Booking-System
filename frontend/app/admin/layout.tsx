"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.replace("/");
        if (!loading && user && user.role !== "ADMIN") router.replace("/dashboard");
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center admin-mesh-bg">
                <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex admin-mesh-bg overflow-x-hidden">
            <AdminSidebar />
            <main className="flex-1 lg:ml-64 min-h-screen pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
