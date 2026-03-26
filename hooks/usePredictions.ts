"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Prediction } from "@/lib/types";
import { useAuth } from "./useAuth";

export function usePredictions() {
  const [groupPredictions, setGroupPredictions] = useState<Prediction[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { currentUser, currentGroup } = useAuth();

  const fetchPredictions = useCallback(async () => {
    if (!currentGroup) {
      setGroupPredictions([]);
      setIsHydrated(true);
      return;
    }

    setIsHydrated(false);

    // Fetch predictions filtered strictly by group_id
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("group_id", currentGroup);

    if (predictions) {
      const mapped: Prediction[] = predictions.map((p) => ({
        userId: p.user_id,
        matchId: p.match_id,
        predictedTeam: p.predicted_team,
        lockedAt: p.locked_at,
      }));
      setGroupPredictions(mapped);
    } else {
      setGroupPredictions([]);
    }

    setIsHydrated(true);
  }, [currentGroup]);

  // Initial fetch when group changes
  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Polling for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPredictions();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  const isMatchLocked = useCallback((matchDate: string, matchTime: string): boolean => {
    const [hours, minutes] = matchTime.split(":").map(Number);
    const matchStart = new Date(matchDate);
    matchStart.setHours(hours, minutes, 0, 0);
    return new Date() >= matchStart;
  }, []);

  const predict = useCallback(
    async (matchId: number, team: string, matchDate: string, matchTime: string): Promise<boolean> => {
      if (!currentUser || !currentGroup) return false;
      if (isMatchLocked(matchDate, matchTime)) return false;

      // Optimistic update
      setGroupPredictions((prev) => {
        const filtered = prev.filter((p) => !(p.userId === currentUser.id && p.matchId === matchId));
        return [
          ...filtered,
          {
            userId: currentUser.id,
            matchId,
            predictedTeam: team,
            lockedAt: new Date().toISOString(),
          },
        ];
      });

      // DB insert/update - now scoped strictly by user_id AND group_id
      const { error } = await supabase
        .from("predictions")
        .upsert(
          {
            user_id: currentUser.id,
            group_id: currentGroup,
            match_id: matchId,
            predicted_team: team,
          },
          { onConflict: "user_id,group_id,match_id" }
        );

      if (error) {
        console.error("Prediction error:", error);
        fetchPredictions(); // Revert on error
        return false;
      }
      return true;
    },
    [currentUser, currentGroup, isMatchLocked, fetchPredictions]
  );

  const getPrediction = useCallback(
    (matchId: number): Prediction | null => {
      if (!currentUser) return null;
      return groupPredictions.find((p) => p.userId === currentUser.id && p.matchId === matchId) || null;
    },
    [groupPredictions, currentUser]
  );

  const getPredictionCount = useCallback(
    (matchId: number): number => {
      if (!currentGroup) return 0;
      return groupPredictions.filter((p) => p.matchId === matchId).length;
    },
    [groupPredictions, currentGroup]
  );

  const clearPrediction = useCallback(
    async (matchId: number, matchDate: string, matchTime: string): Promise<boolean> => {
      if (!currentUser || !currentGroup) return false;
      if (isMatchLocked(matchDate, matchTime)) return false;

      // Optimistic update
      setGroupPredictions((prev) => prev.filter((p) => !(p.userId === currentUser.id && p.matchId === matchId)));

      const { error } = await supabase
        .from("predictions")
        .delete()
        .match({ user_id: currentUser.id, group_id: currentGroup, match_id: matchId });

      if (error) {
        console.error("Clear prediction error:", error);
        fetchPredictions();
        return false;
      }
      return true;
    },
    [currentUser, currentGroup, isMatchLocked, fetchPredictions]
  );

  return {
    allPredictions: groupPredictions,
    predict,
    getPrediction,
    getPredictionCount,
    clearPrediction,
    isMatchLocked,
    isHydrated,
  };
}
