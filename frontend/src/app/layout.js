import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";  // 👈 ADD THIS
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "Lumen Library",
  description: "Modern Library Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>        {/* 👈 WRAP OUTSIDE AuthProvider */}
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}