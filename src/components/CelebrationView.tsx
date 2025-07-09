import React, { useState, useEffect, memo, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomDrawer } from "./BottomDrawer";
import { DailyEntry, UserStreak } from "../types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CelebrationViewProps {
  todaysEntry: DailyEntry;
  streak: number; // Change from UserStreak | null to number
  onAddAnother: () => void;
  onViewHistory: () => void;
  isDarkMode?: boolean;
  // Add these new props for drawer functionality
  user: any;
  todaysEntryCount: number;
}

// Memoize the component to prevent unnecessary re-renders
export const CelebrationView: React.FC<CelebrationViewProps> = memo(
  ({
    todaysEntry,
    streak = 0,
    onAddAnother,
    onViewHistory,
    isDarkMode = false,
    user,
    todaysEntryCount,
  }) => {
    useEffect(() => {
      console.log("🎉 CelebrationView streak changed to:", streak);
    }, [streak]);

    const [timeUntilMidnight, setTimeUntilMidnight] = useState("");
    const [celebrationAnim] = useState(new Animated.Value(0));
    // Add state for bottom drawer
    const [showDrawer, setShowDrawer] = useState(false);

    useEffect(() => {
      // Start celebration animation
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Update countdown every second
      const interval = setInterval(() => {
        updateCountdown();
      }, 1000);

      updateCountdown(); // Initial call

      return () => clearInterval(interval);
    }, []);

    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeDiff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeUntilMidnight(`${hours}h ${minutes}m ${seconds}s`);
    };

    const formatEntryTime = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    // Add drawer handlers
    const handleDrawerHistory = () => {
      setShowDrawer(false);
      onViewHistory();
    };

    const handleDrawerSettings = () => {
      setShowDrawer(false);
      // You might want to add a settings callback prop later
      console.log("Settings opened from celebration");
    };

    const handleDrawerAddEntry = () => {
      setShowDrawer(false);
      onAddAnother();
    };

    // Memoize styles to prevent recreation on every render
    const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

    return (
      <>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            justifyContent: "center", // ✅ Layout styles go here
            alignItems: "center", // ✅ Layout styles go here
            padding: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Celebration Header */}
          <Animated.View
            style={[
              styles.celebrationHeader,
              {
                opacity: celebrationAnim,
                transform: [
                  {
                    translateY: celebrationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Well Done!</Text>
            <Text style={styles.celebrationSubtitle}>
              You've captured what's going well today
            </Text>
          </Animated.View>

          {/* Streak Display */}
          {streak > 0 && (
            <Animated.View
              style={[
                styles.streakContainer,
                {
                  opacity: celebrationAnim,
                  transform: [
                    {
                      scale: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.streakContent}>
                <Text style={styles.streakNumber}>{streak}</Text>{" "}
                {/* Changed from streak.current_streak */}
                <Text style={styles.streakLabel}>Day Streak</Text>
                {streak > 1 && (
                  <Text style={styles.streakMessage}>
                    You're building beautiful momentum! 🌟
                  </Text>
                )}
              </View>
            </Animated.View>
          )}

          {/* Today's Entry Recap */}
          <Animated.View
            style={[
              styles.entryRecap,
              {
                opacity: celebrationAnim,
              },
            ]}
          >
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>Today's Gratitude</Text>
              <Text style={styles.entryTime}>
                {formatEntryTime(todaysEntry.created_at)}
              </Text>
            </View>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{todaysEntry.category}</Text>
            </View>

            <Text style={styles.entryTranscription}>
              "{todaysEntry.transcription}"
            </Text>

            {todaysEntry.ai_response && (
              <View style={styles.aiResponseContainer}>
                <Text style={styles.aiResponseLabel}>Your AI Coach says:</Text>
                <Text style={styles.aiResponse}>{todaysEntry.ai_response}</Text>
              </View>
            )}
          </Animated.View>

          {/* Countdown to Tomorrow */}
          <Animated.View
            style={[
              styles.countdownContainer,
              {
                opacity: celebrationAnim,
              },
            ]}
          >
            <Text style={styles.countdownTitle}>
              Next Gratitude Opportunity
            </Text>
            <Text style={styles.countdownTime}>{timeUntilMidnight}</Text>
            <Text style={styles.countdownSubtitle}>until tomorrow</Text>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.actionButtons,
              {
                opacity: celebrationAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.addAnotherButton}
              onPress={onAddAnother}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addAnotherText}>Add Another Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyButton}
              onPress={onViewHistory}
            >
              <Ionicons name="time" size={24} color="#8BC34A" />
              <Text style={styles.historyText}>View Past Entries</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Inspirational Quote */}
          <Animated.View
            style={[
              styles.quoteContainer,
              {
                opacity: celebrationAnim,
              },
            ]}
          >
            <Text style={styles.quoteText}>
              "What you appreciate, appreciates."
            </Text>
            <Text style={styles.quoteAuthor}>- Lynne Twist</Text>
          </Animated.View>
        </ScrollView>

        {/* Add FAB - Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowDrawer(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Add Bottom Drawer */}
        <BottomDrawer
          isVisible={showDrawer}
          onClose={() => setShowDrawer(false)}
          onViewHistory={handleDrawerHistory}
          onSettings={handleDrawerSettings}
          onAddEntry={handleDrawerAddEntry}
          isDarkMode={isDarkMode}
          streak={streak}
          todaysEntryCount={todaysEntryCount}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if these props actually change
    return (
      prevProps.streak === nextProps.streak &&
      prevProps.isDarkMode === nextProps.isDarkMode &&
      prevProps.todaysEntryCount === nextProps.todaysEntryCount &&
      prevProps.todaysEntry?.id === nextProps.todaysEntry?.id
    );
  }
);

CelebrationView.displayName = "CelebrationView";

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
      padding: 20,
      justifyContent: "center",
    },
    // Visual styles for the ScrollView container
    scrollView: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
    },
    // Layout styles for the content
    contentContainer: {
      flexGrow: 1,
      justifyContent: "center", // ✅ Layout styles go here
      alignItems: "center", // ✅ Layout styles go here
      padding: 20,
      paddingBottom: 40,
    },
    celebrationHeader: {
      alignItems: "center",
      padding: 30,
      marginBottom: 20,
    },
    celebrationEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    celebrationTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#8BC34A",
      textAlign: "center",
      marginBottom: 8,
    },
    celebrationSubtitle: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
      marginBottom: 32,
    },
    streakContainer: {
      backgroundColor: "#8BC34A",
      marginHorizontal: 20,
      borderRadius: 20,
      padding: 25,
      alignItems: "center",
      marginBottom: 25,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
    },
    streakContent: {
      alignItems: "center",
    },
    streakNumber: {
      fontSize: 48,
      fontWeight: "900",
      color: "white",
      marginBottom: 5,
    },
    streakLabel: {
      fontSize: 18,
      color: "white",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    streakMessage: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
      marginTop: 8,
      textAlign: "center",
      fontStyle: "italic",
    },
    entryRecap: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 20,
      marginBottom: 25,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
      borderLeftWidth: 4,
      borderLeftColor: "#8BC34A",
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    entryTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#2c3e50",
    },
    entryTime: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      fontWeight: "500",
    },
    categoryBadge: {
      alignSelf: "flex-start",
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0f8f0",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 15,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#8BC34A",
      textTransform: "uppercase",
    },
    entryTranscription: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#2c3e50",
      fontStyle: "italic",
      lineHeight: 24,
      marginBottom: 15,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
      padding: 15,
      borderRadius: 12,
    },
    aiResponseContainer: {
      marginTop: 10,
    },
    aiResponseLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "#8BC34A",
      marginBottom: 8,
    },
    aiResponse: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#555",
      lineHeight: 20,
    },
    countdownContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 25,
      alignItems: "center",
      marginBottom: 25,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    countdownTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginBottom: 10,
    },
    countdownTime: {
      fontSize: 32,
      fontWeight: "800",
      color: "#8BC34A",
      marginBottom: 5,
    },
    countdownSubtitle: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
    },
    actionButtons: {
      marginHorizontal: 20,
      marginBottom: 25,
    },
    addAnotherButton: {
      backgroundColor: "#8BC34A",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    addAnotherText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      marginLeft: 8,
    },
    historyButton: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#8BC34A",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    historyText: {
      color: "#8BC34A",
      fontSize: 16,
      fontWeight: "700",
      marginLeft: 8,
    },
    quoteContainer: {
      marginHorizontal: 20,
      marginBottom: 30,
      padding: 20,
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0f8f0",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#8BC34A",
    },
    quoteText: {
      fontSize: 16,
      fontStyle: "italic",
      color: "#8BC34A",
      textAlign: "center",
      marginBottom: 8,
      lineHeight: 24,
    },
    quoteAuthor: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
      fontWeight: "500",
    },
    // Add FAB styles
    fab: {
      position: "absolute",
      bottom: 30,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#8BC34A",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 100,
    },
  });
