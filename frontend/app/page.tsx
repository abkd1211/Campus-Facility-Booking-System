"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Waves, ArrowRight, User, Mail, Lock, Phone, ChevronDown, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { departments as deptApi } from "@/lib/api";
import type { Department } from "@/lib/api";

const ROLES = [
  { value: "STUDENT", label: "Student" },
  { value: "STAFF", label: "Staff / Lecturer" },
  { value: "VISITOR", label: "Visitor / External Organisation" },
];

export default function AuthPage() {
  const { login, register, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState("STUDENT");
  const [depts, setDepts] = useState<Department[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPw, setRegPw] = useState("");
  const [studentId, setStudentId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [phone, setPhone] = useState("");
  const [deptId, setDeptId] = useState<number | null>(null);

  useEffect(() => {
    deptApi.list().then(setDepts).catch(() => { });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(loginEmail, loginPw);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name,
        email: regEmail,
        passwordHash: regPw,
        role,
        studentId: role === "STUDENT" ? studentId : undefined,
        staffId: role === "STAFF" ? staffId : undefined,
        phone: phone || undefined,
        department: deptId ? { id: deptId } : null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-amber-600/6 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/40">
            <Waves size={22} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">UG Facilities</p>
            <p className="text-xs text-white/40">University of Ghana, Legon</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="glass-strong rounded-3xl p-8"
        >
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 glass rounded-2xl mb-8">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${mode === tab
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30"
                    : "text-white/50 hover:text-white/80"
                  }`}
              >
                {tab === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs mb-5"
              >
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
                onSubmit={handleLogin}
              >
                <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
                <p className="text-sm text-white/50 mb-6">Sign in to manage your bookings</p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email" required value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="kofi.mensah@st.ug.edu.gh"
                      className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPw ? "text" : "password"} required value={loginPw}
                      onChange={(e) => setLoginPw(e.target.value)}
                      placeholder="Your password"
                      className="input-glass w-full pl-10 pr-11 py-3 rounded-xl text-sm"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
                </button>

                <div className="text-center">
                  <span className="text-xs text-white/40">Don&apos;t have an account? </span>
                  <button type="button" onClick={() => setMode("register")}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium">
                    Register
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
                onSubmit={handleRegister}
              >
                <h2 className="text-xl font-bold text-white mb-1">Create account</h2>
                <p className="text-sm text-white/50 mb-5">Join UG Facility Booking</p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Kofi Asante Mensah"
                      className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="kofi.mensah@st.ug.edu.gh"
                      className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">I am a...</label>
                  <div className="relative">
                    <select value={role} onChange={(e) => setRole(e.target.value)}
                      className="input-glass w-full px-4 py-3 rounded-xl text-sm appearance-none pr-10">
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value} className="bg-[#071a18]">{r.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>

                {role === "STUDENT" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Student ID</label>
                    <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)}
                      placeholder="10834201"
                      className="input-glass w-full px-4 py-3 rounded-xl text-sm" />
                  </div>
                )}
                {role === "STAFF" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Staff ID</label>
                    <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)}
                      placeholder="ST-00412"
                      className="input-glass w-full px-4 py-3 rounded-xl text-sm" />
                  </div>
                )}
                {role === "VISITOR" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Phone / Contact</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        placeholder="0244 123 456"
                        className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
                    </div>
                  </div>
                )}

                {role !== "VISITOR" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Department</label>
                    <div className="relative">
                      <select value={deptId ?? ""} onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : null)}
                        className="input-glass w-full px-4 py-3 rounded-xl text-sm appearance-none pr-10">
                        <option value="" className="bg-[#071a18]">Select department...</option>
                        {depts.map((d) => (
                          <option key={d.id} value={d.id} className="bg-[#071a18]">{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type={showPw ? "text" : "password"} required minLength={6}
                      value={regPw} onChange={(e) => setRegPw(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="input-glass w-full pl-10 pr-11 py-3 rounded-xl text-sm" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-glass w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
                </button>

                <div className="text-center">
                  <span className="text-xs text-white/40">Already have an account? </span>
                  <button type="button" onClick={() => setMode("login")}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium">
                    Sign In
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-white/25 mt-6"
        >
          University of Ghana, Legon — Campus Facility Booking System
        </motion.p>
      </div>
    </div>
  );
}
