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

const emptyForm = { name: "", email: "", password: "", role: "student" };

const roleConfig = {
  admin: {
    badge: (isDark) => isDark ? "bg-red-500/15 text-red-300 border border-red-500/30" : "bg-red-50 text-red-700 border border-red-200",
    avatar: (isDark) => isDark ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600",
    icon: "👑",
  },
  librarian: {
    badge: (isDark) => isDark ? "bg-teal-500/15 text-teal-300 border border-teal-500/30" : "bg-teal-50 text-teal-700 border border-teal-200",
    avatar: (isDark) => isDark ? "bg-teal-500/15 text-teal-400" : "bg-teal-50 text-teal-600",
    icon: "📚",
  },
  student: {
    badge: (isDark) => isDark ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" : "bg-blue-50 text-blue-700 border border-blue-200",
    avatar: (isDark) => isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600",
    icon: "🎓",
  },
};

export default function UsersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const fetchUsers = async () => {
    const { data } = await api.get("/users", { params: { page } });
    setItems(data.items);
    setPages(data.pages);
  };

  useEffect(() => {
    if (!user) return;
    fetchUsers();
  }, [user, page]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({ name: item.name, email: item.email, password: "", role: item.role });
    setModalOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, form);
        toast.success("User updated");
      } else {
        await api.post("/users", form);
        toast.success("User added");
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${
    isDark
      ? "bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-teal-500"
      : "bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-teal-500"
  }`;

  // Filtered list by search
  const filtered = items.filter(
    (item) =>
      (item.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (item.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (item.role ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Users">

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
              className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-teal-300/70"
            >
              Admin Panel
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-3xl font-bold text-white"
            >
              User Management
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-2 text-sm text-white/55"
            >
              Assign roles and manage accounts.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(13,148,136,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreate}
              className="rounded-full bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-teal-600/25 transition-all"
            >
              ✨ Add User
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role…"
              className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all duration-200 focus:ring-2 ${
                isDark
                  ? "bg-slate-900/60 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
                  : "bg-white border border-slate-200 text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
          </div>

          {/* Role count pills */}
          <div className="flex gap-2 flex-wrap">
            {["admin", "librarian", "student"].map((role) => {
              const count = items.filter((i) => i.role === role).length;
              const cfg = roleConfig[role];
              return (
                <span key={role} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${cfg.badge(isDark)}`}>
                  {cfg.icon} {count} {role}{count !== 1 ? "s" : ""}
                </span>
              );
            })}
          </div>

          {/* Total count */}
          <motion.span
            key={filtered.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`ml-auto rounded-full px-3 py-1.5 text-xs font-bold ${
              isDark ? "bg-teal-500/15 text-teal-400" : "bg-teal-50 text-teal-700"
            }`}
          >
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </motion.span>
        </div>
      </motion.div>

      {/* ── User List ── */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((item, index) => {
            const cfg = roleConfig[item.role] || roleConfig.student;
            return (
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
                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${cfg.avatar(isDark)}`}>
                      {item.name?.charAt(0)?.toUpperCase() || cfg.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold transition-colors duration-300 ${isDark ? "text-white" : "text-slate-900"}`}>
                        {item.name}
                      </p>
                      <p className={`text-xs mt-0.5 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {item.email}
                      </p>
                    </div>
                  </div>

                  {/* Right: role badge + actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${cfg.badge(isDark)}`}>
                      {cfg.icon} {item.role}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEdit(item)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-200 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:border-teal-500 hover:text-teal-400"
                          : "border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600"
                      }`}
                    >
                      ✏️ Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(239,68,68,0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(item._id)}
                      className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      🗑️ Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-2xl border p-12 text-center ${
              isDark ? "border-slate-700/50 bg-slate-800/40" : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-3xl mb-3">👤</p>
            <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No users found
            </p>
          </motion.div>
        )}
      </div>

      <div className="mt-6">
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modalOpen}
        title={editingId ? "Edit User" : "Add User"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="grid gap-4">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="Full name"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
            placeholder="Email address"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
            placeholder={editingId ? "New password (optional)" : "Password"}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputClass}
          >
            <option value="admin">👑 Admin</option>
            <option value="librarian">📚 Librarian</option>
            <option value="student">🎓 Student</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(13,148,136,0.3)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="rounded-full bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md"
          >
            {editingId ? "Update User" : "Create User"}
          </motion.button>
        </form>
      </Modal>
    </AppLayout>
  );
}
