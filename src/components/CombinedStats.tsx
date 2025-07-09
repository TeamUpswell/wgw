import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CombinedStatsProps {
  entries: any[];
  categories: string[];
  isDarkMode: boolean;
  todaysEntryCount: number;
}

export const CombinedStats: React.FC<CombinedStatsProps> = ({
  entries,
  categories,
  isDarkMode,
  todaysEntryCount,
}) => {
  const styles = getStyles(isDarkMode);

  // Calculate this week's progress
  const getWeekProgress = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start on Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const progress = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const hasEntry = entries.some((entry) => {
        const entryDate = new Date(entry.created_at);
        return entryDate.toDateString() === date.toDateString();
      });

      progress.push({
        day: weekDays[i],
        hasEntry,
        isToday: date.toDateString() === today.toDateString(),
        isFuture: date > today,
      });
    }

    return progress;
  };

  const weekProgress = getWeekProgress();
  const weekCount = weekProgress.filter((day) => day.hasEntry).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.subtitle}>{weekCount} of 7 days</Text>
      </View>

      <View style={styles.weekContainer}>
        {weekProgress.map((day, index) => (
          <View key={index} style={styles.dayColumn}>
            <View
              style={[
                styles.dayCircle,
                day.hasEntry && styles.dayCircleFilled,
                day.isToday && styles.dayCircleToday,
                day.isFuture && styles.dayCircleFuture,
              ]}
            >
              {day.hasEntry && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text
              style={[
                styles.dayText,
                day.isToday && styles.dayTextToday,
                day.isFuture && styles.dayTextFuture,
              ]}
            >
              {day.day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
    },
    weekContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dayColumn: {
      alignItems: "center",
      flex: 1,
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    dayCircleFilled: {
      backgroundColor: "#8BC34A",
    },
    dayCircleToday: {
      borderWidth: 2,
      borderColor: "#FF6B35",
    },
    dayCircleFuture: {
      opacity: 0.5,
    },
    dayText: {
      fontSize: 12,
      color: isDarkMode ? "#aaa" : "#666",
      fontWeight: "500",
    },
    dayTextToday: {
      color: "#FF6B35",
      fontWeight: "700",
    },
    dayTextFuture: {
      opacity: 0.5,
    },
  });
