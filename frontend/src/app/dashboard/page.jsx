"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatsCard from "@/components/ui/StatsCard";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [notifications, setNotifications] = useState({ dueSoon: [], overdue: [] });
  const [dataLoading, setDataLoading] = useState(true);
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
        setNotifications(notificationsRes.data);
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
            <StatsCard label="Total books" value={stats?.totalBooks ?? "--"} role={user.role} />
            <StatsCard label="Issued books" value={stats?.issuedBooks ?? "--"} role={user.role} />
            <StatsCard label="Available" value={stats?.availableBooks ?? "--"} role={user.role} />
            <StatsCard label="Users" value={stats?.registeredUsers ?? "--"} role={user.role} />
          </>
        )}
        
        {user?.role === "librarian" && (
          <>
            <StatsCard label="My Books" value={stats?.librarianBooks ?? "0"} role={user.role} />
            <StatsCard label="Issued Today" value={stats?.todayIssues ?? "0"} role={user.role} />
            <StatsCard label="Pending Returns" value={stats?.pendingReturns ?? "0"} role={user.role} />
            <StatsCard label="Total Members" value={stats?.totalMembers ?? "--"} role={user.role} />
          </>
        )}
        
        {user?.role === "student" && (
          <>
            <StatsCard label="Books Borrowed" value={stats?.myBorrows ?? "0"} role={user.role} />
            <StatsCard label="Pending Requests" value={stats?.pendingRequests ?? "0"} role={user.role} />
            <StatsCard label="Due This Week" value={stats?.dueThisWeek ?? "0"} role={user.role} />
            <StatsCard label="Total Read" value={stats?.totalRead ?? "0"} role={user.role} />
          </>
        )}
      </div>

      {/* Charts and Notifications Section */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">

        {/* ── Most Issued Books ── */}
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
                <ResponsiveContainer width="100%" height="100%">
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
 
        {/* ── Notifications ── */}
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
            
            <div className="mt-6 flex-1 space-y-4">
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

      </div>
    </AppLayout>
  );
}