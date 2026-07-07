"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AuthInput, useAuthTheme } from "@/components/auth/AuthBackground";

function RegisterContent() {
  const router     = useRouter();
  const searchParams = useSearchParams();
  const { oauthLogin, register } = useAuth();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const t = useAuthTheme();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`, {
          token: tokenResponse.access_token
        });
        
        oauthLogin(res.data.token, res.data);
        toast.success("Successfully signed up/logged in with Google!");
        router.replace("/dashboard");
      } catch (err) {
        console.error(err);
        toast.error("Google signup failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google signup was cancelled")
  });

  const githubProcessed = useRef(false);

  // Handle GitHub OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !githubProcessed.current) {
      githubProcessed.current = true;
      const handleGithubCallback = async () => {
        try {
          setLoading(true);
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/github`, { code });
          oauthLogin(res.data.token, res.data);
          toast.success("Successfully logged in with GitHub!");
          
          // Clean up the URL
          router.replace("/dashboard");
        } catch (err) {
          console.error(err);
          toast.error("GitHub login failed");
          githubProcessed.current = false;
        } finally {
          setLoading(false);
        }
      };
      handleGithubCallback();
    }
  }, [searchParams, oauthLogin, router]);

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

  if (!t) return null;

  return (
    <>
          {/* Circular Logo Badge */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-[#22c1a5]/10 border border-[#22c1a5]/20 flex items-center justify-center text-xl shadow-inner text-[#22c1a5]">
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
            <h2 className="font-serif text-2xl font-bold text-[#e2f0ed] tracking-tight">
              Create an Account
            </h2>
            <p className="text-xs text-[#6b8e88] mt-1 font-medium">
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
            <div className="flex-1 h-[1px] bg-[#1a2e2a]" />
            <span className="text-[11px] font-semibold text-[#4a6560] font-sans uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-[1px] bg-[#1a2e2a]" />
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
              className="flex-1 py-2.5 px-4 bg-[#0f1a17] border border-[#1a2e2a] hover:border-[#22c1a5]/40 rounded-xl font-sans text-xs font-semibold text-[#e2f0ed] flex items-center justify-center gap-2 shadow-sm transition-all"
              onClick={() => googleLogin()}
              disabled={loading}
            >
              <span>🌐</span>
              <span>Google</span>
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 px-4 bg-[#0f1a17] border border-[#1a2e2a] hover:border-[#22c1a5]/40 rounded-xl font-sans text-xs font-semibold text-[#e2f0ed] flex items-center justify-center gap-2 shadow-sm transition-all"
              onClick={() => {
                const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
                if (!clientId) return toast.error("GitHub Client ID missing in env");
                window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
              }}
              disabled={loading}
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
            className="text-center mt-6 text-xs text-[#6b8e88] font-sans font-medium"
          >
            Already a member?{" "}
            <Link href="/login" className="text-[#0f766e] font-bold hover:underline">
              Sign In
            </Link>
          </motion.p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[#e2f0ed]">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
