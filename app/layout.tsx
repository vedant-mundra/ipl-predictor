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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-outfit antialiased bg-[#080B14] text-white min-h-screen`} suppressHydrationWarning>
        <div className="relative min-h-screen">
          {/* Ambient background glows */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[600px] h-64 bg-purple-500/5 rounded-full blur-3xl" />
          </div>

          <Navbar />

          <main className="relative z-10 pt-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
