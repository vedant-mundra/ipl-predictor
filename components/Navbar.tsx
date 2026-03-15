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
            <div className="flex flex-col leading-tight">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] gold-text">TATA</span>
                <span className="text-sm font-black tracking-wide text-white">IPL</span>
              </div>
              <span className="text-[10px] font-semibold text-[#D4AF37]/70 uppercase tracking-widest">Predictor 2026</span>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? "border-[#D4AF37]/40 text-[#D4AF37]"
                      : "border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10"
                  }`}
                  style={isActive ? { background: "rgba(212,175,55,0.12)" } : {}}
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
