// Components/StreakDisplay.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StreakDisplayProps {
  streak: any;
  isDarkMode: boolean;
  todaysEntryCount: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  isDarkMode,
  todaysEntryCount,
}) => {
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
      <Text style={styles.streakLabel}>Day Streak</Text>
      <Text style={styles.streakBest}>
        Best: {streak?.longest_streak || 0} days
      </Text>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 20,
      padding: 20,
      marginBottom: 25,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
    },
    streakNumber: {
      fontSize: 48,
      fontWeight: "900",
      color: "#8BC34A",
      marginBottom: 5,
    },
    streakLabel: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginBottom: 8,
    },
    streakBest: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      fontWeight: "500",
    },
  });
