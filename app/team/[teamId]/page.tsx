"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, TrophyIcon, UserIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { teamsInfo } from "@/data/teamsInfo";
import { TEAM_CONFIG } from "@/lib/teams";

export default function TeamInfoPage({ params }: { params: Promise<{ teamId: string }> }) {
  const unwrappedParams = use(params);
  const teamId = unwrappedParams.teamId.toUpperCase();
  const data = teamsInfo[teamId];

  if (!data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">🏏</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Team Not Found</h1>
        <p className="text-white/50 mb-6">The franchise you requested could not be located.</p>
        <Link href="/" className="flex items-center gap-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 px-4 py-2 rounded-xl transition-colors">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Matches
        </Link>
      </div>
    );
  }

  const config = TEAM_CONFIG[data.name];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 fade-in-up">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8">
        <ArrowLeftIcon className="w-4 h-4" /> Back
      </Link>

      {/* Hero Header */}
      <div className="relative glass rounded-3xl p-8 sm:p-12 mb-8 overflow-hidden border border-white/5" style={{ "--team-color-1": config?.primary || "#D4AF37" } as any}>
        <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(45deg, ${config?.primary}, transparent)` }} />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white flex items-center justify-center p-2 shadow-2xl shrink-0" style={{ border: `4px solid ${config?.primary}` }}>
            <div className="relative w-full h-full">
              <Image src={config?.logo || ""} alt={data.name} fill className="object-contain p-2" />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">{data.name}</h1>
            <p className="text-lg font-bold tracking-widest uppercase opacity-80" style={{ color: config?.primary }}>
              {teamId} Franchise
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-5 mb-8">
        {/* Captain */}
        <div className="glass rounded-2xl p-6 flex flex-col border border-white/5">
          <div className="flex items-center gap-2 text-white/40 font-bold uppercase tracking-wider text-xs mb-3">
            <UserIcon className="w-4 h-4" /> Captain
          </div>
          <div className="text-xl font-bold text-white">{data.captain}</div>
        </div>

        {/* Coach */}
        <div className="glass rounded-2xl p-6 flex flex-col border border-white/5">
          <div className="flex items-center gap-2 text-white/40 font-bold uppercase tracking-wider text-xs mb-3">
            <UserGroupIcon className="w-4 h-4" /> Head Coach
          </div>
          <div className="text-xl font-bold text-white">{data.coach}</div>
        </div>

        {/* Titles */}
        <div className="glass rounded-2xl p-6 flex flex-col border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFD700]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2 text-white/40 font-bold uppercase tracking-wider text-xs">
              <TrophyIcon className="w-4 h-4 text-[#FFD700]" /> IPL Titles
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center font-black">
              {data.titles.count}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 relative z-10 mt-2">
            {data.titles.years.length > 0 ? (
              data.titles.years.map(year => (
                <span key={year} className="px-2.5 py-1 rounded bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-bold">
                  {year}
                </span>
              ))
            ) : (
              <span className="text-white/30 text-sm font-medium italic">Searching for their first title...</span>
            )}
          </div>
        </div>
      </div>

      {/* Squad Grid */}
      <div className="glass rounded-3xl p-6 sm:p-10 border border-white/5">
        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
          <span className="w-8 h-1" style={{ backgroundColor: config?.primary }} />
          Current Squad
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.squad.map((player, idx) => (
            <div key={idx} className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-4 border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/30 font-bold shrink-0">
                {player.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="text-sm font-semibold text-white/90">{player}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
