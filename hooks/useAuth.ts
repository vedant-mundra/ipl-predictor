import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { User, CurrentUser } from "@/lib/types";
import { VALID_GROUPS } from "@/lib/groups";

const USERS_KEY = "ipl_users_2026";
const CURRENT_USER_KEY = "ipl_current_user_2026";

export function useAuth() {
  const [users, setUsers, isUsersHydrated] = useLocalStorage<User[]>(USERS_KEY, []);
  const [currentUser, setCurrentUser, isCurrentUserHydrated] = useLocalStorage<CurrentUser | null>(
    CURRENT_USER_KEY,
    null
  );
  const [currentGroup, setCurrentGroup, isCurrentGroupHydrated] = useLocalStorage<string | null>(
    "ipl_current_group_2026",
    null
  );

  const isHydrated = isUsersHydrated && isCurrentUserHydrated && isCurrentGroupHydrated;

  const signup = useCallback((email: string, username: string, password: string, inviteCode: string): { success: boolean, message: string } => {
    const isAdmin = email.toLowerCase() === "admin@ipl.com";
    if (isAdmin) {
      setCurrentUser({ id: "admin", username: "Admin", isAdmin: true, groupIds: [] });
      setCurrentGroup(null);
      return { success: true, message: "Logged in as Admin. (Admins are omitted from player rankings)" };
    }

    if (!VALID_GROUPS[inviteCode]) {
      return { success: false, message: "Invalid invite code" };
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      if (existingUser.password !== password) {
        return { success: false, message: "Email already registered with a different password." };
      }
      if (existingUser.groupIds.includes(inviteCode)) {
        return { success: false, message: "You are already a member of this league." };
      }

      const updatedUser = { ...existingUser, groupIds: [...existingUser.groupIds, inviteCode] };
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setCurrentUser({ id: updatedUser.id, username: updatedUser.username, isAdmin: updatedUser.isAdmin, groupIds: updatedUser.groupIds });
      
      if (updatedUser.groupIds.length === 1) setCurrentGroup(inviteCode);
      else setCurrentGroup(null); // Force group selection

      return { success: true, message: `Successfully joined ${VALID_GROUPS[inviteCode]}!` };
    }

    const usernameExists = users.some(u => u.username === username);
    if (usernameExists) {
      return { success: false, message: "Username already taken" };
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email,
      username,
      password,
      score: 0,
      isAdmin: false,
      groupIds: [inviteCode]
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser({ id: newUser.id, username: newUser.username, isAdmin: false, groupIds: [inviteCode] });
    setCurrentGroup(inviteCode);
    return { success: true, message: "Signup successful" };
  }, [users, setUsers, setCurrentUser, setCurrentGroup]);

  const login = useCallback((email: string, password: string): { success: boolean, message: string } => {
    if (email.toLowerCase() === "admin@ipl.com") {
      setCurrentUser({ id: "admin", username: "Admin", isAdmin: true, groupIds: [] });
      setCurrentGroup(null);
      return { success: true, message: "Logged in as Admin" };
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    setCurrentUser({ id: user.id, username: user.username, isAdmin: user.isAdmin, groupIds: user.groupIds });
    if (user.groupIds.length === 1) {
      setCurrentGroup(user.groupIds[0]);
    } else {
      setCurrentGroup(null); // Force selection
    }
    return { success: true, message: "Login successful" };
  }, [users, setCurrentUser, setCurrentGroup]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentGroup(null);
  }, [setCurrentUser, setCurrentGroup]);

  return {
    users,
    currentUser,
    currentGroup,
    setCurrentGroup,
    signup,
    login,
    logout,
    isHydrated
  };
}
