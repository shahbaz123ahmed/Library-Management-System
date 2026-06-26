"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { exportToCsv } from "@/utils/exportUtils";

const emptyForm = { userId: "", bookId: "", dueDays: "", finePerDay: "" };

export default function TransactionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  // Approve modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveDays, setApproveDays] = useState("14");
  const [approveFinePerDay, setApproveFinePerDay] = useState("");

  useEffect(() => {
    if (!loading && (!user || (user.role !== "admin" && user.role !== "librarian"))) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const fetchTransactions = async () => {
    const { data } = await api.get("/transactions", { params: { page, search, excludeStatus: "requested" } });
    setItems(data.items);
    setPages(data.pages);
  };

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user, page, search]);

  const openIssue = async () => {
    const [usersRes, booksRes] = await Promise.all([
      api.get("/users", { params: { page: 1, limit: 100 } }),
      api.get("/books", { params: { availability: "available", page: 1, limit: 100 } }),
    ]);
    setUsers(usersRes.data.items || []);
    setBooks(booksRes.data.items || []);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleIssue = async (event) => {
    event.preventDefault();
    try {
      await api.post("/transactions/issue", form);
      toast.success("Book issued");
      setModalOpen(false);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Issue failed");
    }
  };

  const handleReturn = async (id) => {
    try {
      await api.post(`/transactions/return/${id}`);
      toast.success("Book returned");
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Return failed");
    }
  };

  // Open the approve modal pre-filled with the request details
  const openApproveModal = (transaction) => {
    setApproveTarget(transaction);
    setApproveDays("14");
    setApproveFinePerDay("");
    setApproveModalOpen(true);
  };

  const submitApprove = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/transactions/approve/${approveTarget._id}`, {
        dueDays: approveDays || 14,
        finePerDay: approveFinePerDay !== "" ? approveFinePerDay : undefined,
      });
      toast.success("Book issued successfully!");
      setApproveModalOpen(false);
      setApproveTarget(null);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approve failed");
    }
  };

  const handleExport = () => {
    exportToCsv(
      items.map((item) => ({
        user: item.userId?.name,
        book: item.bookId?.title,
        status: item.status,
        issueDate: item.issueDate,
        dueDate: item.dueDate,
        returnDate: item.returnDate || "",
        fine: item.fine || 0,
      })),
      "transactions.csv"
    );
  };

  const statusColor = (status) => {
    if (status === "requested") return isDark ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-amber-50 text-amber-700 border border-amber-200";
    if (status === "issued") return isDark ? "bg-teal-500/15 text-teal-300 border border-teal-500/30" : "bg-teal-50 text-teal-700 border border-teal-200";
    if (status === "returned") return isDark ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200";
    return isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600";
  };

  const pendingCount = items.filter((i) => i.status === "requested").length;

  return (
    <AppLayout title="Transactions">

      {/* ── Premium Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative mb-8 overflow-hidden rounded-3xl p-8 shadow-lg transition-colors duration-300 ${
          isDark
            ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700/50"
            : "bg-gradient-to-r from-blue-600 via-teal-600 to-green-600"
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
          className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-purple-400/10 blur-3xl"
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
              Records
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-3xl font-bold text-white"
            >
              Issue &amp; Returns
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-2 text-sm text-white/55"
            >
              Track who has what and collect fines.
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
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(13,148,136,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={openIssue}
              className="rounded-full bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-teal-600/25 transition-all"
            >
              📖 Issue Book
            </motion.button>
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
          <div className="relative w-full md:w-80">
            <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>🔍</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by user, book, or ISBN…"
              className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 ${
                isDark
                  ? "bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
                  : "bg-white border border-slate-200 text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
          </div>

          {/* Result count pill */}
          <motion.span
            key={items.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              isDark ? "bg-teal-500/15 text-teal-400" : "bg-teal-50 text-teal-700"
            }`}
          >
            {items.length} record{items.length !== 1 ? "s" : ""}
          </motion.span>

          {/* Pending borrow requests badge */}
          {pendingCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700"
              }`}
            >
              ⏳ {pendingCount} pending approval
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* ── Transaction List ── */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2, boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.3)" : "0 8px 30px rgba(15,23,42,0.1)" }}
              className="rounded-2xl bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 p-[1.5px] transition-all duration-300"
            >
              <div
                className={`flex flex-col gap-4 rounded-[15px] p-5 transition-colors duration-300 md:flex-row md:items-center md:justify-between ${
                  isDark
                    ? "bg-slate-900/95 backdrop-blur-sm"
                    : "bg-white"
                }`}
              >
                {/* Left: book + user info */}
                <div className="flex items-start gap-4">
                  {/* Book icon avatar */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${
                    isDark ? "bg-teal-500/15 text-teal-400" : "bg-teal-50 text-teal-600"
                  }`}>
                    📚
                  </div>
                  <div>
                    <p className={`text-sm font-semibold transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>
                      {item.bookId?.title}
                    </p>
                    <p className={`text-xs mt-0.5 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Issued to <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{item.userId?.name}</span>
                    </p>
                    <p className={`text-xs mt-0.5 transition-colors duration-300 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Due {new Date(item.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Right: status + fine + action */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className={`text-xs font-medium ${
                    (item.fine || 0) > 0
                      ? "text-orange-500"
                      : isDark ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Fine ₹{item.fine || 0}
                  </span>
                  {item.status === "requested" ? (
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openApproveModal(item)}
                      className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      ✅ Approve &amp; Issue
                    </motion.button>
                  ) : item.status === "issued" ? (
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(234,88,12,0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReturn(item._id)}
                      className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      Mark returned
                    </motion.button>
                  ) : (
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      ✓ Done
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-2xl border p-12 text-center ${
              isDark ? "border-slate-700/50 bg-slate-800/40" : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-3xl mb-3">📋</p>
            <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No transactions found
            </p>
          </motion.div>
        )}
      </div>

      <div className="mt-6">
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      {/* ── Approve Request Modal ── */}
      <Modal
        open={approveModalOpen}
        title="Approve Borrow Request"
        onClose={() => { setApproveModalOpen(false); setApproveTarget(null); }}
      >
        {approveTarget && (
          <form onSubmit={submitApprove} className="grid gap-4">
            {/* Read-only info */}
            <div className={`rounded-xl border p-4 space-y-2 ${
              isDark ? "bg-slate-900/60 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">📚</span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}>Book</p>
                  <p className={`text-sm font-semibold ${
                    isDark ? "text-white" : "text-slate-800"
                  }`}>{approveTarget.bookId?.title}</p>
                  <p className={`text-xs ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>{approveTarget.bookId?.author} · ISBN {approveTarget.bookId?.isbn}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-base">👤</span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}>Requested by</p>
                  <p className={`text-sm font-semibold ${
                    isDark ? "text-white" : "text-slate-800"
                  }`}>{approveTarget.userId?.name}</p>
                  <p className={`text-xs ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>{approveTarget.userId?.email}</p>
                </div>
              </div>
            </div>

            {/* Loan days + Fine per day — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1.5 text-xs font-semibold uppercase tracking-wide ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>
                  📅 Loan Days
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="365"
                  value={approveDays}
                  onChange={(e) => setApproveDays(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/20 ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-teal-500"
                      : "bg-white border-slate-200 text-slate-700 focus:border-teal-500"
                  }`}
                  placeholder="14"
                />
                <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Due: {approveDays
                    ? new Date(Date.now() + Number(approveDays) * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </p>
              </div>
              <div>
                <label className={`block mb-1.5 text-xs font-semibold uppercase tracking-wide ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>
                  💸 Fine / Day (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={approveFinePerDay}
                  onChange={(e) => setApproveFinePerDay(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/20 ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-teal-500"
                      : "bg-white border-slate-200 text-slate-700 focus:border-teal-500"
                  }`}
                  placeholder="Default (₹2)"
                />
                <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Leave blank to use global rate
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(16,185,129,0.3)" }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-md"
            >
              ✅ Confirm &amp; Issue Book
            </motion.button>
          </form>
        )}
      </Modal>

      {/* ── Issue Book Modal ── */}
      <Modal open={modalOpen} title="Issue Book" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleIssue} className="grid gap-4">
          <select
            required
            value={form.userId}
            onChange={(event) => setForm({ ...form, userId: event.target.value })}
            className={`rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/20 ${
              isDark
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <option value="">👤 Select user</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          <select
            required
            value={form.bookId}
            onChange={(event) => setForm({ ...form, bookId: event.target.value })}
            className={`rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/20 ${
              isDark
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <option value="">📚 Select book</option>
            {books.map((b) => (
              <option key={b._id} value={b._id}>
                {b.title} ({b.available} available)
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              max="365"
              value={form.dueDays}
              onChange={(event) => setForm({ ...form, dueDays: event.target.value })}
              className={`rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/20 ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
              placeholder="Loan days (default 14)"
            />
            <div className="relative">
              <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>₹</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.finePerDay}
                onChange={(event) => setForm({ ...form, finePerDay: event.target.value })}
                className={`w-full rounded-xl border py-3 pl-8 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-500/20 ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
                placeholder="Fine/day (default ₹2)"
              />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(13,148,136,0.3)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="rounded-full bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md"
          >
            Issue Now
          </motion.button>
        </form>
      </Modal>
    </AppLayout>
  );
}
