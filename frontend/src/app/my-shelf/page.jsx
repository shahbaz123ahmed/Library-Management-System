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
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.4)" : "0 12px 40px rgba(15,23,42,0.12)" }}
                onClick={() => router.push(`/books/${book._id}`)}
                className={`relative cursor-pointer rounded-2xl border overflow-hidden transition-colors duration-300 ${
                  isDark
                    ? "bg-slate-800/60 border-slate-700/50"
                    : "bg-white border-slate-200/80 shadow-sm"
                }`}
              >
                {/* Cover */}
                <div className={`relative h-40 overflow-hidden ${isDark ? "bg-slate-900/60" : "bg-gradient-to-br from-slate-50 to-slate-100"}`}>
                  {book.coverImage ? (
                    <img
                      src={`${API_BASE}${book.coverImage}`}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
                  )}
                  {/* Remove heart button */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleRemove(book._id, e)}
                    disabled={removingId === book._id}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md text-rose-500 backdrop-blur-sm"
                    title="Remove from shelf"
                  >
                    <span className="text-sm">{removingId === book._id ? "…" : "❤️"}</span>
                  </motion.button>
                  {/* Availability badge */}
                  <div className={`absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    book.available > 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  }`}>
                    {book.available > 0 ? `${book.available} available` : "Unavailable"}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className={`text-sm font-semibold line-clamp-1 ${isDark ? "text-white" : "text-slate-900"}`}>{book.title}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{book.author}</p>
                  <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{book.category}</p>

                  {/* Borrow button */}
                  {user?.role === "student" && (
                    <motion.button
                      whileHover={book.available > 0 ? { scale: 1.03 } : {}}
                      whileTap={book.available > 0 ? { scale: 0.97 } : {}}
                      onClick={(e) => handleBorrow(book._id, e)}
                      disabled={book.available <= 0}
                      className={`mt-3 w-full rounded-full py-2 text-xs font-semibold transition-all ${
                        book.available > 0
                          ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm"
                          : isDark ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {book.available > 0 ? "📖 Request to Borrow" : "📭 Not Available"}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </AppLayout>
  );
}
