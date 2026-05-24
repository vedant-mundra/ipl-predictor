"use client";

import { useState } from "react";
import { useResults } from "@/hooks/useResults";
import { useAuth } from "@/hooks/useAuth";
import { usePlayoffs } from "@/hooks/usePlayoffs";
import fixtures from "@/data/fixtures.json";
import type { Match } from "@/lib/types";
import { TEAM_CONFIG, SHORT_TO_FULL } from "@/lib/teams";
import { ShieldCheckIcon, TrashIcon, CheckCircleIcon, CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";

const initialMatches = fixtures as Match[];

export default function AdminPage() {
  const { results, setResult, removeResult, isHydrated: isResultsHydrated } = useResults();
  const { currentUser, isHydrated: isAuthHydrated } = useAuth();
  const { playoffMatches, updatePlayoffMatch, isHydrated: isPlayoffsHydrated } = usePlayoffs();
  
  const [activeTab, setActiveTab] = useState<"results" | "playoffs">("results");
  const [savedResult, setSavedResult] = useState<number | null>(null);
  const [savedConfig, setSavedConfig] = useState<number | null>(null);

  // Keep local editing states for playoff matches
  const [playoffForms, setPlayoffForms] = useState<Record<number, { team1: string; team2: string; venue: string; date: string; time: string }>>({});

  const isHydrated = isResultsHydrated && isAuthHydrated && isPlayoffsHydrated;

  // Merge playoff overrides into standard matches
  const matches = initialMatches.map((m) => {
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

  const handleSetWinner = (matchId: number, winner: string) => {
    setResult(matchId, winner);
    setSavedResult(matchId);
    setTimeout(() => setSavedResult(null), 2000);
  };

  const handleInitPlayoffForm = (match: Match) => {
    if (playoffForms[match.id]) return;
    setPlayoffForms((prev) => ({
      ...prev,
      [match.id]: {
        team1: match.team1Short,
        team2: match.team2Short,
        venue: match.venue,
        date: match.date,
        time: match.time,
      },
    }));
  };

  const handleUpdatePlayoffField = (matchId: number, field: string, value: string) => {
    setPlayoffForms((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId]!,
        [field]: value,
      },
    }));
  };

  const handleSavePlayoffConfig = async (matchId: number) => {
    const form = playoffForms[matchId];
    if (!form) return;
    
    const success = await updatePlayoffMatch(matchId, form.team1, form.team2, form.venue, form.date, form.time);
    if (success) {
      setSavedConfig(matchId);
      setTimeout(() => setSavedConfig(null), 2500);
    }
  };

  if (!isHydrated) return null;

  if (!currentUser?.isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <ShieldCheckIcon className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Access Denied</h1>
        <p className="text-gray-400">You do not have permission to view or edit match results.</p>
        <p className="text-gray-500 text-sm mt-2">Only administrators can access this control panel.</p>
      </div>
    );
  }

  const playoffMatchesList = matches.filter(m => m.id >= 71);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Admin Panel</h1>
            <p className="text-xs text-white/50">Manage match winners and playoff schedules</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "results"
                ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/10 text-purple-300 border border-purple-500/30"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            Match Results
          </button>
          <button
            onClick={() => setActiveTab("playoffs")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "playoffs"
                ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/10 text-purple-300 border border-purple-500/30"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            Configure Playoffs
          </button>
        </div>
      </div>

      {/* TAB CONTENT: MANAGE RESULTS */}
      {activeTab === "results" ? (
        <div className="space-y-6">
          {/* Quick-Access Highlighted Playoff Results */}
          <div className="bg-gradient-to-br from-[#1c132c] via-[#0D0F1D] to-[#0A0D1A] border-2 border-[#D4AF37]/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(212,175,55,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-xl pointer-events-none" />
            <h2 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest mb-4 flex items-center gap-1.5 italic">
              🏆 Playoff Results Manager
            </h2>
            <div className="space-y-3">
              {playoffMatchesList.map((match) => {
                const result = results.find((r) => r.id === match.id);
                const team1Config = TEAM_CONFIG[match.team1];
                const team2Config = TEAM_CONFIG[match.team2];
                const justSaved = savedResult === match.id;

                return (
                  <div 
                    key={match.id} 
                    className="bg-white/[0.02] hover:bg-white/[0.04] border border-[#D4AF37]/25 rounded-xl px-4 py-3.5 transition-all shadow-inner"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-black text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2 py-0.5 rounded italic shrink-0">
                          #{match.id} PLAYOFF
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-black" style={{ color: team1Config?.primary || "#718096" }}>
                            {match.team1Short}
                          </span>
                          <span className="text-white/30 text-xs font-bold">vs</span>
                          <span className="text-sm font-black" style={{ color: team2Config?.primary || "#718096" }}>
                            {match.team2Short}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 font-semibold bg-white/5 px-2 py-0.5 rounded hidden sm:inline truncate max-w-[200px]">
                          📍 {match.venue.split(",")[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {result ? (
                          <>
                            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              WINNER: {result.winner.split(" ").slice(-1)[0]}
                            </span>
                            <button
                              onClick={() => removeResult(match.id)}
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove result"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={match.team1Short === "TBD"}
                              onClick={() => handleSetWinner(match.id, match.team1)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all duration-200 hover:scale-105 ${match.team1Short === "TBD" ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
                              style={{
                                color: team1Config?.primary,
                                borderColor: `${team1Config?.primary}40`,
                                backgroundColor: `${team1Config?.primary}12`,
                              }}
                            >
                              {match.team1Short} Won
                            </button>
                            <button
                              onClick={() => handleSetWinner(match.id, "Washout")}
                              className="px-3 py-1.5 rounded-lg text-xs font-black border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-all duration-200 hover:scale-105 cursor-pointer"
                            >
                              Washout
                            </button>
                            <button
                              disabled={match.team2Short === "TBD"}
                              onClick={() => handleSetWinner(match.id, match.team2)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all duration-200 hover:scale-105 ${match.team2Short === "TBD" ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
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
                          <span className="text-xs text-green-400 font-bold animate-pulse">Saved!</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* League Stage Matches List */}
          <div className="space-y-3">
            <h2 className="text-xs font-black text-white/40 uppercase tracking-widest pl-1">
              🏏 League Stage Results (Matches 1 - 70)
            </h2>
            {matches.filter(m => m.id <= 70).map((match) => {
              const result = results.find((r) => r.id === match.id);
              const team1Config = TEAM_CONFIG[match.team1];
              const team2Config = TEAM_CONFIG[match.team2];
              const justSaved = savedResult === match.id;

              return (
                <div 
                  key={match.id} 
                  className="glass glass-hover rounded-xl px-4 py-3 border border-white/5"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-white/30 shrink-0">
                        #{match.id}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-black" style={{ color: team1Config?.primary || "#718096" }}>
                          {match.team1Short}
                        </span>
                        <span className="text-white/30 text-xs font-bold">vs</span>
                        <span className="text-sm font-black" style={{ color: team2Config?.primary || "#718096" }}>
                          {match.team2Short}
                        </span>
                      </div>
                      <span className="text-xs text-white/40 hidden sm:inline font-semibold">
                        {new Date(match.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {result ? (
                        <>
                          <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            WINNER: {result.winner.split(" ").slice(-1)[0]}
                          </span>
                          <button
                            onClick={() => removeResult(match.id)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove result"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSetWinner(match.id, match.team1)}
                            className="px-3 py-1.5 rounded-lg text-xs font-black border border-transparent hover:scale-105 cursor-pointer"
                            style={{
                              color: team1Config?.primary,
                              borderColor: `${team1Config?.primary}40`,
                              backgroundColor: `${team1Config?.primary}12`,
                            }}
                          >
                            {match.team1Short} Won
                          </button>
                          <button
                            onClick={() => handleSetWinner(match.id, "Washout")}
                            className="px-3 py-1.5 rounded-lg text-xs font-black border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-all duration-200 hover:scale-105 cursor-pointer"
                          >
                            Washout
                          </button>
                          <button
                            onClick={() => handleSetWinner(match.id, match.team2)}
                            className="px-3 py-1.5 rounded-lg text-xs font-black border border-transparent hover:scale-105 cursor-pointer"
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
                        <span className="text-xs text-green-400 font-bold animate-pulse">Saved!</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TAB CONTENT: CONFIGURE PLAYOFF TEAMS */
        <div className="space-y-6">
          <div className="glass rounded-2xl p-4 border-white/5 bg-white/[0.01] text-xs text-white/50 leading-relaxed mb-6">
            <span className="text-purple-400 font-bold">💡 How to use:</span> Assign the actual teams to the 4 playoff slots as they qualify. Setting the team shortcodes (e.g. RCB, GT, SRH, RR) automatically links their logos, gradient color schemes, and prediction triggers across the user dashboard!
          </div>

          {playoffMatchesList.map((match) => {
            handleInitPlayoffForm(match);
            const form = playoffForms[match.id];
            const justSaved = savedConfig === match.id;
            const matchTitles: Record<number, string> = {
              71: "Qualifier 1",
              72: "Eliminator",
              73: "Qualifier 2",
              74: "Grand Final",
            };

            return (
              <div key={match.id} className="glass rounded-2xl p-5 border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-2xl pointer-events-none" />
                
                {/* Match title header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-[#D4AF37]">🏆</span> {matchTitles[match.id] || `Match ${match.id}`}
                  </h3>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest bg-white/5 px-2.5 py-0.5 rounded">
                    Match ID {match.id}
                  </span>
                </div>

                {form && (
                  <div className="space-y-4">
                    {/* Select Teams grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Team 1 Selector */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-1.5">Team 1 (Left Card)</label>
                        <select
                          value={form.team1}
                          onChange={(e) => handleUpdatePlayoffField(match.id, "team1", e.target.value)}
                          className="w-full bg-[#06080F] border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 outline-none focus:border-purple-500"
                        >
                          <option value="TBD">TBD (To Be Decided)</option>
                          {Object.keys(SHORT_TO_FULL).filter(k => k !== "TBD").map((code) => (
                            <option key={code} value={code}>{code} - {SHORT_TO_FULL[code]}</option>
                          ))}
                        </select>
                      </div>

                      {/* Team 2 Selector */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-1.5">Team 2 (Right Card)</label>
                        <select
                          value={form.team2}
                          onChange={(e) => handleUpdatePlayoffField(match.id, "team2", e.target.value)}
                          className="w-full bg-[#06080F] border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 outline-none focus:border-purple-500"
                        >
                          <option value="TBD">TBD (To Be Decided)</option>
                          {Object.keys(SHORT_TO_FULL).filter(k => k !== "TBD").map((code) => (
                            <option key={code} value={code}>{code} - {SHORT_TO_FULL[code]}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Venue & Date/Time selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Venue Input */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-1.5">Venue</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={form.venue}
                            onChange={(e) => handleUpdatePlayoffField(match.id, "venue", e.target.value)}
                            placeholder="Venue name"
                            className="w-full bg-[#06080F] border border-white/10 rounded-xl text-white text-xs pl-8 pr-3 py-2.5 outline-none focus:border-purple-500"
                          />
                          <MapPinIcon className="w-4 h-4 text-white/30 absolute left-2.5 top-3" />
                        </div>
                      </div>

                      {/* Date Picker */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-1.5">Date</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={form.date}
                            onChange={(e) => handleUpdatePlayoffField(match.id, "date", e.target.value)}
                            className="w-full bg-[#06080F] border border-white/10 rounded-xl text-white text-xs pl-8 pr-3 py-2.5 outline-none focus:border-purple-500 cursor-pointer"
                          />
                          <CalendarIcon className="w-4 h-4 text-white/30 absolute left-2.5 top-3 pointer-events-none" />
                        </div>
                      </div>

                      {/* Time Picker */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-white/40 tracking-wider mb-1.5">Start Time (24h)</label>
                        <input
                          type="text"
                          value={form.time}
                          onChange={(e) => handleUpdatePlayoffField(match.id, "time", e.target.value)}
                          placeholder="e.g. 19:30"
                          className="w-full bg-[#06080F] border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Action Save button */}
                    <div className="flex items-center gap-3 justify-end pt-2">
                      {justSaved && (
                        <span className="text-xs text-purple-400 font-black animate-pulse flex items-center gap-1">
                          ✨ Successfully Saved Override!
                        </span>
                      )}
                      <button
                        onClick={() => handleSavePlayoffConfig(match.id)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider py-2 px-5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-purple-500/20 cursor-pointer"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
