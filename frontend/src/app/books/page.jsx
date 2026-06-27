"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { exportToCsv } from "@/utils/exportUtils";

const emptyForm = {
  title: "",
  author: "",
  category: "",
  isbn: "",
  quantity: 1,
  description: "",
  cover: null,
};

export default function BooksPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [page] = useState(1);
  const [, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const cardRefs = useRef([]);
  const [authorLookupLoading, setAuthorLookupLoading] = useState(false);
  const [isFetchingBook, setIsFetchingBook] = useState(false);

  const canManage = user?.role === "admin" || user?.role === "librarian";
  const isLibrarian = user?.role === "librarian";
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const fetchBooks = useCallback(async () => {
    const params = { page, limit: 1000, search, category, availability };
    if (user?.role === "librarian") {
      params.workspaceOnly = "true";
    }
    const { data } = await api.get("/books", { params });
    setItems(data.items);
    setPages(data.pages);
  }, [page, search, category, availability, user?.role]);

  useEffect(() => {
    if (!user) return;
    fetchBooks();
  }, [user, search, category, availability, fetchBooks]);

  useEffect(() => {
    if (!user) return;
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

  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const categoryOptions = useMemo(() => {
    const set = new Set([...(categories || []), ...items.map((item) => item.category)]);
    return Array.from(set).filter(Boolean).sort();
  }, [categories, items]);

  // ===================== AUTO-FETCH FUNCTIONS =====================

  // ✅ Generate Dummy ISBN
  const generateISBN = () => {
    let isbn = "978";
    for (let i = 0; i < 9; i++) {
      isbn += Math.floor(Math.random() * 10);
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return isbn + checkDigit;
  };

  // ✅ OpenLibrary API Fetch (Works in India)
  const fetchBookDetails = async (title) => {
    if (!title || title.length < 2) return;

    setIsFetchingBook(true);
    try {
      const query = encodeURIComponent(title);
      const response = await fetch(
        `https://openlibrary.org/search.json?title=${query}&limit=3`
      );
      const data = await response.json();

      if (data.docs && data.docs.length > 0) {
        const bestMatch = data.docs[0];
        const fetchedAuthor = bestMatch.author_name?.join(", ") || "";
        const fetchedIsbn = bestMatch.isbn?.[0] || generateISBN();
        const fetchedCategory = bestMatch.subject?.[0] || "";
        let fetchedDescription = "";

        // Fetch description if work key exists
        if (bestMatch.key) {
          try {
            const workRes = await fetch(`https://openlibrary.org${bestMatch.key}.json`);
            if (workRes.ok) {
              const workData = await workRes.json();
              const descObj = workData.description;
              if (descObj) {
                const rawDesc = typeof descObj === "string" ? descObj : descObj.value || "";
                // Strip markdown links and HTML tags
                fetchedDescription = rawDesc
                  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
                  .replace(/<[^>]*>/g, "");
              }
            }
          } catch (descError) {
            console.error("OpenLibrary Description Fetch Error:", descError);
          }
        }

        // Fallback local description if not found
        if (!fetchedDescription) {
          const authorText = fetchedAuthor ? ` by ${fetchedAuthor}` : "";
          const categoryText = fetchedCategory ? ` in the ${fetchedCategory} genre` : "";
          fetchedDescription = `${title}${authorText}${categoryText} offers an engaging storyline and a memorable reading experience. Readers will find a balanced mix of character depth and plot momentum, making it a solid pick for both casual and dedicated readers.`;
        }

        setForm((prev) => ({
          ...prev,
          author: fetchedAuthor || prev.author,
          isbn: fetchedIsbn,
          category: fetchedCategory || prev.category,
          description: fetchedDescription || prev.description,
        }));

        if (bestMatch.isbn?.[0] && fetchedCategory) {
          toast.success("📚 Book details fetched successfully!");
        } else if (bestMatch.isbn?.[0] && !fetchedCategory) {
          toast.success("✅ ISBN found! Please select category manually.");
        } else if (!bestMatch.isbn?.[0] && fetchedCategory) {
          toast.success("✅ Category found! ISBN generated automatically.");
        } else {
          toast.success("📚 Basic details fetched. Please fill missing fields.");
        }
      } else {
        const dummyIsbn = generateISBN();
        setForm((prev) => ({
          ...prev,
          isbn: dummyIsbn,
        }));
        toast.warning("📚 Book not found on OpenLibrary. ISBN generated automatically.");
      }
    } catch (error) {
      console.error("OpenLibrary API Error:", error);
      const dummyIsbn = generateISBN();
      setForm((prev) => ({
        ...prev,
        isbn: dummyIsbn,
      }));
      toast.error("⚠️ Could not fetch book details. ISBN generated automatically.");
    } finally {
      setIsFetchingBook(false);
    }
  };

  // ✅ Title Change Handler (with debounce)
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, title: value }));

    if (window.titleTimeout) clearTimeout(window.titleTimeout);

    if (value.length >= 2) {
      window.titleTimeout = setTimeout(() => {
        fetchBookDetails(value);
      }, 600);
    }
  };

  // ===================== END AUTO-FETCH =====================

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (book) => {
    if (user?.role === "librarian" && book.isGlobal === true) {
      toast.error(
        "❌ You cannot edit admin catalog books. Copy the book to your workspace first, or create your own book."
      );
      return;
    }
    setEditingId(book._id);
    setForm({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      quantity: book.quantity,
      description: book.description || "",
      cover: null,
    });
    setModalOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          payload.append(key, value);
        }
      });

      if (editingId) {
        await api.put(`/books/${editingId}`, payload);
        toast.success("Book updated");
      } else {
        await api.post("/books", payload);
        toast.success("Book added");
      }

      setModalOpen(false);
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (book) => {
    if (user?.role === "librarian" && book.isGlobal === true) {
      toast.error(
        "❌ You cannot delete admin catalog books. You can only delete books you added to your workspace."
      );
      return;
    }
    if (!confirm(`Delete "${book.title}" from your workspace?`)) return;
    try {
      await api.delete(`/books/${book._id}`);
      toast.success(`"${book.title}" deleted from your workspace`);
      fetchBooks();
    } catch (error) {
      const message = error.response?.data?.message || "Delete failed";
      toast.error(message);
    }
  };

  const handleCopyToWorkspace = async (book) => {
    if (!isLibrarian) return;

    try {
      const response = await api.post(`/books/${book._id}/copy-to-workspace`);
      toast.success(`"${book.title}" copied to your workspace. You can now edit it.`);
      fetchBooks();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to copy book";
      toast.error(message);
    }
  };

  const handleExport = () => {
    exportToCsv(
      items.map((book) => ({
        title: book.title,
        author: book.author,
        category: book.category,
        isbn: book.isbn,
        quantity: book.quantity,
        available: book.available,
      })),
      "books.csv"
    );
  };

  const handleGenerateAuthor = async () => {
    const title = form.title?.trim();
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }
    setAuthorLookupLoading(true);
    try {
      const { data } = await api.get("/books/lookup-author", { params: { title } });
      if (data?.author) {
        setForm((prev) => ({ ...prev, author: data.author }));
        toast.success("Author auto-filled");
      } else {
        toast.error("Author not found. Please enter manually.");
      }
    } catch (error) {
      toast.error("Unable to fetch author right now");
    } finally {
      setAuthorLookupLoading(false);
    }
  };

  const handleGenerateDescription = () => {
    const title = form.title?.trim() || "This book";
    const author = form.author?.trim();
    const categoryLabel = form.category?.trim();
    const authorText = author ? ` by ${author}` : "";
    const categoryText = categoryLabel ? ` in the ${categoryLabel} genre` : "";
    const generated = `${title}${authorText}${categoryText} offers an engaging storyline and a memorable reading experience. Readers will find a balanced mix of character depth and plot momentum, making it a solid pick for both casual and dedicated readers.`;
    setForm((prev) => ({ ...prev, description: generated }));
  };

  const handleAutoGenerateAll = async () => {
    const title = form.title?.trim();
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }
    setAuthorLookupLoading(true);
    try {
      const { data } = await api.get("/books/lookup-author", { params: { title } });
      const fetchedAuthor = data?.author || "";
      const categoryLabel = form.category?.trim();
      const categoryText = categoryLabel ? ` in the ${categoryLabel} genre` : "";

      if (fetchedAuthor) {
        const generated = `${title} by ${fetchedAuthor}${categoryText} offers an engaging storyline and a memorable reading experience. Readers will find a balanced mix of character depth and plot momentum, making it a solid pick for both casual and dedicated readers.`;
        setForm((prev) => ({ ...prev, author: fetchedAuthor, description: generated }));
        toast.success("Author & description auto-generated");
      } else {
        const generated = `${title}${categoryText} offers an engaging storyline and a memorable reading experience. Readers will find a balanced mix of character depth and plot momentum, making it a solid pick for both casual and dedicated readers.`;
        setForm((prev) => ({ ...prev, description: generated }));
        toast.error("Author not found, but description generated.");
      }
    } catch (error) {
      toast.error("Unable to auto-generate right now");
    } finally {
      setAuthorLookupLoading(false);
    }
  };

  return (
    <AppLayout title="Books">
      {/* ── Premium Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative mb-8 overflow-hidden rounded-3xl p-8 shadow-lg transition-colors duration-300 ${isDark
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
              Collection
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-3xl font-bold text-white"
            >
              Books Catalog
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-2 text-sm text-white/55"
            >
              Search, filter, and maintain your collection.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all"
            >
              📄 Export CSV
            </motion.button>
            {canManage ? (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(13,148,136,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreate}
                className="rounded-full bg-linear-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-teal-600/25 transition-all"
              >
                ✨ Add Book
              </motion.button>
            ) : null}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Glassmorphic Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`rounded-2xl p-5 mb-6 transition-colors duration-300 ${isDark
          ? "bg-slate-800/60 border border-slate-700/40 backdrop-blur-xl"
          : "bg-white/70 border border-slate-200/60 backdrop-blur-xl shadow-lg shadow-slate-200/40"
          }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Search input */}
          <div className="relative w-full md:w-80">
            <span
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-slate-500" : "text-slate-400"
                }`}
            >
              🔍
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, author, ISBN…"
              className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 ${isDark
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
                  className={`absolute z-20 mt-2 w-full rounded-xl border p-2 shadow-xl ${isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
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
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${isDark
                        ? "text-slate-300 hover:bg-slate-700"
                        : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <span className="font-medium">{item.title}</span>
                      <span
                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
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
            className={`w-full md:w-auto rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${isDark
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
            className={`w-full md:w-auto rounded-xl py-3 px-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${isDark
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
            className={`ml-auto rounded-full px-3 py-1.5 text-xs font-bold ${isDark
              ? "bg-teal-500/15 text-teal-400"
              : "bg-teal-50 text-teal-700"
              }`}
          >
            {items.length} book{items.length !== 1 ? "s" : ""}
          </motion.span>
        </div>
      </motion.div>

      <div className="mt-6 grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((book, index) => (
          <motion.div
            key={book._id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            initial={{ opacity: 0, y: 50, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            style={{ animationDelay: `${index * 60}ms` }}
            whileHover="hover"
            className="group relative w-full max-w-85 justify-self-center rounded-2xl bg-linear-to-r from-blue-500 via-teal-500 to-green-500 p-0.5 transition-all duration-300 preserve-3d flex flex-col"
          >
            <div className="rounded-2xl bg-white/80 p-4 backdrop-blur-md text-red-600 flex-1 flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <motion.div
                  className="flex w-35 shrink-0 flex-col items-center gap-2"
                  variants={{
                    hover: { scale: 1.05 }
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="h-45 w-35 rounded-[15px] bg-slate-100 overflow-hidden">
                    {book.coverImage ? (
                      <motion.img
                        src={`${(
                          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
                        ).replace("/api", "")}${book.coverImage}`}
                        alt={book.title}
                        className="h-full w-full rounded-[15px] object-cover"
                        variants={{
                          hover: { scale: 1.15 }
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <motion.div 
                        className="flex h-full w-full items-center justify-center rounded-[15px] text-xs text-slate-400"
                        variants={{
                          hover: { scale: 1.15 }
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        No cover
                      </motion.div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-500">{book.category}</p>

                  {book.isGlobal && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                    >
                      📚 Admin Catalog
                    </motion.span>
                  )}
                  {!book.isGlobal && book.workspaceId === user?._id && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                    >
                      ✏️ Your Workspace
                    </motion.span>
                  )}
                </motion.div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-slate-900">{book.title}</h3>
                  <p className="text-sm text-slate-500">{book.author}</p>
                  <p className="mt-2 text-sm text-slate-600">ISBN {book.isbn}</p>
                  <p className="text-sm text-slate-600">
                    Available: {book.available} · Total: {book.quantity}
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05, backgroundColor: "#0f766e" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(`/books/${book._id}`)}
                      className="w-fit rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition"
                    >
                      Details
                    </motion.button>

                    {user?.role === "librarian" && book.isGlobal === true && (
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopyToWorkspace(book)}
                        className="w-fit rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition"
                      >
                        📋 Copy to Workspace
                      </motion.button>
                    )}

                    {user?.role === "admin" && (
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openEdit(book)}
                          className="rounded-full border border-sky-200 bg-sky-100 px-4 py-2 text-xs font-semibold text-sky-700 transition"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: "#ea580c" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(book)}
                          className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition"
                        >
                          Delete
                        </motion.button>
                      </div>
                    )}

                    {user?.role === "librarian" &&
                      (book.isGlobal === false || book.workspaceId === user?._id) && (
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openEdit(book)}
                            className="rounded-full border border-sky-200 bg-sky-100 px-4 py-2 text-xs font-semibold text-sky-700 transition"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "#ea580c" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(book)}
                            className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition"
                          >
                            Delete
                          </motion.button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* UPGRADED MODAL WITH 3D ANIMATIONS & AUTO-FETCH */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateX: -30, y: 50 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateX: -30, y: 50 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.4,
              }}
              className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col min-h-0"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 p-[3px] shadow-2xl flex flex-col flex-1 min-h-0">
                <div className={`relative rounded-[13px] transition-colors duration-300 flex flex-col flex-1 overflow-hidden min-h-0 ${isDark ? "bg-slate-900 border border-slate-800" : "bg-linear-to-br from-white to-slate-50"
                  }`}>
                  {/* Header */}
                  <div className={`flex items-center justify-between border-b px-5 py-4 shrink-0 ${isDark ? "border-slate-800" : "border-slate-100"
                    }`}>
                    <motion.h2
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center gap-2 text-lg font-bold bg-linear-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent"
                    >
                      <span className="text-xl">✨</span>
                      {editingId ? "Edit Book" : "Add New Book"}
                    </motion.h2>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setModalOpen(false)}
                      className={`transition ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSave} className="px-5 py-4 overflow-y-auto flex-1 text-slate-850">
                    <div className="grid gap-3 md:grid-cols-2">
                      {/* ===== TITLE WITH AUTO-FETCH ===== */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.05 }}
                        className="md:col-span-2"
                      >
                        <label className={`mb-0.5 block text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          📖 TITLE
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <input
                            required
                            value={form.title}
                            onChange={handleTitleChange}
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100/20 transition-all ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                              }`}
                            placeholder="Enter book title (auto-fetches details)"
                          />
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAutoGenerateAll}
                            disabled={authorLookupLoading || isFetchingBook}
                            className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-semibold disabled:opacity-50 transition-all w-full sm:w-auto text-center ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            {authorLookupLoading || isFetchingBook
                              ? "⏳ Generating..."
                              : "🪄 Auto Generate"}
                          </motion.button>
                        </div>
                        <p className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          💡 Type title, wait 2 seconds — ISBN & Category auto-fill!
                        </p>
                      </motion.div>

                      {/* ===== AUTHOR ===== */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className={`mb-0.5 block text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          ✍️ AUTHOR
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <input
                            required
                            value={form.author}
                            onChange={(event) =>
                              setForm({ ...form, author: event.target.value })
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100/20 transition-all ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                              }`}
                            placeholder="Author name"
                          />
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGenerateAuthor}
                            disabled={authorLookupLoading}
                            className={`shrink-0 rounded-full border px-2.5 py-2 text-[11px] font-semibold disabled:opacity-50 transition-all w-full sm:w-auto text-center ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            {authorLookupLoading ? "⏳" : "⚡ Auto"}
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* ===== CATEGORY ===== */}
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className={`mb-0.5 block text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          🏷️ CATEGORY
                        </label>
                        <input
                          required
                          list="category-options"
                          value={form.category}
                          onChange={(event) =>
                            setForm({ ...form, category: event.target.value })
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100/20 transition-all ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                            }`}
                          placeholder="Select category"
                        />
                        <datalist id="category-options">
                          {categoryOptions.map((item) => (
                            <option key={item} value={item} />
                          ))}
                        </datalist>
                      </motion.div>

                      {/* ===== ISBN WITH GENERATE BUTTON ===== */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        <label className={`mb-0.5 block text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          📚 ISBN
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <input
                            required
                            value={form.isbn}
                            onChange={(event) =>
                              setForm({ ...form, isbn: event.target.value })
                            }
                            className={`w-full flex-1 rounded-xl border px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100/20 transition-all ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                              }`}
                            placeholder={isFetchingBook ? "Fetching ISBN..." : "Auto-generated or manual"}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const isbn = generateISBN();
                              setForm((prev) => ({ ...prev, isbn }));
                              toast.success("📖 ISBN generated!");
                            }}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold transition w-full sm:w-auto text-center ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              }`}
                          >
                            Generate
                          </button>
                        </div>
                      </motion.div>

                      {/* ===== QUANTITY ===== */}
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        <label className={`mb-0.5 block text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          🔢 QUANTITY
                        </label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={form.quantity}
                          onChange={(event) =>
                            setForm({ ...form, quantity: event.target.value })
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100/20 transition-all ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                            }`}
                          placeholder="Number of copies"
                        />
                      </motion.div>

                      {/* ===== COVER IMAGE ===== */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <label className={`mb-0.5 block text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          🖼️ COVER IMAGE
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            setForm({ ...form, cover: event.target.files[0] })
                          }
                          className={`w-full rounded-xl border px-3 py-1.5 text-sm file:mr-2 file:rounded-full file:border-0 file:px-3 file:py-1 file:text-xs file:font-semibold transition-all ${isDark
                              ? "border-slate-700 text-slate-300 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                              : "border-slate-200 text-slate-800 file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                            }`}
                        />
                      </motion.div>

                      {/* ===== DESCRIPTION ===== */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="md:col-span-2"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <label className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            📝 DESCRIPTION
                          </label>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGenerateDescription}
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            ✨ Generate
                          </motion.button>
                        </div>
                        <textarea
                          value={form.description}
                          onChange={(event) =>
                            setForm({ ...form, description: event.target.value })
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100/20 transition-all ${isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                            }`}
                          placeholder="Book description"
                          rows={3}
                        />
                      </motion.div>

                      {/* ===== SUBMIT BUTTON ===== */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-2 mt-2"
                      >
                        <motion.button
                          type="submit"
                          whileHover={{
                            scale: 1.02,
                            boxShadow: "0 10px 30px -10px rgba(13, 148, 136, 0.5)",
                          }}
                          whileTap={{ scale: 0.98 }}
                          className="relative w-full overflow-hidden rounded-full bg-linear-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-all"
                        >
                          <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent"
                          />
                          {editingId ? "🔄 Update Book" : "✨ Create Book"}
                        </motion.button>
                      </motion.div>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}