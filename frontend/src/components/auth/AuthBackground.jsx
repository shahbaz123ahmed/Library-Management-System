"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";

const AuthThemeContext = createContext(null);
export const useAuthTheme = () => useContext(AuthThemeContext);

export function AuthShell({ children, isDark, setIsDark, activeTab = "login" }) {
  const [particles, setParticles] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [lampOn, setLampOn] = useState(false);

  const dragY = useMotionValue(0);
  const chainY2 = useTransform(dragY, (y) => 175 + y);

  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // A harsh, dry square wave for a physical plastic switch snap
      osc.type = "square";

      // High frequency plastic impact that drops instantly
      osc.frequency.setValueAtTime(1500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.02);

      // Incredibly fast, dry envelope to remove any ring or tone
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch (e) {
      // Fail silently if audio is not supported
    }
  };

  const theme = {
    text: "#e2f0ed",
    subtext: "rgba(34,193,165,0.6)",
    accent: "#22c1a5",
    accentDim: "rgba(34,193,165,0.15)",
    divider: "rgba(34,193,165,0.15)",
    socialBg: "#111f1c",
    btnGrad: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
    btnText: "#fff",
    cardBg: "#0d1916",
  };

  useEffect(() => {
    const generateParticles = () => {
      return Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        size: 1 + Math.random() * 1.5,
      }));
    };
    setParticles(generateParticles());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0d1916] flex items-center justify-center p-4">
        <div className="w-full max-w-[1000px] h-[540px] animate-pulse" />
      </div>
    );
  }

  return (
    <AuthThemeContext.Provider value={theme}>
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0d1916] p-4 sm:p-6 md:p-10 selection:bg-[#22c1a5] selection:text-black">

        {/* Main Container */}
        <motion.div
          layout
          className="w-full max-w-[1000px] flex flex-col md:flex-row min-h-[540px] relative z-10"
        >

          {/* Ambient glow when ON (Covering entire scene) */}
          <AnimatePresence>
            {lampOn && (
              <motion.div
                key="ambient"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                  background: "radial-gradient(ellipse at 35% 50%, rgba(255,230,170,0.15) 0%, rgba(255,215,100,0.08) 25%, transparent 60%)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Floating particles when ON (Covering entire scene) */}
          <AnimatePresence>
            {lampOn && (
              <motion.div
                key="particles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="fixed inset-0 overflow-hidden pointer-events-none z-0"
              >
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    animate={{ y: [0, -25, 0], opacity: [0, 0.35, 0] }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      position: "absolute", left: p.left, top: p.top, width: p.size, height: p.size,
                      borderRadius: "50%", background: "#22c1a5",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ====== LEFT SIDE: LAMP PANEL ====== */}
          <div className="relative flex flex-col items-center justify-between md:w-[46%] lg:w-[48%] p-8 lg:p-10 select-none z-10">

            {/* ====== MODERN DESK LAMP ====== */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center -mt-6">
              <div className="relative w-[240px] h-[420px]">
                <svg width="240" height="420" viewBox="0 0 240 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                  <defs>
                    <filter id="lampGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="bigGlow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="25" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <linearGradient id="lightConeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff2c8" stopOpacity={lampOn ? "0.85" : "0"} />
                      <stop offset="50%" stopColor="#ffdb70" stopOpacity={lampOn ? "0.25" : "0"} />
                      <stop offset="100%" stopColor="#ffb300" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="poleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a1a1a" />
                      <stop offset="100%" stopColor="#0a0a0a" />
                    </linearGradient>
                  </defs>

                  {/* === Light cone (visible when ON) === */}
                  <motion.g animate={{ opacity: lampOn ? 1 : 0 }} transition={{ duration: 0.8 }}>
                    <polygon points="65,75 175,75 350,450 -110,450" fill="url(#lightConeGrad)" />
                    {/* Intense diffuser glow (soft) */}
                    <ellipse cx="120" cy="75" rx="55" ry="7" fill="#ffffff" filter="url(#lampGlow)" opacity="0.9" />
                    {/* The bright diffuser (solid) */}
                    <ellipse cx="120" cy="75" rx="55" ry="7" fill="#fffcf0" />
                  </motion.g>

                  {/* === Lamp Shade (Larger, Black) === */}
                  {/* Shade top surface */}
                  <ellipse cx="120" cy="55" rx="80" ry="15" fill="#0d0d0d" stroke="#1f1f1f" strokeWidth="0.5" />
                  {/* Shade rim/edge (side) */}
                  <path
                    d="M40 55 Q40 75 60 75 L180 75 Q200 75 200 55"
                    fill="#050505"
                    stroke="#1f1f1f"
                    strokeWidth="0.5"
                  />
                  {/* Shade bottom rim */}
                  <ellipse cx="120" cy="75" rx="60" ry="8" fill="#0d0d0d" stroke="#1f1f1f" strokeWidth="0.5" />

                  {/* === Pole === */}
                  <rect x="117" y="75" width="6" height="265" rx="3" fill="url(#poleGrad)" />

                  {/* === Base === */}
                  <ellipse cx="120" cy="348" rx="50" ry="8" fill="#0d0d0d" stroke="#1f1f1f" strokeWidth="0.5" />
                  <path
                    d="M70 348 Q70 360 85 362 L155 362 Q170 360 170 348"
                    fill="#050505"
                    stroke="#1f1f1f"
                    strokeWidth="0.5"
                  />
                  <ellipse cx="120" cy="362" rx="43" ry="6" fill="#0d0d0d" />

                  {/* === Dynamic Stretchable Pull Chain === */}
                  {/* Thin solid string */}
                  <motion.line
                    x1="190" y1="80" x2="190"
                    style={{ y2: chainY2 }}
                    stroke={lampOn ? "rgba(255, 219, 112, 0.05)" : "#1f1f1f"}
                    strokeWidth="0.5"
                    animate={{ stroke: lampOn ? "rgba(255, 219, 112, 0.05)" : "#1f1f1f" }}
                    transition={{ duration: 0.5 }}
                  />
                  {/* Dotted beads over the string */}
                  <motion.line
                    x1="190" y1="82" x2="190"
                    style={{ y2: chainY2 }}
                    stroke={lampOn ? "rgba(255, 219, 112, 0.05)" : "#3a3a3a"}
                    strokeWidth="1.5"
                    strokeDasharray="0 5.5"
                    strokeLinecap="round"
                    animate={{ stroke: lampOn ? "rgba(255, 219, 112, 0.05)" : "#3a3a3a" }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>

                {/* ====== PULL CHAIN KNOB (Draggable) ====== */}
                <motion.div
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 45 }}
                  dragElastic={0.4}
                  dragSnapToOrigin={true}
                  onDragEnd={(e, info) => {
                    if (info.offset.y > 15) {
                      setLampOn((prev) => !prev);
                      playClickSound();
                    }
                  }}
                  animate={{
                    scale: lampOn ? 1 : [1, 1.05, 1]
                  }}
                  transition={lampOn ? { duration: 0.3 } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ cursor: "grabbing" }}
                  className="absolute z-30 w-6 h-10 rounded-[12px] cursor-grab focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffdb70]/50"
                  style={{
                    y: dragY,
                    top: "175px",
                    left: "178px", // 190px (chain x) - 12px (half width)
                    background: lampOn
                      ? "rgba(255, 219, 112, 0.05)"
                      : "linear-gradient(180deg, #1a3530, #0f1a17)",
                    border: `1.5px solid ${lampOn ? "rgba(255, 219, 112, 0.05)" : "#1a3530"}`,
                    boxShadow: lampOn ? "none" : "none",
                  }}
                  aria-label="Drag the chain down to toggle lamp"
                />
              </div>
            </div>

            {/* ====== BRANDING BELOW LAMP ====== */}
            <motion.div
              animate={{ opacity: lampOn ? 1 : 0.4 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 flex flex-col items-center mt-6 w-full"
            >
              <h2 className="text-[#22c1a5] text-[12px] tracking-[0.45em] font-bold uppercase font-sans text-center">
                Pull the Chain
              </h2>

              <div className="flex items-center gap-2 mt-2.5 mb-2.5">
                <div className="w-8 h-[1px] bg-[#22c1a5]/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c1a5]/40" />
                <div className="w-8 h-[1px] bg-[#22c1a5]/20" />
              </div>

              <p className="text-[#22c1a5]/50 text-[9px] tracking-[0.25em] font-semibold uppercase font-sans text-center">
                To Light the Path
              </p>
            </motion.div>
          </div>


          {/* ====== RIGHT SIDE: AUTH FORMS PANEL ====== */}
          <AnimatePresence>
            {lampOn && (
              <motion.div
                key="auth-panel"
                initial={{ opacity: 0, x: 80, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 55, damping: 18, mass: 0.8 }}
                className="flex-1 flex flex-col relative z-20"
              >
                <AuthTabs activeTab={activeTab} />

                <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-center max-w-md mx-auto w-full relative overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full flex flex-col justify-center"
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lamp-off right side placeholder */}
          {!lampOn && (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.12 }}
                transition={{ delay: 1.2, duration: 2 }}
                className="text-[#22c1a5] text-sm font-serif italic text-center px-10"
              >
                Pull the chain to illuminate your path...
              </motion.p>
            </div>
          )}

        </motion.div>
      </div>
    </AuthThemeContext.Provider>
  );
}

// ======================================================================
// Auth Tabs
// ======================================================================
function AuthTabs({ activeTab }) {
  return (
    <div className="flex bg-transparent">
      <Link
        href="/login"
        className={`flex-1 text-center py-4 text-xs font-semibold transition-all relative ${activeTab === "login"
            ? "text-[#22c1a5]"
            : "text-[#4a6560] hover:text-[#6b8e88]"
          }`}
      >
        Login
        {activeTab === "login" && (
          <motion.div
            layoutId="activeTabIndicator"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22c1a5]"
          />
        )}
      </Link>
      <Link
        href="/register"
        className={`flex-1 text-center py-4 text-xs font-semibold transition-all relative ${activeTab === "register"
            ? "text-[#22c1a5]"
            : "text-[#4a6560] hover:text-[#6b8e88]"
          }`}
      >
        Sign Up
        {activeTab === "register" && (
          <motion.div
            layoutId="activeTabIndicator"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#22c1a5]"
          />
        )}
      </Link>
    </div>
  );
}

// ======================================================================
// Auth Input (Dark themed)
// ======================================================================
export function AuthInput({
  label, type = "text", icon, value, onChange, required = true,
  delay = 0, autoComplete, t, rightLabel, ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.15, duration: 0.4 }}
      className="mb-4 flex-shrink-0"
    >
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-[11px] font-bold text-[#22c1a5] tracking-wider uppercase font-sans">{label}</label>
        {rightLabel}
      </div>
      <div
        className={`flex items-center border rounded-xl overflow-hidden transition-all duration-200 ${focused
            ? "border-[#22c1a5]/50 ring-1 ring-[#22c1a5]/15 bg-[#111f1c]"
            : "border-[#1a2e2a] bg-[#0f1a17]"
          }`}
      >
        {icon && (
          <span className="pl-3.5 text-[#4a6560] text-sm flex items-center justify-center pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          required={required} autoComplete={autoComplete}
          className="w-full px-3 py-3 text-sm text-[#d0e8e2] outline-none bg-transparent placeholder-[#3a5550] font-medium"
          {...props}
        />
      </div>
    </motion.div>
  );
}

export default AuthShell;