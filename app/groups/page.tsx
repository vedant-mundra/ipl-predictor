"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UsersIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

export default function GroupsPage() {
  const { currentUser, currentGroup, setCurrentGroup, isHydrated, refreshUserGroups } = useAuth();
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isHydrated && !currentUser) {
      router.push("/login");
    }
  }, [isHydrated, currentUser, router]);

  if (!isHydrated || !currentUser) {
    return <div className="flex justify-center mt-20"><div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin"></div></div>;
  }

  const handleSelect = (groupId: string) => {
    setCurrentGroup(groupId);
    router.push("/");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !currentUser) return;

    setLoading(true);
    setError("");
    setSuccess("");

    const code = inviteCode.trim().toUpperCase();

    // Verify group exists
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", code)
      .single();

    if (groupError || !groupData) {
      setError("Invalid invite code. League not found.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("user_groups")
      .insert({ user_id: currentUser.id, group_id: code });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("You are already in this league.");
      } else {
        setError(insertError.message || "Failed to join league.");
      }
    } else {
      setSuccess(`Successfully joined ${code}!`);
      setInviteCode("");
      if (refreshUserGroups) await refreshUserGroups();
      setCurrentGroup(code); // optionally auto select newly joined group
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Your Leagues</h1>
        <p className="text-gray-400 text-sm">Select a league to view matches and leaderboards</p>
      </div>

      <div className="glass rounded-2xl p-6 border-white/10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <PlusCircleIcon className="w-5 h-5 text-[#D4AF37]" />
          Join New League
        </h2>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter Invite Code (e.g. FAM123)"
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] font-mono transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#FFD700] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              "Join"
            )}
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-3 font-medium">{error}</p>}
        {success && <p className="text-green-400 text-sm mt-3 font-medium">{success}</p>}
      </div>

      <div className="grid gap-4">
        {currentUser.groupIds.map((id) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
              currentGroup === id
                ? "bg-[#D4AF37]/10 border-[#D4AF37]/50"
                : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${currentGroup === id ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-white/5 text-gray-400"}`}>
                <UsersIcon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className={`text-lg font-bold ${currentGroup === id ? "text-[#D4AF37]" : "text-white"}`}>
                  League: {id}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Invite Code: <span className="text-gray-300 font-mono bg-white/10 px-1.5 py-0.5 rounded">{id}</span>
                </p>
              </div>
            </div>
            
            <div className="text-sm font-semibold text-gray-400">
              {currentGroup === id ? "Current" : "Select →"}
            </div>
          </button>
        ))}

        {currentUser.groupIds.length === 0 && (
          <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10">
            <p className="text-gray-400">You haven't joined any leagues yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
