"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AuthShell, AuthInput } from "@/components/auth/AuthBackground";

export default function RegisterPage() {
  const router     = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [isDark,  setIsDark]  = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Pass only the fields your API expects — drop `confirm` before sending
      const { confirm, ...payload } = form;
      await register(payload);
      toast.success("Account created! Welcome to the Library 📚");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell activeTab="register" isDark={isDark} setIsDark={setIsDark}>
      {(t) => (
        <>
          {/* Circular Logo Badge */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-[#f4e8dc]/60 border border-[#e8d8c8] flex items-center justify-center text-xl shadow-inner">
              🏛️
            </div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-center mb-5"
          >
            <h2 className="font-serif text-2xl font-bold text-stone-850 tracking-tight">
              Create an Account
            </h2>
            <p className="text-xs text-stone-500 mt-1 font-medium">
              Join the library and start exploring
            </p>
          </motion.div>

          <form onSubmit={onSubmit}>
            <AuthInput
              label="Full Name"
              type="text"
              icon="👤"
              value={form.name}
              delay={0}
              t={t}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your Name"
            />
            <AuthInput
              label="Email Address"
              type="email"
              icon="✉️"
              value={form.email}
              delay={0.05}
              t={t}
              required
              autoComplete="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="student@library.com"
            />
            <AuthInput
              label="Password"
              type="password"
              icon="🔐"
              value={form.password}
              delay={0.1}
              t={t}
              required
              autoComplete="new-password"
              minLength={6}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••••••"
            />
            <AuthInput
              label="Confirm Password"
              type="password"
              icon="🔑"
              value={form.confirm}
              delay={0.15}
              t={t}
              required
              autoComplete="new-password"
              minLength={6}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••••••"
            />

            {/* Password Match Indicator */}
            <AnimatePresence>
              {form.confirm && form.password && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs -mt-2 mb-4 font-semibold font-sans ${
                    form.password === form.confirm ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {form.password === form.confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.01, boxShadow: `0 8px 24px ${t.accentDim}` }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              style={{
                background: t.btnGrad,
                color: t.btnText,
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-sans text-sm font-semibold shadow-md transition-all duration-300 disabled:opacity-85"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-1.5"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-white"
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    Sign Up <span>➔</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 my-5"
          >
            <div className="flex-1 h-[1px] bg-stone-200" />
            <span className="text-[11px] font-semibold text-stone-400 font-sans uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-[1px] bg-stone-200" />
          </motion.div>

          {/* Social Sign-in */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex gap-3"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 px-4 bg-white border border-stone-200 hover:border-stone-300 rounded-xl font-sans text-xs font-semibold text-stone-700 flex items-center justify-center gap-2 shadow-sm transition-all"
              onClick={() => window.location.href = "https://www.google.com/"}
            >
              <span>🌐</span>
              <span>Google</span>
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 px-4 bg-white border border-stone-200 hover:border-stone-300 rounded-xl font-sans text-xs font-semibold text-stone-700 flex items-center justify-center gap-2 shadow-sm transition-all"
              onClick={() => window.location.href = "https://github.com/topics/login"}
            >
              <span>🐱</span>
              <span>GitHub</span>
            </motion.button>
          </motion.div>

          {/* Footer Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 text-xs text-stone-500 font-sans font-medium"
          >
            Already a member?{" "}
            <Link href="/login" className="text-[#8b5e3c] font-bold hover:underline">
              Sign In
            </Link>
          </motion.p>
        </>
      )}
    </AuthShell>
  );
}
