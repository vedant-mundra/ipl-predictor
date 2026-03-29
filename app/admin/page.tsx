"use client";

import { useState } from "react";
import { useResults } from "@/hooks/useResults";
import { useAuth } from "@/hooks/useAuth";
import fixtures from "@/data/fixtures.json";
import type { Match } from "@/lib/types";
import { TEAM_CONFIG } from "@/lib/teams";
import { ShieldCheckIcon, TrashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const matches = fixtures as Match[];

export default function AdminPage() {
  const { results, setResult, removeResult, isHydrated: isResultsHydrated } = useResults();
  const { currentUser, isHydrated: isAuthHydrated } = useAuth();
  const [saved, setSaved] = useState<number | null>(null);

  const isHydrated = isResultsHydrated && isAuthHydrated;

  const handleSet = (matchId: number, winner: string) => {
    setResult(matchId, winner);
    setSaved(matchId);
    setTimeout(() => setSaved(null), 2000);
  };

  if (!isHydrated) return null;

  if (!currentUser?.isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-4 border border-red-500/20">
          <ShieldCheckIcon className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Access Denied</h1>
        <p className="text-gray-400">You do not have permission to view or edit match results.</p>
        <p className="text-gray-500 text-sm mt-2">Only administrators can access this control panel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <ShieldCheckIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Match Results</h1>
          <p className="text-sm text-gray-400">Set match winners to calculate leaderboard scores</p>
        </div>
      </div>

      <div className="space-y-3">
        {matches.map((match) => {
          const result = results.find((r) => r.id === match.id);
          const team1Config = TEAM_CONFIG[match.team1];
          const team2Config = TEAM_CONFIG[match.team2];
          const justSaved = saved === match.id;

          return (
            <div key={match.id} className="glass glass-hover rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Match info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-gray-600 shrink-0">#{match.id}</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-sm font-bold"
                      style={{ color: team1Config?.primary }}
                    >
                      {match.team1Short}
                    </span>
                    <span className="text-gray-600 text-xs">vs</span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: team2Config?.primary }}
                    >
                      {match.team2Short}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 hidden sm:inline">
                    {new Date(match.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {result ? (
                    <>
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        {result.winner.split(" ").slice(-1)[0]}
                      </span>
                      <button
                        onClick={() => removeResult(match.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove result"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSet(match.id, match.team1)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 hover:scale-105"
                        style={{
                          color: team1Config?.primary,
                          borderColor: `${team1Config?.primary}40`,
                          backgroundColor: `${team1Config?.primary}12`,
                        }}
                      >
                        {match.team1Short} Won
                      </button>
                      <button
                        onClick={() => handleSet(match.id, match.team2)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 hover:scale-105"
                        style={{
                          color: team2Config?.primary,
                          borderColor: `${team2Config?.primary}40`,
                          backgroundColor: `${team2Config?.primary}12`,
                        }}
                      >
                        {match.team2Short} Won
                      </button>
                    </>
                  )}
                  {justSaved && (
                    <span className="text-xs text-green-400 font-medium animate-pulse">Saved!</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
