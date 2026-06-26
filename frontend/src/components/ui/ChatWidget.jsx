"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const IMAGE_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

const QUICK_ACTIONS = [
  "🔥 Popular Books",
  "🔍 Search by Title",
  "✍️ Search by Author",
  "🔢 Search by ISBN",
  "📂 Browse Categories",
  "💡 Recommend Me",
  "🔄 Continue Search",
  "📋 My Activity",
  "✨ New Arrivals",
];

// Helper: detect if a string looks like a partial ISBN (digits only, with optional dashes)
const looksLikeISBN = (str) => /^[\d-]+$/.test(str.trim()) && str.replace(/-/g, "").length >= 1;

const initialMessage = {
  id: "bot-hello",
  role: "bot",
  text: "👋 Welcome to the Library Assistant!\n\nI can help you find books by Title, Author, or Category.\n\nPlease choose a language to continue.",
};

// ─── Sub-component: Book cover with fallback ──────────────────────────────────
function BookCover({ coverImage, title }) {
  const [error, setError] = useState(false);

  if (coverImage && !error) {
    const src = coverImage.startsWith("http") ? coverImage : `${IMAGE_BASE}${coverImage}`;
    return (
      <img
        src={src}
        alt={title}
        className="h-24 w-16 rounded-lg object-cover shadow-md border border-slate-200"
        onError={() => setError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-24 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-teal-50 to-slate-100 text-3xl border border-slate-200 shrink-0 shadow-inner">
      📚
    </div>
  );
}

// ─── Sub-component: Typing dots ───────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm">
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="typing-dot h-2 w-2 rounded-full bg-slate-400 inline-block animate-bounce"
          style={{ animationDelay: `${delay}s`, animationDuration: "1s" }}
        />
      ))}
    </div>
  );
}

// ─── Sub-component: Book result card ─────────────────────────────────────────
function BookResultCard({ book, onBorrow, onHold, onStatus, borrowingId }) {
  const isNew = book.publishedYear && book.publishedYear >= 2023;
  const isPopular = book.borrowCount && book.borrowCount >= 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-slate-200 bg-white p-3 text-left transition-all duration-250 hover:shadow-lg hover:border-teal-300 book-card-hover relative overflow-hidden"
    >
      {/* Badges container */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {isPopular && (
          <span className="rounded-full bg-amber-500/90 backdrop-blur-xs px-2 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider shadow-xs">
            Popular
          </span>
        )}
        {isNew && (
          <span className="rounded-full bg-teal-500/90 backdrop-blur-xs px-2 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider shadow-xs">
            New
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <BookCover coverImage={book.coverImage} title={book.title} />
          <div
            className={`absolute -top-1.5 -left-1.5 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm ${book.available > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
          >
            {book.available > 0 ? "✓" : "✕"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold text-slate-800 pr-12 truncate group-hover:text-teal-700 transition-colors"
            title={book.title}
          >
            {book.title}
          </p>
          <p className="text-xs text-slate-500 truncate" title={book.author}>
            by {book.author}
          </p>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
              ⭐ {Number(book.rating || 4.5).toFixed(1)}
            </span>
            {book.publishedYear && (
              <span className="text-[10px] text-slate-400">
                · {book.publishedYear}
              </span>
            )}
            {book.category && (
              <span className="inline-block rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-[9px] font-medium text-purple-600">
                {book.category}
              </span>
            )}
          </div>

          {book.description && (
            <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic pr-2">
              {book.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-medium ${book.available > 0 ? "text-green-600" : "text-red-500"
                }`}
            >
              {book.available > 0 ? `✅ ${book.available} available` : "❌ Out of stock"}
            </span>
            <span className="text-[10px] text-slate-400">· {book.total} total</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
        {book.available > 0 ? (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => onBorrow(book.id)}
            disabled={borrowingId === book.id}
            className="rounded-full bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60 transition-all"
          >
            {borrowingId === book.id ? "⏳ Sending..." : "📖 Borrow"}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => onHold(book.id)}
            className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:shadow-md transition-all"
          >
            📌 Place Hold
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => onStatus(book.id)}
          className="rounded-full border border-slate-200 px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-teal-300 transition-all"
        >
          🔍 Status
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLanguage, setChatLanguage] = useState(null);
  const [chatMessages, setChatMessages] = useState([initialMessage]);
  const [chatBookCache, setChatBookCache] = useState({});
  const [borrowingId, setBorrowingId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // searchMode: null | "title" | "author" | "isbn" | "category"
  const [searchMode, setSearchMode] = useState(null);
  const [categories, setCategories] = useState([]);
  const [alertsChecked, setAlertsChecked] = useState(false);

  // Intent Memory
  const [sessionMemory, setSessionMemory] = useState({
    lastQuery: "",
    lastCategory: "",
    lastMode: null,
    lastResults: [],
    lastInteractedBook: null,
    page: 1,
  });

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // ── Focus input when chat opens ─────────────────────────────────────────────
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [chatOpen]);

  // ── Escape key to close ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && chatOpen) setChatOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [chatOpen]);

  // ── Load categories when chat opens ────────────────────────────────────────
  useEffect(() => {
    if (!chatOpen || categories.length > 0) return;
    api.get("/books/categories")
      .then(({ data }) => setCategories(data.items || []))
      .catch(() => { });
  }, [chatOpen]);

  // ── Smart Alerts System ─────────────────────────────────────────────────────
  const checkSmartAlerts = async () => {
    if (!user || alertsChecked) return;
    setAlertsChecked(true);

    try {
      const [txRes, wishRes] = await Promise.all([
        api.get("/transactions", { params: { userId: user._id } }),
        api.get("/wishlist")
      ]);

      const txs = txRes.data.items || [];
      const wishlist = wishRes.data.wishlist || [];
      const alerts = [];

      // 1. Due Soon or Overdue reminders (due in <= 3 days)
      const dueSoonTxs = txs.filter(tx => {
        if (tx.status !== "issued" || !tx.dueDate) return false;
        const diffTime = new Date(tx.dueDate) - new Date();
        return diffTime < 3 * 24 * 60 * 60 * 1000;
      });

      if (dueSoonTxs.length > 0) {
        dueSoonTxs.forEach(tx => {
          const title = tx.bookId?.title || "Unknown Book";
          const isOverdue = (new Date(tx.dueDate) - new Date()) < 0;
          if (isOverdue) {
            alerts.push(`🚨 **Overdue Alert**: The book "${title}" was due on ${new Date(tx.dueDate).toLocaleDateString()}! Please return it to avoid penalties.`);
          } else {
            alerts.push(`⏰ **Due Soon**: The book "${title}" is due on ${new Date(tx.dueDate).toLocaleDateString()}.`);
          }
        });
      }

      // 2. Reserved book / Wishlist availability
      const availableWishlist = wishlist.filter(book => book.available > 0);
      if (availableWishlist.length > 0) {
        availableWishlist.forEach(book => {
          alerts.push(`🎉 **Wishlist Update**: "${book.title}" is now back in stock and available for borrow!`);
        });
      }

      if (alerts.length > 0) {
        addMessage({
          id: `bot-alert-${Date.now()}`,
          role: "bot",
          text: `🔔 **Smart Notifications**\n\n${alerts.join("\n\n")}`,
          results: availableWishlist.length > 0 ? normalizeBooks(availableWishlist) : null
        });
      }
    } catch (err) {
      console.error("Smart alerts check error:", err);
    }
  };

  useEffect(() => {
    if (chatOpen && user) {
      checkSmartAlerts();
    }
  }, [chatOpen, user]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const addMessage = useCallback((message) => {
    setChatMessages((prev) => [...prev, message]);
  }, []);

  const cacheBooks = useCallback((books) => {
    setChatBookCache((prev) => {
      const updated = { ...prev };
      books.forEach((b) => { updated[b.id] = b; });
      return updated;
    });
  }, []);

  const normalizeBooks = (list) =>
    list
      .filter((b) => b && (b._id || b.bookId))
      .map((b) => ({
        id: b._id || b.bookId,
        title: b.title || "Unknown",
        author: b.author || "Unknown",
        isbn: b.isbn || "N/A",
        available: Number(b.available ?? 0),
        total: Number(b.quantity ?? b.total ?? 0),
        totalIssued: Number(b.totalIssued ?? 0),
        coverImage: b.coverImage || null,
        category: b.category || "",
        description: b.description || "",
        rating: b.rating || 4.5,
        publishedYear: b.publishedYear || 2021,
        borrowCount: b.borrowCount || 0,
        createdAt: b.createdAt || new Date().toISOString(),
      }));

  const t = useCallback(
    (key, data = {}) => {
      const hi = chatLanguage === "hi";
      const strings = {
        noMatches: hi
          ? "😅 Koi book nahi mili. Koi aur title, author ya category try karein."
          : "😅 No books found. Try a different title, author, or category.",
        searchFound: hi
          ? "📖 Yeh books mile hain! Aap kya karna chahenge?"
          : "📖 Here are the books I found! What would you like to do?",
        popularFound: hi
          ? "🔥 Yeh sabse popular books hain!"
          : "🔥 Here are the most popular books!",
        popularMissing: hi
          ? "😅 Abhi popular books ka data nahi hai."
          : "😅 No popular books data right now.",
        borrowDone: hi
          ? "✅ Borrow request bhej diya! Librarian confirm kar denge. 📬"
          : "✅ Borrow request sent! A librarian will confirm shortly. 📬",
        borrowError: hi
          ? `❌ Request fail ho gayi: ${data.msg || "Dobara try karein."}`
          : `❌ Request failed: ${data.msg || "Please try again."}`,
        borrowAlready: hi
          ? "⚠️ Aapne pehle se yeh book request ya issue kar rakhi hai."
          : "⚠️ You already have an active request or this book is issued to you.",
        holdDone: hi
          ? "📌 Hold request note kar liya. Availability hote hi notify karenge."
          : "📌 Hold request noted. We'll notify you when it's available.",
        statusMissing: hi
          ? "❓ Book ka data nahi mila."
          : "❓ Book data not found.",
        status: hi
          ? `📊 "${data.title}" — ${data.available}/${data.total} copies available.`
          : `📊 "${data.title}" — ${data.available}/${data.total} copies available.`,
        error: hi
          ? "😕 Kuch gadbad ho gayi. Please phir se try karein."
          : "😕 Something went wrong. Please try again.",
        languageSet: hi
          ? "✅ Hindi select ho gayi! 📚"
          : "✅ English selected! 📚",
        askTitle: hi
          ? "📖 Aap kaunsi book ki title search karna chahte hain?"
          : "📖 What book title are you looking for?",
        askAuthor: hi
          ? "✍️ Kaunse author ki books dhundhni hain?"
          : "✍️ Which author's books would you like to find?",
        askISBN: hi
          ? "🔢 Kitab ka ISBN number enter karein (kam se kam 4 digits):"
          : "🔢 Enter the book ISBN number (at least 4 digits):",
        isbnTooShort: hi
          ? "⚠️ Sorry! Hume kam se kam pehle 4 digits chahiye ISBN match karne ke liye. Please thoda aur enter karein."
          : "⚠️ Sorry! We need at least the first 4 digits of the ISBN to find matching books. Please enter more digits.",
        askCategory: hi
          ? "📂 Neeche se category select karein:"
          : "📂 Select a category below:",
        followUp: hi
          ? "Kya main aur kuch madad kar sakta hoon?"
          : "Can I help you with anything else?",
      };
      return strings[key] ?? "";
    },
    [chatLanguage]
  );

  // Separate helper for ISBN found message (takes extra args)
  // matchType: "prefix" = digits matched from the start, "contains" = digits found anywhere in ISBN
  const isbnFoundMsg = useCallback(
    (digits, count, matchType) => {
      const hi = chatLanguage === "hi";
      const c = count > 1;
      if (matchType === "prefix") {
        return hi
          ? `🔢 ISBN "${digits}" se shuru hone wali ${count} book${c ? "en" : ""} mili hain!`
          : `🔢 Found ${count} book${c ? "s" : ""} whose ISBN starts with "${digits}"!`;
      }
      return hi
        ? `🔢 "${digits}" se related ${count} book${c ? "en" : ""} mili hain! (ISBN mein partial match)`
        : `🔢 Found ${count} relevant book${c ? "s" : ""} containing "${digits}" in the ISBN. (Partial match — not an exact start)`;
    },
    [chatLanguage]
  );

  // ── Language selection ──────────────────────────────────────────────────────
  const handleLanguageSelect = (lang) => {
    setChatLanguage(lang);
    addMessage({
      id: `bot-lang-${Date.now()}`,
      role: "bot",
      text: lang === "hi"
        ? "✅ Hindi select ho gayi! 📚"
        : "✅ English selected! 📚",
      languageSelected: lang,
    });
    setTimeout(() => {
      addMessage({
        id: `bot-actions-${Date.now()}`,
        role: "bot",
        text: lang === "hi"
          ? "🔍 Aap kya dhundhna chahte hain?"
          : "🔍 What would you like to do?",
        suggestions: QUICK_ACTIONS,
      });
    }, 400);
  };

  // ── User Dashboard Fetcher ──────────────────────────────────────────────────
  const fetchDashboardInfo = async (type) => {
    if (!user) {
      addMessage({
        id: `bot-${Date.now()}`,
        role: "bot",
        text: chatLanguage === "hi"
          ? "🔒 Please check dashboard ko dekhne ke liye account log in karein."
          : "🔒 Please log in to your account to view your shelf activity.",
      });
      return;
    }

    setIsTyping(true);
    try {
      const { data } = await api.get("/transactions", { params: { userId: user._id } });
      const items = data.items || [];

      if (type === "activity") {
        const active = items.filter(item => item.status === "issued" || item.status === "requested");
        if (active.length === 0) {
          addMessage({
            id: `bot-${Date.now()}`,
            role: "bot",
            text: chatLanguage === "hi"
              ? "📋 Aapki koi active book activity nahi hai (issued ya requested books)."
              : "📋 You have no active book activity (no current borrows or pending requests).",
            suggestions: QUICK_ACTIONS
          });
        } else {
          let text = chatLanguage === "hi" ? "📋 **Aapki Activity:**\n\n" : "📋 **Your Shelf Activity:**\n\n";
          active.forEach(item => {
            const title = item.bookId?.title || "Unknown Book";
            if (item.status === "issued") {
              const due = new Date(item.dueDate).toLocaleDateString();
              text += `📖 **${title}** (Issued — Due: ${due})\n`;
            } else {
              text += `⏳ **${title}** (Requested — Pending Approval)\n`;
            }
          });
          addMessage({ id: `bot-${Date.now()}`, role: "bot", text, showFollowUp: true });
        }
      }

      else if (type === "due") {
        const issued = items.filter(item => item.status === "issued");
        if (issued.length === 0) {
          addMessage({
            id: `bot-${Date.now()}`,
            role: "bot",
            text: chatLanguage === "hi"
              ? "📅 Aapke paas abhi koi issued books nahi hain."
              : "📅 You do not have any issued books right now.",
            suggestions: QUICK_ACTIONS
          });
        } else {
          let text = chatLanguage === "hi" ? "📅 **Due Dates Reminder:**\n\n" : "📅 **Book Due Dates:**\n\n";
          issued.forEach(item => {
            const title = item.bookId?.title || "Unknown Book";
            const due = new Date(item.dueDate);
            const dueStr = due.toLocaleDateString();
            const diff = due - new Date();
            const isOverdue = diff < 0;
            const emoji = isOverdue ? "⚠️ Overdue!" : "⏰";

            text += `• **${title}**: Due on **${dueStr}** ${emoji}\n`;
          });
          addMessage({ id: `bot-${Date.now()}`, role: "bot", text, showFollowUp: true });
        }
      }

      else if (type === "fines") {
        const totalFine = items.reduce((sum, item) => sum + (item.fine || 0), 0);
        const finedItems = items.filter(item => item.fine > 0);

        let text = "";
        if (totalFine === 0) {
          text = chatLanguage === "hi"
            ? "🎉 Aapka fine balance bilkul clean hai! Koi penalties nahi hain."
            : "🎉 You have a clean fine balance! No unpaid penalties.";
        } else {
          text = chatLanguage === "hi"
            ? `💵 **Fines & Penalties:**\n\nTotal Fine: **₹${totalFine}**\n\n`
            : `💵 **Fines & Penalties:**\n\nTotal Fine: **$${totalFine}**\n\n`;

          finedItems.forEach(item => {
            const title = item.bookId?.title || "Unknown Book";
            text += `• **${title}**: Fine of **$${item.fine}** (Due to late return)\n`;
          });
        }
        addMessage({ id: `bot-${Date.now()}`, role: "bot", text, showFollowUp: true });
      }
    } catch (err) {
      console.error("Error fetching dashboard info:", err);
      toast.error(t("error"));
    } finally {
      setIsTyping(false);
    }
  };

  // ── Core: fetch books via API (always fresh, supports author/category/title) ─
  const fetchAndDisplay = async ({ mode, query, page = 1 }) => {
    setIsTyping(true);
    try {
      let results = [];

      if (mode === "popular") {
        const { data } = await api.get("/books", { params: { sort: "popularity", limit: 6 } });
        results = normalizeBooks(data.items || []);
        if (!results.length) {
          addMessage({ id: `bot-${Date.now()}`, role: "bot", text: t("popularMissing"), suggestions: QUICK_ACTIONS });
          return;
        }
        cacheBooks(results);
        addMessage({ id: `bot-${Date.now()}`, role: "bot", text: t("popularFound"), results, showFollowUp: true });
        return;
      }

      // Record Search Intent Memory
      if (mode !== "recommendations") {
        setSessionMemory(prev => ({
          ...prev,
          lastQuery: query || "",
          lastCategory: mode === "category" ? query : prev.lastCategory,
          lastMode: mode,
          page: page
        }));
      }

      if (mode === "author") {
        const { data } = await api.get("/books", { params: { search: query, page, limit: 10 } });
        results = normalizeBooks(data.items || []);
      } else if (mode === "isbn") {
        const digits = query.replace(/-/g, "").trim();
        if (digits.length < 4) {
          addMessage({
            id: `bot-${Date.now()}`,
            role: "bot",
            text: t("isbnTooShort"),
            suggestions: ["🔢 Search by ISBN", ...QUICK_ACTIONS],
          });
          return;
        }
        const { data } = await api.get("/books", { params: { search: digits, limit: 15 } });
        results = normalizeBooks(data.items || []);
      } else if (mode === "category") {
        const { data } = await api.get("/books", { params: { category: query, page, limit: 10 } });
        results = normalizeBooks(data.items || []);
      } else if (mode === "recommendations") {
        const params = { category: query };
        if (page && String(page).length === 24) {
          params.bookId = page;
        }
        const { data } = await api.get("/books/recommendations", { params });
        const trending = normalizeBooks(data.trending || []);
        const similar = normalizeBooks(data.similar || []);
        const popularInCategory = normalizeBooks(data.popularInCategory || []);

        cacheBooks([...trending, ...similar, ...popularInCategory]);

        if (similar.length > 0) {
          addMessage({
            id: `bot-rec-sim-${Date.now()}`,
            role: "bot",
            text: chatLanguage === "hi"
              ? `📚 **category "${query}" ke similar books:**`
              : `📚 **Similar Books in "${query}":**`,
            results: similar,
          });
        }

        if (popularInCategory.length > 0) {
          addMessage({
            id: `bot-rec-pop-${Date.now()}`,
            role: "bot",
            text: chatLanguage === "hi"
              ? `🔥 **"${query}" category mein popular books:**`
              : `🔥 **Popular in "${query}":**`,
            results: popularInCategory,
          });
        }

        addMessage({
          id: `bot-rec-trend-${Date.now()}`,
          role: "bot",
          text: chatLanguage === "hi"
            ? `📈 **Trending kitaben:**`
            : `📈 **Overall Trending Books:**`,
          results: trending,
          showFollowUp: true
        });
        return;
      } else {
        // title (default search)
        const { data } = await api.get("/books", { params: { search: query, page, limit: 10 } });
        results = normalizeBooks(data.items || []);
      }

      // Empty State Suggestion Handling
      if (!results.length) {
        let emptyMsg = t("noMatches");
        if (query) {
          emptyMsg = chatLanguage === "hi"
            ? `😅 "${query}" ke liye koi book nahi mili.`
            : `😅 No books found matching "${query}".`;
        }

        // Fetch standard recommendations as suggestions for empty state
        const { data: recData } = await api.get("/books/recommendations");
        const fallbackBooks = normalizeBooks(recData.trending || []).slice(0, 3);
        cacheBooks(fallbackBooks);

        addMessage({
          id: `bot-${Date.now()}`,
          role: "bot",
          text: emptyMsg + (chatLanguage === "hi"
            ? "\n\nAap in popular books ko explore kar sakte hain ya quick actions try karein:"
            : "\n\nYou might want to check out these popular books or browse a category:"),
          results: fallbackBooks,
          suggestions: QUICK_ACTIONS,
        });
        return;
      }

      cacheBooks(results);

      if (mode !== "recommendations") {
        setSessionMemory(prev => ({
          ...prev,
          lastResults: results
        }));
      }

      addMessage({
        id: `bot-${Date.now()}`,
        role: "bot",
        text: t("searchFound"),
        results,
        showFollowUp: true,
      });

      // Show dynamically structured recommendation pills based on results category
      if (results[0] && results[0].category) {
        const cat = results[0].category;
        setTimeout(() => {
          addMessage({
            id: `bot-rec-offer-${Date.now()}`,
            role: "bot",
            text: chatLanguage === "hi"
              ? `💡 Kya aap is category "${cat}" ke aur similar books ya recommendations dekhna chahte hain?`
              : `💡 Would you like to see similar books in the "${cat}" category?`,
            suggestions: [`Similar to "${results[0].title}"`, `Popular in "${cat}"`],
          });
        }, 800);
      }
    } catch (err) {
      console.error("ChatWidget search error:", err);
      toast.error(t("error"));
      addMessage({ id: `bot-${Date.now()}`, role: "bot", text: t("error") });
    } finally {
      setIsTyping(false);
    }
  };

  // ── Suggestion pill handler ──────────────────────────────────────────────────
  const handleSuggestionClick = async (suggestion) => {
    addMessage({ id: `user-${Date.now()}`, role: `user`, text: suggestion });

    // Language shortcuts
    if (suggestion === "Hindi" || suggestion === "🇮🇳 Hindi") {
      handleLanguageSelect("hi");
      return;
    }
    if (suggestion === "English" || suggestion === "🇬🇧 English") {
      handleLanguageSelect("en");
      return;
    }

    // Dynamic Context Action pills
    if (suggestion.startsWith("Similar to \"")) {
      const title = suggestion.replace("Similar to \"", "").replace("\"", "");
      const book = Object.values(chatBookCache).find(b => b.title === title);
      if (book) {
        await fetchAndDisplay({ mode: "recommendations", query: book.category, page: book.id });
      }
      return;
    }

    if (suggestion.startsWith("Popular in \"")) {
      const cat = suggestion.replace("Popular in \"", "").replace("\"", "");
      await fetchAndDisplay({ mode: "recommendations", query: cat });
      return;
    }

    // Quick actions mapping
    if (suggestion === "🔥 Popular Books") {
      await fetchAndDisplay({ mode: "popular" });
      return;
    }

    if (suggestion === "🔍 Search by Title") {
      setSearchMode("title");
      addMessage({ id: `bot-${Date.now()}`, role: "bot", text: t("askTitle") });
      return;
    }

    if (suggestion === "✍️ Search by Author") {
      setSearchMode("author");
      addMessage({ id: `bot-${Date.now()}`, role: "bot", text: t("askAuthor") });
      return;
    }

    if (suggestion === "🔢 Search by ISBN") {
      setSearchMode("isbn");
      addMessage({ id: `bot-${Date.now()}`, role: "bot", text: t("askISBN") });
      return;
    }

    if (suggestion === "📂 Browse Categories") {
      const cats = categories.length > 0
        ? categories
        : ["Fiction", "Non-Fiction", "Science", "History", "Biography", "Technology", "Philosophy", "Self-Help"];
      addMessage({
        id: `bot-${Date.now()}`,
        role: "bot",
        text: t("askCategory"),
        categoryOptions: cats,
      });
      return;
    }

    if (suggestion === "💡 Recommend Me") {
      let cat = sessionMemory.lastCategory || "Software";
      let bookId = null;
      if (user) {
        try {
          const { data } = await api.get("/wishlist");
          const list = data.wishlist || [];
          if (list.length > 0) {
            cat = list[0].category || cat;
            bookId = list[0]._id || list[0].id;
          }
        } catch (e) { }
      }
      await fetchAndDisplay({ mode: "recommendations", query: cat, page: bookId });
      return;
    }

    if (suggestion === "🔄 Continue Search") {
      const lastMode = sessionMemory.lastMode || "title";
      setSearchMode(lastMode);
      addMessage({
        id: `bot-${Date.now()}`,
        role: "bot",
        text: lastMode === "author" ? t("askAuthor") : lastMode === "isbn" ? t("askISBN") : t("askTitle")
      });
      return;
    }

    if (suggestion === "📋 My Activity") {
      await fetchDashboardInfo("activity");
      return;
    }

    if (suggestion === "✨ New Arrivals") {
      // Natural parser maps "latest books" to sort: "newest"
      await fetchAndDisplay({ mode: "title", query: "latest books" });
      return;
    }

    // Category options selection
    await fetchAndDisplay({ mode: "category", query: suggestion });
  };

  // ── Free-text send ────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!chatLanguage) {
      addMessage({
        id: `bot-${Date.now()}`,
        role: "bot",
        text: "👋 Please choose a language first.",
        suggestions: ["Hindi", "English"],
      });
      return;
    }

    const trimmed = chatInput.trim();
    if (!trimmed) return;

    addMessage({ id: `user-${Date.now()}`, role: "user", text: trimmed });
    setChatInput("");

    // NLP intent routing
    const cleanedInput = trimmed.toLowerCase();

    // 1. Show More pagination Command
    if (cleanedInput === "show more" || cleanedInput === "more") {
      if (sessionMemory.lastQuery && sessionMemory.lastMode) {
        const nextPage = sessionMemory.page + 1;
        addMessage({
          id: `bot-${Date.now()}`,
          role: "bot",
          text: chatLanguage === "hi" ? "🔍 Aur results fetch kar raha hoon..." : "🔍 Fetching more results...",
        });
        await fetchAndDisplay({
          mode: sessionMemory.lastMode,
          query: sessionMemory.lastQuery,
          page: nextPage
        });
      } else {
        addMessage({
          id: `bot-${Date.now()}`,
          role: "bot",
          text: chatLanguage === "hi"
            ? "😅 Mere paas pichle search ki memory nahi hai. Nayi search shuru karein."
            : "😅 I don't have any previous search in memory. Let's start a new search!",
          suggestions: QUICK_ACTIONS
        });
      }
      return;
    }

    // 2. Similar Books recommendation Command
    if (cleanedInput === "similar books" || cleanedInput === "similar") {
      const targetBook = sessionMemory.lastInteractedBook || (sessionMemory.lastResults && sessionMemory.lastResults[0]);
      if (targetBook) {
        addMessage({
          id: `bot-${Date.now()}`,
          role: "bot",
          text: chatLanguage === "hi"
            ? `🔍 "${targetBook.title}" ke similar books search kar raha hoon...`
            : `🔍 Searching for books similar to "${targetBook.title}"...`,
        });
        await fetchAndDisplay({
          mode: "recommendations",
          query: targetBook.category,
          page: targetBook.id
        });
      } else {
        addMessage({
          id: `bot-${Date.now()}`,
          role: "bot",
          text: chatLanguage === "hi"
            ? "😅 Aapne kisi book se interact nahi kiya hai. Similar books recommend karne ke liye please pehle ek book search karein."
            : "😅 You haven't interacted with any books yet. Search for a book first, and I will recommend similar ones!",
          suggestions: QUICK_ACTIONS
        });
      }
      return;
    }

    // 3. User Dashboard activity Commands
    if (cleanedInput === "my books" || cleanedInput === "my activity" || cleanedInput === "activity") {
      await fetchDashboardInfo("activity");
      return;
    }

    if (cleanedInput === "due date" || cleanedInput === "due dates" || cleanedInput === "due") {
      await fetchDashboardInfo("due");
      return;
    }

    if (cleanedInput === "fines" || cleanedInput === "fine" || cleanedInput === "penalties") {
      await fetchDashboardInfo("fines");
      return;
    }

    const mode = searchMode;
    setSearchMode(null); // reset

    // Auto-detect ISBN if user typed only digits (and no active mode)
    if (!mode && looksLikeISBN(trimmed)) {
      await fetchAndDisplay({ mode: "isbn", query: trimmed });
      return;
    }

    await fetchAndDisplay({ mode: mode || "title", query: trimmed });
  };

  // ── Borrow ───────────────────────────────────────────────────────────────────
  const handleBorrow = async (bookId) => {
    if (borrowingId) return;
    setBorrowingId(bookId);
    try {
      await api.post("/transactions/request", { bookId });
      toast.success(t("borrowDone"));
      addMessage({ id: `bot-${Date.now()}`, role: "bot", text: t("borrowDone") });
      setTimeout(() => {
        addMessage({ id: `bot-fu-${Date.now()}`, role: "bot", text: t("followUp"), suggestions: QUICK_ACTIONS });
      }, 600);
    } catch (error) {
      const msg = error.response?.data?.message || "";
      const isDuplicate = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("pending");
      const errMsg = isDuplicate ? t("borrowAlready") : t("borrowError", { msg });
      toast.error(errMsg);
      addMessage({ id: `bot-${Date.now()}`, role: "bot", text: errMsg });
    } finally {
      setBorrowingId(null);
    }
  };

  // Borrow/Hold Wrappers to track intent memory
  const handleBorrowWrapper = async (bookId) => {
    const book = chatBookCache[bookId];
    if (book) {
      setSessionMemory(prev => ({ ...prev, lastInteractedBook: book }));
    }
    await handleBorrow(bookId);
  };

  const handleHoldWrapper = (bookId) => {
    const book = chatBookCache[bookId];
    if (book) {
      setSessionMemory(prev => ({ ...prev, lastInteractedBook: book }));
    }
    handleHold(bookId);
  };

  const handleStatusWrapper = (bookId) => {
    const book = chatBookCache[bookId];
    if (book) {
      setSessionMemory(prev => ({ ...prev, lastInteractedBook: book }));
    }
    handleStatus(bookId);
  };

  // ── Hold ─────────────────────────────────────────────────────────────────────
  const handleHold = (bookId) => {
    toast.success(t("holdDone"));
    addMessage({ id: `bot-${Date.now()}`, role: "bot", text: t("holdDone") });
    setTimeout(() => {
      addMessage({ id: `bot-fu-${Date.now()}`, role: "bot", text: t("followUp"), suggestions: QUICK_ACTIONS });
    }, 600);
  };

  // ── Status ───────────────────────────────────────────────────────────────────
  const handleStatus = (bookId) => {
    const book = chatBookCache[bookId];
    addMessage({
      id: `bot-${Date.now()}`,
      role: "bot",
      text: book ? t("status", book) : t("statusMissing"),
      statusBook: book,
    });
  };

  // ── Clear history ────────────────────────────────────────────────────────────
  const handleClear = () => {
    setChatMessages([initialMessage]);
    setChatLanguage(null);
    setSearchMode(null);
    setAlertsChecked(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toggle button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setChatOpen((p) => !p)}
        className={`fixed bottom-6 right-6 z-30 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl transition-all ${chatOpen
            ? "bg-slate-600 hover:bg-slate-700"
            : "bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 hover:from-blue-700 hover:via-teal-700 hover:to-green-700 chat-attention"
          }`}
      >
        {chatOpen ? "✕ Close" : "💬 Chat with Librarian"}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-20 right-6 z-30 w-96 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-blue-600/20 bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <div>
                  <p className="text-sm font-semibold text-white">Virtual Librarian</p>
                  <p className="text-xs text-teal-100">
                    {searchMode
                      ? `Mode: ${searchMode === "title" ? "📖 Title" : searchMode === "author" ? "✍️ Author" : "📂 Category"} search`
                      : chatLanguage === "hi"
                        ? "Hindi में बात करें"
                        : "Ask me anything about books"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatLanguage && (
                  <button
                    type="button"
                    onClick={() => handleLanguageSelect(chatLanguage === "hi" ? "en" : "hi")}
                    title={chatLanguage === "hi" ? "Switch to English" : "Hindi में बदलें"}
                    className="rounded-full bg-white/15 hover:bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white transition-all mr-1"
                  >
                    {chatLanguage === "hi" ? "🌐 EN" : "🌐 HI"}
                  </button>
                )}
                {chatMessages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear chat"
                    className="text-white/60 hover:text-white text-xs transition-colors"
                  >
                    🗑️
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="text-white/60 hover:text-white text-sm font-semibold transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-scroll max-h-[420px] min-h-[280px] overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
              {chatMessages.map((msg, idx) => (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={msg.role === "user" ? "text-right" : "text-left"}
                >
                  {/* Bubble */}
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 text-white"
                        : "bg-white text-slate-700 border border-slate-100"
                      }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Inline check status borrow button */}
                    {msg.statusBook && msg.statusBook.available > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-start">
                        <button
                          type="button"
                          onClick={() => handleBorrowWrapper(msg.statusBook.id)}
                          disabled={borrowingId === msg.statusBook.id}
                          className="rounded-full bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60 transition-all"
                        >
                          {borrowingId === msg.statusBook.id ? "⏳ Borrowing..." : "📖 Borrow This Book"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggestion pills */}
                  {msg.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestionClick(s)}
                          className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Category pills */}
                  {msg.categoryOptions && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.categoryOptions.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleSuggestionClick(cat)}
                          className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-100 hover:border-purple-300 transition-all shadow-sm"
                        >
                          📂 {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Book results */}
                  {msg.results && (
                    <div className="mt-2 space-y-2.5">
                      {msg.results.map((book) => (
                        <BookResultCard
                          key={book.id}
                          book={book}
                          onBorrow={handleBorrowWrapper}
                          onHold={handleHoldWrapper}
                          onStatus={handleStatusWrapper}
                          borrowingId={borrowingId}
                        />
                      ))}
                    </div>
                  )}

                  {/* Follow-up prompt */}
                  {msg.showFollowUp && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                      {QUICK_ACTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestionClick(s)}
                          className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm animate-fade-in"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-left"
                >
                  <TypingIndicator />
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-slate-200 bg-white px-3 py-3">
              {!chatLanguage ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleLanguageSelect("hi")}
                    className="flex-1 rounded-full bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:via-teal-700 hover:to-green-700 transition-all shadow-sm"
                  >
                    🇮🇳 Hindi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageSelect("en")}
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    IN English
                  </button>
                </div>
              ) : (
                <div className={`flex items-center gap-2${searchMode === "isbn" ? " pb-5" : ""}`}>
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={
                        searchMode === "author"
                          ? chatLanguage === "hi" ? "Author ka naam likhiye..." : "Enter author name..."
                          : searchMode === "isbn"
                            ? chatLanguage === "hi" ? "ISBN digits likhiye (min 4)..." : "Enter ISBN digits (min 4)..."
                            : searchMode === "title"
                              ? chatLanguage === "hi" ? "Book title likhiye..." : "Enter book title..."
                              : chatLanguage === "hi"
                                ? "Kuch bhi puchiye (e.g. my books, fines)..."
                                : "Search by title, author, or commands (fines, due date)..."
                      }
                      className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    {searchMode === "isbn" && (
                      <p className="absolute -bottom-5 left-1 text-[10px] text-slate-400">
                        {chatLanguage === "hi" ? "⚠️ Kam se kam 4 digits zaroori hain" : "⚠️ Minimum 4 digits required"}
                      </p>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleSend}
                    disabled={isTyping || !chatInput.trim()}
                    className="rounded-full bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
                  >
                    {chatLanguage === "hi" ? "भेजें" : "Send"}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
