import { supabase } from "../config/supabase";

import { DailyEntry, UserStreak, UserCategories } from "../types";

export class SupabaseService {
  // Entry methods
  static async createEntry(entry: {
    user_id: string;
    category: string;
    audioUri: string;
    transcription?: string;
    ai_response?: string;
  }) {
    try {
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        // ❌ REMOVE: console.warn("⚠️ Session refresh failed:", refreshError.message);
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (authError || !user) {
        // ✅ KEEP error logs:
        console.error("Auth error:", authError);
        throw new Error(
          `User not authenticated: ${authError?.message || "No user"}`
        );
      }

      if (!session) {
        console.error("No session found");
        throw new Error("Auth session missing - please log in again");
      }

      if (user.id !== entry.user_id) {
        console.error("User ID mismatch");
        throw new Error("User ID mismatch");
      }

      // Make sure we're creating the timestamp correctly
      const now = new Date();
      console.log("🕐 Creating entry with timestamp:", {
        local: now.toLocaleString(),
        iso: now.toISOString(),
        utc: now.toUTCString(),
      });

      const dbEntry = {
        user_id: entry.user_id,
        category: entry.category,
        audio_url: entry.audioUri,
        transcription: entry.transcription || "",
        ai_response: entry.ai_response || "",
        created_at: now.toISOString(), // Ensure we're sending ISO string
      };

      console.log("🔍 Attempting to insert:", dbEntry);

      const { data, error } = await supabase
        .from("daily_entries")
        .insert([dbEntry])
        .select()
        .single();

      if (error) {
        console.error("❌ Database error creating entry:", error);
        console.log("🔍 Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(`Failed to save entry: ${error.message}`);
      }

      console.log("✅ Entry created successfully:", data.id);

      return {
        ...data,
        audioUri: data.audio_url,
      };
    } catch (error) {
      console.error("❌ Error in createEntry:", error);
      throw new Error(`Failed to create entry: ${error.message}`);
    }
  }

  static async getUserEntries(userId: string): Promise<DailyEntry[]> {
    const { data, error } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch entries: ${error.message}`);
    }

    return data.map((entry) => ({
      ...entry,
      audioUri: entry.audio_url,
    }));
  }

  // Streak methods
  static async getUserStreak(userId: string) {
    console.log("🔥 SupabaseService.getUserStreak for:", userId);

    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no streak record exists, create one
        if (error.code === "PGRST116") {
          console.log("🔥 No streak record found, creating new one");
          const newStreak = {
            user_id: userId,
            current_streak: 0,
            longest_streak: 0,
            last_entry_date: null,
          };

          const { data: created, error: createError } = await supabase
            .from("user_streaks")
            .insert(newStreak)
            .select()
            .single();

          if (createError) {
            console.error("❌ Error creating streak:", createError);
            // Return default values instead of throwing
            return {
              current_streak: 0,
              longest_streak: 0,
              last_entry_date: null,
            };
          }
          return created;
        }

        // Handle RLS policy errors gracefully
        if (error.code === "42501") {
          console.warn("⚠️ RLS policy prevents access, using defaults");
          return {
            current_streak: 0,
            longest_streak: 0,
            last_entry_date: null,
          };
        }

        // For other errors, still return defaults
        console.error("❌ Other error accessing streaks:", error);
        return {
          current_streak: 0,
          longest_streak: 0,
          last_entry_date: null,
        };
      }

      return data;
    } catch (error) {
      console.error("❌ SupabaseService.getUserStreak error:", error);
      // Always return default values instead of throwing
      return {
        current_streak: 0,
        longest_streak: 0,
        last_entry_date: null,
      };
    }
  }

  static async updateUserStreak(userId: string): Promise<UserStreak> {
    try {
      // Calculate streak based on entries
      const entries = await this.getUserEntries(userId);
      const streak = this.calculateStreak(entries);

      const streakData = {
        user_id: userId,
        current_streak: streak.current,
        longest_streak: streak.longest,
        last_entry_date: new Date().toISOString().split("T")[0],
      };

      const { data, error } = await supabase
        .from("user_streaks")
        .upsert([streakData])
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating streak:", error);
        // Return default values instead of throwing
        return {
          current_streak: streak.current,
          longest_streak: streak.longest,
          last_entry_date: new Date().toISOString().split("T")[0],
        };
      }

      return data;
    } catch (error) {
      console.error("❌ updateUserStreak error:", error);
      return {
        current_streak: 0,
        longest_streak: 0,
        last_entry_date: null,
      };
    }
  }

  // Categories methods
  static async getUserCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("user_categories")
        .select("categories")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116" || error.code === "42501") {
          // No categories found or RLS policy blocks access, return defaults
          console.log("📂 Using default categories");
          return [
            "Health & Fitness",
            "Career & Work",
            "Family & Friends",
            "Personal Growth",
            "Hobbies & Interests",
            "Financial Goals",
            "Community & Service",
          ];
        }

        // For other errors, still return defaults
        console.error("❌ Error accessing categories:", error);
        return [
          "Health & Fitness",
          "Career & Work",
          "Family & Friends",
          "Personal Growth",
          "Hobbies & Interests",
          "Financial Goals",
          "Community & Service",
        ];
      }

      return data.categories || [];
    } catch (error) {
      console.error("❌ getUserCategories error:", error);
      // Return defaults on any error
      return [
        "Health & Fitness",
        "Career & Work",
        "Family & Friends",
        "Personal Growth",
        "Hobbies & Interests",
        "Financial Goals",
        "Community & Service",
      ];
    }
  }

  static async updateUserCategories(
    userId: string,
    categories: string[]
  ): Promise<void> {
    try {
      const { error } = await supabase.from("user_categories").upsert([
        {
          user_id: userId,
          categories,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("❌ Error updating categories:", error);
        // Don't throw, just log the error
        return;
      }

      console.log("✅ Categories updated successfully");
    } catch (error) {
      console.error("❌ updateUserCategories error:", error);
      // Don't throw, just log the error
    }
  }

  // New method to create a daily entry (wrapper around createEntry)
  static async createDailyEntry(entry: {
    user_id: string;
    category: string;
    audioUri: string;
    transcription?: string;
    ai_response?: string;
  }) {
    // Just call the existing createEntry method
    return await this.createEntry(entry);
  }

  // Debug method for user authentication state
  static async debugUserAuth() {
    console.log("🔍 === USER AUTH DEBUG ===");

    // Check current auth user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("🔍 Auth User:", {
      id: user?.id,
      email: user?.email,
      error: authError?.message,
    });

    // Check current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("🔍 Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      error: sessionError?.message,
    });

    // Test if auth.uid() matches user.id
    console.log("🔍 User ID Match:", {
      authUserId: user?.id,
      sessionUserId: session?.user?.id,
      match: user?.id === session?.user?.id,
    });

    // Test RLS policy directly
    const { data, error } = await supabase.rpc("auth.uid"); // This should return the current user's ID

    console.log("🔍 auth.uid() result:", { data, error });

    console.log("🔍 === END DEBUG ===");
    return { user, session, authUid: data };
  }

  // New debug method for authentication state
  static async debugAuthState() {
    console.log("🔍 === AUTH STATE DEBUG ===");

    // Check current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log("🔍 Current User:", {
      id: user?.id,
      email: user?.email,
      error: userError?.message,
    });

    // Check session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("🔍 Current Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      error: sessionError?.message,
      accessToken: session?.access_token ? "Present" : "Missing",
    });

    // Test a simple query
    const { data: testData, error: testError } = await supabase
      .from("daily_entries")
      .select("count(*)")
      .limit(1);

    console.log("🔍 Test Query:", {
      success: !testError,
      error: testError?.code,
      message: testError?.message,
    });

    console.log("🔍 === END AUTH DEBUG ===");
    return { user, session, testError };
  }

  // Helper method to calculate streak
  private static calculateStreak(entries: DailyEntry[]): {
    current: number;
    longest: number;
  } {
    if (!entries.length) return { current: 0, longest: 0 };

    // Sort entries by date (newest first)
    const sortedEntries = entries.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Get unique dates
    const uniqueDates = [
      ...new Set(sortedEntries.map((entry) => entry.created_at.split("T")[0])),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const entryDate = new Date(uniqueDates[i]);
      entryDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        // Check if most recent entry is today or yesterday
        const daysDiff = Math.floor(
          (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 1) {
          currentStreak = 1;
          tempStreak = 1;
        }
      } else {
        const prevDate = new Date(uniqueDates[i - 1]);
        prevDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (prevDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          tempStreak++;
          if (i === 1 || currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          if (currentStreak === 0) currentStreak = 0;
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
  }
}

// In your Supabase functions (utils/supabase.ts):
export const createEntry = async (
  userId: string,
  transcription: string,
  aiResponse: string,
  category: string,
  audioUri?: string
) => {
  try {
    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: userId,
        transcription: transcription, // ← Ensure this field exists
        ai_response: aiResponse,
        category: category,
        audio_url: audioUri,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log("📊 Entry saved to database:", data);
    return data;
  } catch (error) {
    console.error("Error creating entry:", error);
    return null;
  }
};
