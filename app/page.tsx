"use client";

import { useState } from "react";
import { usePredictions } from "@/hooks/usePredictions";
import { useResults } from "@/hooks/useResults";
import { MatchCard } from "@/components/MatchCard";
import fixtures from "@/data/fixtures.json";
import type { Match } from "@/lib/types";
import { CalendarDaysIcon, SparklesIcon } from "@heroicons/react/24/outline";

const matches = fixtures as Match[];

type FilterType = "all" | "upcoming" | "live-locked" | "predicted";

export default function MatchesPage() {
  const { predict, getPrediction, clearPrediction, isHydrated } = usePredictions();
  const { getResult } = useResults();
  const [filter, setFilter] = useState<FilterType>("all");

  const now = new Date();

  const withStatus = matches.map((m) => {
    const [h, min] = m.time.split(":").map(Number);
    const start = new Date(m.date);
    start.setHours(h, min, 0, 0);
    const locked = now >= start;
    const prediction = getPrediction(m.id);
    return { ...m, locked, prediction };
  });

  const filtered = withStatus.filter((m) => {
    if (filter === "upcoming") return !m.locked;
    if (filter === "live-locked") return m.locked;
    if (filter === "predicted") return !!m.prediction;
    return true;
  });

  const predictedCount = withStatus.filter((m) => m.prediction).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <CalendarDaysIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">IPL 2026 Matches</h1>
            <p className="text-sm text-gray-400">
              {predictedCount} of {matches.length} matches predicted
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${(predictedCount / matches.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          [
            { key: "all", label: `All (${matches.length})` },
            { key: "upcoming", label: `Open (${withStatus.filter((m) => !m.locked).length})` },
            { key: "live-locked", label: `Locked (${withStatus.filter((m) => m.locked).length})` },
            { key: "predicted", label: `Predicted (${predictedCount})` },
          ] as { key: FilterType; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
              filter === key
                ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {!isHydrated ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl h-52 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SparklesIcon className="w-12 h-12 text-gray-700 mb-3" />
          <p className="text-gray-500 text-lg font-medium">No matches found</p>
          <p className="text-gray-600 text-sm mt-1">Try a different filter</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((match, i) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={getPrediction(match.id)}
              result={getResult(match.id)}
              onPredict={predict}
              onClearPrediction={clearPrediction}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
