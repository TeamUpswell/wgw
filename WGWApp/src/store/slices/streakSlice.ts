import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { SupabaseService } from "../../services/supabase";
import { supabase } from "../../config/supabase"; // Add this missing import!

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_entry_date: string;
}

interface StreakState {
  streak: UserStreak | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StreakState = {
  streak: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserStreak = createAsyncThunk(
  "streak/fetchUserStreak",
  async (userId: string) => {
    try {
      const result = await SupabaseService.getUserStreak(userId);
      return result;
    } catch (error) {
      console.error("❌ Streak fetch error:", error);
      throw error;
    }
  }
);

export const updateUserStreak = createAsyncThunk(
  "streak/updateUserStreak",
  async (userId: string) => {
    try {
      // Get user's entries to calculate streak
      const { data: entries, error: entriesError } = await supabase
        .from("daily_entries")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (entriesError) throw entriesError;

      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;

      if (entries && entries.length > 0) {
        currentStreak = calculateCurrentStreak(entries);
        longestStreak = Math.max(
          currentStreak,
          await getCurrentLongestStreak(userId)
        );
      }

      // Update or create streak record
      const { data: existingStreak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      let result;
      if (existingStreak) {
        // Update existing record
        const { data, error } = await supabase
          .from("user_streaks")
          .update({
            current_streak: currentStreak,
            longest_streak: Math.max(
              longestStreak,
              existingStreak.longest_streak
            ),
            last_entry_date: entries[0]?.created_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("user_streaks")
          .insert({
            user_id: userId,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_entry_date: entries[0]?.created_at || null,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error("❌ Update streak error:", error);
      throw error;
    }
  }
);

// Helper function to calculate current streak
function calculateCurrentStreak(entries: any[]): number {
  if (!entries || entries.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  let currentDate = new Date(today);

  // Sort entries by date (newest first)
  const sortedEntries = entries
    .map((entry) => new Date(entry.created_at))
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if there's an entry today
  const hasEntryToday = sortedEntries.some(
    (entryDate) => entryDate.toDateString() === today.toDateString()
  );

  // Start from today if there's an entry, otherwise from yesterday
  if (hasEntryToday) {
    streak = 1;
  }

  // Go backwards day by day
  for (let i = hasEntryToday ? 1 : 0; i < 365; i++) {
    // Max 365 days
    currentDate.setDate(currentDate.getDate() - 1);

    const hasEntryOnDate = sortedEntries.some(
      (entryDate) => entryDate.toDateString() === currentDate.toDateString()
    );

    if (hasEntryOnDate) {
      streak++;
    } else {
      break; // Streak is broken
    }
  }

  return streak;
}

// Helper function to get current longest streak
async function getCurrentLongestStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from("user_streaks")
    .select("longest_streak")
    .eq("user_id", userId)
    .single();

  return data?.longest_streak || 0;
}

const streakSlice = createSlice({
  name: "streak",
  initialState: {
    streak: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearStreakError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user streak
      .addCase(fetchUserStreak.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserStreak.fulfilled, (state, action) => {
        state.isLoading = false;
        state.streak = action.payload;
        state.error = null;
      })
      .addCase(fetchUserStreak.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch streak";
      })
      // Update user streak
      .addCase(updateUserStreak.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserStreak.fulfilled, (state, action) => {
        state.isLoading = false;
        state.streak = action.payload;
        state.error = null;
      })
      .addCase(updateUserStreak.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update streak";
      });
  },
});

// Make sure you export the reducer as default
export default streakSlice.reducer;

// And export the actions
export const { clearStreakError } = streakSlice.actions;
