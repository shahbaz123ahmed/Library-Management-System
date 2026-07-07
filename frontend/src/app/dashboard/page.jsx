"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatsCard from "@/components/ui/StatsCard";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [extendedStats, setExtendedStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notifications, setNotifications] = useState({ dueSoon: [], overdue: [] });
  const [dataLoading, setDataLoading] = useState(true);
  const [activeModalContent, setActiveModalContent] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Fetch dashboard data only when user is available
  useEffect(() => {
    if (!user) return;
    
    const load = async () => {
      setDataLoading(true);
      try {
        const token = localStorage.getItem("lms_token");
        if (!token) {
          console.log("No token found");
          return;
        }

        const [statsRes, analyticsRes, notificationsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/dashboard/analytics"),
          api.get("/notifications"),
        ]);
        
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data.mostIssued || []);
        setExtendedStats(analyticsRes.data);
        setNotifications(notificationsRes.data);

        // Fetch activity logs for the timeline widget if Admin
        if (user.role === "admin") {
          try {
            const logsRes = await api.get("/activity-logs", { params: { limit: 5 } });
            setTimeline(logsRes.data.items || []);
          } catch (e) {
            console.error("Failed to load timeline logs:", e);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        if (error.response?.status === 403) {
          // Token expired, logout
          localStorage.removeItem("lms_token");
          router.push("/login");
        }
      } finally {
        setDataLoading(false);
      }
    };
    
    load();
  }, [user, router]);

  // Role-based dashboard configuration
  const getDashboardConfig = () => {
    if (!user) return {};
    
    switch (user.role) {
      case "admin":
        return {
          title: "Welcome to the Admin Panel of LMS",
          subtitle: "Complete control over users, books, and system settings.",
          icon: "👑",
          gradient: "from-blue-600 via-teal-600 to-green-600",
        };
      case "librarian":
        return {
          title: "Welcome to the Librarian Panel",
          subtitle: "Manage books, issue returns, and help readers.",
          icon: "📚",
          gradient: "from-blue-600 via-teal-600 to-green-600",
        };
      case "student":
        return {
          title: "Welcome to Lumen Library Management",
          subtitle: "Browse books, track your reading history, and manage borrows.",
          icon: "📖",
          gradient: "from-blue-600 via-teal-600 to-green-600",
        };
      default:
        return {
          title: "Welcome to Lumen Library Management",
          subtitle: "Your digital library companion.",
          icon: "📚",
          gradient: "from-blue-600 via-teal-600 to-green-600",
        };
    }
  };

  const config = getDashboardConfig();

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">📚</div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout title="Dashboard">
      {/* Personalized Hero Section */}
      <div className={`mb-8 rounded-3xl bg-gradient-to-r ${config.gradient} p-8 shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{config.icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-white">{config.title}</h1>
            <p className="mt-2 text-white/80">{config.subtitle}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                Role: {user.role?.toUpperCase()}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                Logged in as: {user.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Dynamic based on user role */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {user?.role === "admin" && (
          <>
            <StatsCard label="Total books" value={stats?.totalBooks ?? "--"} role={user.role} onClick={() => setActiveModalContent({ title: "Total Books", list: stats?.totalBooksList || [] })} />
            <StatsCard label="Issued books" value={stats?.issuedBooks ?? "--"} role={user.role} onClick={() => setActiveModalContent({ title: "Issued Books", list: stats?.issuedBooksList || [] })} />
            <StatsCard label="Available" value={stats?.availableBooks ?? "--"} role={user.role} onClick={() => setActiveModalContent({ title: "Available Books", list: stats?.availableBooksList || [] })} />
            <StatsCard label="Users" value={stats?.registeredUsers ?? "--"} role={user.role} onClick={() => setActiveModalContent({ title: "Registered Users", list: stats?.registeredUsersList || [] })} />
          </>
        )}
        
        {user?.role === "librarian" && (
          <>
            <StatsCard label="My Books" value={stats?.librarianBooks ?? "0"} role={user.role} onClick={() => setActiveModalContent({ title: "My Books", list: stats?.librarianBooksList || [] })} />
            <StatsCard label="Issued Today" value={stats?.todayIssues ?? "0"} role={user.role} onClick={() => setActiveModalContent({ title: "Issued Today", list: stats?.todayIssuesList || [] })} />
            <StatsCard label="Pending Returns" value={stats?.pendingReturns ?? "0"} role={user.role} onClick={() => setActiveModalContent({ title: "Pending Returns", list: stats?.pendingReturnsList || [] })} />
            <StatsCard label="Total Members" value={stats?.totalMembers ?? "--"} role={user.role} onClick={() => setActiveModalContent({ title: "Total Members", list: stats?.totalMembersList || [] })} />
          </>
        )}
        
        {user?.role === "student" && (
          <>
            <StatsCard 
              label="Books Borrowed" 
              value={stats?.myBorrows ?? "0"} 
              role={user.role} 
              onClick={() => setActiveModalContent({ title: "Books Borrowed", list: stats?.myBorrowsList || [] })} 
            />
            <StatsCard 
              label="Pending Requests" 
              value={stats?.pendingRequests ?? "0"} 
              role={user.role} 
              onClick={() => setActiveModalContent({ title: "Pending Requests", list: stats?.pendingRequestsList || [] })} 
            />
            <StatsCard 
              label="Due This Week" 
              value={stats?.dueThisWeek ?? "0"} 
              role={user.role} 
              onClick={() => setActiveModalContent({ title: "Due This Week", list: stats?.dueThisWeekList || [] })} 
            />
            <StatsCard 
              label="Total Read" 
              value={stats?.totalRead ?? "0"} 
              role={user.role} 
              onClick={() => setActiveModalContent({ title: "Total Read", list: stats?.totalReadList || [] })} 
            />
          </>
        )}
      </div>

      {/* Charts and Notifications Section */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">

        {/* ── Left Column: Charts & KPI Tables ── */}
        <div className="space-y-6">
          {/* Most Issued Books */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={`rounded-3xl bg-gradient-to-r ${config.gradient} p-[2px] shadow-xl`}
          >
            <div className={`rounded-[22px] p-6 transition-colors duration-300 ${
              isDark ? "bg-slate-800" : "bg-white"
            }`}>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${isDark ? "text-white" : "text-gray-800"}`}>Most issued books</h3>
              <p className={`mt-1 text-sm transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Top titles by issue count.</p>
              <div className="mt-6 h-64 w-full">
                {analytics.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={analytics} barSize={32}>
                      <XAxis dataKey="title" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                      <Tooltip
                        contentStyle={isDark ? { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#e2e8f0" } : { borderRadius: "12px" }}
                      />
                      <Bar dataKey="total" fill="#0f766e" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`flex h-full items-center justify-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    No data available
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Monthly Transaction Trends Line Chart */}
          {user?.role === "admin" && extendedStats && (
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={`rounded-3xl bg-gradient-to-r ${config.gradient} p-[2px] shadow-xl`}
            >
              <div className={`rounded-[22px] p-6 transition-colors duration-300 ${
                isDark ? "bg-slate-800" : "bg-white"
              }`}>
                <h3 className={`text-xl font-semibold transition-colors duration-300 ${isDark ? "text-white" : "text-gray-800"}`}>Monthly Transaction Trends</h3>
                <p className={`mt-1 text-sm transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Comparing borrow and return volumes over time.</p>
                <div className="mt-6 h-64 w-full">
                  {extendedStats.monthlyBorrows?.length > 0 || extendedStats.monthlyReturns?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart
                        data={
                          (() => {
                            const months = {};
                            (extendedStats.monthlyBorrows || []).forEach(b => {
                              months[b._id] = { month: b._id, borrows: b.count, returns: 0 };
                            });
                            (extendedStats.monthlyReturns || []).forEach(r => {
                              if (!months[r._id]) {
                                months[r._id] = { month: r._id, borrows: 0, returns: r.count };
                              } else {
                                months[r._id].returns = r.count;
                              }
                            });
                            return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
                          })()
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                        <YAxis tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                        <Tooltip contentStyle={isDark ? { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#e2e8f0" } : { borderRadius: "12px" }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="borrows" name="Borrows" stroke="#0ea5e9" strokeWidth={2.5} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="returns" name="Returns" stroke="#10b981" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={`flex h-full items-center justify-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Average Performance & Top lists */}
          {user?.role === "admin" && extendedStats && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Average Fine Card */}
              <div className={`p-6 rounded-3xl border flex flex-col justify-between shadow-md transition hover:shadow-lg ${
                isDark ? "bg-slate-800 border-slate-700/60" : "bg-white border-slate-200"
              }`}>
                <div>
                  <span className="text-3xl">🪙</span>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mt-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Average Fine Paid</h4>
                </div>
                <p className="text-3xl font-extrabold mt-4 text-teal-400">
                  ₹{extendedStats.avgFine ?? "0.00"}
                </p>
              </div>

              {/* Avg Duration Card */}
              <div className={`p-6 rounded-3xl border flex flex-col justify-between shadow-md transition hover:shadow-lg ${
                isDark ? "bg-slate-800 border-slate-700/60" : "bg-white border-slate-200"
              }`}>
                <div>
                  <span className="text-3xl">⏳</span>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mt-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Avg Borrow Duration</h4>
                </div>
                <p className="text-3xl font-extrabold mt-4 text-indigo-400">
                  {extendedStats.avgBorrowDuration ?? "0.0"} Days
                </p>
              </div>

              {/* Most Borrowed Authors */}
              <div className={`p-6 rounded-3xl border shadow-md ${
                isDark ? "bg-slate-800 border-slate-700/60" : "bg-white border-slate-200"
              }`}>
                <h4 className={`text-xs uppercase font-bold tracking-wider mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>✍️ Most Borrowed Authors</h4>
                <ul className="space-y-3.5 text-sm">
                  {extendedStats.topAuthors?.length > 0 ? (
                    extendedStats.topAuthors.map((item, i) => (
                      <li key={i} className="flex justify-between items-center pb-2 border-b last:border-none last:pb-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                        <span className="font-semibold">{item.author}</span>
                        <span className="text-xs text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded">{item.count} borrows</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 text-xs">No borrow records</li>
                  )}
                </ul>
              </div>

              {/* Active Librarians */}
              <div className={`p-6 rounded-3xl border shadow-md ${
                isDark ? "bg-slate-800 border-slate-700/60" : "bg-white border-slate-200"
              }`}>
                <h4 className={`text-xs uppercase font-bold tracking-wider mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>📚 Most Active Librarians</h4>
                <ul className="space-y-3.5 text-sm">
                  {extendedStats.activeLibrarians?.length > 0 ? (
                    extendedStats.activeLibrarians.map((item, i) => (
                      <li key={i} className="flex justify-between items-center pb-2 border-b last:border-none last:pb-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">{item.count} actions</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 text-xs">No activity logged</li>
                  )}
                </ul>
              </div>

              {/* Books Never Borrowed */}
              <div className={`p-6 rounded-3xl border shadow-md md:col-span-2 ${
                isDark ? "bg-slate-800 border-slate-700/60" : "bg-white border-slate-200"
              }`}>
                <h4 className={`text-xs uppercase font-bold tracking-wider mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>❄️ Books Never Borrowed</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extendedStats.booksNeverBorrowed?.length > 0 ? (
                    extendedStats.booksNeverBorrowed.map((item, i) => (
                      <div key={i} className="p-3 bg-slate-750/35 rounded-xl border border-slate-700/40 text-sm truncate" title={item.title}>
                        <span className="font-semibold block truncate text-slate-200">{item.title}</span>
                        <span className="text-xs text-slate-500">by {item.author}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-xs py-2 col-span-2">All books have been borrowed at least once!</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Notifications & Audit Timeline ── */}
        <div className="space-y-6">
          {/* Notifications */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={`flex flex-col rounded-3xl bg-gradient-to-r ${config.gradient} p-[2px] shadow-xl`}
          >
            <div className={`flex flex-col flex-1 rounded-[22px] p-6 transition-colors duration-300 ${
              isDark ? "bg-slate-800" : "bg-white"
            }`}>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${isDark ? "text-white" : "text-gray-800"}`}>Notifications</h3>
              <p className={`mt-1 text-sm transition-colors duration-300 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Upcoming and overdue returns.</p>
              
              <div className="mt-6 flex-1 space-y-4 text-left">
                <div>
                  <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Due soon</p>
                  <ul className={`mt-2 space-y-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {notifications.dueSoon?.length ? (
                      notifications.dueSoon.slice(0, 4).map((item) => (
                        <li key={item._id} className={`rounded-xl px-3 py-2 transition-colors duration-300 ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}>
                          {item.bookId?.title} · {item.userId?.name}
                        </li>
                      ))
                    ) : (
                      <li className={isDark ? "text-slate-500" : "text-slate-400"}>No upcoming dues</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Overdue</p>
                  <ul className={`mt-2 space-y-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {notifications.overdue?.length ? (
                      notifications.overdue.slice(0, 4).map((item) => (
                        <li key={item._id} className={`rounded-xl px-3 py-2 transition-colors duration-300 ${isDark ? "bg-orange-500/10" : "bg-orange-50"}`}>
                          {item.bookId?.title} · {item.userId?.name}
                        </li>
                      ))
                    ) : (
                      <li className={isDark ? "text-slate-500" : "text-slate-400"}>No overdue books</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Premium Divider & Quote */}
              <div className={`mt-6 pt-4 border-t ${isDark ? "border-slate-700/60" : "border-slate-100"}`}>
                <p className={`text-[12px] italic text-center font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  "To read is to fly: it is to soar to a point of vantage which gives a view over the whole terrain of history, science, or art."
                </p>
                <p className={`mt-1 text-[10px] text-center uppercase tracking-wider ${isDark ? "text-teal-400/80" : "text-teal-600"}`}>
                  — Library Companion
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent System Activity Timeline Widget */}
          {user?.role === "admin" && timeline.length > 0 && (
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={`rounded-3xl bg-gradient-to-r ${config.gradient} p-[2px] shadow-xl`}
            >
              <div className={`rounded-[22px] p-6 text-left transition-colors duration-300 ${
                isDark ? "bg-slate-800" : "bg-white"
              }`}>
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>Recent System Activity</h3>
                <p className={`text-xs mt-1 mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Real-time audit log stream.</p>
                
                <div className="relative border-l border-teal-500/30 pl-4 space-y-5 ml-1">
                  {timeline.map((log) => (
                    <div key={log._id} className="relative text-xs">
                      {/* Timeline marker node */}
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-slate-850" />
                      
                      <span className="text-slate-500 font-bold block text-[10px]">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className={`mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        <strong className={isDark ? "text-slate-100" : "text-slate-800"}>{log.performedByName}</strong> {log.action.toLowerCase()}{" "}
                        {log.targetBookTitle && <span className="text-teal-400 font-semibold">"{log.targetBookTitle}"</span>}
                        {log.targetUserName && <span className="text-indigo-400 font-semibold">"{log.targetUserName}"</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

      </div>

      {/* ── Generic Dashboard Modal ── */}
      {activeModalContent && (
        <div className="relative z-[100]">
          <Modal
            open={!!activeModalContent}
            onClose={() => setActiveModalContent(null)}
            title={activeModalContent.title}
          >
          <div className="flex flex-col gap-3">
            {activeModalContent.list.length > 0 ? (
              activeModalContent.list.map((item) => {
                const isUser = !!item.email;
                const isBook = !!item.title && !item.bookId;
                const isTransaction = !!item.bookId;

                const displayTitle = isUser ? item.name : (isBook ? item.title : (item.bookId?.title || "Unknown Book"));
                const displaySubtitle = isUser ? item.email : (isBook ? item.author : (item.bookId?.author || "Unknown Author"));
                const displayImg = isUser ? item.avatar : (isBook ? item.coverImage : item.bookId?.coverImage);
                const emoji = isUser ? "👤" : "📚";

                return (
                  <div
                    key={item._id}
                    className={`flex items-center gap-4 rounded-xl p-3 border transition-colors ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    {/* Tiny Cover Image or Avatar */}
                    <div className="h-12 w-9 flex-shrink-0 rounded bg-slate-200 overflow-hidden shadow-sm">
                      {displayImg ? (
                        <img src={displayImg} alt={displayTitle} className="h-full w-full object-cover" />
                      ) : (
                        <div className={`h-full w-full flex items-center justify-center text-xs ${isDark ? "bg-slate-700 text-slate-500" : "bg-slate-200 text-slate-400"}`}>
                          {emoji}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                        {displayTitle}
                      </p>
                      <p className={`truncate text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {displaySubtitle}
                      </p>
                    </div>

                    {/* Date/Status tag */}
                    <div className="flex-shrink-0 text-right">
                      {isTransaction && (
                        <>
                          <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                            {item.status}
                          </p>
                          {item.dueDate && (
                            <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                              Due: {new Date(item.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </>
                      )}
                      {isUser && (
                        <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                          {item.role}
                        </p>
                      )}
                      {isBook && item.available !== undefined && (
                        <p className={`text-[10px] font-semibold tracking-widest ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                          Available: {item.available}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-70">
                <span className="text-4xl mb-2">🤷‍♂️</span>
                <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>No items found for this category.</p>
              </div>
            )}
          </div>
          </Modal>
        </div>
      )}

    </AppLayout>
  );
}