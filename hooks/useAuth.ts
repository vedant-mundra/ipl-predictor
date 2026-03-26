import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const { session, user, currentUser, currentGroup, setCurrentGroup, isHydrated, refreshUserGroups } = useAuthContext();

  const signup = async (email: string, username: string, password: string, inviteCode: string): Promise<{ success: boolean, message: string }> => {
    try {
      if (email.toLowerCase() === "admin@ipl.com") {
        return { success: false, message: "Use login for admin" };
      }

      // 1. Validate invite code exists
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("id")
        .eq("id", inviteCode)
        .single();
        
      if (groupError || !groupData) {
        return { success: false, message: "Invalid invite code" };
      }

      // 2. Sign up via Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("User already registered")) {
           return { success: false, message: "Email already registered. Please log in." };
        }
        return { success: false, message: authError.message };
      }

      const userId = authData.user?.id;
      if (!userId) {
        return { success: false, message: "Failed to create user account" };
      }

      // 3. Insert into profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: userId, username });

      if (profileError) {
        if (profileError.code === '23505') {
          return { success: false, message: "Username already taken. Try another." };
        }
        const errMsg = profileError.message || "Unknown error";
        return { success: false, message: `Failed to create profile: ${errMsg}` };
      }

      // 4. Insert into user_groups
      const { error: ugError } = await supabase
        .from("user_groups")
        .insert({ user_id: userId, group_id: inviteCode });

      if (ugError) {
        if (ugError.code === '23505') {
            return { success: false, message: "Already a member of this league." };
        }
        const ugErrMsg = ugError.message || "Unknown error";
        return { success: false, message: `Failed to join group: ${ugErrMsg}` };
      }
      
      await refreshUserGroups();
      return { success: true, message: `Successfully joined ${inviteCode}!` };
      
    } catch (err: any) {
      return { success: false, message: err.message || "An unknown error occurred" };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean, message: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: "Invalid email or password" };
      }
      
      return { success: true, message: "Login successful!" };
    } catch (err: any) {
      return { success: false, message: err.message || "An unknown error occurred" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const resetPasswordForEmail = async (email: string): Promise<{ success: boolean, message: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: "📧 Password reset link sent to your email. Please check your inbox." };
    } catch (err: any) {
      return { success: false, message: err.message || "An unknown error occurred" };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean, message: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: "Password updated successfully!" };
    } catch (err: any) {
      return { success: false, message: err.message || "An unknown error occurred" };
    }
  };

  return {
    currentUser,
    currentGroup,
    setCurrentGroup,
    signup,
    login,
    logout,
    resetPasswordForEmail,
    updatePassword,
    isHydrated,
    refreshUserGroups
  };
}
