"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MatchResult } from "@/lib/types";

export function useResults() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchResults = useCallback(async () => {
    setIsHydrated(false);
    const { data: dbResults, error } = await supabase
      .from("results")
      .select("*");
      
    if (!error && dbResults) {
      setResults(dbResults.map((r) => ({
        id: r.match_id,
        winner: r.winner
      })));
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Polling for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchResults();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const getResult = useCallback(
    (matchId: number): MatchResult | null => {
      return results.find((r) => r.id === matchId) || null;
    },
    [results]
  );

  const setResult = useCallback(
    async (matchId: number, winner: string) => {
      // Optimistic update
      setResults((prev) => {
        const existing = prev.findIndex((r) => r.id === matchId);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = { id: matchId, winner };
          return next;
        }
        return [...prev, { id: matchId, winner }];
      });

      const { error } = await supabase
        .from("results")
        .upsert(
          { match_id: matchId, winner },
          { onConflict: "match_id" }
        );

      if (error) {
        console.error("Set result error:", error);
        fetchResults(); // Revert on error
      }
    },
    [fetchResults]
  );

  const removeResult = useCallback(
    async (matchId: number) => {
      // Optimistic update
      setResults((prev) => prev.filter((r) => r.id !== matchId));

      const { error } = await supabase
        .from("results")
        .delete()
        .eq("match_id", matchId);

      if (error) {
        console.error("Remove result error:", error);
        fetchResults(); // Revert on error
      }
    },
    [fetchResults]
  );

  return { results, getResult, setResult, removeResult, isHydrated };
}
