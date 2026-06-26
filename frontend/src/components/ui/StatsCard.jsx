"use client";

import { useTheme } from "@/context/ThemeContext";

export default function StatsCard({ label, value, hint }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const borderGradient = "bg-linear-to-r from-blue-600 via-teal-600 to-green-600 bg-gradient-to-r";

  return (
    <div 
      className={`rounded-3xl ${borderGradient} p-5 text-white transition-all duration-300 hover:scale-[1.03] shadow-md h-full min-h-[105px] flex flex-col`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-white/85">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {hint ? <p className="mt-auto pt-1 text-xs text-white/75">{hint}</p> : null}
    </div>
  );
}
