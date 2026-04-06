"use client";

import { usePredictions } from "@/hooks/usePredictions";
import { useResults } from "@/hooks/useResults";
import { useAuth } from "@/hooks/useAuth";
import fixtures from "@/data/fixtures.json";
import type { Match } from "@/lib/types";
import { TEAM_CONFIG } from "@/lib/teams";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const matches = fixtures as Match[];

export default function UserProfile({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { allPredictions, isHydrated: isPredsHydrated } = usePredictions();
  const { results, isHydrated: isResultsHydrated } = useResults();
  const { currentUser, isHydrated: isAuthHydrated } = useAuth();
  
  const [user, setUser] = useState<{ id: string, username: string, isAdmin: boolean } | null>(null);
  const [isUserHydrated, setIsUserHydrated] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setIsUserHydrated(false);
      const { data } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", unwrappedParams.id)
        .single();
        
      if (data) {
        setUser({ id: data.id, username: data.username, isAdmin: false });
      }
      setIsUserHydrated(true);
    };
    fetchUser();
  }, [unwrappedParams.id]);
  
  const isHydrated = isPredsHydrated && isResultsHydrated && isAuthHydrated && isUserHydrated;

  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="glass h-40 rounded-3xl shimmer mb-8" />
        <div className="glass h-64 rounded-3xl shimmer" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black text-white mb-2">User Not Found</h1>
        <p className="text-gray-400 mb-6">The player you are looking for does not exist.</p>
        <Link href="/leaderboard" className="text-[#D4AF37] hover:underline font-bold">
          &larr; Back to Leaderboard
        </Link>
      </div>
    );
  }

  const userPreds = allPredictions.filter(p => p.userId === user.id);
  
  let correct = 0;
  let wrong = 0;
  let pending = 0;

  const historyEntries = userPreds.map(pred => {
    const match = matches.find(m => m.id === pred.matchId);
    const result = results.find(r => r.id === pred.matchId);
    
    let status: "correct" | "wrong" | "pending" = "pending";
    if (result) {
      if (result.winner === pred.predictedTeam) {
        status = "correct";
        correct++;
      } else {
        status = "wrong";
        wrong++;
      }
    } else {
      pending++;
    }

    return { pred, match, result, status };
  }).sort((a, b) => a.pred.matchId - b.pred.matchId); // ascending chronological

  const totalCompleted = correct + wrong;
  const accuracy = totalCompleted > 0 ? Math.round((correct / totalCompleted) * 100) : 0;
  const isMe = currentUser?.id === user.id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/leaderboard" className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#FFD700] text-sm font-bold mb-6 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Leaderboard
      </Link>

      {/* Profile Header */}
      <div className="glass rounded-3xl p-6 sm:p-10 mb-8 border border-[#D4AF37]/20 relative overflow-hidden flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-center sm:text-left">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent pointer-events-none" />
        
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center text-3xl sm:text-5xl font-black text-black shadow-xl shadow-black/50 border-4 border-[#FFF0A0]/30 shrink-0 z-10">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        
        <div className="z-10 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{user.username}</h1>
            {isMe && <span className="bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">YOU</span>}
            {user.isAdmin && <span className="bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">ADMIN</span>}
          </div>
          <p className="text-gray-400 font-medium tracking-wide text-sm mb-6">IPL 2026 PREDICTOR</p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-8">
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Points</span>
              <span className="text-3xl font-black text-[#FFD700]">{correct}</span>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Accuracy</span>
              <span className="text-3xl font-black text-white">{accuracy}%</span>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Predicted</span>
              <span className="text-3xl font-black text-blue-400">{userPreds.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div>
        <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-3">
          Prediction <span className="text-gray-500">History</span>
        </h2>

        {historyEntries.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center text-gray-500 font-medium">
            No predictions made yet.
          </div>
        ) : (
          <div className="space-y-4">
            {historyEntries.map(({ pred, match, result, status }) => {
              if (!match) return null;
              
              const team1 = TEAM_CONFIG[match.team1];
              const team2 = TEAM_CONFIG[match.team2];
              const pickedTeam = TEAM_CONFIG[pred.predictedTeam];
              
              return (
                <div key={pred.matchId} className={`glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 transition-colors hover:bg-white/[0.02] ${
                  status === "correct" ? "border-l-green-500" :
                  status === "wrong" ? "border-l-red-500" :
                  "border-l-blue-500"
                }`}>
                  
                  {/* Match Info Side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-400 font-medium">
                      <span className="bg-white/5 px-2 py-0.5 rounded-md">Match {match.id}</span>
                      <span>{new Date(match.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 font-black text-sm sm:text-base">
                      <span style={{ color: team1?.primary }}>{match.team1Short}</span>
                      <span className="text-gray-600 text-[10px] italic">VS</span>
                      <span style={{ color: team2?.primary }}>{match.team2Short}</span>
                    </div>
                  </div>

                  {/* Pick & Status Side */}
                  <div className="flex items-center sm:justify-end gap-5 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-0">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Predicted</span>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <div className="w-4 h-4 rounded-full bg-white p-0.5">
                          <Image src={pickedTeam?.logo || ""} alt={pickedTeam?.shortCode || "Team"} width={16} height={16} className="object-contain" />
                        </div>
                        <span className="text-white text-xs font-bold">{pickedTeam?.shortCode}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end min-w-[100px]">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 pl-2">Result</span>
                      {status === "correct" ? (
                        <div className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 text-xs font-bold whitespace-nowrap">
                          <CheckCircleIcon className="w-4 h-4" /> Won
                        </div>
                      ) : status === "wrong" ? (
                        <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 text-xs font-bold whitespace-nowrap">
                          <XCircleIcon className="w-4 h-4" /> Lost
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-xs font-bold whitespace-nowrap">
                          <ClockIcon className="w-4 h-4" /> Pending
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
