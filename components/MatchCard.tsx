"use client";

import { useState, useEffect, useCallback } from "react";
import { LockClosedIcon, CheckCircleIcon, ClockIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import type { Match, MatchResult, Prediction } from "@/lib/types";
import { TEAM_CONFIG, SHORT_TO_FULL } from "@/lib/teams";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MatchCardProps {
  match: Match;
  prediction: Prediction | null;
  result: MatchResult | null;
  onPredict: (matchId: number, team: string, matchDate: string, matchTime: string) => Promise<boolean>;
  onClearPrediction: (matchId: number, matchDate: string, matchTime: string) => Promise<boolean>;
  index: number;
  predictionCount: number;
  matchPredictions?: Prediction[];
  groupUsers?: { id: string; username: string }[];
  totalUsers: number;
  isLoggedIn: boolean;
  id?: string;
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

export function MatchCard({
  match,
  prediction,
  result,
  onPredict,
  onClearPrediction,
  index,
  predictionCount,
  matchPredictions = [],
  groupUsers = [],
  totalUsers,
  isLoggedIn,
  id
}: MatchCardProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [animatePrediction, setAnimatePrediction] = useState(false);
  const [showPredictionsModal, setShowPredictionsModal] = useState(false);
  const router = useRouter();

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

  const handlePredict = async (team: string) => {
    if (prediction?.predictedTeam === team) {
      // Toggle off
      await onClearPrediction(match.id, match.date, match.time);
    } else {
      const ok = await onPredict(match.id, team, match.date, match.time);
      if (ok) {
        setAnimatePrediction(true);
        setTimeout(() => setAnimatePrediction(false), 600);
      }
    }
  };

  const { dateFormatted, timeFormatted } = formatDate(match.date, match.time);
  const predictedTeam = prediction?.predictedTeam;
  const winner = result?.winner;

  const isWashout = winner === "Washout";
  const isCorrect = winner && !isWashout && predictedTeam === winner;
  const isWrong = winner && !isWashout && predictedTeam && predictedTeam !== winner;

  return (
    <div
      id={id}
      className={`relative glass glass-hover rounded-2xl overflow-hidden transition-all duration-300 fade-in-up ipl-card-accent ${animatePrediction ? "scale-[1.01]" : ""
        }`}
      style={
        {
          animationDelay: `${index * 60}ms`,
          "--team-color-1": team1Config?.primary || "#D4AF37",
          "--team-color-2": team2Config?.primary || "#003087",
        } as React.CSSProperties
      }
    >
      {/* Match number + status bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-1">
          Match {match.id}
        </span>
        <div className="flex items-center gap-2">
          {winner && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircleIcon className="w-3.5 h-3.5" /> RESULT IN
            </span>
          )}
          {isLocked && !winner ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
              <LockClosedIcon className="w-3.5 h-3.5" /> LOCKED
            </span>
          ) : !isLocked ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              <ClockIcon className="w-3.5 h-3.5" /> {countdown}
            </span>
          ) : null}
        </div>
      </div>

      {/* Teams section */}
      <div className="px-5 py-3 mt-1">
        <div className="flex items-center justify-between relative">
          {/* Background aura for logos */}
          <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-xl opacity-20" style={{ backgroundColor: team1Config?.primary }} />
          <div className="absolute right-[15%] top-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-xl opacity-20" style={{ backgroundColor: team2Config?.primary }} />

          {/* Team 1 */}
          <Link href={`/team/${match.team1Short.toLowerCase()}`} className="flex flex-col items-center w-[40%] text-center z-10 group cursor-pointer">
            <div
              className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden flex items-center justify-center p-1.5 mb-2 group-hover:scale-105 transition-all duration-300"
              style={{ backgroundColor: "#fff", border: `3px solid ${team1Config?.primary}`, boxShadow: `0 0 15px ${team1Config?.primary}30` }}
            >
              <div className="relative w-full h-full">
                <Image src={team1Config?.logo} alt={match.team1Short} fill className="object-contain p-2 drop-shadow-sm transition-transform group-hover:scale-110" sizes="(max-width: 768px) 72px, 84px" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-black tracking-tight text-white/90 group-hover:text-[#D4AF37] transition-colors">
              {match.team1Short}
            </div>
          </Link>

          {/* VS divider (Cricket ball style) */}
          <div className="flex flex-col items-center justify-center z-10 mx-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 shadow-lg flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#CC2200] to-[#7A0000]">
              <span className="text-[10px] sm:text-xs font-black text-white italic drop-shadow-md z-10">VS</span>
              {/* Seam line svg overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 24 24">
                <path d="M6 0 Q12 12 6 24 M18 0 Q12 12 18 24" stroke="#FFF" strokeWidth="0.5" fill="none" />
                <path d="M4 4 Q8 8 4 12 M20 4 Q16 8 20 12 M4 12 Q8 16 4 20 M20 12 Q16 16 20 20" stroke="#FFF" strokeWidth="0.5" fill="none" />
              </svg>
            </div>
          </div>

          {/* Team 2 */}
          <Link href={`/team/${match.team2Short.toLowerCase()}`} className="flex flex-col items-center w-[40%] text-center z-10 group cursor-pointer">
            <div
              className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden flex items-center justify-center p-1.5 mb-2 group-hover:scale-105 transition-all duration-300"
              style={{ backgroundColor: "#fff", border: `3px solid ${team2Config?.primary}`, boxShadow: `0 0 15px ${team2Config?.primary}30` }}
            >
              <div className="relative w-full h-full">
                <Image src={team2Config?.logo} alt={match.team2Short} fill className="object-contain p-2 drop-shadow-sm transition-transform group-hover:scale-110" sizes="(max-width: 768px) 72px, 84px" />
              </div>
            </div>
            <div className="text-sm sm:text-base font-black tracking-tight text-white/90 group-hover:text-[#D4AF37] transition-colors">
              {match.team2Short}
            </div>
          </Link>
        </div>
      </div>

      {/* Date + Venue */}
      <div className="flex items-center justify-center gap-4 px-5 pb-3 mt-2 text-[11px] text-white/50 font-medium tracking-wide">
        <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <ClockIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
          {dateFormatted} • {timeFormatted}
        </span>
      </div>
      <div className="flex flex-col items-center justify-center pb-4 gap-2">
        <span className="flex items-center gap-1 text-[11px] text-white/40">
          <MapPinIcon className="w-3 h-3" />
          {match.venue}
        </span>
        <button
          onClick={() => predictionCount > 0 && setShowPredictionsModal(true)}
          className={`text-[10px] font-bold text-[#D4AF37] px-2.5 py-1 rounded-md border transition-colors ${
            predictionCount > 0 
              ? "bg-[#D4AF37]/10 border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 cursor-pointer" 
              : "bg-white/5 border-white/10 text-white/40 cursor-default"
          }`}
        >
          {predictionCount} / {totalUsers} users predicted
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />

      {/* Prediction area */}
      <div className="px-5 py-4 bg-white/[0.02]">
        {/* Result outcome banner */}
        {winner && (
          <div
            className={`mb-4 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold border ${isWashout
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : isCorrect
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : isWrong
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-white/5 text-gray-400 border-white/5"
              }`}
          >
            {isWashout ? (
              <>
                 <div className="w-8 h-8 rounded-full bg-blue-500/20 flex flex-col items-center justify-center shrink-0 border border-blue-500/30">
                   <span className="text-lg leading-none pt-0.5">☔</span>
                 </div>
                 <div>
                   <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-0.5">Match Washed Out</div>
                   <div className="text-blue-100/70 text-xs">This match is excluded from scoring</div>
                 </div>
              </>
            ) : isCorrect ? (
              <>
                <div className="w-8 h-8 rounded-full bg-white p-1 shrink-0">
                  <div className="relative w-full h-full">
                    <Image src={TEAM_CONFIG[winner]?.logo || ""} alt="Winner" fill className="object-contain p-[2px]" />
                  </div>
                </div>
                <div>
                  <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-0.5">Correct Prediction</div>
                  <div className="text-white/90 text-sm">{winner} won</div>
                </div>
              </>
            ) : isWrong ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white p-1 shrink-0 grayscale opacity-70">
                    <div className="relative w-full h-full">
                      <Image src={TEAM_CONFIG[predictedTeam as string]?.logo || ""} alt="Picked" fill className="object-contain p-[2px]" />
                    </div>
                  </div>
                  <span className="text-white/40 text-xs px-1">vs</span>
                  <div className="w-8 h-8 rounded-full bg-white p-1 shrink-0">
                    <div className="relative w-full h-full">
                      <Image src={TEAM_CONFIG[winner]?.logo || ""} alt="Winner" fill className="object-contain p-[2px]" />
                    </div>
                  </div>
                </div>
                <div className="ml-1">
                  <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-0.5">Incorrect Pick</div>
                  <div className="text-white/70 text-xs">Winner: <span className="text-white font-medium">{TEAM_CONFIG[winner]?.shortCode}</span></div>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-white p-1 shrink-0">
                  <div className="relative w-full h-full">
                    <Image src={TEAM_CONFIG[winner]?.logo || ""} alt="Winner" fill className="object-contain p-[2px]" />
                  </div>
                </div>
                <div>
                  <div className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-0.5">Match Result</div>
                  <div className="text-white/90 text-sm">{winner} won</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Predict / Locked */}
        {isLocked ? (
          <div className="text-center py-2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-white/40 uppercase tracking-widest">
              <LockClosedIcon className="w-3.5 h-3.5" />
              Prediction Locked
            </div>
            {predictedTeam && (
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg mt-1">
                <span className="text-xs text-white/60">Your Pick:</span>
                <div className="w-4 h-4 rounded-full bg-white p-0.5 shrink-0">
                  <div className="relative w-full h-full">
                    <Image src={TEAM_CONFIG[predictedTeam]?.logo || ""} alt="Pick" fill className="object-contain p-[2px]" />
                  </div>
                </div>
                <span className="text-sm font-bold text-white" style={{ color: TEAM_CONFIG[predictedTeam]?.primary }}>
                  {TEAM_CONFIG[predictedTeam]?.shortCode}
                </span>
              </div>
            )}
          </div>
        ) : !isLoggedIn ? (
          <div className="text-center py-3">
             <button onClick={() => router.push('/login')} className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2 px-6 rounded-xl transition-colors border border-white/10">
               Log in to Predict
             </button>
          </div>
        ) : (
          <div>
            <p className="text-[10px] text-center text-[#D4AF37] mb-3 font-bold uppercase tracking-[0.2em]">
              Predict Match Winner
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { team: match.team1, short: match.team1Short, config: team1Config },
                { team: match.team2, short: match.team2Short, config: team2Config },
              ].map(({ team, short, config }) => {
                const isPicked = predictedTeam === team;
                return (
                  <button
                    key={team}
                    onClick={() => handlePredict(team)}
                    className={`relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-300 border overflow-hidden group ${isPicked
                      ? "border-[#D4AF37]/50 text-white scale-[1.03] shadow-lg"
                      : "border-white/10 text-white/70 hover:text-white hover:border-[#D4AF37]/30 hover:scale-[1.02]"
                      }`}
                    style={
                      isPicked
                        ? {
                          background: `linear-gradient(135deg, ${config?.primary}25 0%, rgba(212,175,55,0.1) 100%)`,
                          boxShadow: `0 4px 20px ${config?.primary}30, inset 0 0 10px ${config?.primary}20`,
                        }
                        : {
                          background: "rgba(255,255,255,0.03)"
                        }
                    }
                  >
                    {/* Tiny team logo */}
                    <div className={`w-5 h-5 rounded-full bg-white p-[2px] shrink-0 transition-transform ${isPicked ? "scale-110" : "group-hover:scale-110"}`}>
                      <div className="relative w-full h-full">
                        <Image src={config?.logo || ""} alt={short} fill className="object-contain p-[2px]" />
                      </div>
                    </div>

                    <span className={`text-sm font-black tracking-tight ${isPicked ? "text-white" : ""}`}>
                      {short}
                    </span>

                    {isPicked && (
                      <CheckCircleSolid
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 shrink-0 text-[#D4AF37] drop-shadow-sm"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {predictedTeam && (
              <p className="text-[10px] text-center mt-3 text-white/30 font-medium">
                Click again to change prediction
              </p>
            )}
          </div>
        )}
      </div>

      {showPredictionsModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-4 animate-fade-in fade-in-up">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              Predictions
            </span>
            <button onClick={() => setShowPredictionsModal(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-1 rounded-full border border-white/10 hover:bg-white/10">
               <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto scx pr-2 space-y-2.5 -mx-2 px-2">
             {matchPredictions.length === 0 ? (
               <div className="text-center text-xs text-white/50 mt-10">No predictions yet</div>
             ) : (
               groupUsers.filter(u => matchPredictions.some(p => p.userId === u.id)).map(user => {
                 const pred = matchPredictions.find(p => p.userId === user.id);
                 const team = pred?.predictedTeam;
                 const teamConfig = TEAM_CONFIG[team as string];
                 
                 return (
                   <div key={user.id} className="flex justify-between items-center bg-[#06080F]/60 rounded-xl p-3 border border-white/5 shadow-inner">
                     <span className="text-xs font-bold text-white/90 truncate mr-3">{user.username}</span>
                     {teamConfig ? (
                       <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 rounded-lg border border-white/5" style={{ borderColor: `${teamConfig.primary}30` }}>
                           <div className="relative w-4 h-4 bg-white rounded-full p-[2px]">
                             <Image src={teamConfig.logo} alt={teamConfig.shortCode} fill className="object-contain" />
                           </div>
                           <span className="text-[10px] font-black text-white" style={{ color: teamConfig.primary }}>{teamConfig.shortCode}</span>
                         </div>
                       </div>
                     ) : (
                       <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-lg">Unknown</span>
                     )}
                   </div>
                 );
               })
             )}
          </div>
        </div>
      )}
    </div>
  );
}
