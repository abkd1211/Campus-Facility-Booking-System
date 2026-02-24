"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { auth, type User } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (body: Parameters<typeof auth.register>[0]) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Rehydrate from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("token");
        if (!stored) { setLoading(false); return; }
        setToken(stored);
        auth.me()
            .then(setUser)
            .catch(() => { localStorage.removeItem("token"); setToken(null); })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await auth.login(email, password);
        localStorage.setItem("token", res.token);
        setToken(res.token);
        setUser(res.user);
        if (res.user.role === "ADMIN") router.push("/admin");
        else router.push("/dashboard");
    }, [router]);

    const register = useCallback(async (body: Parameters<typeof auth.register>[0]) => {
        const res = await auth.register(body);
        localStorage.setItem("token", res.token);
        setToken(res.token);
        setUser(res.user);
        router.push("/dashboard");
    }, [router]);

    const logout = useCallback(async () => {
        await auth.logout().catch(() => { });
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        router.push("/");
    }, [router]);

    const updateUser = useCallback((u: User) => setUser(u), []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
