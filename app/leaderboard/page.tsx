"use client";

import { useMemo } from "react";
import { usePredictions } from "@/hooks/usePredictions";
import { useResults, useCurrentUser } from "@/hooks/useResults";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import fixtures from "@/data/fixtures.json";
import simulatedUsers from "@/data/users.json";
import type { Match, LeaderboardEntry } from "@/lib/types";
import { UserCircleIcon } from "@heroicons/react/24/outline";

const matches = fixtures as Match[];

// Medal colors and styles
const medalColors = [
  "from-[#FFD700] to-[#D4AF37]", // Gold
  "from-[#E0E0E0] to-[#A0A0A0]", // Silver
  "from-[#CD7F32] to-[#A0522D]"  // Bronze
];
const medalText = ["text-[#FFD700]", "text-gray-300", "text-[#CD7F32]"];

export default function LeaderboardPage() {
  const { predictions, isHydrated } = usePredictions();
  const { results } = useResults();
  const { currentUser, setCurrentUser } = useCurrentUser();
  const [userName, setUserName] = useLocalStorage<string>("ipl_username_2026", "You");

  const leaderboard = useMemo((): LeaderboardEntry[] => {
    const completedMatchIds = results.map((r) => r.id);

    // Current user entry
    const currentUserCorrect = completedMatchIds.filter((id) => {
      const pred = predictions[String(id)];
      const result = results.find((r) => r.id === id);
      return pred && result && pred.team === result.winner;
    }).length;

    const currentUserTotal = completedMatchIds.filter((id) => predictions[String(id)]).length;

    const entries: LeaderboardEntry[] = [
      {
        rank: 0,
        userId: "current_user",
        name: (userName as string) || "You",
        avatar: ((userName as string) || "You").slice(0, 2).toUpperCase(),
        correct: currentUserCorrect,
        total: currentUserTotal,
        isCurrentUser: true,
      },
    ];

    // Simulated users
    for (const user of simulatedUsers) {
      const userPredictions = user.predictions as Record<string, string>;
      const correct = completedMatchIds.filter((id) => {
        const pred = userPredictions[String(id)];
        const result = results.find((r) => r.id === id);
        return pred && result && pred === result.winner;
      }).length;

      const total = completedMatchIds.filter((id) => userPredictions[String(id)]).length;

      entries.push({
        rank: 0,
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        correct,
        total,
        isCurrentUser: false,
      });
    }

    // Sort by correct desc, then total desc
    entries.sort((a, b) => b.correct - a.correct || b.total - a.total);
    entries.forEach((e, i) => (e.rank = i + 1));

    return entries;
  }, [predictions, results, userName]);

  const completedMatches = results.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] mb-4 border-2 border-[#FFF0A0]/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/30 w-full h-full skew-x-[-20deg] translate-x-[-150%] animate-[shimmer_3s_infinite]" />
          <span className="text-3xl filter drop-shadow-md relative z-10">👑</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
          Global <span className="gold-text">Rankings</span>
        </h1>
        <p className="text-sm font-medium text-[#D4AF37] mt-2 tracking-wider uppercase">
          {completedMatches} / {matches.length} Matches Completed
        </p>
      </div>

      {/* Username input */}
      <div className="glass rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center gap-4 border-[#D4AF37]/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <UserCircleIcon className="w-7 h-7 text-[#D4AF37]" />
        </div>
        <div className="flex-1 w-full text-center sm:text-left z-10">
          <p className="text-[10px] text-white/40 mb-1 font-bold tracking-widest uppercase">Display Name</p>
          <input
            type="text"
            value={userName as string}
            onChange={(e) => {
              setUserName(e.target.value);
              setCurrentUser(e.target.value);
            }}
            placeholder="Enter your name..."
            className="w-full bg-transparent text-white text-lg font-black outline-none placeholder-white/20 focus:text-[#FFD700] transition-colors"
            maxLength={20}
          />
        </div>
        <div className="hidden sm:block text-[#D4AF37] opacity-30 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      </div>

      {/* Top 3 podium (if results available) */}
      {completedMatches > 0 && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-10 items-end mt-16 px-2 sm:px-10">
          {[1, 0, 2].map((posIndex) => { // Render order: 2nd, 1st, 3rd to make a visual podium
            const entry = leaderboard[posIndex];
            if (!entry) return null;
            const isFirst = posIndex === 0;
            const isSecond = posIndex === 1;
            const isThird = posIndex === 2;
            
            return (
              <div
                key={entry.userId}
                className={`flex flex-col items-center relative transition-transform hover:-translate-y-2 duration-300 ${
                  isFirst ? "z-10" : "z-0"
                }`}
              >
                {/* Crown for 1st */}
                {isFirst && <div className="absolute -top-8 text-2xl filter drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] animate-bounce">👑</div>}
                
                {/* Avatar */}
                <div className={`rounded-full flex items-center justify-center font-black text-white shadow-xl border-4 ${
                  isFirst ? "w-20 h-20 text-xl border-[#FFD700] bg-gradient-to-br from-[#FFD700]/20 to-[#B8860B]/40" : 
                  isSecond ? "w-16 h-16 text-lg border-[#E0E0E0] bg-white/10" : 
                  "w-16 h-16 text-lg border-[#CD7F32] bg-white/10"
                } ${entry.isCurrentUser ? "ring-2 ring-white ring-offset-2 ring-offset-[#06080F]" : ""}`}>
                  {entry.avatar}
                </div>
                
                {/* Player Name */}
                <p className={`font-bold mt-3 mb-2 truncate w-full text-center ${isFirst ? "text-[#FFD700] text-sm" : "text-white/80 text-xs"}`}>
                  {entry.name}
                </p>

                {/* Podium Block */}
                <div className={`w-full rounded-t-xl bg-gradient-to-b ${medalColors[posIndex]} p-0.5 shadow-lg`}>
                  <div className={`w-full h-full bg-[#06080F]/90 rounded-t-[10px] flex flex-col items-center justify-start ${
                    isFirst ? "pt-6 pb-2 min-h-[140px]" : 
                    isSecond ? "pt-4 pb-2 min-h-[110px]" : 
                    "pt-4 pb-2 min-h-[90px]"
                  }`}>
                    <span className={`text-3xl font-black ${medalText[posIndex]}`}>{entry.correct}</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold mt-1">PTS</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      {!isHydrated ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl h-20 shimmer" />
          ))}
        </div>
      ) : completedMatches === 0 ? (
        <div className="glass rounded-3xl p-12 text-center border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl opacity-50">🏆</span>
          </div>
          <p className="text-white/80 text-lg font-bold">No results yet</p>
          <p className="text-white/40 text-sm mt-2">
            Add match results in the Results tab to view the standings
          </p>
        </div>
      ) : (
        <div className="bg-[#0A0D18] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-white/5 text-[10px] font-black tracking-widest uppercase text-white/40">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Player</div>
            <div className="col-span-2 text-center">Acc</div>
            <div className="col-span-2 text-right">Pts</div>
          </div>
          
          <div className="divide-y divide-white/5">
            {leaderboard.map((entry) => {
              const accuracy =
                entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-white/[0.02] ${
                    entry.isCurrentUser
                      ? "bg-[rgba(212,175,55,0.08)] relative"
                      : ""
                  }`}
                >
                  {entry.isCurrentUser && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]" />
                  )}
                  
                  {/* Rank */}
                  <div className="col-span-2 flex justify-center">
                    <span className="text-sm font-black text-white/50">
                      {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                  </div>

                  {/* Player */}
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        entry.isCurrentUser
                          ? "bg-[#D4AF37] text-black"
                          : "bg-white/10 text-white/80"
                      }`}
                    >
                      {entry.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${entry.isCurrentUser ? "text-[#D4AF37]" : "text-white/90"}`}>
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[8px] bg-[#D4AF37] text-black font-black uppercase tracking-widest align-middle">YOU</span>
                        )}
                      </p>
                      <p className="text-[10px] text-white/40 font-medium">
                        {entry.total} Match{entry.total !== 1 ? "es" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Accuracy */}
                  <div className="col-span-2 flex justify-center">
                    <span className="text-xs font-bold text-white/60">{accuracy}%</span>
                  </div>

                  {/* Points */}
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-lg font-black ${entry.isCurrentUser ? "text-[#FFD700]" : "text-white"}`}>
                      {entry.correct}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
