"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AuthInput, useAuthTheme } from "@/components/auth/AuthBackground";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, oauthLogin, user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const t = useAuthTheme();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        // We need the user's profile info. We can either send the access_token to the backend, 
        // or fetch profile here and send it. Actually, google-auth-library expects an idToken.
        // Wait, useGoogleLogin with flow: 'implicit' returns an access_token, not id_token.
        // To get an id_token, we use credential from <GoogleLogin> or we fetch the userinfo.
        // Let's fetch user info and send it to backend, OR use the access token in backend.
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        
        // Let's send a custom request to our backend with the user info
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`, {
          // Since we changed backend to expect an idToken, we need to adapt backend or just use a specialized route.
          // Let's pass the google token and handle it.
          token: tokenResponse.access_token,
          userInfo: userInfo.data // Fallback for our backend
        });
        
        // Now login to context
        oauthLogin(res.data.token, res.data);
        toast.success("Successfully logged in with Google!");
      } catch (err) {
        console.error(err);
        toast.error("Google login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google login was cancelled")
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

  // Only redirect after auth is done loading
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  // Show loading while checking auth
  if (authLoading || !t) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center text-stone-500 font-medium">Loading...</div>
      </div>
    );
  }

  // If user is logged in, don't show login form (redirect happens in useEffect)
  if (user) {
    return null;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back! 📚");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
          {/* Circular Logo Badge */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#22c1a5]/10 border border-[#22c1a5]/20 flex items-center justify-center text-xl shadow-inner text-[#22c1a5]">
              🏛️
            </div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-center mb-6"
          >
            <h2 className="font-serif text-2xl font-bold text-[#e2f0ed] tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-[#6b8e88] mt-1 font-medium">
              Sign in to manage your library
            </p>
          </motion.div>

          <form onSubmit={onSubmit}>
            <AuthInput
              label="Email Address"
              type="email"
              icon="✉️"
              value={form.email}
              delay={0.05}
              t={t}
              required
              autoComplete="username"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="librarian@library.com"
            />
            
            <AuthInput
              label="Password"
              type="password"
              icon="🔐"
              value={form.password}
              delay={0.1}
              t={t}
              required
              autoComplete="current-password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••••••"
              rightLabel={
                <Link href="/forgot-password" className="text-xs font-semibold text-[#0f766e] hover:underline font-sans">
                  Forgot Password?
                </Link>
              }
            />

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 mb-6 mt-1">
              <input 
                type="checkbox" 
                id="remember" 
                className="rounded text-[#0f766e] focus:ring-[#0f766e]/20 w-4 h-4 border-[#22c1a5]/30 bg-[#0f1a17] accent-[#0f766e]" 
              />
              <label htmlFor="remember" className="text-xs font-semibold text-[#6b8e88] font-sans cursor-pointer selection:bg-transparent">
                Remember me
              </label>
            </div>

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
                    Sign In <span>➔</span>
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
            New here?{" "}
            <Link href="/register" className="text-[#0f766e] font-bold hover:underline">
              Create an account
            </Link>
          </motion.p>
    </>
  );
}