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

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");

  // Librarian inbox (book assigned / request approved notifications)
  const [inboxItems, setInboxItems] = useState([]);
  const [inboxPage, setInboxPage] = useState(1);
  const [inboxPages, setInboxPages] = useState(1);

  // Approve modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveDays, setApproveDays] = useState("14");
  const [approveFinePerDay, setApproveFinePerDay] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin" && user.role !== "librarian") {
        router.push("/dashboard");
      }
    }
  }, [loading, user, router]);

  const fetchRequests = async () => {
    try {
      if (user.role === "admin") {
        const { data } = await api.get("/books/workspace-requests", {
          params: { page, status: "pending" }
        });
        setItems(data.items);
        setPages(data.pages);
      } else {
        const { data } = await api.get("/transactions", {
          params: { page, search, status: "requested" },
        });
        setItems(data.items);
        setPages(data.pages);
      }
    } catch (error) {
      toast.error("Failed to load requests list");
    }
  };

  const fetchInbox = async () => {
    try {
      const { data } = await api.get("/notifications/inbox", {
        params: { page: inboxPage, limit: 10 },
      });
      setInboxItems(data.items);
      setInboxPages(data.pages);
    } catch (error) {
      console.error("Failed to load inbox", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user, page, search]);

  useEffect(() => {
    if (!user || user.role !== "librarian") return;
    fetchInbox();
  }, [user, inboxPage]);

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
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approve failed");
    }
  };

  const handleApproveWorkspace = async (id) => {
    try {
      const { data } = await api.post(`/books/workspace-requests/${id}/approve`);
      toast.success(data.message || "Request approved and book added to workspace!");
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approve failed");
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this borrow request?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Request rejected");
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Reject failed");
    }
  };

  const handleRejectWorkspace = async (id) => {
    if (!confirm("Reject this workspace copy request?")) return;
    try {
      const { data } = await api.post(`/books/workspace-requests/${id}/reject`);
      toast.success(data.message || "Request rejected");
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Reject failed");
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/inbox/${id}/read`);
      setInboxItems((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Mark read failed", error);
    }
  };

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/20 ${
    isDark
      ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-teal-500"
      : "bg-white border-slate-200 text-slate-700 focus:border-teal-500"
  }`;

  return (
    <AppLayout title="Notifications">

      {/* ── Premium Hero Banner ── */}
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
        {/* Decorative orbs */}
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
              className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70"
            >
              Pending Approvals
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-3xl font-bold text-white"
            >
              🔔 Borrow Requests
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-2 text-sm text-white/55"
            >
              Review and approve student book requests before issuing.
            </motion.p>
          </motion.div>

          <motion.span
            key={items.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="self-start md:self-auto rounded-full bg-amber-500/20 border border-amber-400/30 px-4 py-2 text-sm font-bold text-amber-200"
          >
            {items.length} pending
          </motion.span>
        </div>
      </motion.div>

      {/* ── Search Bar ── */}
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
        <div className="relative w-full md:w-80">
          <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>🔍</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by student or book…"
            className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 ${
              isDark
                ? "bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                : "bg-white border border-slate-200 text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
            }`}
          />
        </div>
      </motion.div>

      {/* ── Request Cards ── */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2, boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.3)" : "0 8px 30px rgba(15,23,42,0.1)" }}
              className="rounded-2xl bg-gradient-to-r from-blue-600 via-teal-600 to-green-600 p-[1.5px] transition-all duration-300"
            >
              <div className={`flex flex-col gap-4 rounded-[15px] p-5 transition-colors duration-300 md:flex-row md:items-center md:justify-between ${
                isDark
                  ? "bg-slate-900/95 backdrop-blur-sm"
                  : "bg-white"
              }`}
              >
              {/* Left: request info */}
              <div className="flex items-start gap-4">
                {/* Pulsing dot */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-25" />
                  <span className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-base ${
                    isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"
                  }`}>
                    📋
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {item.bookId?.title}
                  </p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    by {item.bookId?.author}
                    {item.bookId?.isbn ? ` · ISBN ${item.bookId.isbn}` : ""}
                  </p>
                  {user.role === "admin" ? (
                    <p className={`text-xs mt-1 font-medium ${isDark ? "text-teal-400" : "text-teal-700"}`}>
                      👤 Librarian: {item.librarianId?.name}
                      <span className={`ml-1.5 font-normal ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {item.librarianId?.email}
                      </span>
                    </p>
                  ) : (
                    <p className={`text-xs mt-1 font-medium ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                      🎓 Student: {item.userId?.name}
                      <span className={`ml-1.5 font-normal ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {item.userId?.email}
                      </span>
                    </p>
                  )}
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Requested {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                  isDark
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  ⏳ Pending
                </span>
                {user.role === "admin" ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApproveWorkspace(item._id)}
                      className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      ✅ Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRejectWorkspace(item._id)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                        isDark
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      ✕ Reject
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openApproveModal(item)}
                      className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      ✅ Approve & Issue
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReject(item._id)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                        isDark
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      ✕ Reject
                    </motion.button>
                  </>
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
            className={`rounded-2xl border p-16 text-center ${
              isDark ? "border-slate-700/50 bg-slate-800/40" : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-4xl mb-3">🎉</p>
            <p className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              All caught up!
            </p>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {user?.role === "admin" ? "No pending workspace copy requests at the moment." : "No pending borrow requests at the moment."}
            </p>
          </motion.div>
        )}
      </div>

      <div className="mt-6">
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      {/* ── Librarian Inbox (Book Assignments from Admin) ── */}
      {user?.role === "librarian" && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <div className={`h-8 w-1 rounded-full bg-gradient-to-b from-teal-400 to-emerald-500`} />
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}>📬 Book Catalog Notifications</h3>
            {inboxItems.filter(n => !n.isRead).length > 0 && (
              <span className="rounded-full bg-teal-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {inboxItems.filter(n => !n.isRead).length} new
              </span>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {inboxItems.map((notif, idx) => (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`rounded-2xl border p-5 flex items-start gap-4 transition-all ${
                    notif.isRead
                      ? isDark ? "border-slate-700/40 bg-slate-800/30" : "border-slate-200 bg-white/60"
                      : isDark ? "border-teal-500/30 bg-teal-500/5" : "border-teal-200 bg-teal-50"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                    notif.type === "WORKSPACE_REQUEST_APPROVED"
                      ? isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                      : isDark ? "bg-teal-500/15 text-teal-400" : "bg-teal-50 text-teal-600"
                  }`}>
                    {notif.type === "WORKSPACE_REQUEST_APPROVED" ? "✅" : "📚"}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{notif.title}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{notif.message}</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                      {new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        isDark
                          ? "border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                          : "border-teal-200 text-teal-600 hover:bg-teal-100"
                      }`}
                    >
                      Mark read
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {inboxItems.length === 0 && (
              <div className={`rounded-2xl border p-10 text-center ${isDark ? "border-slate-700/50 bg-slate-800/40" : "border-slate-200 bg-white"}`}>
                <p className="text-3xl mb-2">📭</p>
                <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No catalog notifications yet.</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Pagination page={inboxPage} pages={inboxPages} onChange={setInboxPage} />
          </div>
        </div>
      )}

      {/* ── Approve Modal ── */}
      <Modal
        open={approveModalOpen}
        title="Approve Borrow Request"
        onClose={() => { setApproveModalOpen(false); setApproveTarget(null); }}
      >
        {approveTarget && (
          <form onSubmit={submitApprove} className="grid gap-4">
            {/* Read-only info card */}
            <div className={`rounded-xl border p-4 space-y-3 ${
              isDark ? "bg-slate-900/60 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">📚</span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Book</p>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{approveTarget.bookId?.title}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{approveTarget.bookId?.author} · ISBN {approveTarget.bookId?.isbn}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🎓</span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-400"}`}>Requested by</p>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{approveTarget.userId?.name}</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{approveTarget.userId?.email}</p>
                </div>
              </div>
            </div>

            {/* Loan days + Fine per day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1.5 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  📅 Loan Days
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="365"
                  value={approveDays}
                  onChange={(e) => setApproveDays(e.target.value)}
                  className={inputClass}
                  placeholder="14"
                />
                <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Due: {approveDays
                    ? new Date(Date.now() + Number(approveDays) * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </p>
              </div>
              <div>
                <label className={`block mb-1.5 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  💸 Fine / Day (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={approveFinePerDay}
                  onChange={(e) => setApproveFinePerDay(e.target.value)}
                  className={inputClass}
                  placeholder="Default (₹2)"
                />
                <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Leave blank for global rate
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
    </AppLayout>
  );
}
