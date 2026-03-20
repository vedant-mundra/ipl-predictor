"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Prediction } from "@/lib/types";
import { useAuth } from "./useAuth";

const PREDICTIONS_KEY = "ipl_all_predictions_2026";

export function usePredictions() {
  const [allPredictions, setAllPredictions, isHydrated] = useLocalStorage<Prediction[]>(
    PREDICTIONS_KEY,
    []
  );
  const { currentUser, currentGroup, users } = useAuth();

  const isMatchLocked = useCallback((matchDate: string, matchTime: string): boolean => {
    const [hours, minutes] = matchTime.split(":").map(Number);
    const matchStart = new Date(matchDate);
    matchStart.setHours(hours, minutes, 0, 0);
    return new Date() >= matchStart;
  }, []);

  const predict = useCallback(
    (matchId: number, team: string, matchDate: string, matchTime: string): boolean => {
      if (!currentUser) return false;
      if (isMatchLocked(matchDate, matchTime)) return false;

      setAllPredictions((prev) => {
        // Remove existing prediction for this user and match
        const filtered = prev.filter(p => !(p.userId === currentUser.id && p.matchId === matchId));
        return [
          ...filtered,
          {
            userId: currentUser.id,
            matchId,
            predictedTeam: team,
            lockedAt: new Date().toISOString()
          }
        ];
      });
      return true;
    },
    [currentUser, isMatchLocked, setAllPredictions]
  );

  const getPrediction = useCallback(
    (matchId: number): Prediction | null => {
      if (!currentUser) return null;
      return allPredictions.find(p => p.userId === currentUser.id && p.matchId === matchId) || null;
    },
    [allPredictions, currentUser]
  );

  const getPredictionCount = useCallback((matchId: number): number => {
    if (!currentGroup) return 0;
    const groupUserIds = users.filter(u => u.groupIds?.includes(currentGroup)).map(u => u.id);
    return allPredictions.filter(p => p.matchId === matchId && groupUserIds.includes(p.userId)).length;
  }, [allPredictions, currentGroup, users]);

  const clearPrediction = useCallback(
    (matchId: number, matchDate: string, matchTime: string): boolean => {
      if (!currentUser) return false;
      if (isMatchLocked(matchDate, matchTime)) return false;
      
      setAllPredictions((prev) => prev.filter(p => !(p.userId === currentUser.id && p.matchId === matchId)));
      return true;
    },
    [currentUser, isMatchLocked, setAllPredictions]
  );

  return {
    allPredictions,
    predict,
    getPrediction,
    getPredictionCount,
    clearPrediction,
    isMatchLocked,
    isHydrated,
  };
}
