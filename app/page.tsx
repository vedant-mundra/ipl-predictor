"use client";

import { useState } from "react";
import { usePredictions } from "@/hooks/usePredictions";
import { useResults } from "@/hooks/useResults";
import { useAuth } from "@/hooks/useAuth";
import { MatchCard } from "@/components/MatchCard";
import fixtures from "@/data/fixtures.json";
import type { Match } from "@/lib/types";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { TEAM_CONFIG } from "@/lib/teams";
import Image from "next/image";
import Link from "next/link";

const matches = fixtures as Match[];

type FilterType = "all" | "upcoming" | "live-locked" | "predicted";

export default function MatchesPage() {
  const { predict, getPrediction, clearPrediction, getPredictionCount, isHydrated: isPredsHydrated } = usePredictions();
  const { getResult } = useResults();
  const { users, currentUser, currentGroup, isHydrated: isAuthHydrated } = useAuth();
  
  const groupUsers = currentGroup ? users.filter(u => u.groupIds?.includes(currentGroup)) : [];
  const [filter, setFilter] = useState<FilterType>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");

  const isHydrated = isPredsHydrated && isAuthHydrated;

  const now = new Date();

  const uniqueTeams = Array.from(new Set(matches.flatMap(m => [m.team1, m.team2]))).sort();
  const uniqueVenues = Array.from(new Set(matches.map(m => m.venue))).sort();

  const withStatus = matches.map((m) => {
    const [h, min] = m.time.split(":").map(Number);
    const start = new Date(m.date);
    start.setHours(h, min, 0, 0);
    const locked = now >= start;
    const prediction = getPrediction(m.id);
    return { ...m, locked, prediction };
  });

  const filtered = withStatus.filter((m) => {
    if (filter === "upcoming" && m.locked) return false;
    if (filter === "live-locked" && !m.locked) return false;
    if (filter === "predicted" && !m.prediction) return false;
    
    if (teamFilter !== "all" && m.team1 !== teamFilter && m.team2 !== teamFilter) return false;
    if (venueFilter !== "all" && m.venue !== venueFilter) return false;
    
    return true;
  });

  const predictedCount = withStatus.filter((m) => m.prediction).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

      {/* Ticker Tape - All Team Logos */}
      <div className="w-full overflow-hidden bg-black/40 border-y border-[#D4AF37]/20 py-3 mb-8 -mx-4 sm:mx-0 sm:rounded-xl sm:border-x flex items-center shadow-lg shadow-black/50 backdrop-blur-md">
        <div className="text-[10px] font-black uppercase text-[#D4AF37] px-4 shrink-0 border-r border-[#D4AF37]/20 tracking-wider">TEAMS</div>
        <div className="flex-1 overflow-hidden relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/80 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent z-10" />

          <div className="ticker-track items-center gap-8 px-6">
            {/* Double array for seamless loop */}
            {[...Object.values(TEAM_CONFIG), ...Object.values(TEAM_CONFIG)].map((team, i) => (
              <Link href={`/team/${team.shortCode.toLowerCase()}`} key={i} className="flex items-center gap-2 group cursor-pointer transition-transform hover:scale-110">
                <div className="w-7 h-7 bg-white rounded-full p-[2px]">
                  <div className="relative w-full h-full">
                    <Image src={team.logo} alt={team.shortCode} fill className="object-contain p-[2px]" />
                  </div>
                </div>
                <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors">{team.shortCode}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Page header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            {/* Trophy Icon */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#B8860B] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] border border-[#FFF0A0]/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 w-full h-full translate-x-[-100%] skew-x-[-15deg] animate-[shimmer_3s_infinite]" />
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 text-black drop-shadow-md relative z-10">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 18.1 8.9 19 10 19H14C15.1 19 16 18.1 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM12 4C14.76 4 17 6.24 17 9C17 11.76 14.76 14 12 14C9.24 14 7 11.76 7 9C7 6.24 9.24 4 12 4ZM10 20H14V22H10V20Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
                Match <span className="gold-text">Fixtures</span>
              </h1>
              <p className="text-sm font-medium text-white/60 mt-1">
                Predict the winner of all 74 IPL matches
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3 max-w-sm">
            <span className="text-xs font-bold text-[#D4AF37] whitespace-nowrap">{predictedCount} / {matches.length} Predicts</span>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden flex-1 backdrop-blur-sm border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#FFD700] to-[#D4AF37] rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${(predictedCount / matches.length) * 100}%` }}
              >
                <div className="absolute inset-0 w-full h-full bg-white/30 skew-x-[-20deg] translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Column */}
        <div className="flex flex-col gap-3 w-full md:w-auto items-end">
          {/* Filter tabs */}
          <div className="flex bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10 w-full md:w-auto overflow-x-auto scx">
            {(
              [
                { key: "all", label: `All (${matches.length})` },
                { key: "upcoming", label: `Open` },
                { key: "live-locked", label: `Locked` },
                { key: "predicted", label: `Done` },
              ] as { key: FilterType; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 sm:px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap ${filter === key
                    ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD700]/10 text-[#FFD700] shadow-inner shadow-[#D4AF37]/20 border border-[#D4AF37]/30"
                    : "text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* New Match Filters */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
             <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs px-3 py-2 outline-none focus:border-[#D4AF37]/50 flex-1 min-w-[120px] transition-colors hover:bg-white/10"
            >
              <option value="all" className="bg-[#06080F]">All Teams</option>
              {uniqueTeams.map(t => <option key={t} value={t} className="bg-[#06080F]">{TEAM_CONFIG[t]?.shortCode || t}</option>)}
            </select>
            
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs px-3 py-2 outline-none focus:border-[#D4AF37]/50 flex-1 min-w-[120px] transition-colors hover:bg-white/10"
            >
              <option value="all" className="bg-[#06080F]">All Venues</option>
              {uniqueVenues.map(v => <option key={v} value={v} className="bg-[#06080F]">{v}</option>)}
            </select>
            
            {(teamFilter !== "all" || venueFilter !== "all") && (
              <button
                onClick={() => { setTeamFilter("all"); setVenueFilter("all"); }}
                className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors border border-red-500/20"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      {!isHydrated ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-3xl h-[380px] shimmer border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border-white/5 mt-4">
          <SparklesIcon className="w-12 h-12 text-[#D4AF37]/50 mb-4 pulse-glow rounded-full" />
          <p className="text-white/80 text-xl font-bold tracking-tight">No matches found</p>
          <p className="text-white/50 text-sm mt-1">Try selecting a different filter above</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((match, i) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={getPrediction(match.id)}
              result={getResult(match.id)}
              onPredict={predict}
              onClearPrediction={clearPrediction}
              index={i}
              predictionCount={getPredictionCount(match.id)}
              totalUsers={currentGroup ? groupUsers.length : 0}
              isLoggedIn={!!currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
