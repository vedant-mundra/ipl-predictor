"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrophyIcon, CalendarIcon, ShieldCheckIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "Matches", icon: CalendarIcon },
  { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon },
  { href: "/admin", label: "Results", icon: ShieldCheckIcon },
];

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, currentGroup, logout } = useAuth();
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    if (currentGroup) {
      const fetchCount = async () => {
        const { count } = await supabase
          .from("user_groups")
          .select("*", { count: "exact", head: true })
          .eq("group_id", currentGroup);
        if (count !== null) setUserCount(count);
      };
      fetchCount();
    } else {
      setUserCount(null);
    }
  }, [currentGroup]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4AF37]/15"
      style={{ background: "rgba(6,8,15,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Cricket ball icon */}
            <div className="relative w-9 h-9 shrink-0">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                <circle cx="18" cy="18" r="17" fill="url(#ballGrad)" stroke="#D4AF37" strokeWidth="0.8"/>
                {/* Seam lines */}
                <path d="M10 8 Q18 15 10 28" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.9"/>
                <path d="M26 8 Q18 15 26 28" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.9"/>
                <path d="M8 13 Q13 18 8 23" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.6"/>
                <path d="M28 13 Q23 18 28 23" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.6"/>
                <defs>
                  <radialGradient id="ballGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#CC2200"/>
                    <stop offset="100%" stopColor="#7A0000"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col leading-tight whitespace-nowrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] gold-text">TATA</span>
                <span className="text-sm font-black tracking-wide text-white">IPL</span>
              </div>
              <span className="text-[10px] font-semibold text-[#D4AF37]/70 uppercase tracking-widest">Predictor 2026</span>
            </div>
          </Link>

          {/* Nav links & Auth */}
          <div className="flex items-center gap-1 sm:gap-4">
            <div className="flex flex-col items-end mr-0.5 sm:mr-2 scale-[0.85] sm:scale-100 origin-right min-w-[fit-content]">
              {currentGroup && userCount !== null && (
                <div className="flex items-center gap-1 sm:gap-1.5 text-[#D4AF37] bg-[#D4AF37]/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#D4AF37]/20">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    🔥 {userCount} <span className="hidden sm:inline">Playing</span>
                  </span>
                </div>
              )}
              {currentUser && (
                <Link href="/groups" className="text-[8px] sm:text-[9px] text-gray-400 hover:text-white uppercase font-bold tracking-[0.1em] sm:tracking-widest mt-1 mr-0.5 sm:mr-1 transition-colors whitespace-nowrap">
                  <span className="hidden sm:inline">Switch / Join </span>League &rarr;
                </Link>
              )}
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 mr-1 sm:mr-4">
              {navLinks.map(({ href, label, icon: Icon }) => {
                if (href === "/admin" && !currentUser?.isAdmin) return null;
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      isActive
                        ? "border-[#D4AF37]/40 text-[#D4AF37]"
                        : "border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10"
                    }`}
                    style={isActive ? { background: "rgba(212,175,55,0.12)" } : {}}
                  >
                    <Icon className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth section */}
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-white/10 pl-1.5 sm:pl-4">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-white/90 font-medium">
                    <UserCircleIcon className="w-5 h-5 text-[#D4AF37]" />
                    {currentUser.username}
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all"
                    title="Log Out"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/login"
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white/80 hover:text-white transition-colors whitespace-nowrap"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold bg-[#D4AF37] hover:bg-[#B38F22] text-black rounded-lg transition-colors whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
