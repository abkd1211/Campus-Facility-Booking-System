"use client";

import { motion } from "framer-motion";
import { User, Mail, Phone, Shield, Edit3, Save, X, Lock } from "lucide-react";
import { useState } from "react";
import { users as usersApi, auth as authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import clsx from "clsx";

const ROLE_COLOR: Record<string, string> = {
    STUDENT: "text-teal-400  bg-teal-400/10  border-teal-400/20",
    STAFF: "text-cyan-400   bg-cyan-400/10  border-cyan-400/20",
    ADMIN: "text-amber-400  bg-amber-400/10 border-amber-400/20",
    VISITOR: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    SECURITY: "text-red-400    bg-red-400/10   border-red-400/20",
};

export default function ProfilePage() {
    const { user, updateUser } = useAuth();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveDone, setSaveDone] = useState(false);

    // Edit fields
    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [phone, setPhone] = useState(user?.phone ?? "");
    const [studentId, setStudentId] = useState(user?.studentId ?? "");
    const [staffId, setStaffId] = useState(user?.staffId ?? "");

    // Password change
    const [changePw, setChangePw] = useState(false);
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwDone, setPwDone] = useState(false);

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
        </div>
    );

    const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    const handleSave = async () => {
        setSaving(true); setSaveError(null); setSaveDone(false);
        try {
            const updated = await usersApi.update(user.id, { name, email, phone, studentId, staffId });
            updateUser(updated);
            setEditing(false);
            setSaveDone(true);
            setTimeout(() => setSaveDone(false), 3000);
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handlePwChange = async () => {
        setPwSaving(true); setPwError(null); setPwDone(false);
        try {
            await authApi.changePassword(currentPw, newPw);
            setPwDone(true);
            setChangePw(false);
            setCurrentPw(""); setNewPw("");
        } catch (err: unknown) {
            setPwError(err instanceof Error ? err.message : "Password change failed.");
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-2xl font-bold text-white">Profile</h1>
                <p className="text-sm text-white/45 mt-0.5">Manage your account information</p>
            </motion.div>

            <div className="max-w-2xl space-y-5">
                {/* Avatar card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-8">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-400 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-teal-500/30">
                                {initials}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user.name}</h2>
                            <p className="text-sm text-white/50 mt-0.5">{user.email}</p>
                            <span className={clsx(
                                "inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                                ROLE_COLOR[user.role] ?? "text-white/60 bg-white/[0.06] border-white/[0.12]"
                            )}>
                                <Shield size={11} />{user.role}
                            </span>
                        </div>
                        <button
                            onClick={() => { setEditing(!editing); setSaveError(null); }}
                            className="ml-auto glass px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                            {editing ? <><X size={13} /> Cancel</> : <><Edit3 size={13} /> Edit</>}
                        </button>
                    </div>
                </motion.div>

                {/* Info card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                        <User size={15} className="text-teal-400" /> Personal Information
                    </h3>

                    {saveError && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">{saveError}</div>
                    )}
                    {saveDone && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">Profile updated successfully.</div>
                    )}

                    <div className="space-y-4">
                        {[
                            { label: "Full Name", icon: User, value: name, setter: setName, placeholder: "Your full name" },
                            { label: "Email", icon: Mail, value: email, setter: setEmail, placeholder: "your@email.com" },
                            { label: "Phone", icon: Phone, value: phone, setter: setPhone, placeholder: "0244 123 456" },
                            ...(user.role === "STUDENT" ? [{ label: "Student ID", icon: Shield, value: studentId, setter: setStudentId, placeholder: "10834201" }] : []),
                            ...(user.role === "STAFF" ? [{ label: "Staff ID", icon: Shield, value: staffId, setter: setStaffId, placeholder: "ST-00412" }] : []),
                        ].map(({ label, icon: Icon, value, setter, placeholder }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0">
                                    <Icon size={14} className="text-teal-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-white/40 mb-1">{label}</p>
                                    {editing ? (
                                        <input
                                            type="text" value={value} onChange={(e) => setter(e.target.value)}
                                            placeholder={placeholder}
                                            className="input-glass w-full px-3 py-2 rounded-lg text-sm"
                                        />
                                    ) : (
                                        <p className="text-sm text-white/80">{value || <span className="text-white/30 italic">Not set</span>}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {editing && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-6"
                        >
                            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} /> Save Changes</>}
                        </button>
                    )}
                </motion.div>

                {/* Password card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Lock size={15} className="text-teal-400" /> Security
                        </h3>
                        <button onClick={() => { setChangePw(!changePw); setPwError(null); }}
                            className="glass px-3 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors">
                            {changePw ? "Cancel" : "Change Password"}
                        </button>
                    </div>

                    {pwDone && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">Password changed successfully.</div>}

                    {changePw && (
                        <div className="space-y-3">
                            {pwError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">{pwError}</div>}
                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">Current Password</label>
                                <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                                    placeholder="Current password"
                                    className="input-glass w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">New Password</label>
                                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="input-glass w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <button
                                onClick={handlePwChange}
                                disabled={pwSaving || !currentPw || newPw.length < 6}
                                className={clsx(
                                    "btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2",
                                    (pwSaving || !currentPw || newPw.length < 6) && "opacity-40 cursor-not-allowed"
                                )}
                            >
                                {pwSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Update Password"}
                            </button>
                        </div>
                    )}

                    {!changePw && (
                        <div className="flex items-center gap-2 text-xs text-white/40">
                            <Lock size={12} />
                            <span>Password last changed — keep your account secure.</span>
                        </div>
                    )}
                </motion.div>

                {/* Account meta */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6 space-y-2">
                    <h3 className="text-sm font-bold text-white mb-4">Account Details</h3>
                    {[
                        { label: "Account Status", value: user.isActive ? "Active" : "Inactive", color: user.isActive ? "text-emerald-400" : "text-red-400" },
                        { label: "Role", value: user.role },
                        { label: "Department", value: user.department?.name ?? "—" },
                        { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-US", { dateStyle: "long" }) },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between text-xs py-2 border-b border-white/[0.05] last:border-0">
                            <span className="text-white/40">{label}</span>
                            <span className={clsx("font-medium", color ?? "text-white/70")}>{value}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
