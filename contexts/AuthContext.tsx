"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { CurrentUser } from "@/lib/types";

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  currentUser: CurrentUser | null; // Contains username, groupIds, isAdmin
  currentGroup: string | null;
  setCurrentGroup: (groupId: string | null) => void;
  isHydrated: boolean;
  refreshUserGroups: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  currentUser: null,
  currentGroup: null,
  setCurrentGroup: () => {},
  isHydrated: false,
  refreshUserGroups: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentGroup, setCurrentGroup] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Re-fetch groups
  const refreshUserGroups = async (userId: string) => {
    // get user metadata
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Check for admin
    const isAdmin = user.email?.toLowerCase() === "admin@ipl.com";

    let groupIds: string[] = [];
    let username = "Player";
    
    if (!isAdmin) {
      const { data: userGroups } = await supabase
        .from("user_groups")
        .select("group_id")
        .eq("user_id", user.id);
      groupIds = userGroups ? userGroups.map(ug => ug.group_id) : [];
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
        
      if (profile && profile.username) {
        username = profile.username;
      }
    } else {
      username = "Admin";
    }
    
    // restore selection from localStorage optionally
    const savedGroup = typeof window !== "undefined" ? localStorage.getItem("ipl_current_group_2026") : null;

    let initialGroup = currentGroup;

    if (!isAdmin) {
      if (!initialGroup) {
        if (savedGroup && groupIds.includes(savedGroup)) {
          initialGroup = savedGroup;
        } else if (groupIds.length === 1) {
          initialGroup = groupIds[0];
        }
      }
    } else {
      initialGroup = null;
    }
    
    setCurrentUser({
      id: user.id,
      username,
      groupIds,
      isAdmin
    });
    
    setCurrentGroup(initialGroup);
    if (initialGroup && typeof window !== "undefined") {
      localStorage.setItem("ipl_current_group_2026", initialGroup);
    }
  };

  const setGroup = (groupId: string | null) => {
    setCurrentGroup(groupId);
    if (typeof window !== "undefined") {
      if (groupId) localStorage.setItem("ipl_current_group_2026", groupId);
      else localStorage.removeItem("ipl_current_group_2026");
    }
  };

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshUserGroups(session.user.id).finally(() => setIsHydrated(true));
      } else {
        setIsHydrated(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          refreshUserGroups(session.user.id);
        } else {
          setCurrentUser(null);
          setGroup(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      currentUser,
      currentGroup,
      setCurrentGroup: setGroup,
      isHydrated,
      refreshUserGroups: async () => { if (user) await refreshUserGroups(user.id); }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
