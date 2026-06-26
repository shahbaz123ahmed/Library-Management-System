"use client";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ChatWidget from "@/components/ui/ChatWidget";
import { useTheme } from "@/context/ThemeContext";

export default function AppLayout({ title, children }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`flex h-screen overflow-hidden md:pl-64 transition-colors duration-300 ${isDark ? "bg-slate-900" : ""}`}>
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title={title} />
        <main className={`flex-1 overflow-y-auto px-6 pb-16 pt-6 md:px-10 transition-colors duration-300 ${isDark ? "bg-slate-900" : ""}`}>{children}</main>
      </div>
      <ChatWidget />
    </div>
  );
}
