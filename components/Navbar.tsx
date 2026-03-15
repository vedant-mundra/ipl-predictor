"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrophyIcon, CalendarIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const navLinks = [
  { href: "/", label: "Matches", icon: CalendarIcon },
  { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon },
  { href: "/admin", label: "Results", icon: ShieldCheckIcon },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-black shadow-lg shadow-orange-500/30">
              🏏
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white">IPL Predictor</span>
              <span className="text-[10px] font-medium text-orange-400/80 uppercase tracking-wider">2026 Season</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
