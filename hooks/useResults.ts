"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { MatchResult } from "@/lib/types";

const RESULTS_KEY = "ipl_results_2026";

export function useResults() {
  const [results, setResults, isHydrated] = useLocalStorage<MatchResult[]>(
    RESULTS_KEY,
    []
  );

  const getResult = useCallback(
    (matchId: number): MatchResult | null => {
      return results.find((r) => r.id === matchId) || null;
    },
    [results]
  );

  const setResult = useCallback(
    (matchId: number, winner: string) => {
      setResults((prev) => {
        const existing = prev.findIndex((r) => r.id === matchId);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = { id: matchId, winner };
          return next;
        }
        return [...prev, { id: matchId, winner }];
      });
    },
    [setResults]
  );

  const removeResult = useCallback(
    (matchId: number) => {
      setResults((prev) => prev.filter((r) => r.id !== matchId));
    },
    [setResults]
  );

  return { results, getResult, setResult, removeResult, isHydrated };
}
