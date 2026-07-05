"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AppLayout from "@/components/layout/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

export default function MyShelfPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [wishlist, setWishlist] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const fetchWishlist = async () => {
    setFetching(true);
    try {
      const { data } = await api.get("/wishlist");
      setWishlist(data.wishlist || []);
    } catch {
      toast.error("Failed to load shelf");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchWishlist();
  }, [user]);

  const handleRemove = async (bookId, e) => {
    e.stopPropagation();
    setRemovingId(bookId);
    try {
      await api.post(`/wishlist/${bookId}`);
      setWishlist((prev) => prev.filter((b) => b._id !== bookId));
      toast("💔 Removed from My Shelf", { style: { fontWeight: 600 } });
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemovingId(null);
    }
  };

  const handleBorrow = async (bookId, e) => {
    e.stopPropagation();
    try {
      await api.post("/transactions/request", { bookId });
      toast.success("📬 Borrow request sent! A librarian will approve it soon.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    }
  };

  return (
    <AppLayout title="My Shelf">

      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative mb-8 overflow-hidden rounded-3xl p-8 transition-colors duration-300 ${
          isDark
            ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700/50"
            : "bg-gradient-to-r from-blue-600 via-teal-600 to-green-600"
        }`}
      >
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-teal-400/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-purple-400/10 blur-3xl"
        />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-teal-300/70">Want to Read</p>
            <h2 className="text-3xl font-bold text-white">❤️ My Shelf</h2>
            <p className="mt-2 text-sm text-white/55">Books you've saved to read in the future.</p>
          </motion.div>
          <motion.span
            key={wishlist.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="self-start md:self-auto rounded-full bg-teal-500/20 border border-teal-400/30 px-4 py-2 text-sm font-bold text-teal-200"
          >
            {wishlist.length} book{wishlist.length !== 1 ? "s" : ""}
          </motion.span>
        </div>
      </motion.div>

      {/* ── Book Grid ── */}
      {fetching ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-3xl mb-3 animate-pulse">📚</p>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading your shelf…</p>
          </div>
        </div>
      ) : wishlist.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-3xl border p-20 text-center ${
            isDark ? "border-slate-700/50 bg-slate-800/40" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-5xl mb-4">🤍</p>
          <p className={`text-lg font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Your shelf is empty</p>
          <p className={`text-sm mt-1 mb-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Tap the ❤️ on any book to save it here for later.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/books")}
            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg"
          >
            Browse Books
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {wishlist.map((book, index) => (
              <motion.div
                key={book._id}
                layout
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover="hover"
                onClick={() => router.push(`/books/${book._id}`)}
                className="group cursor-pointer relative w-full justify-self-center rounded-2xl bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 p-0.5 transition-all duration-300 preserve-3d flex flex-col"
              >
                <div className={`rounded-2xl p-4 backdrop-blur-md flex-1 flex flex-col relative overflow-hidden ${
                  isDark ? "bg-slate-900/90" : "bg-white/90"
                }`}>
                  {/* Remove heart button */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleRemove(book._id, e)}
                    disabled={removingId === book._id}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md text-rose-500 backdrop-blur-sm"
                    title="Remove from shelf"
                  >
                    <span className="text-sm">{removingId === book._id ? "…" : "❤️"}</span>
                  </motion.button>

                  <div className="flex items-stretch gap-4 h-full">
                    <motion.div
                      className="flex w-28 shrink-0 flex-col items-center gap-2"
                      variants={{ hover: { scale: 1.05 } }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="h-40 w-full rounded-[12px] bg-slate-100 overflow-hidden relative shadow-md">
                        {book.coverImage ? (
                          <motion.img
                            src={
                              book.coverImage.startsWith("http")
                                ? book.coverImage
                                : `${API_BASE}${book.coverImage}`
                            }
                            alt={book.title}
                            className="h-full w-full rounded-[12px] object-cover"
                            variants={{ hover: { scale: 1.15 } }}
                            transition={{ duration: 0.3 }}
                          />
                        ) : (
                          <motion.div
                            className="flex h-full w-full items-center justify-center rounded-[12px] text-4xl text-slate-400"
                            variants={{ hover: { scale: 1.15 } }}
                            transition={{ duration: 0.3 }}
                          >
                            📚
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    <div className="flex-1 text-left flex flex-col pt-1 h-full min-h-[11rem]">
                      <h3 className={`text-lg font-bold leading-tight line-clamp-2 ${isDark ? "text-white" : "text-slate-900"}`}>{book.title}</h3>
                      <p className={`text-sm mt-1 mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{book.author}</p>
                      
                      {/* Details Area */}
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                            🏷️ {book.category || "Uncategorized"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-2 h-2 rounded-full ${book.available > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`}></div>
                          <span className={`text-[11px] font-semibold ${book.available > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {book.available > 0 ? `${book.available} Copies Available` : "Currently Unavailable"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Borrow button */}
                      {user?.role === "student" && (
                        <div className="mt-auto flex flex-col gap-2">
                          <motion.button
                            whileHover={book.available > 0 ? { scale: 1.03, backgroundColor: "#0f766e" } : {}}
                            whileTap={book.available > 0 ? { scale: 0.95 } : {}}
                            onClick={(e) => handleBorrow(book._id, e)}
                            disabled={book.available <= 0}
                            className={`w-full rounded-full py-2.5 text-xs font-semibold transition-all shadow-sm ${
                              book.available > 0
                                ? "bg-teal-600 text-white"
                                : isDark ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {book.available > 0 ? "📖 Request to Borrow" : "📭 Not Available"}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </AppLayout>
  );
}
