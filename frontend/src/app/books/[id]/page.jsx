"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AppLayout from "@/components/layout/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

function CoverImage({ src, alt, className = "" }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-teal-100 to-slate-200 text-4xl ${className}`}>
        📚
      </div>
    );
  }
  return <img src={src.startsWith("http") ? src : `${API_BASE}${src}`} alt={alt} className={`object-cover ${className}`} />;
}

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [borrowStatus, setBorrowStatus] = useState(null); // null | 'requested' | 'issued'
  const [borrowLoading, setBorrowLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Load book details + wishlist state + active transaction
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        // Use allSettled so a failed wishlist/transaction request doesn't crash the page
        const [bookResult, wishlistResult, txResult] = await Promise.allSettled([
          api.get(`/books/${params.id}`),
          api.get("/wishlist"),
          api.get("/transactions", { params: { status: "requested", userId: user._id, limit: 100 } }),
        ]);

        // Book is required — surface a real error if it fails
        if (bookResult.status === "rejected") {
          console.error("Failed to load book:", bookResult.reason?.response?.data?.message);
          return;
        }
        setBook(bookResult.value.data.book);

        // Wishlist is optional
        if (wishlistResult.status === "fulfilled") {
          const wl = wishlistResult.value.data.wishlist || [];
          setWishlisted(wl.some((b) => (b._id || b) === params.id || (b._id || b).toString() === params.id));
        }

        // Check if this book already has an active request/issue
        try {
          const issuedRes = await api.get("/transactions", { params: { status: "issued", limit: 100 } });
          const requestedItems = txResult.status === "fulfilled" ? (txResult.value.data.items || []) : [];
          const allTx = [...requestedItems, ...(issuedRes.data.items || [])];
          const myTx = allTx.find((t) => t.bookId?._id === params.id && t.userId?._id === user._id);
          if (myTx) setBorrowStatus(myTx.status);
        } catch {
          // ignore — borrow status is non-critical
        }
      } catch (err) {
        console.error("Unexpected error loading book details:", err);
      }
    };
    load();
  }, [user, params.id]);

  // Related books
  useEffect(() => {
    if (!user || !book?.category) return;
    api.get("/books", { params: { category: book.category, limit: 6 } }).then(({ data }) => {
      setRelated((data.items || []).filter((i) => i._id !== book._id));
    });
  }, [user, book]);

  const handleToggleWishlist = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      const { data } = await api.post(`/wishlist/${params.id}`);
      setWishlisted(data.added);
      toast(data.added ? "❤️ Added to My Shelf!" : "💔 Removed from My Shelf", {
        style: { fontWeight: 600 },
      });
    } catch {
      toast.error("Failed to update shelf");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (borrowLoading || borrowStatus) return;
    setBorrowLoading(true);
    try {
      await api.post("/transactions/request", { bookId: params.id });
      setBorrowStatus("requested");
      toast.success("📬 Borrow request sent! A librarian will approve it soon.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    } finally {
      setBorrowLoading(false);
    }
  };

  if (!book) {
    return (
      <AppLayout title="Book details">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-3 animate-pulse">📚</div>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading book details…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const borrowButtonContent = () => {
    if (borrowStatus === "issued") return { label: "📗 Already Issued", disabled: true, cls: "from-emerald-500 to-emerald-600" };
    if (borrowStatus === "requested") return { label: "⏳ Request Pending", disabled: true, cls: "from-amber-500 to-amber-600" };
    if (book.available <= 0) return { label: "📭 Not Available", disabled: true, cls: "from-slate-400 to-slate-500" };
    if (borrowLoading) return { label: "Sending…", disabled: true, cls: "from-teal-500 to-teal-600" };
    return { label: "📖 Request to Borrow", disabled: false, cls: "from-teal-500 to-teal-600" };
  };

  const btn = borrowButtonContent();

  return (
    <AppLayout title="Book details">

      {/* ── Main Card with animated spinning border ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 p-[3px] shadow-2xl"
      >

        {/* Inner card */}
        <div className={`relative rounded-[22px] overflow-hidden transition-colors duration-300 ${
          isDark ? "bg-slate-800/90" : "bg-white"
        }`}>
        <div className="flex flex-col md:flex-row">

          {/* Cover panel */}
          <div className={`flex-shrink-0 md:w-72 flex items-center justify-center p-8 ${
            isDark ? "bg-slate-900/60" : "bg-gradient-to-br from-slate-50 to-slate-100"
          }`}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="relative w-44 h-64 rounded-2xl overflow-hidden shadow-2xl"
            >
              <CoverImage src={book.coverImage} alt={book.title} className="w-full h-full" />
              {/* Availability ribbon */}
              <div className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold shadow ${
                book.available > 0
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white"
              }`}>
                {book.available > 0 ? `${book.available} left` : "Unavailable"}
              </div>
            </motion.div>
          </div>

          {/* Info panel */}
          <div className="flex-1 p-8 flex flex-col gap-5">
            {/* Title + Wishlist row */}
            <div className="flex items-start justify-between gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.3em] mb-1 ${isDark ? "text-teal-400/70" : "text-teal-600/70"}`}>
                  {book.category}
                </p>
                <h1 className={`text-3xl font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  {book.title}
                </h1>
                <p className={`mt-1 text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  by {book.author}
                </p>
              </motion.div>

              {/* Heart / Wishlist button */}
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  wishlisted
                    ? "border-red-400 bg-red-50 text-red-500 shadow-md shadow-red-200/50"
                    : isDark
                    ? "border-slate-600 bg-slate-700 text-slate-400 hover:border-red-400 hover:text-red-400"
                    : "border-slate-200 bg-white text-slate-400 hover:border-red-400 hover:text-red-400"
                }`}
                title={wishlisted ? "Remove from My Shelf" : "Add to My Shelf"}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wishlisted ? "filled" : "empty"}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl leading-none"
                  >
                    {wishlisted ? "❤️" : "🤍"}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Metadata chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2"
            >
              {[
                { label: "ISBN", value: book.isbn },
                { label: "Available", value: `${book.available} / ${book.quantity}` },
              ].map(({ label, value }) => (
                <span
                  key={label}
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    isDark
                      ? "bg-slate-700/60 border-slate-600 text-slate-300"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span className={`font-bold mr-1 ${isDark ? "text-slate-400" : "text-slate-400"}`}>{label}:</span>
                  {value}
                </span>
              ))}
            </motion.div>

            {/* Description */}
            {book.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className={`text-sm leading-relaxed line-clamp-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {book.description}
              </motion.p>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3 mt-auto pt-2"
            >
              {/* Borrow button — only for students */}
              {user?.role === "student" && (
                <motion.button
                  whileHover={!btn.disabled ? { scale: 1.04, boxShadow: "0 8px 30px rgba(13,148,136,0.35)" } : {}}
                  whileTap={!btn.disabled ? { scale: 0.97 } : {}}
                  onClick={handleBorrow}
                  disabled={btn.disabled}
                  className={`rounded-full bg-gradient-to-r ${btn.cls} px-6 py-3 text-sm font-semibold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-80`}
                >
                  {btn.label}
                </motion.button>
              )}

              {/* Wishlist toggle — for students */}
              {user?.role === "student" && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className={`rounded-full border px-6 py-3 text-sm font-semibold transition-all ${
                    wishlisted
                      ? isDark ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-red-300 bg-red-50 text-red-600"
                      : isDark ? "border-slate-600 text-slate-300 hover:border-red-400 hover:text-red-400" : "border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-500"
                  }`}
                >
                  {wishlisted ? "❤️ In My Shelf" : "🤍 Add to My Shelf"}
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.back()}
                className={`rounded-full border px-6 py-3 text-sm font-semibold transition-all ${
                  isDark
                    ? "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                ← Back
              </motion.button>
            </motion.div>
          </div>
        </div>
        </div>
      </motion.div>

      {/* ── Related Books ── */}
      {related.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <div className="flex items-baseline gap-3 mb-5">
            <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Related Books</h3>
            <span className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>{book.category}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + index * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`rounded-2xl border p-4 shadow-lg cursor-pointer transition-colors duration-300 ${
                  isDark
                    ? "bg-slate-800/90 border-slate-700/50"
                    : "bg-white border-slate-200"
                }`}
                onClick={() => router.push(`/books/${item._id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="h-20 w-14 shrink-0 rounded-xl overflow-hidden">
                    <CoverImage src={item.coverImage} alt={item.title} className="w-full h-full" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold line-clamp-2 ${isDark ? "text-white" : "text-slate-900"}`}>{item.title}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.author}</p>
                    <p className={`text-xs mt-2 line-clamp-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {item.description || "No description"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AppLayout>
  );
}
