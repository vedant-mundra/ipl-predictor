"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export function useGroupUsers() {
  const [groupUsers, setGroupUsers] = useState<{ id: string; username: string }[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { currentGroup } = useAuth();

  useEffect(() => {
    if (!currentGroup) {
      setGroupUsers([]);
      setIsHydrated(true);
      return;
    }

    const fetchUsers = async () => {
      setIsHydrated(false);

      const { data: userGroups } = await supabase
        .from("user_groups")
        .select("user_id")
        .eq("group_id", currentGroup);

      if (!userGroups || userGroups.length === 0) {
        setGroupUsers([]);
        setIsHydrated(true);
        return;
      }

      const userIds = userGroups.map((ug) => ug.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const mapped = userGroups.map((ug) => {
        const matchingProfile = profiles?.find((p) => p.id === ug.user_id);
        return {
          id: ug.user_id,
          username: matchingProfile?.username || "Player",
        };
      });

      setGroupUsers(mapped);
      setIsHydrated(true);
    };

    fetchUsers();
  }, [currentGroup]);

  return { groupUsers, isHydrated };
}
