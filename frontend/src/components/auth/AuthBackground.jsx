"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export function AuthShell({ children, isDark, setIsDark, activeTab = "login" }) {
  const [particles, setParticles] = useState([]);
  const [mounted, setMounted] = useState(false);

  const theme = {
    text: "#2c1810",
    subtext: "rgba(44,24,16,0.65)",
    accent: "#8b5e3c",
    accentDim: "rgba(139,94,60,0.15)",
    divider: "rgba(44,24,16,0.1)",
    socialBg: "#fff",
    btnGrad: "linear-gradient(135deg, #7a5235 0%, #8d6243 100%)",
    btnText: "#fff",
    cardBg: "#fcfaf7",
  };

  useEffect(() => {
    const generateParticles = () => {
      return Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        size: 1.5 + Math.random() * 2.5,
      }));
    };
    
    setParticles(generateParticles());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0c0f16] flex items-center justify-center p-4">
        <div className="w-full max-w-5xl h-[650px] bg-[#1a1f2c] rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0c0f16] p-4 sm:p-6 md:p-10 selection:bg-[#8b5e3c] selection:text-white">
      {/* Container Frame */}
      <div className="w-full max-w-5xl bg-[#1a1f2c] rounded-3xl overflow-hidden shadow-[0_24px_85px_rgba(0,0,0,0.65)] flex flex-col md:flex-row min-h-[640px] border border-stone-800/40 relative">
        
        {/* Left Side: Library Branding & Info */}
        <div className="hidden md:flex md:w-[46%] lg:w-[48%] relative flex-col justify-between p-8 lg:p-10 overflow-hidden border-r border-stone-800/20">
          {/* Background Image with Dark Tint Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
            style={{
              backgroundImage: "url('/library_background.png')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090706]/95 via-[#0d0a08]/85 to-[#090706]/90" />
          
          {/* Floating Dust Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                animate={{ y: [0, -35, 0], opacity: [0, 0.35, 0] }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: "#d4a373",
                  opacity: 0,
                }}
              />
            ))}
          </div>

          {/* Left Side Content */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Logo and Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#d4a373]/15 rounded-xl border border-[#d4a373]/20">
                  <svg className="w-6 h-6 text-[#d4a373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold tracking-widest text-[#f0ebe0] uppercase leading-none">Library</h1>
                  <p className="text-[9px] tracking-[0.25em] font-semibold text-[#d4a373] uppercase mt-1">Management System</p>
                </div>
              </div>

              {/* Taglines */}
              <div className="mt-8">
                <h2 className="text-[#f0ebe0] text-sm font-semibold tracking-wider font-sans">Organize. Manage. Inspire.</h2>
                <p className="text-white/50 text-xs mt-1">A smarter way to manage your library.</p>
              </div>

              {/* Stacked Features */}
              <div className="mt-8 space-y-5">
                {/* Feature 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-white/70 text-sm">
                    📖
                  </div>
                  <div>
                    <h3 className="text-white/90 text-xs font-semibold">Smart Catalog</h3>
                    <p className="text-white/50 text-[11px] mt-0.5 leading-normal">Easily manage books, authors and categories.</p>
                  </div>
                </div>
                {/* Feature 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-white/70 text-sm">
                    👥
                  </div>
                  <div>
                    <h3 className="text-white/90 text-xs font-semibold">Member Management</h3>
                    <p className="text-white/50 text-[11px] mt-0.5 leading-normal">Add, edit and manage library members with ease.</p>
                  </div>
                </div>
                {/* Feature 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-white/70 text-sm">
                    📊
                  </div>
                  <div>
                    <h3 className="text-white/90 text-xs font-semibold">Advanced Reports</h3>
                    <p className="text-white/50 text-[11px] mt-0.5 leading-normal">Track issued books, fines and library activity.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote block */}
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-white/80 text-[11px] italic font-serif leading-relaxed">
                "A library today is a doorway to tomorrow."
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Form Container */}
        <div className="flex-1 bg-[#fcfaf7] flex flex-col justify-between relative">
          
          {/* Navigation Tabs at the very top */}
          <div className="flex border-b border-stone-200/60 bg-stone-50/50">
            <Link 
              href="/login" 
              className={`flex-1 text-center py-4 text-xs font-semibold transition-all relative ${
                activeTab === "login" 
                  ? "text-stone-900 bg-white" 
                  : "text-stone-400 hover:text-stone-600 hover:bg-stone-50/80"
              }`}
            >
              Login
              {activeTab === "login" && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#8b5e3c]" 
                />
              )}
            </Link>
            <Link 
              href="/register" 
              className={`flex-1 text-center py-4 text-xs font-semibold transition-all relative ${
                activeTab === "register" 
                  ? "text-stone-900 bg-white" 
                  : "text-stone-400 hover:text-stone-600 hover:bg-stone-50/80"
              }`}
            >
              Sign Up
              {activeTab === "register" && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#8b5e3c]" 
                />
              )}
            </Link>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-center max-w-md mx-auto w-full">
            {children(theme)}
          </div>

        </div>

      </div>
    </div>
  );
}

export function AuthInput({ 
  label, 
  type = "text", 
  icon, 
  value, 
  onChange, 
  required = true,
  delay = 0,
  autoComplete,
  t,
  rightLabel,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.15, duration: 0.4 }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold text-stone-700 tracking-wide font-sans">
          {label}
        </label>
        {rightLabel}
      </div>
      <div
        className={`flex items-center border rounded-xl bg-white overflow-hidden transition-all duration-200 ${
          focused ? "border-[#8b5e3c] ring-2 ring-[#8b5e3c]/10" : "border-stone-200"
        }`}
      >
        {icon && (
          <span className="pl-3.5 text-stone-400 text-sm flex items-center justify-center pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          autoComplete={autoComplete}
          className="w-full px-3 py-2.5 text-sm text-stone-850 outline-none bg-transparent placeholder-stone-400 font-medium"
          {...props}
        />
      </div>
    </motion.div>
  );
}

export default AuthShell;