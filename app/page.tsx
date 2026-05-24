"use client";

import { useState, useEffect, useMemo } from "react";
import { usePredictions } from "@/hooks/usePredictions";
import { useResults } from "@/hooks/useResults";
import { useAuth } from "@/hooks/useAuth";
import { useGroupUsers } from "@/hooks/useGroupUsers";
import { usePlayoffs } from "@/hooks/usePlayoffs";
import { MatchCard } from "@/components/MatchCard";
import fixtures from "@/data/fixtures.json";
import type { Match } from "@/lib/types";
import { SparklesIcon, LockClosedIcon, TrophyIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { TEAM_CONFIG } from "@/lib/teams";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const initialMatches = fixtures as Match[];

type FilterType = "all" | "upcoming" | "live-locked";

export default function MatchesPage() {
  const { allPredictions, predict, getPrediction, clearPrediction, getPredictionCount, isHydrated: isPredsHydrated } = usePredictions();
  const { getResult } = useResults();
  const { currentUser, currentGroup, isHydrated: isAuthHydrated } = useAuth();
  const { groupUsers } = useGroupUsers();
  const { playoffMatches, isHydrated: isPlayoffsHydrated } = usePlayoffs();
  
  const [totalUsers, setTotalUsers] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"playoffs" | "league">("playoffs");
  const [champCountdown, setChampCountdown] = useState("");
  const [isChampLocked, setIsChampLocked] = useState(false);
  const [isChampLockedLocally, setIsChampLockedLocally] = useState(false);

  const isHydrated = isPredsHydrated && isAuthHydrated && isPlayoffsHydrated;

  // Track total users in current group
  useEffect(() => {
    if (currentGroup) {
      supabase.from("user_groups").select("*", { count: "exact", head: true }).eq("group_id", currentGroup)
        .then(({ count }) => {
          if (count !== null) setTotalUsers(count);
        });
    } else {
      setTotalUsers(0);
    }
  }, [currentGroup]);

  // Champion countdown lock timer (Locks on May 26, 2026 at 19:30 IST)
  useEffect(() => {
    const updateCountdown = () => {
      const lockDate = new Date("2026-05-26T19:30:00+05:30");
      const diff = lockDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        setChampCountdown("Closed");
        setIsChampLocked(true);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setChampCountdown(`${days}d ${hours}h ${mins}m left`);
        setIsChampLocked(false);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();

  // Merge playoff overrides from database into our matches list
  const matches = useMemo((): Match[] => {
    return initialMatches.map((m) => {
      if (m.id >= 71) {
        const dbPlayoff = playoffMatches.find((pm) => pm.id === m.id);
        if (dbPlayoff) {
          return {
            ...m,
            team1: dbPlayoff.team1,
            team2: dbPlayoff.team2,
            team1Short: dbPlayoff.team1Short,
            team2Short: dbPlayoff.team2Short,
            venue: dbPlayoff.venue || m.venue,
            date: dbPlayoff.date || m.date,
            time: dbPlayoff.time || m.time,
          };
        }
      }
      return m;
    });
  }, [playoffMatches]);

  const uniqueTeams = Array.from(new Set(matches.flatMap(m => [m.team1, m.team2]))).filter(t => t !== "TBD").sort();
  const uniqueVenues = Array.from(new Set(matches.map(m => m.venue))).sort();

  const withStatus = useMemo(() => {
    return matches.map((m) => {
      const [h, min] = m.time.split(":").map(Number);
      const start = new Date(m.date);
      start.setHours(h, min, 0, 0);
      const locked = now >= start;
      const prediction = getPrediction(m.id);
      const result = getResult(m.id);
      return { ...m, locked, prediction, result };
    });
  }, [matches, getPrediction, getResult, now]);

  const upcomingCount = withStatus.filter(m => !m.locked && m.id <= 70).length;
  const doneCount = withStatus.filter(m => m.locked && !!m.result && m.id <= 70).length;

  const nextUpcomingMatchId = [...withStatus].sort((a,b) => a.id - b.id).find(m => !m.result)?.id;

  // Auto-scroll to next upcoming match
  useEffect(() => {
    if (isHydrated && nextUpcomingMatchId && activeTab === "league") {
      setTimeout(() => {
        const el = document.getElementById(`match-${nextUpcomingMatchId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    }
  }, [isHydrated, filter, nextUpcomingMatchId, activeTab]);

  const filteredLeague = withStatus.filter((m) => {
    // Standard filters for regular league stage
    if (m.id >= 71) return false; // Exclude playoffs in league stage tab
    if (filter === "upcoming" && m.locked) return false;
    if (filter === "live-locked" && !m.locked) return false;
    
    if (teamFilter !== "all" && m.team1 !== teamFilter && m.team2 !== teamFilter) return false;
    if (venueFilter !== "all" && m.venue !== venueFilter) return false;
    
    return true;
  }).sort((a, b) => a.id - b.id);

  const playoffFiltered = withStatus.filter((m) => m.id >= 71 && m.id <= 74).sort((a, b) => a.id - b.id);

  const predictedCount = withStatus.filter((m) => m.prediction && m.id <= 74).length;

  // Champion Prediction variables
  const championPrediction = getPrediction(100);
  const selectedChampTeam = championPrediction?.predictedTeam || null;
  const champConfig = selectedChampTeam ? TEAM_CONFIG[selectedChampTeam] : null;

  // Initialize and check local storage lock state for champion
  useEffect(() => {
    if (currentUser && currentGroup) {
      const val = localStorage.getItem(`ipl_champion_locked_${currentGroup}_${currentUser.id}`);
      setIsChampLockedLocally(val === "true");
    }
  }, [currentUser, currentGroup]);

  const handleLockChampion = () => {
    if (!currentUser || !currentGroup || !selectedChampTeam) return;
    localStorage.setItem(`ipl_champion_locked_${currentGroup}_${currentUser.id}`, "true");
    setIsChampLockedLocally(true);
  };

  const handleUnlockChampion = () => {
    if (!currentUser || !currentGroup) return;
    localStorage.removeItem(`ipl_champion_locked_${currentGroup}_${currentUser.id}`);
    setIsChampLockedLocally(false);
  };

  const handleSelectChampion = async (teamName: string) => {
    if (isChampLocked || isChampLockedLocally || !currentUser || !currentGroup) return;
    await predict(100, teamName, "2026-05-26", "19:30");
  };

  // Playoff bracket structure variables
  const q1 = playoffFiltered.find(m => m.id === 71);
  const elim = playoffFiltered.find(m => m.id === 72);
  const q2 = playoffFiltered.find(m => m.id === 73);
  const final = playoffFiltered.find(m => m.id === 74);

  const playoffTeams = useMemo(() => {
    const teams = new Set<string>();
    if (q1?.team1 && q1.team1 !== "TBD") teams.add(q1.team1);
    if (q1?.team2 && q1.team2 !== "TBD") teams.add(q1.team2);
    if (elim?.team1 && elim.team1 !== "TBD") teams.add(elim.team1);
    if (elim?.team2 && elim.team2 !== "TBD") teams.add(elim.team2);
    
    // Fallback to all teams in TEAM_CONFIG if none are set yet (e.g. at start of tournament)
    if (teams.size === 0) {
      Object.keys(TEAM_CONFIG).filter(k => k !== "TBD").forEach(t => teams.add(t));
    }
    return Array.from(teams);
  }, [q1, elim]);

  const handlePredictPlayoffTeam = async (matchId: number, team: string, date: string, time: string) => {
    if (!currentUser || !currentGroup || team === "TBD") return;
    const match = playoffFiltered.find(m => m.id === matchId);
    if (match?.locked) return;
    
    const currentPred = getPrediction(matchId);
    if (currentPred?.predictedTeam === team) {
      await clearPrediction(matchId, date, time);
    } else {
      await predict(matchId, team, date, time);
    }
  };

  const formatBracketHeader = (match: Match | undefined) => {
    if (!match) return "";
    const dateFormatted = new Date(match.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    return `${dateFormatted} • ${match.venue}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <style>{`
        @keyframes bracket-flow {
          to {
            stroke-dashoffset: -40;
          }
        }
        .glowing-connector {
          stroke-dasharray: 6 10;
          animation: bracket-flow 2s linear infinite;
        }
        .playoff-bracket-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .playoff-bracket-card:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 25px -5px rgba(212, 175, 55, 0.15);
        }
      `}</style>

      {/* Ticker Tape - All Team Logos */}
      <div className="w-full overflow-hidden bg-black/40 border-y border-[#D4AF37]/20 py-3 mb-8 -mx-4 sm:mx-0 sm:rounded-xl sm:border-x flex items-center shadow-lg shadow-black/50 backdrop-blur-md">
        <div className="text-[10px] font-black uppercase text-[#D4AF37] px-4 shrink-0 border-r border-[#D4AF37]/20 tracking-wider">TEAMS</div>
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/80 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent z-10" />

          <div className="ticker-track items-center gap-8 px-6">
            {[...Object.entries(TEAM_CONFIG), ...Object.entries(TEAM_CONFIG)].filter(([k]) => k !== "TBD").map(([name, team], i) => (
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

      {/* Champion Prediction Widget */}
      {(!currentUser || !currentGroup) ? (
        <div className="relative bg-gradient-to-br from-[#121829] to-[#0A0D1A] border-2 border-[#D4AF37]/15 rounded-3xl p-6 mb-10 overflow-hidden shadow-lg flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md tracking-widest inline-block mb-2">
              🏆 Premium Feature
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Predict the <span className="gold-text">IPL Winner</span>
            </h2>
            <p className="text-white/50 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed">
              {!currentUser ? (
                <>Unlock the champion prediction picker and qualify for the <strong className="text-emerald-400">+5 Leaderboard points</strong> bonus! Please <Link href="/login" className="text-[#D4AF37] underline hover:text-[#FFD700]">log in</Link> to make your prediction.</>
              ) : (
                <>Unlock the champion prediction picker and qualify for the <strong className="text-emerald-400">+5 Leaderboard points</strong> bonus! Please <Link href="/groups" className="text-[#D4AF37] underline hover:text-[#FFD700]">select or join a group</Link> to make your prediction.</>
              )}
            </p>
          </div>
          <div className="shrink-0">
            {!currentUser ? (
              <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:scale-105 transition-all text-black font-black uppercase tracking-wider rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-yellow-500/10 cursor-pointer">
                <span>🔑</span> Log In to Predict
              </Link>
            ) : (
              <Link href="/groups" className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:scale-105 transition-all text-black font-black uppercase tracking-wider rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-yellow-500/10 cursor-pointer">
                <span>👥</span> Select a Group
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="relative bg-gradient-to-br from-[#121829] to-[#0A0D1A] border-2 border-[#D4AF37]/30 rounded-3xl p-6 mb-10 overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-[#D4AF37]/5 to-transparent blur-3xl pointer-events-none" />
          
          {/* Text details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md tracking-widest flex items-center gap-1">
                <SparklesIcon className="w-3.5 h-3.5" /> Premium Event
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isChampLocked || isChampLockedLocally ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse"}`}>
                {isChampLocked || isChampLockedLocally ? "🔒 Locked" : `⏳ ${champCountdown}`}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Predict the <span className="gold-text">IPL Winner</span>
            </h2>
            <p className="text-white/50 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed">
              Choose your tournament winner from the 4 qualified playoff teams! Submit and lock your prediction before <strong className="text-[#D4AF37]">7:30 PM on 26th May</strong>. If correct, you will be awarded <strong className="text-emerald-400">+5 Leaderboard points</strong>!
            </p>

            {/* Selectors grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 max-w-xl">
              {playoffTeams.map((name) => {
                const config = TEAM_CONFIG[name];
                if (!config) return null;
                const isSelected = selectedChampTeam === name;
                const isDisabled = isChampLocked || isChampLockedLocally;
                return (
                  <button
                    key={name}
                    disabled={isDisabled}
                    onClick={() => handleSelectChampion(name)}
                    className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
                      isSelected 
                        ? "border-[#D4AF37] scale-105 bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.15)]" 
                        : isDisabled
                          ? "border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 hover:scale-[1.02]"
                    }`}
                    title={name}
                  >
                    <div className={`w-9 h-9 rounded-full p-[2px] bg-white transition-transform ${isSelected ? "scale-110 shadow-lg" : "group-hover:scale-105"}`}>
                      <div className="relative w-full h-full">
                        <Image src={config.logo} alt={config.shortCode} fill className="object-contain" />
                      </div>
                    </div>
                    <span className={`text-[10px] font-black mt-2 ${isSelected ? "text-[#D4AF37]" : "text-white/40 group-hover:text-white/80"}`}>
                      {config.shortCode}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Lock Control Button */}
            {!isChampLocked && (
              <div className="mt-5 flex items-center justify-start gap-4">
                {!selectedChampTeam ? (
                  <button
                    disabled
                    className="px-6 py-2.5 bg-white/5 text-white/20 border border-white/5 text-xs font-black uppercase tracking-wider rounded-xl cursor-not-allowed flex items-center gap-1.5"
                  >
                    <span>🔒</span> Select a Team to Lock
                  </button>
                ) : !isChampLockedLocally ? (
                  <button
                    onClick={handleLockChampion}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🔒</span> Lock in Champion Pick
                  </button>
                ) : (
                  <button
                    onClick={handleUnlockChampion}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 border border-white/10 cursor-pointer flex items-center gap-1"
                  >
                    <span>🔓</span> Unlock and Change Choice
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Current Selection Visualizer */}
          <div className="shrink-0 flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl min-w-[200px] w-full md:w-auto relative shadow-inner">
            {champConfig ? (
              <div className="flex flex-col items-center text-center animate-fade-in">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Your Champion Choice</div>
                <div className="w-20 h-20 bg-white rounded-full p-2 border-4 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/10 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] animate-bounce">👑</div>
                  <div className="relative w-full h-full">
                    <Image src={champConfig.logo} alt={selectedChampTeam || ""} fill className="object-contain" />
                  </div>
                </div>
                <div className="text-md font-black text-white mt-3" style={{ color: champConfig.primary }}>
                  {champConfig.shortCode}
                </div>
                <div className={`text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full mt-1.5 ${
                  (isChampLocked || isChampLockedLocally)
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-amber-400 bg-amber-500/10 border border-amber-400/20 animate-pulse"
                }`}>
                  {(isChampLocked || isChampLockedLocally) ? "🔒 Locked Pick" : "⏳ Click Lock on Left"}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 flex flex-col items-center gap-2">
                <TrophyIcon className="w-10 h-10 text-white/20 animate-pulse" />
                <div className="text-xs font-bold text-white/50">No champion picked yet</div>
                <div className="text-[9px] text-[#D4AF37] font-semibold tracking-wider uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded-md mt-1">
                  Pick above to qualify!
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Area controls */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#B8860B] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] border border-[#FFF0A0]/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 w-full h-full translate-x-[-100%] skew-x-[-15deg] animate-[shimmer_3s_infinite]" />
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 sm:w-8 sm:h-8 text-black drop-shadow-md relative z-10">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 18.1 8.9 19 10 19H14C15.1 19 16 18.1 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM12 4C14.76 4 17 6.24 17 9C17 11.76 14.76 14 12 14C9.24 14 7 11.76 7 9C7 6.24 9.24 4 12 4ZM10 20H14V22H10V20Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                Tournament <span className="gold-text">Center</span>
              </h1>
              <p className="text-sm font-medium text-white/60 mt-1">
                Predict the winner of regular fixtures and dynamic playoffs!
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3 max-w-sm">
            <span className="text-xs font-bold text-[#D4AF37] whitespace-nowrap">{predictedCount} / 74 Predicts</span>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden flex-1 backdrop-blur-sm border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#FFD700] to-[#D4AF37] rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${(predictedCount / 74) * 100}%` }}
              >
                <div className="absolute inset-0 w-full h-full bg-white/30 skew-x-[-20deg] translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex flex-col gap-3 w-full md:w-auto items-end">
          {/* Main Tabs */}
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("playoffs")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === "playoffs"
                  ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD700]/10 text-[#FFD700] border border-[#D4AF37]/40 shadow-inner"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              🔥 Playoffs Section
            </button>
            <button
              onClick={() => setActiveTab("league")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === "league"
                  ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD700]/10 text-[#FFD700] border border-[#D4AF37]/40 shadow-inner"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              🏏 League Stage
            </button>
          </div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      {!isHydrated ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-3xl h-[380px] shimmer border-white/5" />
          ))}
        </div>
      ) : activeTab === "playoffs" ? (
        <div className="space-y-10">
          
          {/* PLAYOFFS BRACKET VISUAL TREE */}
          <div className="w-full bg-[#080B13]/70 border border-[#D4AF37]/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Background design elements */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-10">
              <div className="text-[10px] font-black uppercase text-[#D4AF37] tracking-[0.25em] mb-1">IPL 2026 FINALS</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
                Interactive <span className="gold-text">Playoff Bracket</span>
              </h2>
              <p className="text-white/50 text-xs mt-1">Click a team to lock in predictions directly on the bracket tree!</p>
            </div>

            {/* Tree Grid */}
            <div className="overflow-x-auto scx pb-6 -mx-6 px-6">
              <div className="min-w-[1000px] grid grid-cols-12 gap-2 relative items-center py-8">
                
                {/* SVG Connections Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" viewBox="0 0 1000 360" fill="none">
                  {/* Background Solid paths */}
                  <path d="M 280 90 L 400 90 L 400 65 L 720 65" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <path d="M 280 90 L 400 90 L 400 160 L 420 160" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <path d="M 280 270 L 400 270 L 400 220 L 420 220" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <path d="M 680 190 L 700 190 L 700 120 L 720 120" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />

                  {/* Q1 to Final (Top path - Glowing Gold) */}
                  <path d="M 280 90 L 400 90 L 400 65 L 720 65" stroke="url(#goldGrad)" strokeWidth="2" className="glowing-connector" />
                  
                  {/* Q1 to Q2 (Bottom path for loser - Glowing Orange) */}
                  <path d="M 280 90 L 400 90 L 400 160 L 420 160" stroke="url(#orangeGrad)" strokeWidth="2" className="glowing-connector" />

                  {/* Eliminator to Q2 (Path for winner - Glowing Orange) */}
                  <path d="M 280 270 L 400 270 L 400 220 L 420 220" stroke="url(#orangeGrad)" strokeWidth="2" className="glowing-connector" />

                  {/* Q2 to Final (Path for winner - Glowing Gold) */}
                  <path d="M 680 190 L 700 190 L 700 120 L 720 120" stroke="url(#goldGrad)" strokeWidth="2" className="glowing-connector" />
                  
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF822A" />
                      <stop offset="100%" stopColor="#FF5722" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* COLUMN 1: Qualifier 1 & Eliminator (Col-span-3) */}
                <div className="col-span-3 space-y-24 z-10">
                  {/* Qualifier 1 Match Box */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 shadow-xl relative backdrop-blur-sm">
                    {/* Match Info label */}
                    <div className="bg-white text-black text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded absolute -top-2.5 left-4 border border-white/20 italic">
                      Qualifier 1
                    </div>
                    <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider text-right mb-2">
                      {formatBracketHeader(q1)}
                    </div>

                    <div className="space-y-2">
                      {[
                        { team: q1?.team1, short: q1?.team1Short, config: q1 ? TEAM_CONFIG[q1.team1] : null },
                        { team: q1?.team2, short: q1?.team2Short, config: q1 ? TEAM_CONFIG[q1.team2] : null },
                      ].map((t, idx) => {
                        const isPicked = q1?.prediction?.predictedTeam === t.team;
                        const isWinner = q1?.result?.winner === t.team;
                        return (
                          <button
                            key={`${t.team}-${idx}`}
                            disabled={q1?.locked || t.short === "TBD"}
                            onClick={() => q1 && handlePredictPlayoffTeam(71, t.team!, q1.date, q1.time)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isPicked 
                                ? "border-[#D4AF37]/50 text-white scale-[1.02]" 
                                : "border-white/5 bg-black/40 text-white/70 hover:text-white hover:border-white/20"
                            } ${q1?.locked ? "cursor-default" : "cursor-pointer"}`}
                            style={isPicked && t.config ? { background: `linear-gradient(135deg, ${t.config.primary}25 0%, rgba(212,175,55,0.1) 100%)` } : {}}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {t.short === "TBD" ? (
                                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">❓</div>
                              ) : (
                                <div className="w-5 h-5 bg-white rounded-full p-[2px] relative shrink-0">
                                  <Image src={t.config?.logo || ""} alt={t.short || ""} fill className="object-contain" />
                                </div>
                              )}
                              <span className="text-xs font-black truncate">{t.short === "TBD" ? "TBD" : t.short}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isWinner && <span className="text-[10px] text-emerald-400 font-black">W</span>}
                              {isPicked && <span className="text-xs">⭐</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Eliminator Match Box */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 shadow-xl relative backdrop-blur-sm">
                    <div className="bg-white text-black text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded absolute -top-2.5 left-4 border border-white/20 italic">
                      Eliminator
                    </div>
                    <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider text-right mb-2">
                      {formatBracketHeader(elim)}
                    </div>

                    <div className="space-y-2">
                      {[
                        { team: elim?.team1, short: elim?.team1Short, config: elim ? TEAM_CONFIG[elim.team1] : null },
                        { team: elim?.team2, short: elim?.team2Short, config: elim ? TEAM_CONFIG[elim.team2] : null },
                      ].map((t, idx) => {
                        const isPicked = elim?.prediction?.predictedTeam === t.team;
                        const isWinner = elim?.result?.winner === t.team;
                        return (
                          <button
                            key={`${t.team}-${idx}`}
                            disabled={elim?.locked || t.short === "TBD"}
                            onClick={() => elim && handlePredictPlayoffTeam(72, t.team!, elim.date, elim.time)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isPicked 
                                ? "border-[#D4AF37]/50 text-white scale-[1.02]" 
                                : "border-white/5 bg-black/40 text-white/70 hover:text-white hover:border-white/20"
                            } ${elim?.locked ? "cursor-default" : "cursor-pointer"}`}
                            style={isPicked && t.config ? { background: `linear-gradient(135deg, ${t.config.primary}25 0%, rgba(212,175,55,0.1) 100%)` } : {}}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {t.short === "TBD" ? (
                                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">❓</div>
                              ) : (
                                <div className="w-5 h-5 bg-white rounded-full p-[2px] relative shrink-0">
                                  <Image src={t.config?.logo || ""} alt={t.short || ""} fill className="object-contain" />
                                </div>
                              )}
                              <span className="text-xs font-black truncate">{t.short === "TBD" ? "TBD" : t.short}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isWinner && <span className="text-[10px] text-emerald-400 font-black">W</span>}
                              {isPicked && <span className="text-xs">⭐</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Qualifier 2 (Col-span-5 with offsets) */}
                <div className="col-span-5 flex justify-center z-10 px-8">
                  {/* Qualifier 2 Match Box */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 shadow-xl relative min-w-[240px] max-w-xs backdrop-blur-sm">
                    <div className="bg-white text-black text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded absolute -top-2.5 left-4 border border-white/20 italic">
                      Qualifier 2
                    </div>
                    <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider text-right mb-2">
                      {formatBracketHeader(q2)}
                    </div>

                    <div className="space-y-2">
                      {[
                        { team: q2?.team1, short: q2?.team1Short, config: q2 ? TEAM_CONFIG[q2.team1] : null },
                        { team: q2?.team2, short: q2?.team2Short, config: q2 ? TEAM_CONFIG[q2.team2] : null },
                      ].map((t, idx) => {
                        const isPicked = q2?.prediction?.predictedTeam === t.team;
                        const isWinner = q2?.result?.winner === t.team;
                        return (
                          <button
                            key={`${t.team}-${idx}`}
                            disabled={q2?.locked || t.short === "TBD"}
                            onClick={() => q2 && handlePredictPlayoffTeam(73, t.team!, q2.date, q2.time)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isPicked 
                                ? "border-[#D4AF37]/50 text-white scale-[1.02]" 
                                : "border-white/5 bg-black/40 text-white/70 hover:text-white hover:border-white/20"
                            } ${q2?.locked ? "cursor-default" : "cursor-pointer"} ${t.short === "TBD" ? "opacity-50 select-none" : ""}`}
                            style={isPicked && t.config ? { background: `linear-gradient(135deg, ${t.config.primary}25 0%, rgba(212,175,55,0.1) 100%)` } : {}}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {t.short === "TBD" ? (
                                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">❓</div>
                              ) : (
                                <div className="w-5 h-5 bg-white rounded-full p-[2px] relative shrink-0">
                                  <Image src={t.config?.logo || ""} alt={t.short || ""} fill className="object-contain" />
                                </div>
                              )}
                              <span className="text-xs font-black truncate">{t.short === "TBD" ? "TBD (Loser Q1 / Winner Elim)" : t.short}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isWinner && <span className="text-[10px] text-emerald-400 font-black">W</span>}
                              {isPicked && <span className="text-xs">⭐</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: The Grand Final (Col-span-4) */}
                <div className="col-span-4 flex justify-end z-10">
                  {/* Final Match Box */}
                  <div className="bg-white/[0.02] border-2 border-[#D4AF37]/40 rounded-2xl p-4 shadow-2xl relative min-w-[260px] max-w-xs backdrop-blur-sm shadow-[#D4AF37]/5">
                    <div className="bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-black text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded absolute -top-3 left-4 border border-[#FFF0A0]/40 italic shadow-lg shadow-black/50">
                      🏆 GRAND FINAL
                    </div>
                    <div className="text-[8px] text-[#D4AF37] font-black uppercase tracking-wider text-right mb-2 flex items-center justify-end gap-1">
                      <span>👑 CHAMPIONSHIP MATCH</span> • {formatBracketHeader(final)}
                    </div>

                    <div className="space-y-2">
                      {[
                        { team: final?.team1, short: final?.team1Short, config: final ? TEAM_CONFIG[final.team1] : null },
                        { team: final?.team2, short: final?.team2Short, config: final ? TEAM_CONFIG[final.team2] : null },
                      ].map((t, idx) => {
                        const isPicked = final?.prediction?.predictedTeam === t.team;
                        const isWinner = final?.result?.winner === t.team;
                        return (
                          <button
                            key={`${t.team}-${idx}`}
                            disabled={final?.locked || t.short === "TBD"}
                            onClick={() => final && handlePredictPlayoffTeam(74, t.team!, final.date, final.time)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isPicked 
                                ? "border-[#D4AF37] text-white scale-[1.02] shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
                                : "border-white/10 bg-black/50 text-white/80 hover:text-white hover:border-[#D4AF37]/30"
                            } ${final?.locked ? "cursor-default" : "cursor-pointer"} ${t.short === "TBD" ? "opacity-50 select-none" : ""}`}
                            style={isPicked && t.config ? { background: `linear-gradient(135deg, ${t.config.primary}25 0%, rgba(212,175,55,0.1) 100%)` } : {}}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {t.short === "TBD" ? (
                                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs">❓</div>
                              ) : (
                                <div className="w-6 h-6 bg-white rounded-full p-[2px] relative shrink-0">
                                  <Image src={t.config?.logo || ""} alt={t.short || ""} fill className="object-contain" />
                                </div>
                              )}
                              <span className="text-sm font-black truncate">{t.short === "TBD" ? "TBD (Finalist 1 / 2)" : t.short}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isWinner && <span className="text-xs text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">👑 WINNER</span>}
                              {isPicked && <span className="text-sm">⭐</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* PLAYOFF MATCH CARDS LIST */}
          <div>
            <div className="flex items-center gap-2 mb-6 justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Playoff Match Details</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {playoffFiltered.map((match, i) => (
                <div key={match.id} className="relative rounded-2xl overflow-hidden p-0.5 bg-gradient-to-br from-[#D4AF37]/30 via-transparent to-white/5 shadow-xl">
                  <MatchCard
                    id={`match-${match.id}`}
                    match={match}
                    prediction={getPrediction(match.id)}
                    result={getResult(match.id)}
                    onPredict={predict}
                    onClearPrediction={clearPrediction}
                    index={i}
                    predictionCount={getPredictionCount(match.id)}
                    matchPredictions={allPredictions.filter(p => p.matchId === match.id)}
                    groupUsers={groupUsers}
                    totalUsers={totalUsers}
                    isLoggedIn={!!currentUser}
                  />
                </div>
              ))}
            </div>
          </div>
          
        </div>
      ) : (
        /* LEAGUE STAGE TAB CONTENT */
        <div>
          {/* League Stage Filters */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 mb-6 bg-white/[0.02] border border-white/10 p-3 rounded-2xl backdrop-blur-md max-w-3xl mx-auto">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-[#06080F] border border-white/10 rounded-xl text-white/80 text-xs px-3 py-2.5 outline-none focus:border-[#D4AF37]/50 flex-1 min-w-[120px] transition-colors"
            >
              <option value="all">All Teams</option>
              {uniqueTeams.map(t => <option key={t} value={t}>{TEAM_CONFIG[t]?.shortCode || t}</option>)}
            </select>
            
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="bg-[#06080F] border border-white/10 rounded-xl text-white/80 text-xs px-3 py-2.5 outline-none focus:border-[#D4AF37]/50 flex-1 min-w-[120px] transition-colors"
            >
              <option value="all">All Venues</option>
              {uniqueVenues.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "upcoming", label: "Open" },
                  { key: "live-locked", label: "Done" },
                ] as { key: FilterType; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-300 ${filter === key
                      ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#FFD700]/10 text-[#FFD700] border border-[#D4AF37]/30 shadow-inner"
                      : "text-white/40 hover:text-white/80"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {(teamFilter !== "all" || venueFilter !== "all") && (
              <button
                onClick={() => { setTeamFilter("all"); setVenueFilter("all"); }}
                className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-colors border border-red-500/20 shrink-0"
              >
                Clear Filters
              </button>
            )}
          </div>

          {filteredLeague.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border-white/5 mt-4">
              <SparklesIcon className="w-12 h-12 text-[#D4AF37]/50 mb-4 pulse-glow rounded-full" />
              <p className="text-white/80 text-xl font-bold tracking-tight">No fixtures found</p>
              <p className="text-white/50 text-sm mt-1">Try resetting the filters above</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {filteredLeague.map((match, i) => (
                <MatchCard
                  key={match.id}
                  id={`match-${match.id}`}
                  match={match}
                  prediction={getPrediction(match.id)}
                  result={getResult(match.id)}
                  onPredict={predict}
                  onClearPrediction={clearPrediction}
                  index={i}
                  predictionCount={getPredictionCount(match.id)}
                  matchPredictions={allPredictions.filter(p => p.matchId === match.id)}
                  groupUsers={groupUsers}
                  totalUsers={totalUsers}
                  isLoggedIn={!!currentUser}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
