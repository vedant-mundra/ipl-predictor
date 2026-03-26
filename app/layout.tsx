import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "IPL Predictor 2026 – Predict the Champion",
  description:
    "Predict the winner of every IPL 2026 match before they start. Track your score on the leaderboard. Frontend-only, no sign-up required.",
};

import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-outfit antialiased bg-[#06080F] text-white min-h-screen`} suppressHydrationWarning>
        <AuthProvider>
        <div className="relative min-h-screen cricket-bg">
          {/* IPL-themed ambient background glows */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Gold glow — top left */}
            <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-3xl" />
            {/* Deep blue — top right */}
            <div className="absolute -top-24 -right-48 w-[450px] h-[450px] bg-[#003087]/12 rounded-full blur-3xl" />
            {/* Cricket green — bottom center */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[700px] h-72 bg-[#1a4a2e]/10 rounded-full blur-3xl" />
            {/* Red accent — mid left */}
            <div className="absolute top-1/2 -left-32 w-64 h-64 bg-[#CC0000]/6 rounded-full blur-3xl" />
            {/* Gold accent — bottom right */}
            <div className="absolute bottom-1/4 -right-24 w-72 h-72 bg-[#D4AF37]/6 rounded-full blur-3xl" />
          </div>

          <Navbar />

          <main className="relative z-10 pt-16">
            {children}
          </main>
        </div>
        </AuthProvider>
      </body>
    </html>
  );
}
