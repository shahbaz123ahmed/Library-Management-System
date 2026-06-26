"use client";

import { useTheme } from "@/context/ThemeContext";

export default function PageHeader({ title, subtitle, actions }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className={`text-xs uppercase tracking-[0.3em] transition-colors duration-300 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Overview</p>
        <h2 className={`text-3xl font-semibold transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h2>
        {subtitle ? <p className={`mt-2 text-sm transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
