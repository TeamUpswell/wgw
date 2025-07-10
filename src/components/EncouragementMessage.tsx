import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface EncouragementMessageProps {
  todaysEntryCount: number;
  isDarkMode: boolean;
}

export const EncouragementMessage: React.FC<EncouragementMessageProps> = ({
  todaysEntryCount,
  isDarkMode,
}) => {
  const styles = getStyles(isDarkMode);

  const getEncouragementMessage = () => {
    if (todaysEntryCount === 0) {
      return "Take a moment to reflect on what's going well today. Every small victory counts! 🌟";
    } else if (todaysEntryCount === 1) {
      return "Great start! Consider adding another reflection to deepen your gratitude practice. ✨";
    } else if (todaysEntryCount <= 3) {
      return "You're building a wonderful habit of gratitude! Keep going! 🚀";
    } else {
      return "Amazing! You're truly embracing the power of positive reflection! 🎉";
    }
  };

  return (
    <View style={styles.encouragementContainer}>
      <Text style={styles.encouragementText}>{getEncouragementMessage()}</Text>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    encouragementContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      marginHorizontal: 20,
      borderLeftWidth: 4,
      borderLeftColor: "#FF6B35",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    encouragementText: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#2c3e50",
      textAlign: "center",
      lineHeight: 24,
      fontStyle: "italic",
    },
  });
