"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const typeConfig = {
  AUTH: { bg: "bg-red-500/15 text-red-400 border-red-500/30", label: "🔐 Auth" },
  BOOK: { bg: "bg-teal-500/15 text-teal-400 border-teal-500/30", label: "📚 Book" },
  CATEGORY: { bg: "bg-purple-500/15 text-purple-400 border-purple-500/30", label: "📂 Category" },
  TRANSACTION: { bg: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "🔄 Transaction" },
  USER: { bg: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: "👤 User" },
  CHATBOT: { bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", label: "🤖 Chatbot" },
  NOTIFICATION: { bg: "bg-pink-500/15 text-pink-400 border-pink-500/30", label: "🔔 Notification" }
};

export default function ActivityLogsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters state
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState("");
  const [userRole, setUserRole] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedLog, setSelectedLog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const fetchLogs = async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        activityType,
        userRole,
        status,
        startDate,
        endDate
      };
      // Strip empty values
      Object.keys(params).forEach(key => {
        if (params[key] === "") delete params[key];
      });

      const { data } = await api.get("/activity-logs", { params });
      setLogs(data.items || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error("Failed to load activity logs");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user, page, activityType, userRole, status, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExport = async (format) => {
    try {
      const params = {
        search,
        activityType,
        userRole,
        status,
        startDate,
        endDate,
        format
      };
      Object.keys(params).forEach(key => {
        if (params[key] === "") delete params[key];
      });

      const response = await api.get("/activity-logs", { 
        params, 
        responseType: format === "csv" ? "blob" : "json" 
      });

      if (format === "csv") {
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity_logs_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("CSV exported successfully");
      } else {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(response.data, null, 2)
        )}`;
        const a = document.createElement("a");
        a.href = jsonString;
        a.download = `activity_logs_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("JSON exported successfully");
      }
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const viewDetails = (log) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const resetFilters = () => {
    setSearch("");
    setActivityType("");
    setUserRole("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <AppLayout>
      <div className={`p-6 min-h-screen ${isDark ? "text-slate-100" : "text-slate-800"}`}>
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>
              🏛️ Centralized System Audit Logs
            </h1>
            <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Monitor and track critical activity records across the multi-library engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("csv")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                isDark 
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-teal-300"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-teal-700"
              }`}
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                isDark 
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-indigo-300"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-indigo-700"
              }`}
            >
              📄 Export JSON
            </button>
          </div>
        </div>

        {/* Filters grid */}
        <div className={`p-4 rounded-xl border mb-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase font-bold tracking-wider mb-1.5 block">Search Actions / Users</label>
              <input
                type="text"
                placeholder="Search description, name, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDark ? "bg-slate-800 border-slate-750 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-1.5 block">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDark ? "bg-slate-800 border-slate-750 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="">All Types</option>
                <option value="AUTH">🔐 Auth</option>
                <option value="BOOK">📚 Book</option>
                <option value="CATEGORY">📂 Category</option>
                <option value="TRANSACTION">🔄 Transaction</option>
                <option value="USER">👤 User</option>
                <option value="CHATBOT">🤖 Chatbot</option>
                <option value="NOTIFICATION">🔔 Notification</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-1.5 block">User Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDark ? "bg-slate-800 border-slate-750 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="librarian">Librarian</option>
                <option value="student">Student</option>
                <option value="System">System</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-1.5 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDark ? "bg-slate-800 border-slate-750 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={resetFilters}
                className="w-full py-2 text-xs font-semibold rounded-lg border transition hover:bg-slate-100 hover:text-slate-800 border-slate-300"
              >
                🧹 Reset
              </button>
            </div>
          </form>

          {/* Dates row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-1.5 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDark ? "bg-slate-800 border-slate-750 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-1.5 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  isDark ? "bg-slate-800 border-slate-750 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Logs Table / List */}
        <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          {fetchLoading ? (
            <div className="py-20 text-center text-sm">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-teal-500 border-t-transparent mb-2"></div>
              <p>Fetching enterprise logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              <span className="text-4xl block mb-2">📋</span>
              No audit logs found matching the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    isDark ? "border-slate-800 text-slate-400 bg-slate-850/40" : "border-slate-100 text-slate-500 bg-slate-50"
                  }`}>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Performed By</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Target Entity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const type = typeConfig[log.activityType] || { bg: "bg-slate-500/10 text-slate-400 border-slate-200", label: log.activityType };
                    return (
                      <tr key={log._id} className={`border-b transition hover:bg-slate-50/5 ${
                        isDark ? "border-slate-800/60" : "border-slate-100"
                      }`}>
                        <td className="p-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-bold uppercase ${type.bg}`}>
                            {type.label}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap font-medium text-slate-300">
                          {log.action}
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-400">{log.performedByName}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.userRole === "admin" 
                              ? "bg-red-500/10 text-red-400"
                              : log.userRole === "librarian"
                                ? "bg-teal-500/10 text-teal-400"
                                : log.userRole === "student"
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "bg-slate-500/10 text-slate-400"
                          }`}>
                            {log.userRole}
                          </span>
                        </td>
                        <td className="p-4 max-w-[200px] truncate" title={log.targetBookTitle || log.targetUserName || "-"}>
                          {log.targetBookTitle ? (
                            <span className="text-teal-400">📖 {log.targetBookTitle}</span>
                          ) : log.targetUserName ? (
                            <span className="text-indigo-400">👤 {log.targetUserName}</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            log.status === "success" ? "text-green-500" : "text-red-500"
                          }`}>
                            {log.status === "success" ? "● Success" : "○ Failed"}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <button
                            onClick={() => viewDetails(log)}
                            className="text-xs text-teal-400 hover:text-teal-300 underline font-semibold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {pages > 1 && (
            <div className="p-4 flex items-center justify-center border-t border-slate-800">
              <Pagination page={page} pages={pages} onChange={setPage} />
            </div>
          )}
        </div>

        {/* Detailed Logs Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="📋 Audit Log Details">
          {selectedLog && (
            <div className="space-y-4 text-left p-2">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-slate-500 text-xs uppercase block">Timestamp</span>
                  <span className="text-sm font-semibold">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase block">Activity Type</span>
                  <span className="text-sm font-semibold">{selectedLog.activityType}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase block">Action Actioned</span>
                  <span className="text-sm font-semibold text-teal-400">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase block">Overall Status</span>
                  <span className={`text-sm font-semibold ${selectedLog.status === "success" ? "text-green-400" : "text-red-400"}`}>
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-slate-500 text-xs uppercase block">Performed By</span>
                  <span className="text-sm font-semibold">{selectedLog.performedByName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase block">User Role</span>
                  <span className="text-sm font-semibold">{selectedLog.userRole}</span>
                </div>
                {selectedLog.targetBookTitle && (
                  <div>
                    <span className="text-slate-500 text-xs uppercase block">Target Book</span>
                    <span className="text-sm font-semibold text-indigo-300">{selectedLog.targetBookTitle}</span>
                  </div>
                )}
                {selectedLog.targetUserName && (
                  <div>
                    <span className="text-slate-500 text-xs uppercase block">Target User</span>
                    <span className="text-sm font-semibold text-indigo-300">{selectedLog.targetUserName}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-500 text-xs uppercase block">Client Network & Browser</span>
                <p className="text-xs text-slate-300 mt-1"><strong>IP:</strong> {selectedLog.ipAddress || "Unknown"}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed break-all"><strong>UA:</strong> {selectedLog.userAgent || "Unknown"}</p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-slate-500 text-xs uppercase block mb-1">Structured Action Metadata</span>
                  <pre className="p-3 bg-slate-950 rounded-lg text-[11px] text-teal-300 font-mono overflow-auto max-h-[200px] border border-slate-850">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
