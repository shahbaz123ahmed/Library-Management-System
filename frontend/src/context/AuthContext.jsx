"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "@/lib/api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("lms_token");
      if (token) {
        fetchMe();
        return;
      }
    }
    setLoading(false);
  }, []);

  const login = async (form) => {
    const { data } = await api.post("/auth/login", { email: form.email, password: form.password });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const oauthLogin = (token, userData) => {
    setAuthToken(token);
    setUser(userData);
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    toast.success("Signed out");
  };

  const value = useMemo(
    () => ({ user, loading, login, oauthLogin, register, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};