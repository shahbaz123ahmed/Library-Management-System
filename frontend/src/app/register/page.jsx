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
    <AuthShell isDark={isDark} setIsDark={setIsDark}>
      {(t) => (
        <>
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{ marginBottom: "20px" }}
          >
            <motion.h2
              animate={{ color: t.text }} transition={{ duration: 0.4 }}
              style={{
                fontFamily: "'Cinzel',serif",
                fontSize: "16px", fontWeight: 600,
                letterSpacing: "0.1em", marginBottom: "4px",
              }}
            >
              Create an Account
            </motion.h2>
            <motion.p
              animate={{ color: t.subtext }} transition={{ duration: 0.4 }}
              style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "14px", fontStyle: "italic" }}
            >
              Join the library and start exploring.
            </motion.p>
          </motion.div>

          {/* Form */}
          <form onSubmit={onSubmit}>
            <AuthInput
              label="Full Name" type="text" icon="👤"
              value={form.name} delay={0} t={t}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <AuthInput
              label="Email Address" type="email" icon="✉️"
              value={form.email} delay={0.05} t={t}
              required
              autoComplete="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <AuthInput
              label="Password" type="password" icon="🔐"
              value={form.password} delay={0.1} t={t}
              required
              autoComplete="new-password"
              minLength={6}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <AuthInput
              label="Confirm Password" type="password" icon="🔑"
              value={form.confirm} delay={0.15} t={t}
              required
              autoComplete="new-password"
              minLength={6}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />

            {/* Password match indicator */}
            <AnimatePresence>
              {form.confirm && form.password && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontSize: "12px",
                    fontFamily: "'Cormorant Garamond',serif",
                    color: form.password === form.confirm ? "#4caf7d" : "#e06c6c",
                    marginTop: "-12px", marginBottom: "16px",
                    paddingLeft: "4px",
                  }}
                >
                  {form.password === form.confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              type="submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.02, boxShadow: `0 8px 32px ${t.accentDim}` }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              style={{
                width: "100%", padding: "14px", border: "none",
                borderRadius: "12px",
                background: t.btnGrad,
                color: t.btnText,
                fontFamily: "'Cinzel',serif",
                fontSize: "13px", fontWeight: 700,
                letterSpacing: "0.2em",
                cursor: loading ? "not-allowed" : "pointer",
                position: "relative", overflow: "hidden",
                boxShadow: `0 4px 20px ${t.accentDim}`,
                opacity: loading ? 0.85 : 1,
                transition: "opacity 0.3s",
              }}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: t.btnText }}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    JOIN THE LIBRARY
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Shimmer */}
              {!loading && (
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                  style={{
                    position: "absolute", top: 0, left: 0,
                    width: "40%", height: "100%",
                    background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)",
                    transform: "skewX(-20deg)",
                  }}
                />
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}
          >
            <div style={{ flex: 1, height: "1px", background: t.divider }} />
            <span style={{ fontSize: "11px", color: t.subtext, fontStyle: "italic" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: t.divider }} />
          </motion.div>

          {/* Social buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ display: "flex", gap: "12px" }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: "11px",
                background: t.socialBg,
                border: `1.5px solid ${t.accentDim}`,
                borderRadius: "10px",
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: "13px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                backdropFilter: "blur(8px)",
                transition: "background 0.4s",
              }}
              onClick={() => window.location.href = "https://www.google.com/"}
            >
              <span>🌐</span>
              <span style={{ color: t.subtext }}>Google</span>
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: "11px",
                background: t.socialBg,
                border: `1.5px solid ${t.accentDim}`,
                borderRadius: "10px",
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: "13px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                backdropFilter: "blur(8px)",
                transition: "background 0.4s",
              }}
              onClick={() => window.location.href = "https://github.com/topics/login"}
            >
              <span>🐱</span>
              <span style={{ color: t.subtext }}>GitHub</span>
            </motion.button>
          </motion.div>

          {/* Footer link */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{
              textAlign: "center", marginTop: "20px",
              fontSize: "13px", color: t.subtext,
              fontStyle: "italic",
              fontFamily: "'Cormorant Garamond',serif",
            }}
          >
            Already a member?{" "}
            <Link href="/login" style={{ textDecoration: "none" }}>
              <motion.span
                whileHover={{ color: t.accent }}
                style={{
                  color: `${t.accent}CC`,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  transition: "color 0.2s",
                  fontWeight: 600,
                }}
              >
                Sign In
              </motion.span>
            </Link>
          </motion.p>
        </>
      )}
    </AuthShell>
  );
}
