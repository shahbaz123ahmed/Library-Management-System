"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

const motivationalQuotes = [
  "The more that you read, the more things you will know.",
  "Learning never exhausts the mind.",
  "Books are a uniquely portable magic.",
  "Knowledge is power.",
  "Today a reader, tomorrow a leader.",
  "Education is the key to unlocking the world.",
  "A room without books is like a body without a soul.",
  "The purpose of education is to replace an empty mind with an open one.",
  "Reading gives us someplace to go when we have to stay where we are.",
  "Wisdom begins in wonder.",
  "An educated mind is able to entertain a thought without accepting it.",
  "Books are the mirrors of the soul.",
  "Tell me and I forget, teach me and I may remember, involve me and I learn.",
  "The only true wisdom is in knowing you know nothing.",
  "Education is the passport to the future.",
  "Reading is essential for those who seek to rise above the ordinary.",
  "Learning is a treasure that will follow its owner everywhere.",
  "The beautiful thing about knowledge is that it grows when shared.",
  "Study hard, for the well is deep, and our brains are shallow.",
  "He who opens a school door, closes a prison.",
  "The beautiful thing about learning is that nobody can take it away from you.",
  "An investment in knowledge pays the best interest.",
  "The mind is not a vessel to be filled, but a fire to be kindled.",
  "Education is not preparation for life; education is life itself.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "The roots of education are bitter, but the fruit is sweet.",
  "Reading is dreaming with open eyes.",
  "A book is a dream you hold in your hands.",
  "Knowledge speaks, but wisdom listens.",
  "The pen is mightier than the sword.",
  "In learning you will teach, and in teaching you will learn.",
  "The expert in anything was once a beginner.",
  "A good book is an event in my life.",
  "There is no friend as loyal as a book.",
  "Once you learn to read, you will be forever free.",
  "The world belongs to those who read.",
  "So many books, so little time.",
  "A library is a hospital for the mind.",
  "To read is to fly — it is to soar to a point of vantage.",
];

// Each quote gets a unique animation style
const animationVariants = [
  // 0 – Welcome: gentle scale + fade
  {
    initial: { opacity: 0, scale: 0.8, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.1, filter: "blur(6px)" },
  },
  // 1 – Slide from left + rotate
  {
    initial: { opacity: 0, x: -120, rotateY: 45 },
    animate: { opacity: 1, x: 0, rotateY: 0 },
    exit: { opacity: 0, x: 120, rotateY: -45 },
  },
  // 2 – Drop from top
  {
    initial: { opacity: 0, y: -40, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 40, scale: 0.95 },
  },
  // 3 – Zoom in from center
  {
    initial: { opacity: 0, scale: 0.3, rotate: -5 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 2, rotate: 5 },
  },
  // 4 – Slide from right + skew
  {
    initial: { opacity: 0, x: 100, skewX: -8 },
    animate: { opacity: 1, x: 0, skewX: 0 },
    exit: { opacity: 0, x: -100, skewX: 8 },
  },
  // 5 – Rise from bottom + blur
  {
    initial: { opacity: 0, y: 30, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -30, filter: "blur(10px)" },
  },
  // 6 – Flip vertical
  {
    initial: { opacity: 0, rotateX: 90 },
    animate: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: -90 },
  },
  // 7 – Typewriter fade-in from left
  {
    initial: { opacity: 0, x: -60, letterSpacing: "0.3em" },
    animate: { opacity: 1, x: 0, letterSpacing: "0em" },
    exit: { opacity: 0, x: 60, letterSpacing: "-0.1em" },
  },
  // 8 – Scale bounce
  {
    initial: { opacity: 0, scale: 1.5, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.5, y: 10 },
  },
  // 9 – Diagonal slide
  {
    initial: { opacity: 0, x: -80, y: 20, rotate: -3 },
    animate: { opacity: 1, x: 0, y: 0, rotate: 0 },
    exit: { opacity: 0, x: 80, y: -20, rotate: 3 },
  },
  // 10 – Elastic pop
  {
    initial: { opacity: 0, scale: 0, rotate: -10 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0, rotate: 10 },
  },
];

// Different transition easing for each
const animationTransitions = [
  { duration: 1.4, ease: "easeOut" },
  { duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94] },
  { duration: 1.2, type: "spring", stiffness: 60, damping: 18 },
  { duration: 1.5, ease: "easeInOut" },
  { duration: 1.3, ease: [0.22, 1, 0.36, 1] },
  { duration: 1.4, ease: "easeOut" },
  { duration: 1.2, ease: [0.68, -0.55, 0.27, 1.55] },
  { duration: 1.5, ease: [0.16, 1, 0.3, 1] },
  { duration: 1.3, type: "spring", stiffness: 80, damping: 18 },
  { duration: 1.4, ease: [0.33, 1, 0.68, 1] },
  { duration: 1.2, type: "spring", stiffness: 100, damping: 20 },
];

export default function Topbar({ title }) {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const isDark = theme === "dark";

  // Build the full cycle: welcome → 10 quotes → repeat
  const allMessages = useMemo(() => {
    const welcome = "Where Every Book Opens a New Door \u2013 Welcome! \uD83D\uDCDA";
    return [welcome, ...motivationalQuotes];
  }, []);

  // Always start from welcome, then cycle through quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allMessages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [allMessages.length]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [badge, setBadge] = useState({ pendingRequests: 0, overdue: 0, total: 0, unreadInbox: 0 });
  const [inboxItems, setInboxItems] = useState([]);
  const notifRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Fetch inbox items when dropdown is opened
  useEffect(() => {
    if (notifOpen && user) {
      api.get("/notifications/inbox", { params: { limit: 5 } })
        .then((res) => setInboxItems(res.data.items))
        .catch(() => {});
    }
  }, [notifOpen, user]);

  // Poll badge count every 60s for admin/librarian — use stable primitives as deps to avoid stacking intervals
  const userId = user?._id;
  const userRole = user?.role;

  useEffect(() => {
    if (!userId) return;

    const fetchBadge = async () => {
      // Skip fetch when tab is not visible to avoid unnecessary requests
      if (document.visibilityState === "hidden") return;
      try {
        const { data } = await api.get("/notifications/badge");
        setBadge(data);
      } catch { /* silent fail */ }
    };

    fetchBadge();
    const interval = setInterval(fetchBadge, 60000); // 60s poll
    return () => clearInterval(interval);
  }, [userId, userRole]); // stable primitives — no re-subscribe on every render

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", roles: ["admin", "librarian", "student"] },
    { label: "Books", href: "/books", roles: ["admin", "librarian", "student"] },
    { label: "My Shelf", href: "/my-shelf", roles: ["student", "librarian"] },
    { label: "Notifications", href: "/notifications", roles: ["admin", "librarian", "student"] },
    { label: "Transactions", href: "/transactions", roles: ["admin", "librarian"] },
    { label: "Admin Catalog", href: "/admin-catalog", roles: ["librarian"] },
    { label: "Users", href: "/users", roles: ["admin"] },
    { label: "Activity Logs", href: "/users/activity-logs", roles: ["admin"] },
  ];

  const variantIndex = currentIndex % animationVariants.length;
  const currentVariant = animationVariants[variantIndex];
  const currentTransition = animationTransitions[variantIndex];

  // Gradient colors for each quote
  const gradientColors = [
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

  const currentGradient = gradientColors[currentIndex % gradientColors.length];

  return (
    <div className="sticky top-0 z-40">
      {/* Animated gradient line */}
      <motion.div
        animate={{
          background: [
            "linear-gradient(90deg, #8b5cf6, #3b82f6, #06b6d4)",
            "linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6)",
            "linear-gradient(90deg, #06b6d4, #8b5cf6, #3b82f6)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="h-0.75 w-full"
      />
      <header className={`flex items-center justify-between border-b px-4 py-3 backdrop-blur transition-colors duration-300 md:px-10 md:py-4 ${isDark
          ? "border-slate-800/50 bg-slate-950/80 text-white"
          : "border-slate-200 bg-white/70 text-slate-900"
        }`}>
        {/* Left: Title */}
        <div className="shrink-0">
          <p className={`text-xs uppercase tracking-[0.3em] transition-colors duration-300 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Workspace
          </p>
          <h1 className={`text-2xl font-semibold transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>
            {title}
          </h1>
        </div>

        {/* Center: Animated Quotes */}
        <div className="hidden md:flex flex-1 justify-center px-6 overflow-hidden">
          <div className="relative h-10 w-full max-w-xl flex items-center justify-center" style={{ perspective: "600px" }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={currentVariant.initial}
                animate={currentVariant.animate}
                exit={currentVariant.exit}
                transition={currentTransition}
                className={`absolute text-center text-base font-semibold leading-snug text-transparent bg-clip-text bg-linear-to-r ${currentGradient}`}
                style={{
                  fontFamily: currentIndex === 0
                    ? "'Inter', sans-serif"
                    : currentIndex % 2 === 0
                      ? "'Georgia', serif"
                      : "'Inter', sans-serif",
                }}
              >
                {currentIndex === 0 ? (
                  <span className="text-lg font-bold">{allMessages[currentIndex]}</span>
                ) : (
                  <>
                    <span className="mr-1">&ldquo;</span>
                    {allMessages[currentIndex]}
                    <span className="ml-1">&rdquo;</span>
                  </>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* ── Notification Bell (all users) ── */}
          {user && (
            <div className="relative" ref={notifRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotifOpen((o) => !o)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${
                  isDark
                    ? "border-slate-700 bg-slate-800 hover:border-slate-500"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
                title="Notifications"
              >
                {/* Bell icon */}
                <svg className={`w-4 h-4 ${isDark ? "text-slate-300" : "text-slate-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Red badge */}
                <AnimatePresence>
                  {badge.total > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow"
                    >
                      {badge.total > 99 ? "99+" : badge.total}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Dropdown panel */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 z-50 sm:w-80 overflow-hidden rounded-2xl border shadow-2xl ${
                      isDark
                        ? "bg-slate-900 border-slate-700"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {/* Header */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${
                      isDark ? "border-slate-700" : "border-slate-100"
                    }`}>
                      <span className={`text-sm font-bold ${ isDark ? "text-white" : "text-slate-900"}`}>🔔 Notifications</span>
                      {badge.total > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {badge.total} new
                        </span>
                      )}
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-slate-100/10">
                      {/* Inbox / Unread Notifications list */}
                      {user && (user.role === "student" || user.role === "librarian") && inboxItems.length > 0 ? (
                        <>
                          {inboxItems.slice(0, 4).map((item) => (
                            <button
                              key={item._id}
                              type="button"
                              onClick={() => { setNotifOpen(false); router.push("/notifications"); }}
                              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                                isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                              } ${!item.isRead ? (isDark ? "bg-slate-800/40" : "bg-teal-50/50") : ""}`}
                            >
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                                !item.isRead
                                  ? "bg-teal-500/15 text-teal-500"
                                  : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                              }`}>
                                {item.type === 'BORROW_APPROVED' ? '✅' : item.type === 'BORROW_REJECTED' ? '❌' : '📬'}
                              </span>
                              <div className="flex-1 overflow-hidden">
                                <p className={`text-xs font-semibold truncate ${ isDark ? "text-slate-200" : "text-slate-800"}`}>{item.title}</p>
                                <p className={`text-[11px] line-clamp-2 mt-0.5 ${ isDark ? "text-slate-500" : "text-slate-400"}`}>
                                  {item.type === 'BORROW_APPROVED' 
                                    ? `Your request to borrow "${item.bookId?.title || 'a book'}" has been approved by the librarian.` 
                                    : item.type === 'BORROW_REJECTED'
                                      ? `Your request to borrow "${item.bookId?.title || 'a book'}" has been rejected by the librarian.`
                                      : item.message}
                                </p>
                              </div>
                              {!item.isRead && (
                                <span className="h-2 w-2 rounded-full bg-teal-500 mt-1 shrink-0"></span>
                              )}
                            </button>
                          ))}
                          {inboxItems.length > 4 && (
                            <button
                              onClick={() => { setNotifOpen(false); router.push("/notifications"); }}
                              className={`w-full py-2.5 text-xs text-center font-medium border-t transition-colors ${
                                isDark ? "border-slate-700/50 text-teal-400 hover:bg-slate-800/50" : "border-slate-100 text-teal-600 hover:bg-slate-50"
                              }`}
                            >
                              View all notifications
                            </button>
                          )}
                        </>
                      ) : user && (user.role === "student" || user.role === "librarian") && (
                        <div className="px-4 py-4 text-center">
                          <p className={`text-xs ${ isDark ? "text-slate-500" : "text-slate-400"}`}>No new messages in your inbox.</p>
                        </div>
                      )}

                      {/* Borrow requests */}
                      {user && user.role === "librarian" && (
                        <button
                          type="button"
                          onClick={() => { setNotifOpen(false); router.push("/notifications"); }}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${
                            badge.pendingRequests > 0
                              ? "bg-amber-500/15 text-amber-500"
                              : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                          }`}>📋</span>
                          <div className="flex-1">
                            <p className={`text-xs font-semibold ${ isDark ? "text-slate-200" : "text-slate-800"}`}>Borrow Requests</p>
                            <p className={`text-[11px] ${ isDark ? "text-slate-500" : "text-slate-400"}`}>
                              {badge.pendingRequests > 0 ? `${badge.pendingRequests} pending approval` : "All clear"}
                            </p>
                          </div>
                          {badge.pendingRequests > 0 && (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              {badge.pendingRequests}
                            </span>
                          )}
                        </button>
                      )}

                      {/* Workspace requests for Admin */}
                      {user && user.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => { setNotifOpen(false); router.push("/notifications"); }}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${
                            badge.workspaceRequests > 0
                              ? "bg-amber-500/15 text-amber-500"
                              : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                          }`}>📋</span>
                          <div className="flex-1">
                            <p className={`text-xs font-semibold ${ isDark ? "text-slate-200" : "text-slate-800"}`}>Workspace Requests</p>
                            <p className={`text-[11px] ${ isDark ? "text-slate-500" : "text-slate-400"}`}>
                              {badge.workspaceRequests > 0 ? `${badge.workspaceRequests} pending approval` : "All clear"}
                            </p>
                          </div>
                          {badge.workspaceRequests > 0 && (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              {badge.workspaceRequests}
                            </span>
                          )}
                        </button>
                      )}

                      {/* Overdue books */}
                      {user && (user.role === "librarian" || user.role === "admin") && (
                        <button
                        type="button"
                        onClick={() => { setNotifOpen(false); router.push("/transactions"); }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${
                          badge.overdue > 0
                            ? "bg-red-500/15 text-red-500"
                            : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                        }`}>⚠️</span>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold ${ isDark ? "text-slate-200" : "text-slate-800"}`}>Overdue Books</p>
                          <p className={`text-[11px] ${ isDark ? "text-slate-500" : "text-slate-400"}`}>
                            {badge.overdue > 0 ? `${badge.overdue} book${badge.overdue !== 1 ? "s" : ""} past due date` : "No overdue books"}
                          </p>
                        </div>
                        {badge.overdue > 0 && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {badge.overdue}
                          </span>
                        )}
                      </button>
                      )}
                    </div>

                    {/* Footer */}
                    {badge.total === 0 && (
                      <div className="px-4 py-4 text-center">
                        <p className="text-2xl mb-1">🎉</p>
                        <p className={`text-xs ${ isDark ? "text-slate-500" : "text-slate-400"}`}>All caught up! No new notifications.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-full border p-2 text-xs font-semibold transition-colors duration-300 ${isDark
                ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Desktop Only Sign out */}
          {user ? (
            <button
              type="button"
              onClick={logout}
              className={`hidden md:block rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-300 ${isDark
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 text-white shadow-md hover:from-blue-700 hover:via-teal-700 hover:to-green-700"
                }`}
            >
              Sign out
            </button>
          ) : null}

          {/* Mobile Only Hamburger Menu */}
          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`rounded-full border p-2 flex items-center justify-center transition-colors duration-300 ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
              title="Open Menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Mobile Dropdown Panel */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border shadow-2xl ${
                    isDark
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="py-1">
                    {navItems
                      .filter((item) => !item.roles || item.roles.includes(user?.role))
                      .map((item) => {
                        const active = pathname === item.href;
                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              router.push(item.href);
                            }}
                            className={`flex w-full items-center px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                              active
                                ? isDark
                                  ? "bg-teal-500/20 text-teal-400"
                                  : "bg-teal-50 text-teal-600 font-bold"
                                : isDark
                                ? "text-slate-300 hover:bg-slate-800"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                  </div>
                  {user && (
                    <div className={`border-t p-2 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:via-teal-700 hover:to-green-700 transition-all"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </div>
  );
}
