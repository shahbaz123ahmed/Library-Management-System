"use client";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ChatWidget from "@/components/ui/ChatWidget";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export default function AppLayout({ title, children }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);

  const canManage = user?.role === "admin" || user?.role === "librarian";

  const handleAddBookClick = () => {
    if (typeof window !== "undefined" && window.location.pathname === "/books") {
      window.dispatchEvent(new Event("openAddBookModal"));
    } else {
      router.push("/books?action=new");
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setScrollProgress(0);
    } else {
      setScrollProgress((scrollTop / maxScroll) * 100);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden md:pl-64 transition-colors duration-300 ${isDark ? "bg-slate-900" : ""}`}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 w-full relative">
        {/* Scroll Progress Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 z-50 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
          <div 
            className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <Topbar title={title} />
        <main 
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto px-4 pb-16 pt-6 md:px-10 transition-colors duration-300 ${isDark ? "bg-slate-900" : ""}`}
        >
          {children}
        </main>
      </div>
      <ChatWidget />
      
      {/* ===== GLOBAL FLOATING ACTION BUTTON (ADD BOOK) ===== */}
      {canManage && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1, boxShadow: "0 10px 25px rgba(13, 148, 136, 0.5)" }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAddBookClick}
          className="fixed bottom-16 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-2xl text-white shadow-xl shadow-teal-600/30 transition-all"
          title="Add New Book"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
