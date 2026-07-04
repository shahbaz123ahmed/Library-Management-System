import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";  // 👈 ADD THIS
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "Lumen Library",
  description: "Modern Library Management System",
};

export default function RootLayout({ children }) {
  // We use NEXT_PUBLIC_GOOGLE_CLIENT_ID from .env.local
  // Fallback to empty string to prevent crashes if it's missing initially
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body>
        <GoogleOAuthProvider clientId={googleClientId}>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}