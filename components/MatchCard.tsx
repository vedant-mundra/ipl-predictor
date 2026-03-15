
"use client";

import { useState, useEffect, useCallback } from "react";
import { LockClosedIcon, CheckCircleIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import type { Match, MatchResult, Prediction } from "@/lib/types";
import { TEAM_CONFIG } from "@/lib/teams";

interface MatchCardProps {
  match: Match;
  prediction: Prediction | null;
  result: MatchResult | null;
  onPredict: (matchId: number, team: string, matchDate: string, matchTime: string) => boolean;
  onClearPrediction: (matchId: number, matchDate: string, matchTime: string) => boolean;
  index: number;
}

function formatDate(dateStr: string, timeStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  const dateFormatted = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFormatted = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { dateFormatted, timeFormatted };
}

function getMatchStatus(dateStr: string, timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const matchStart = new Date(dateStr);
  matchStart.setHours(hours, minutes, 0, 0);
  const now = new Date();
  if (now >= matchStart) return "locked";

  const diffMs = matchStart.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
  return `${diffMins}m`;
}

export function MatchCard({ match, prediction, result, onPredict, onClearPrediction, index }: MatchCardProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [animatePrediction, setAnimatePrediction] = useState(false);

  const team1Config = TEAM_CONFIG[match.team1];
  const team2Config = TEAM_CONFIG[match.team2];

  const updateStatus = useCallback(() => {
    const status = getMatchStatus(match.date, match.time);
    setIsLocked(status === "locked");
    if (status !== "locked") setCountdown(status);
    else setCountdown("");
  }, [match.date, match.time]);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [updateStatus]);

  const handlePredict = (team: string) => {
    if (prediction?.team === team) {
      // Toggle off — clicking the selected team deselects it
      onClearPrediction(match.id, match.date, match.time);
    } else {
      const ok = onPredict(match.id, team, match.date, match.time);
      if (ok) {
        setAnimatePrediction(true);
        setTimeout(() => setAnimatePrediction(false), 600);
      }
    }
  };

  const { dateFormatted, timeFormatted } = formatDate(match.date, match.time);
  const predictedTeam = prediction?.team;
  const winner = result?.winner;

  const isCorrect = winner && predictedTeam === winner;
  const isWrong = winner && predictedTeam && predictedTeam !== winner;

  return (
    <div
      className={`glass glass-hover rounded-2xl overflow-hidden transition-all duration-300 fade-in-up ${animatePrediction ? "scale-[1.01]" : ""
        }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Match number + status bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Match #{match.id}
        </span>
        <div className="flex items-center gap-2">
          {winner && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
              <CheckCircleIcon className="w-3 h-3" /> Result in
            </span>
          )}
          {isLocked && !winner ? (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
              <LockClosedIcon className="w-3 h-3" /> Locked
            </span>
          ) : !isLocked ? (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ClockIcon className="w-3 h-3" /> {countdown} left
            </span>
          ) : null}
        </div>
      </div>

      {/* Teams section */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Team 1 */}
          <div className="flex-1 text-center">
            <div
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: team1Config?.primary || "#fff" }}
            >
              {match.team1Short}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">{match.team1}</div>
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
              VS
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-center">
            <div
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: team2Config?.primary || "#fff" }}
            >
              {match.team2Short}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">{match.team2}</div>
          </div>
        </div>
      </div>

      {/* Date + Venue */}
      <div className="flex items-center gap-4 px-5 pb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" />
          {dateFormatted} • {timeFormatted}
        </span>
        <span className="flex items-center gap-1">
          <MapPinIcon className="w-3.5 h-3.5" />
          {match.venue}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 mx-5" />

      {/* Prediction area */}
      <div className="px-5 py-4">
        {/* Result outcome banner */}
        {winner && (
          <div
            className={`mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${isCorrect
                ? "bg-green-500/15 text-green-400 border border-green-500/25"
                : isWrong
                  ? "bg-red-500/15 text-red-400 border border-red-500/25"
                  : "bg-gray-700/30 text-gray-400 border border-gray-700/30"
              }`}
          >
            {isCorrect ? (
              <>
                <CheckCircleSolid className="w-4 h-4" />
                🎉 Correct! {winner} won.
              </>
            ) : isWrong ? (
              <>
                <span>❌</span>
                {winner} won. You picked {predictedTeam?.split(" ").pop()}.
              </>
            ) : (
              <>
                <span>🏆</span>
                Winner: {winner}. (No prediction)
              </>
            )}
          </div>
        )}

        {/* Predict / Locked */}
        {isLocked ? (
          <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2 py-2">
            <LockClosedIcon className="w-4 h-4" />
            {predictedTeam ? (
              <span>
                Prediction Locked 🔒 —{" "}
                <span className="font-semibold text-gray-300">
                  {match[predictedTeam === match.team1 ? "team1Short" : "team2Short"]}
                </span>
              </span>
            ) : (
              "Prediction Locked 🔒"
            )}
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
              Predict Winner:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { team: match.team1, short: match.team1Short, config: team1Config },
                { team: match.team2, short: match.team2Short, config: team2Config },
              ].map(({ team, short, config }) => {
                const isPicked = predictedTeam === team;
                return (
                  <button
                    key={team}
                    onClick={() => handlePredict(team)}
                    className={`relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 border ${isPicked
                        ? "border-white/30 text-white scale-[1.02] shadow-lg"
                        : "border-white/8 text-gray-400 hover:text-white hover:border-white/20 hover:scale-[1.01]"
                      }`}
                    style={
                      isPicked
                        ? {
                          backgroundColor: `${config?.primary}25`,
                          borderColor: `${config?.primary}60`,
                          boxShadow: `0 4px 20px ${config?.primary}30`,
                        }
                        : {}
                    }
                  >
                    {isPicked && (
                      <CheckCircleSolid
                        className="w-4 h-4 shrink-0"
                        style={{ color: config?.primary }}
                      />
                    )}
                    <span>{short}</span>
                  </button>
                );
              })}
            </div>
            {predictedTeam && (
              <p className="text-xs text-center mt-2 text-gray-600">
                Click again to deselect
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
