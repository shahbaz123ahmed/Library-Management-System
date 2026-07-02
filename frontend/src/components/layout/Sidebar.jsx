"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["admin", "librarian", "student"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Books",
    href: "/books",
    roles: ["admin", "librarian", "student"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: "My Shelf",
    href: "/my-shelf",
    roles: ["student", "librarian"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/notifications",
    roles: ["admin", "librarian"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    label: "Transactions",
    href: "/transactions",
    roles: ["admin", "librarian"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    label: "Admin Catalog",
    href: "/admin-catalog",
    roles: ["librarian"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/users",
    roles: ["admin"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Activity Logs",
    href: "/users/activity-logs",
    roles: ["admin"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const allSidebarMessages = [
  { text: "Welcome to Your Gateway of Knowledge\uD83D\uDCDA", author: null },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Reading is dreaming with open eyes.", author: "Anissa Trisdianty" },
  { text: "A book is a dream you hold in your hands.", author: "Neil Gaiman" },
  { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix" },
  { text: "The pen is mightier than the sword.", author: "Edward Bulwer-Lytton" },
];

const sidebarQuoteAnimations = [
  { initial: { opacity: 0, scale: 0.8, filter: "blur(6px)" }, animate: { opacity: 1, scale: 1, filter: "blur(0px)" }, exit: { opacity: 0, scale: 1.1, filter: "blur(6px)" } },
  { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 40 } },
  { initial: { opacity: 0, y: -25 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 25 } },
  { initial: { opacity: 0, scale: 0.4, rotate: -5 }, animate: { opacity: 1, scale: 1, rotate: 0 }, exit: { opacity: 0, scale: 1.6, rotate: 5 } },
  { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 } },
  { initial: { opacity: 0, y: 25, filter: "blur(8px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -25, filter: "blur(8px)" } },
  { initial: { opacity: 0, rotateX: 60 }, animate: { opacity: 1, rotateX: 0 }, exit: { opacity: 0, rotateX: -60 } },
  { initial: { opacity: 0, x: -30, scale: 0.9 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 30, scale: 0.9 } },
  { initial: { opacity: 0, scale: 1.3, y: -10 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.7, y: 10 } },
  { initial: { opacity: 0, x: -20, y: 15, rotate: -3 }, animate: { opacity: 1, x: 0, y: 0, rotate: 0 }, exit: { opacity: 0, x: 20, y: -15, rotate: 3 } },
  { initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0 } },
];

const sidebarGradients = [
  "from-teal-500 via-blue-500 to-purple-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-blue-400 via-indigo-500 to-violet-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-pink-500 via-rose-500 to-red-500",
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-cyan-400 via-blue-500 to-indigo-500",
  "from-lime-500 via-emerald-500 to-teal-500",
  "from-rose-400 via-pink-500 to-purple-500",
  "from-sky-400 via-blue-500 to-violet-500",
  "from-orange-400 via-amber-500 to-yellow-500",
];

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { x: -15, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [quoteIndex, setQuoteIndex] = useState(0);

  const isDark = theme === "dark";

  // Always start at 0 (welcome message) on every refresh, then cycle forward
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % allSidebarMessages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const sidebarVariantIndex = quoteIndex % sidebarQuoteAnimations.length;
  const currentSidebarAnim = sidebarQuoteAnimations[sidebarVariantIndex];
  const currentSidebarGradient = sidebarGradients[quoteIndex % sidebarGradients.length];

  const roleColor = {
    admin: { badge: isDark ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700", dot: "bg-red-400" },
    librarian: { badge: isDark ? "bg-teal-500/20 text-teal-300" : "bg-teal-100 text-teal-700", dot: "bg-teal-400" },
    student: { badge: isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
  };

  const colors = roleColor[user?.role] || roleColor.student;

  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className={`hidden w-64 flex-col md:fixed md:inset-y-0 md:left-0 md:flex overflow-hidden transition-colors duration-300 ${isDark
          ? "bg-slate-950 border-r border-slate-800/50"
          : "bg-linear-to-b from-white via-slate-50/50 to-white border-r border-slate-200/80"
        }`}
    >
      {/* Gradient line at top */}
      <div className="h-0.75 w-full shrink-0 bg-gradient-to-r from-blue-600 via-teal-600 to-green-600" />

      {/* Branding */}
      <motion.div variants={itemVariants} className="px-5 pt-5 pb-1">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-blue-600 shadow-lg shadow-teal-500/25"
          >
            <span className="text-lg font-bold text-white">L</span>
          </motion.div>
          <div>
            <h2 className={`text-base font-bold tracking-tight transition-colors duration-300 ${isDark ? "text-white" : "text-slate-800"}`}>
              Lumen Stack
            </h2>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Library System
            </p>
          </div>
        </div>
      </motion.div>

      {/* Divider */}
      <div className={`mx-5 my-4 h-px bg-linear-to-r from-transparent to-transparent transition-colors duration-300 ${isDark ? "via-slate-700" : "via-slate-200"}`} />

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        <motion.p
          variants={itemVariants}
          className={`px-3 mb-2 text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors duration-300 ${isDark ? "text-slate-600" : "text-slate-400"}`}
        >
          Menu
        </motion.p>
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user?.role))
          .map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <motion.div key={item.href} variants={itemVariants}>
                <Link
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${active
                      ? "bg-linear-to-r from-blue-600 via-teal-600 to-green-600 text-white shadow-md shadow-blue-600/20"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.75 rounded-r-full bg-teal-300"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <span className={`transition-colors duration-200 ${active
                      ? "text-white/90"
                      : isDark
                        ? "text-slate-500 group-hover:text-teal-400"
                        : "text-slate-400 group-hover:text-teal-500"
                    }`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>

                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
      </nav>

      {/* Divider */}
      <div className={`mx-5 my-4 h-px bg-linear-to-r from-transparent to-transparent transition-colors duration-300 ${isDark ? "via-slate-700" : "via-slate-200"}`} />

      {/* Animated Quotes Section */}
      <motion.div variants={itemVariants} className="flex-1 flex items-center px-5">
        <div className={`w-full rounded-xl border p-4 relative overflow-hidden transition-colors duration-300 ${isDark
            ? "bg-slate-900/60 border-slate-800/60"
            : "bg-linear-to-br from-slate-50 to-slate-100/80 border-slate-200/60"
          }`} style={{ perspective: "400px" }}>
          {/* Decorative quote mark */}
          <span className={`absolute top-1 right-3 text-4xl font-serif leading-none select-none transition-colors duration-300 ${isDark ? "text-slate-700/40" : "text-slate-200/60"
            }`}>&ldquo;</span>

          <div className="h-20 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIndex}
                initial={currentSidebarAnim.initial}
                animate={currentSidebarAnim.animate}
                exit={currentSidebarAnim.exit}
                transition={{ duration: 1.3, ease: "easeInOut" }}
                className={`absolute text-center text-xs font-semibold leading-relaxed text-transparent bg-clip-text bg-linear-to-r ${currentSidebarGradient}`}
                style={{
                  fontFamily: quoteIndex === 0 ? "'Inter', sans-serif" : quoteIndex % 2 === 0 ? "'Georgia', serif" : "'Inter', sans-serif",
                }}
              >
                {quoteIndex === 0 ? (
                  <p className="text-sm font-bold">{allSidebarMessages[quoteIndex].text}</p>
                ) : (
                  <>
                    <p>&ldquo;{allSidebarMessages[quoteIndex].text}&rdquo;</p>
                    <p className={`mt-1 text-[10px] font-bold ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                      &mdash; {allSidebarMessages[quoteIndex].author}
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1 mt-2">
            {allSidebarMessages.map((_, i) => (
              <motion.span
                key={i}
                animate={{ scale: i === quoteIndex ? 1.3 : 1 }}
                className={`h-1 rounded-full transition-all duration-300 ${i === quoteIndex
                    ? "w-3 bg-teal-500"
                    : isDark ? "w-1 bg-slate-700" : "w-1 bg-slate-300"
                  }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* User Profile Card */}
      <motion.div variants={itemVariants} className="p-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
          className={`rounded-xl border p-3.5 transition-colors duration-300 ${isDark
              ? "bg-slate-900/80 border-slate-800/80"
              : "bg-white border-slate-200/80 shadow-sm"
            }`}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-blue-500 text-sm font-bold text-white shadow-md shadow-teal-400/20">
                {user?.name?.charAt(0)?.toUpperCase() || "G"}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 bg-emerald-400 ${isDark ? "border-slate-900" : "border-white"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate transition-colors duration-300 ${isDark ? "text-white" : "text-slate-800"}`}>
                {user?.name || "Guest"}
              </p>
              <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${colors.badge}`}>
                {user?.role || "visitor"}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}
