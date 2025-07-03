import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log("🔍 Environment Variables Check:");
console.log("URL:", supabaseUrl);
console.log("Key exists:", !!supabaseAnonKey);
console.log("Key length:", supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("🚨 Missing Supabase configuration. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // This enables session persistence
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Debug the client
console.log("🔍 Supabase Client Debug:");
console.log("Client created:", !!supabase);
console.log("Auth available:", !!supabase?.auth);
console.log(
  "Auth methods:",
  supabase?.auth ? Object.keys(supabase.auth) : "None"
);

// Test a simple auth method
setTimeout(() => {
  if (supabase?.auth) {
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        console.log(
          "🔍 Auth test - User:",
          data?.user ? "Found" : "None",
          error ? `Error: ${error.message}` : "No error"
        );
      })
      .catch((err) => {
        console.error("❌ Auth test failed:", err);
      });
  }
}, 1000);
