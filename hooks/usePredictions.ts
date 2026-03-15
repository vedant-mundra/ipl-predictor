"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { Predictions, Prediction } from "@/lib/types";

const PREDICTIONS_KEY = "ipl_predictions_2026";

export function usePredictions() {
  const [predictions, setPredictions, isHydrated] = useLocalStorage<Predictions>(
    PREDICTIONS_KEY,
    {}
  );

  const isMatchLocked = useCallback((matchDate: string, matchTime: string): boolean => {
    const [hours, minutes] = matchTime.split(":").map(Number);
    const matchStart = new Date(matchDate);
    matchStart.setHours(hours, minutes, 0, 0);
    return new Date() >= matchStart;
  }, []);

  const predict = useCallback(
    (matchId: number, team: string, matchDate: string, matchTime: string): boolean => {
      if (isMatchLocked(matchDate, matchTime)) {
        return false; // locked
      }
      const prediction: Prediction = {
        matchId,
        team,
      };
      setPredictions((prev) => ({
        ...prev,
        [String(matchId)]: prediction,
      }));
      return true;
    },
    [isMatchLocked, setPredictions]
  );

  const getPrediction = useCallback(
    (matchId: number): Prediction | null => {
      return predictions[String(matchId)] || null;
    },
    [predictions]
  );

  const clearPrediction = useCallback(
    (matchId: number, matchDate: string, matchTime: string): boolean => {
      if (isMatchLocked(matchDate, matchTime)) {
        return false;
      }
      setPredictions((prev) => {
        const next = { ...prev };
        delete next[String(matchId)];
        return next;
      });
      return true;
    },
    [isMatchLocked, setPredictions]
  );

  return {
    predictions,
    predict,
    getPrediction,
    clearPrediction,
    isMatchLocked,
    isHydrated,
  };
}
