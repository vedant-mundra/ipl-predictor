"use client";

import { useState, useEffect, useMemo } from "react";
import { usePredictions } from "@/hooks/usePredictions";
import { useResults } from "@/hooks/useResults";
import { useAuth } from "@/hooks/useAuth";
import fixtures from "@/data/fixtures.json";
import type { Match, LeaderboardEntry } from "@/lib/types";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const matches = fixtures as Match[];

// Medal colors and styles
const medalColors = [
  "from-[#FFD700] to-[#D4AF37]", // Gold
  "from-[#E0E0E0] to-[#A0A0A0]", // Silver
  "from-[#CD7F32] to-[#A0522D]"  // Bronze
];
const medalText = ["text-[#FFD700]", "text-gray-300", "text-[#CD7F32]"];

export default function LeaderboardPage() {
  const { allPredictions, isHydrated: isPredsHydrated } = usePredictions();
  const { results, isHydrated: isResultsHydrated } = useResults();
  const { currentUser, currentGroup, isHydrated: isAuthHydrated } = useAuth();
  
  const [groupUsers, setGroupUsers] = useState<{ id: string, username: string }[]>([]);
  const [isUsersHydrated, setIsUsersHydrated] = useState(false);

  useEffect(() => {
    if (!currentGroup) {
      setGroupUsers([]);
      setIsUsersHydrated(true);
      return;
    }
    
    const fetchUsers = async () => {
      setIsUsersHydrated(false);
      
      // 1. Fetch user_groups explicitly
      const { data: userGroups } = await supabase
        .from("user_groups")
        .select("user_id")
        .eq("group_id", currentGroup);

      if (!userGroups || userGroups.length === 0) {
        setGroupUsers([]);
        setIsUsersHydrated(true);
        return;
      }

      const userIds = userGroups.map(ug => ug.user_id);

      // 2. Fetch profiles explicitly matching those IDs
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      // 3. Map them exactly together in memory
      const mapped = userGroups.map(ug => {
        const matchingProfile = profiles?.find(p => p.id === ug.user_id);
        return {
          id: ug.user_id,
          username: matchingProfile?.username || "Player"
        };
      });
      
      setGroupUsers(mapped);
      setIsUsersHydrated(true);
    };

    fetchUsers();
  }, [currentGroup]);

  const isHydrated = isPredsHydrated && isResultsHydrated && isAuthHydrated && isUsersHydrated;

  const leaderboard = useMemo(() => {
    const completedMatchIds = results.map((r) => r.id);

    const validUsers = groupUsers;

    const entries = validUsers.map(user => {
      // Find user predictions
      const userPreds = allPredictions.filter(p => p.userId === user.id);

      let correct = 0;
      let groupStageScore = 0;
      let playoffsScore = 0;
      let championScore = 0;

      completedMatchIds.forEach(matchId => {
        const pred = userPreds.find(p => p.matchId === matchId);
        const result = results.find(r => r.id === matchId);
        if (result?.winner === "Washout") {
          // Washout matches do not award any points
        } else if (pred && result && pred.predictedTeam === result.winner) {
          if (matchId <= 70) {
            groupStageScore += 1;
          } else if (matchId <= 73) {
            playoffsScore += 2;
          } else if (matchId === 74) {
            playoffsScore += 3;
          }
          correct += 1;
        }
      });

      // Champion Prediction Bonus
      const finalResult = results.find(r => r.id === 74);
      const userChampPred = userPreds.find(p => p.matchId === 100);
      const predictedChamp = userChampPred?.predictedTeam || null;

      if (finalResult && finalResult.winner && finalResult.winner !== "Washout" && predictedChamp) {
        if (predictedChamp === finalResult.winner) {
          // Check if predicted before 7:30 pm of 26th May (IST)
          const predictionTime = userChampPred?.lockedAt ? new Date(userChampPred.lockedAt) : null;
          const deadline = new Date("2026-05-26T19:30:00+05:30");
          if (predictionTime && predictionTime < deadline) {
            championScore += 5;
          }
        }
      }

      const score = groupStageScore + playoffsScore + championScore;

      const total = completedMatchIds.filter(matchId => {
        // Exclude champion prediction matchId 100 from general match accuracy
        if (matchId === 100) return false;
        const pred = userPreds.find(p => p.matchId === matchId);
        const result = results.find(r => r.id === matchId);
        return pred && result?.winner !== "Washout";
      }).length;

      return {
        rank: 0,
        userId: user.id,
        name: user.username,
        avatar: user.username.slice(0, 2).toUpperCase(),
        score,
        correct,
        total,
        isCurrentUser: currentUser?.id === user.id,
        groupStageScore,
        playoffsScore,
        championScore,
        predictedChamp,
      };
    });

    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bAcc = b.total > 0 ? b.correct / b.total : 0;
      const aAcc = a.total > 0 ? a.correct / a.total : 0;
      if (bAcc !== aAcc) return bAcc - aAcc;
      return b.total - a.total;
    });

    let currentRank = 1;
    entries.forEach((e, i) => {
      if (i > 0) {
        const prev = entries[i - 1];
        const eAcc = e.total > 0 ? e.correct / e.total : 0;
        const prevAcc = prev.total > 0 ? prev.correct / prev.total : 0;

        if (e.score === prev.score && eAcc === prevAcc && e.total === prev.total) {
          e.rank = currentRank;
        } else {
          currentRank = i + 1;
          e.rank = currentRank;
        }
      } else {
        e.rank = currentRank;
      }
    });

    return entries;
  }, [allPredictions, results, groupUsers, currentUser, currentGroup]);

  const completedMatches = results.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] mb-4 border-2 border-[#FFF0A0]/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/30 w-full h-full skew-x-[-20deg] translate-x-[-150%] animate-[shimmer_3s_infinite]" />
          <span className="text-3xl filter drop-shadow-md relative z-10">👑</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
          League <span className="gold-text">Rankings</span>
        </h1>
        <p className="text-sm font-medium text-[#D4AF37] mt-2 tracking-wider uppercase">
          {completedMatches} / {matches.length} Matches Completed
        </p>
      </div>

      {/* Point System Breakdown Banner */}
      <div className="glass rounded-2xl p-4 mb-10 border-white/5 bg-white/[0.01]">
        <div className="font-bold text-[#D4AF37] uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-2.5">
          <span>📢</span> Playoff Point System Rules
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <div className="text-white/40 text-[9px] uppercase tracking-wider font-bold">Group Stage</div>
            <div className="text-white font-black text-xs mt-0.5">+1 Pt</div>
            <div className="text-[8px] text-white/30">Matches 1 - 70</div>
          </div>
          <div className="bg-[#FF822A]/10 p-2 rounded-xl border border-[#FF822A]/20">
            <div className="text-[#FF822A] text-[9px] uppercase tracking-wider font-bold">Qualifiers / Elim</div>
            <div className="text-[#FF822A] font-black text-xs mt-0.5">+2 Pts</div>
            <div className="text-[8px] text-[#FF822A]/55">Matches 71 - 73</div>
          </div>
          <div className="bg-[#FFD700]/10 p-2 rounded-xl border border-[#FFD700]/20">
            <div className="text-[#FFD700] text-[9px] uppercase tracking-wider font-bold">Grand Final</div>
            <div className="text-[#FFD700] font-black text-xs mt-0.5">+3 Pts</div>
            <div className="text-[8px] text-[#FFD700]/55">Match 74</div>
          </div>
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <div className="text-emerald-400 text-[9px] uppercase tracking-wider font-bold">Champion Pick</div>
            <div className="text-emerald-400 font-black text-xs mt-0.5">+5 Pts</div>
            <div className="text-[8px] text-emerald-400/55">Locked Pick</div>
          </div>
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
                className={`flex flex-col items-center relative transition-transform hover:-translate-y-2 duration-300 ${isFirst ? "z-10" : "z-0"
                  }`}
              >
                {/* Crown for 1st */}
                {isFirst && <div className="absolute -top-8 text-2xl filter drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] animate-bounce">👑</div>}

                {/* Avatar */}
                <div className={`rounded-full flex items-center justify-center font-black text-white shadow-xl border-4 ${isFirst ? "w-20 h-20 text-xl border-[#FFD700] bg-gradient-to-br from-[#FFD700]/20 to-[#B8860B]/40" :
                    isSecond ? "w-16 h-16 text-lg border-[#E0E0E0] bg-white/10" :
                      "w-16 h-16 text-lg border-[#CD7F32] bg-white/10"
                  } ${entry.isCurrentUser ? "ring-2 ring-white ring-offset-2 ring-offset-[#06080F]" : ""}`}>
                  {entry.avatar}
                </div>

                {/* Player Name */}
                <Link href={`/user/${entry.userId}`} className={`font-bold mt-3 mb-2 truncate w-full text-center hover:underline ${isFirst ? "text-[#FFD700] text-sm" : "text-white/80 text-xs"}`}>
                  {entry.name}
                </Link>

                {/* Podium Block */}
                <div className={`w-full rounded-t-xl bg-gradient-to-b ${medalColors[posIndex]} p-0.5 shadow-lg`}>
                  <div className={`w-full h-full bg-[#06080F]/90 rounded-t-[10px] flex flex-col items-center justify-start ${isFirst ? "pt-6 pb-2 min-h-[140px]" :
                      isSecond ? "pt-4 pb-2 min-h-[110px]" :
                        "pt-4 pb-2 min-h-[90px]"
                    }`}>
                    <span className={`text-3xl font-black ${medalText[posIndex]}`}>{entry.score}</span>
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
      ) : leaderboard.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl opacity-50">🏆</span>
          </div>
          <p className="text-white/80 text-lg font-bold">No users found</p>
          <p className="text-white/40 text-sm mt-2">
            No users have signed up yet. Create an account to see the leaderboard.
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
            {leaderboard.map((entry: any) => {
              const accuracy =
                entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-white/[0.02] ${entry.isCurrentUser
                      ? "bg-[rgba(212,175,55,0.08)] relative"
                      : ""
                    }`}
                >
                  {entry.isCurrentUser && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-[#D4AF37] rounded-l" />
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${entry.isCurrentUser
                          ? "bg-[#D4AF37] text-black"
                          : "bg-white/10 text-white/80"
                        }`}
                    >
                      {entry.avatar}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/user/${entry.userId}`} className={`text-sm font-bold truncate hover:underline ${entry.isCurrentUser ? "text-[#D4AF37]" : "text-white/90"}`}>
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[8px] bg-[#D4AF37] text-black font-black uppercase tracking-widest align-middle flex-shrink-0">YOU</span>
                        )}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-white/40 font-medium">
                        <span>{entry.total} Match{entry.total !== 1 ? "es" : ""}</span>
                        {entry.predictedChamp && (
                          <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold ${entry.championScore > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-white/50 border border-white/5"}`}>
                            👑 {entry.predictedChamp.split(" ").slice(-1)[0]}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-[#D4AF37]/80 font-bold flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span>Group stage: +{entry.groupStageScore || 0}</span>
                        <span>Playoffs: +{entry.playoffsScore || 0}</span>
                        {entry.championScore > 0 && <span className="text-emerald-400">Champ: +5</span>}
                      </div>
                    </div>
                  </div>

                  {/* Accuracy */}
                  <div className="col-span-2 flex justify-center">
                    <span className="text-xs font-bold text-white/60">{accuracy}%</span>
                  </div>

                  {/* Points */}
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-lg font-black ${entry.isCurrentUser ? "text-[#FFD700]" : "text-white"}`}>
                      {entry.score}
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
