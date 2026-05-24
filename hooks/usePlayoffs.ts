"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Match } from "@/lib/types";

export function usePlayoffs() {
  const [playoffMatches, setPlayoffMatches] = useState<Match[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchPlayoffs = useCallback(async () => {
    setIsHydrated(false);
    const { data: dbMatches, error } = await supabase
      .from("matches")
      .select("*")
      .gte("id", 71)
      .order("id", { ascending: true });

    if (!error && dbMatches) {
      const mapped: Match[] = dbMatches.map((m) => {
        // Map dynamic db values to our Match type structure
        const datePart = m.match_time.split("T")[0];
        const timePart = m.match_time.split("T")[1]?.slice(0, 5) || "19:30";
        
        // Map short codes to full team names or keep TBD
        const SHORT_TO_FULL_MAP: Record<string, string> = {
          RCB: "Royal Challengers Bengaluru",
          MI: "Mumbai Indians",
          CSK: "Chennai Super Kings",
          KKR: "Kolkata Knight Riders",
          SRH: "Sunrisers Hyderabad",
          RR: "Rajasthan Royals",
          PBKS: "Punjab Kings",
          GT: "Gujarat Titans",
          LSG: "Lucknow Super Giants",
          DC: "Delhi Capitals",
          TBD: "TBD",
        };

        return {
          id: m.id,
          team1: SHORT_TO_FULL_MAP[m.team1] || m.team1,
          team2: SHORT_TO_FULL_MAP[m.team2] || m.team2,
          team1Short: m.team1,
          team2Short: m.team2,
          date: datePart,
          time: timePart,
          venue: m.venue,
        };
      });
      setPlayoffMatches(mapped);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    fetchPlayoffs();
  }, [fetchPlayoffs]);

  // Polling for playoff match details updates every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPlayoffs();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPlayoffs]);

  const updatePlayoffMatch = useCallback(
    async (matchId: number, team1: string, team2: string, venue: string, date: string, time: string): Promise<boolean> => {
      // Optimistic update
      setPlayoffMatches((prev) =>
        prev.map((m) => {
          if (m.id === matchId) {
            const SHORT_TO_FULL_MAP: Record<string, string> = {
              RCB: "Royal Challengers Bengaluru",
              MI: "Mumbai Indians",
              CSK: "Chennai Super Kings",
              KKR: "Kolkata Knight Riders",
              SRH: "Sunrisers Hyderabad",
              RR: "Rajasthan Royals",
              PBKS: "Punjab Kings",
              GT: "Gujarat Titans",
              LSG: "Lucknow Super Giants",
              DC: "Delhi Capitals",
              TBD: "TBD",
            };
            return {
              id: matchId,
              team1: SHORT_TO_FULL_MAP[team1] || team1,
              team2: SHORT_TO_FULL_MAP[team2] || team2,
              team1Short: team1,
              team2Short: team2,
              date,
              time,
              venue,
            };
          }
          return m;
        })
      );

      const timestamp = `${date}T${time}:00`;

      const { error } = await supabase
        .from("matches")
        .upsert(
          {
            id: matchId,
            team1,
            team2,
            match_time: timestamp,
            venue,
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Update playoff match error:", error);
        fetchPlayoffs(); // Revert
        return false;
      }
      return true;
    },
    [fetchPlayoffs]
  );

  return { playoffMatches, updatePlayoffMatch, isHydrated, refreshPlayoffs: fetchPlayoffs };
}
