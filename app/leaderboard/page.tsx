"use client";

import { useMemo } from "react";
import { usePredictions } from "@/hooks/usePredictions";
import { useResults, useCurrentUser } from "@/hooks/useResults";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import fixtures from "@/data/fixtures.json";
import simulatedUsers from "@/data/users.json";
import type { Match, LeaderboardEntry } from "@/lib/types";
import { TrophyIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { TrophyIcon as TrophySolid } from "@heroicons/react/24/solid";

const matches = fixtures as Match[];

// Medal colors
const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
const medalEmojis = ["🥇", "🥈", "🥉"];

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <TrophyIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Leaderboard</h1>
          <p className="text-sm text-gray-400">
            Based on {completedMatches} completed match{completedMatches !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      {/* Username input */}
      <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3">
        <UserCircleIcon className="w-6 h-6 text-orange-400 shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1 font-medium">Your display name</p>
          <input
            type="text"
            value={userName as string}
            onChange={(e) => {
              setUserName(e.target.value);
              setCurrentUser(e.target.value);
            }}
            placeholder="Enter your name..."
            className="w-full bg-transparent text-white text-sm font-semibold outline-none placeholder-gray-600"
            maxLength={20}
          />
        </div>
      </div>

      {/* Top 3 podium (if results available) */}
      {completedMatches > 0 && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {leaderboard.slice(0, 3).map((entry, pos) => (
            <div
              key={entry.userId}
              className={`glass rounded-xl p-4 text-center flex flex-col items-center gap-2 ${
                entry.isCurrentUser ? "border border-orange-500/30" : ""
              }`}
            >
              <div className="text-2xl">{medalEmojis[pos]}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xs font-black text-white border border-white/10">
                {entry.avatar}
              </div>
              <p className="text-xs font-semibold text-white truncate w-full text-center">{entry.name}</p>
              <p className={`text-lg font-black ${medalColors[pos]}`}>{entry.correct}</p>
              <p className="text-[10px] text-gray-600">correct picks</p>
            </div>
          ))}
        </div>
      )}

      {/* Full table */}
      {!isHydrated ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-16 shimmer" />
          ))}
        </div>
      ) : completedMatches === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <TrophySolid className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No results yet</p>
          <p className="text-gray-600 text-sm mt-1">
            Add match results in the Results tab to see scores
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const accuracy =
              entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
            return (
              <div
                key={entry.userId}
                className={`glass glass-hover rounded-xl px-4 py-3 flex items-center gap-4 ${
                  entry.isCurrentUser
                    ? "border border-orange-500/25 bg-orange-500/5"
                    : ""
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {entry.rank <= 3 ? (
                    <span className="text-lg">{medalEmojis[entry.rank - 1]}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-500">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border ${
                    entry.isCurrentUser
                      ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                      : "bg-white/5 border-white/10 text-white"
                  }`}
                >
                  {entry.avatar}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-[10px] text-orange-400 font-medium">YOU</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.total} prediction{entry.total !== 1 ? "s" : ""} • {accuracy}% accuracy
                  </p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-white">{entry.correct}</p>
                  <p className="text-[10px] text-gray-600">correct</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
