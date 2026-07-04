"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function AdminCatalogPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [categories, setCategories] = useState([]);

  const isLibrarian = user?.role === "librarian";
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role !== "librarian") {
      // Admin Catalog page is only intended for Librarians
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  const fetchBooks = useCallback(async () => {
    try {
      const { data } = await api.get("/books", {
        params: { page, limit: 12, search, category, availability, globalOnly: "true" },
      });
      setItems(data.items);
      setPages(data.pages);
    } catch (error) {
      toast.error("Failed to fetch books catalog");
    }
  }, [page, search, category, availability]);

  useEffect(() => {
    if (!user || user.role !== "librarian") return;
    fetchBooks();
  }, [user, page, search, category, availability, fetchBooks]);

  useEffect(() => {
    if (!user || user.role !== "librarian") return;
    const loadCategories = async () => {
      try {
        const { data } = await api.get("/books/categories");
        setCategories(data.items || []);
      } catch (error) {
        setCategories([]);
      }
    };
    loadCategories();
  }, [user]);

  useEffect(() => {
    if (!user || !search) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await api.get("/books/suggest", { params: { q: search } });
      setSuggestions(data.items || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [user, search]);

  const categoryOptions = useMemo(() => {
    const set = new Set([...(categories || []), ...items.map((item) => item.category)]);
    return Array.from(set).filter(Boolean).sort();
  }, [categories, items]);

  const handleCopyToWorkspace = async (book) => {
    if (!isLibrarian) return;

    try {
      const response = await api.post(`/books/${book._id}/request-workspace`);
      toast.success(response.data.message || `Request to copy "${book.title}" submitted to Admin!`);
      fetchBooks();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit request";
      toast.error(message);
    }
  };

  const handleAlreadyCopied = (book) => {
    toast.error(`Already added "${book.title}" to your workspace`);
  };

  if (loading || !user || user.role !== "librarian") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <AppLayout title="Admin Catalog">
      {/* ── Premium Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative mb-8 overflow-hidden rounded-3xl p-8 shadow-lg transition-colors duration-300 ${
          isDark
            ? "bg-linear-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700/50"
            : "bg-linear-to-r from-blue-600 via-teal-600 to-green-600"
        }`}
      >
        {/* Decorative floating orbs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-teal-400/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-purple-400/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-teal-300/70"
            >
              Master Catalog
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-3xl font-bold text-white"
            >
              Admin Book Catalog
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-2 text-sm text-white/55"
            >
              Browse master books added by Admin and copy them to your personal workspace.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Glassmorphic Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`rounded-2xl p-5 mb-6 transition-colors duration-300 ${
          isDark
            ? "bg-slate-800/60 border border-slate-700/40 backdrop-blur-xl"
            : "bg-white/70 border border-slate-200/60 backdrop-blur-xl shadow-lg shadow-slate-200/40"
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Search input */}
          <div className="relative w-full md:w-80">
            <span
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              🔍
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search master catalog..."
              className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 ${
                isDark
                  ? "bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
                  : "bg-white border border-slate-200 text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
            <AnimatePresence>
              {suggestions.length ? (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute z-20 mt-2 w-full rounded-xl border p-2 shadow-xl ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                  }`}
                >
                  {suggestions.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        setSearch(item.title);
                        setSuggestions([]);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isDark ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-medium">{item.title}</span>
                      <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {item.author}
                      </span>
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Category filter */}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={`w-full md:w-auto rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${
              isDark
                ? "bg-slate-900/60 border border-slate-700 text-slate-300"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <option value="">📂 All categories</option>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* Availability filter */}
          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            className={`w-full md:w-auto rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${
              isDark
                ? "bg-slate-900/60 border border-slate-700 text-slate-300"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            <option value="">📊 Availability</option>
            <option value="available">✅ Available</option>
          </select>

          {/* Result count pill */}
          <motion.span
            key={items.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`ml-auto rounded-full px-3 py-1.5 text-xs font-bold ${
              isDark ? "bg-teal-500/15 text-teal-400" : "bg-teal-50 text-teal-700"
            }`}
          >
            {items.length} book{items.length !== 1 ? "s" : ""}
          </motion.span>
        </div>
      </motion.div>

      {/* ── Book Cards Grid ── */}
      <div className="mt-6 grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((book, index) => (
          <motion.div
            key={book._id}
            initial={{ opacity: 0, y: 50, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            style={{ animationDelay: `${index * 60}ms` }}
            whileHover="hover"
            className="group relative w-full max-w-85 justify-self-center rounded-2xl bg-linear-to-r from-blue-500 via-teal-500 to-green-500 p-0.5 transition-all duration-300 preserve-3d flex flex-col"
          >
            <div className="rounded-2xl bg-white/80 p-4 backdrop-blur-md flex-1 flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <motion.div
                  className="flex w-35 shrink-0 flex-col items-center gap-2"
                  variants={{
                    hover: { scale: 1.05 },
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="h-45 w-35 rounded-[15px] bg-slate-100 overflow-hidden">
                    {book.coverImage ? (
                      <motion.img
                        src={
                          book.coverImage.startsWith("http")
                            ? book.coverImage
                            : `${(
                                process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
                              ).replace("/api", "")}${book.coverImage}`
                        }
                        alt={book.title}
                        className="h-full w-full rounded-[15px] object-cover"
                        variants={{
                          hover: { scale: 1.15 },
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <motion.div
                        className="flex h-full w-full items-center justify-center rounded-[15px] text-xs text-slate-400"
                        variants={{
                          hover: { scale: 1.15 },
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        No cover
                      </motion.div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-500">{book.category}</p>

                  <span className="mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    📚 Admin Catalog
                  </span>
                </motion.div>
                <div className="flex-1 text-left flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{book.title}</h3>
                    <p className="text-sm text-slate-500">{book.author}</p>
                    <p className="mt-2 text-sm text-slate-600">ISBN {book.isbn}</p>
                    <p className="text-sm text-slate-600">
                      Available: {book.available} · Total: {book.quantity}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    {book.isAlreadyCopied ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAlreadyCopied(book)}
                        className="w-full rounded-full border border-teal-200 bg-teal-50 py-2.5 text-xs font-bold text-teal-700 transition flex items-center justify-center gap-1.5"
                      >
                        ✓ Added to Workspace
                      </motion.button>
                    ) : book.workspaceRequestStatus === "pending" ? (
                      <motion.button
                        disabled
                        className="w-full rounded-full border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-700 transition flex items-center justify-center gap-1.5 opacity-75 cursor-not-allowed"
                      >
                        ⌛ Request Pending
                      </motion.button>
                    ) : book.workspaceRequestStatus === "rejected" ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-center text-red-500 font-semibold">Request Rejected by Admin</span>
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: "#0f766e" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopyToWorkspace(book)}
                          className="w-full rounded-full bg-teal-600 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                        >
                          📋 Try Request Again
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "#0f766e" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopyToWorkspace(book)}
                        className="w-full rounded-full bg-teal-600 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                      >
                        📋 Add to Workspace
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination controls */}
      {pages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                p === page
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
