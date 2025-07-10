import React, { useEffect, useState } from "react";
import { SafeAreaView, StatusBar, View, Text } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./src/store";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { supabase } from "./src/config/supabase";
import type { User } from "@supabase/supabase-js";
import { ProfileBlocker } from "./src/components/ProfileBlocker";

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true); // <-- Default to true for dark mode

  useEffect(() => {
    console.log("🔍 Supabase client check:", {
      exists: !!supabase,
      hasAuth: !!supabase?.auth,
      authMethods: supabase?.auth
        ? Object.keys(supabase.auth).slice(0, 5)
        : "None",
    });

    // Check if supabase and auth are properly initialized
    if (!supabase || !supabase.auth) {
      console.error("❌ Supabase client not properly initialized");
      setIsLoading(false);
      return;
    }

    // Get initial user session
    const getUser = async () => {
      try {
        console.log("🔍 Checking initial user session...");

        // Check both session and user
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        console.log("🔍 Auth Debug:", {
          hasSession: !!session,
          sessionError: sessionError?.message,
          hasUser: !!user,
          userError: userError?.message,
          userEmail: user?.email || "None",
        });

        // Use session user if available, fallback to getUser
        const currentUser = session?.user || user;

        if (currentUser) {
          console.log(
            "✅ Initial user check:",
            `Logged in as ${currentUser.email}`
          );
          setUser(currentUser);
        } else {
          console.log("📝 No user session found");
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Error checking user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔐 Auth state changed:",
        event,
        session?.user ? "logged in" : "logged out"
      );

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
        }}
      >
        <Text style={{ fontSize: 18, color: isDarkMode ? "#fff" : "#666" }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
      }}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      {user ? (
        <ProfileBlocker user={user}>
          <HomeScreen
            user={user}
            isDarkMode={isDarkMode}
            onToggleDarkMode={setIsDarkMode}
          />
        </ProfileBlocker>
      ) : (
        <AuthScreen />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}
