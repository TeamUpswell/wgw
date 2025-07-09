// Components/WeeklyProgress.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WeeklyProgressProps {
  categories: string[];
  todaysCategory: string;
  selectedCategory: string;
  hasWeeklyEntry: (category: string) => boolean;
  isDarkMode: boolean;
}

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  categories,
  todaysCategory,
  selectedCategory,
  hasWeeklyEntry,
  isDarkMode,
}) => {
  const styles = getStyles(isDarkMode);

  const getWeeklyProgress = () => {
    return categories.map((category) => ({
      category,
      completed: hasWeeklyEntry(category),
      isToday: category === todaysCategory,
      isSelected: category === selectedCategory,
    }));
  };

  return (
    <View style={styles.weeklyProgressContainer}>
      <Text style={styles.weeklyProgressTitle}>This Week's Progress</Text>
      <View style={styles.weeklyProgressDots}>
        {getWeeklyProgress().map((item, index) => {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          return (
            <View key={item.category} style={styles.progressDayContainer}>
              <View
                style={[
                  styles.progressDot,
                  item.isToday && styles.progressDotToday,
                  item.completed && styles.progressDotComplete,
                  item.isSelected &&
                    !item.isToday &&
                    styles.progressDotSelected,
                ]}
              />
              <Text
                style={[
                  styles.progressDayLabel,
                  item.isToday && styles.progressDayLabelToday,
                  item.isSelected && styles.progressDayLabelSelected,
                ]}
              >
                {dayNames[index]}
              </Text>
              <Text
                style={[
                  styles.progressCategoryLabel,
                  item.isToday && styles.progressCategoryLabelToday,
                  item.completed && styles.progressCategoryLabelCompleted,
                  item.isSelected && styles.progressCategoryLabelSelected,
                ]}
              >
                {item.category.split(" ")[0]}
              </Text>
              {item.completed && (
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color="#8BC34A"
                  style={{ marginTop: 2 }}
                />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.progressSummary}>
        <Text style={styles.progressSummaryText}>
          {getWeeklyProgress().filter((item) => item.completed).length} of{" "}
          {categories.length} areas reflected on this week
        </Text>
      </View>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    weeklyProgressContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      marginHorizontal: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    weeklyProgressTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginBottom: 16,
      textAlign: "center",
    },
    weeklyProgressDots: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    progressDayContainer: {
      alignItems: "center",
      flex: 1,
    },
    progressDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      marginBottom: 4,
    },
    progressDotToday: {
      backgroundColor: "#FF6B35",
      transform: [{ scale: 1.2 }],
    },
    progressDotComplete: {
      backgroundColor: "#8BC34A",
    },
    progressDotSelected: {
      backgroundColor: "#8BC34A",
      opacity: 0.7,
    },
    progressDayLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: isDarkMode ? "#aaa" : "#666",
      marginBottom: 2,
    },
    progressDayLabelToday: {
      color: "#FF6B35",
    },
    progressDayLabelSelected: {
      color: "#8BC34A",
    },
    progressCategoryLabel: {
      fontSize: 8,
      color: isDarkMode ? "#666" : "#999",
      textAlign: "center",
      fontWeight: "500",
    },
    progressCategoryLabelToday: {
      color: "#FF6B35",
      fontWeight: "600",
    },
    progressCategoryLabelCompleted: {
      color: "#8BC34A",
    },
    progressCategoryLabelSelected: {
      color: "#8BC34A",
    },
    progressSummary: {
      alignItems: "center",
    },
    progressSummaryText: {
      fontSize: 12,
      color: isDarkMode ? "#aaa" : "#666",
      fontStyle: "italic",
    },
  });
