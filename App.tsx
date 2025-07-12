import React, { useEffect, useRef } from "react";
import { SafeAreaView, StatusBar, View, Text, AppState } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./src/store";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { supabase } from "./src/config/supabase";
import { setUser, setLoading, clearAuth } from "./src/store/authSlice";
import { ensureUserProfile } from "./src/services/userProfileService";
import { sessionManager } from "./src/services/sessionService";
import { AppProvider } from "./src/contexts/AppContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { useTheme } from "./src/contexts/ThemeContext";
import { useLoading } from "./src/contexts/LoadingContext";
import { networkService } from "./src/services/networkService";
import type { RootState } from "./src/store";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function AppContent() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();
  const { isLoading } = useLoading();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    console.log("🔍 Supabase client check:", {
      exists: !!supabase,
      hasAuth: !!supabase?.auth,
      authMethods: supabase?.auth
        ? Object.keys(supabase.auth).slice(0, 5)
        : "None",
    });

    // Initialize network service
    networkService.initialize().catch(console.error);

    // Check if supabase and auth are properly initialized
    if (!supabase || !supabase.auth) {
      console.error("❌ Supabase client not properly initialized");
      dispatch(setLoading(false));
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
          
          // Ensure user profile exists
          await ensureUserProfile(currentUser.id, currentUser.email || '');
          
          // Map Supabase user to our User type
          const mappedUser = {
            id: currentUser.id,
            email: currentUser.email || '',
            created_at: currentUser.created_at || new Date().toISOString(),
          };
          dispatch(setUser(mappedUser));
          
          // Start session monitoring for logged-in users
          sessionManager.startSessionMonitoring();
        } else {
          console.log("📝 No user session found");
          dispatch(clearAuth());
          
          // Stop session monitoring when no user
          sessionManager.stopSessionMonitoring();
        }
      } catch (error) {
        console.error("❌ Error checking user:", error);
        dispatch(clearAuth());
      } finally {
        dispatch(setLoading(false));
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
        // Ensure user profile exists
        await ensureUserProfile(session.user.id, session.user.email || '');
        
        // Map Supabase user to our User type
        const mappedUser = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || new Date().toISOString(),
        };
        dispatch(setUser(mappedUser));
        
        // Restart session monitoring on auth state change
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          sessionManager.startSessionMonitoring();
        }
      } else {
        dispatch(clearAuth());
        
        // Stop monitoring on sign out
        if (event === 'SIGNED_OUT') {
          sessionManager.stopSessionMonitoring();
        }
      }

      // Loading is handled by context now
    });

    // Handle app state changes (background/foreground)
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 App came to foreground - checking session...');
        if (user) {
          sessionManager.checkAndRefreshSession();
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('📱 App went to background');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.unsubscribe();
      sessionManager.stopSessionMonitoring();
      appStateSubscription.remove();
    };
  }, []);

  const handleLogout = async () => {
    await withLoading('auth', async () => {
      try {
        console.log("🔐 Logging out...");
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        dispatch(clearAuth());
        console.log("✅ Logged out successfully");
      } catch (error) {
        console.error("❌ Logout error:", error);
      }
    });
  };

  if (isLoading('auth')) {
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
        <HomeScreen
          user={user}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleTheme}
          onLogout={handleLogout}
        />
      ) : (
        <AuthScreen isDarkMode={isDarkMode} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ErrorBoundary>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}
