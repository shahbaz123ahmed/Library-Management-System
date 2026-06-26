"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function AuthShell({ children, isDark, setIsDark }) {
  const [particles, setParticles] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Theme colors based on dark/light mode
  const theme = {
    text: isDark ? "#f0ebe0" : "#2c1810",
    subtext: isDark ? "rgba(240,235,224,0.65)" : "rgba(44,24,16,0.65)",
    accent: isDark ? "#d4a373" : "#8b5e3c",
    accentDim: isDark ? "rgba(212,163,115,0.35)" : "rgba(139,94,60,0.35)",
    divider: isDark ? "rgba(240,235,224,0.2)" : "rgba(44,24,16,0.15)",
    socialBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
    btnGrad: isDark 
      ? "linear-gradient(135deg, #8b5e3c 0%, #d4a373 100%)"
      : "linear-gradient(135deg, #6b4226 0%, #a0522d 100%)",
    btnText: "#fff",
    cardBg: isDark ? "rgba(20,15,25,0.75)" : "rgba(255,245,235,0.85)",
  };

  useEffect(() => {
    const generateParticles = () => {
      return Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 4 + Math.random() * 8,
        delay: Math.random() * 6,
        size: 2 + Math.random() * 4,
      }));
    };
    
    setParticles(generateParticles());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-900 via-stone-800 to-amber-950">
        <div className="relative z-10">{children(theme)}</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-900 via-stone-800 to-amber-950">
      {/* Vintage paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
      
      {/* Floating particles (dust motes) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            animate={{ y: [0, -40, 0], opacity: [0, 0.4, 0] }}
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
              background: isDark ? "#d4a373" : "#c49a6c",
              opacity: 0,
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      {/* Theme toggle button */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed right-4 top-4 z-50 rounded-full bg-white/10 p-2 backdrop-blur-sm transition hover:bg-white/20"
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            maxWidth: "460px",
            width: "100%",
            background: theme.cardBg,
            backdropFilter: "blur(16px)",
            borderRadius: "32px",
            padding: "40px 36px",
            border: `1px solid ${theme.accentDim}`,
            boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 ${theme.accentDim}`,
          }}
        >
          {children(theme)}
        </motion.div>
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
  ...props
}) {
  const [focused, setFocused] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.15, duration: 0.4 }}
      style={{ marginBottom: "20px" }}
    >
      <motion.label
        animate={{ color: focused ? t.accent : t.subtext }}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "12px", marginBottom: "6px",
          fontFamily: "'Cormorant Garamond',serif",
          letterSpacing: "0.05em",
          transition: "color 0.2s",
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </motion.label>
      <motion.div
        animate={{ borderColor: focused ? t.accent : t.divider }}
        style={{
          display: "flex", alignItems: "center",
          border: "1px solid", borderRadius: "14px",
          background: "rgba(0,0,0,0.2)",
          transition: "border-color 0.2s",
        }}
      >
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          autoComplete={autoComplete}
          style={{
            width: "100%", padding: "14px 16px",
            background: "transparent", border: "none",
            fontSize: "14px", outline: "none",
            color: t.text, fontFamily: "'Cormorant Garamond',serif",
          }}
          {...props}
        />
      </motion.div>
    </motion.div>
  );
}

export default AuthShell;