"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthBackground";

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const activeTab = pathname === "/register" ? "register" : "login";

  return (
    <AuthShell activeTab={activeTab} isDark={isDark} setIsDark={setIsDark}>
      {children}
    </AuthShell>
  );
}
