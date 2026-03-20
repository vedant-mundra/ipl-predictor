"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { VALID_GROUPS } from "@/lib/groups";

export default function GroupsPage() {
  const router = useRouter();
  const { currentUser, currentGroup, setCurrentGroup, isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated && !currentUser) {
      router.push("/login");
    }
    // We intentionally removed the currentGroup redirect so users can switch leagues here anytime.
  }, [currentUser, isHydrated, router]);

  if (!isHydrated || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-3xl p-8 sm:p-12 border border-[#D4AF37]/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] via-[#FFDF00] to-[#D4AF37]" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Select League</h1>
          <p className="text-sm text-gray-400">You are a member of multiple leagues. Which one would you like to view?</p>
        </div>

        <div className="space-y-4">
          {currentUser.groupIds.map(groupId => {
            const genericName = VALID_GROUPS[groupId] || "League";
            return (
              <button
                key={groupId}
                onClick={() => {
                  setCurrentGroup(groupId);
                  router.push("/");
                }}
                className={`w-full relative group overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.02] ${
                  currentGroup === groupId ? "ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-black scale-[1.02]" : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/50 to-[#FFDF00]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-[#06080F]/90 backdrop-blur-xl rounded-xl p-4 flex items-center justify-between border border-white/10 group-hover:border-transparent">
                  <span className="font-bold text-white text-lg tracking-widest">{genericName}</span>
                  <span className="text-[#D4AF37] text-sm font-bold">{currentGroup === groupId ? "Active" : "Switch \u2192"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
