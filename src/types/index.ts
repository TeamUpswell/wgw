export interface DailyEntry {
  id: string;
  user_id: string;
  category: string;
  transcription: string;
  ai_response?: string;
  created_at: string;
  audioUri?: string; // Frontend uses audioUri
  audio_url?: string; // Database uses audio_url (for raw data)
}

export interface UserStreak {
  user_id: string; // ← Primary key is user_id, not id
  current_streak: number;
  longest_streak: number;
  last_entry_date: string; // Date format from database
}

export interface UserCategories {
  user_id: string;
  categories: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  book_purchase_code?: string;
  subscription_tier?: string;
  trial_expires_at?: string;
  created_at: string;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  uri?: string;
}

export interface AppState {
  user: User | null;
  entries: DailyEntry[];
  streak: UserStreak | null;
  isLoading: boolean;
  error: string | null;
}
