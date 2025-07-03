import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BottomNavigationProps {
  onRecordPress: () => void;
  onHistoryPress: () => void;
  onSettingsPress: () => void;
  isDarkMode: boolean;
  isRecording?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onRecordPress,
  onHistoryPress,
  onSettingsPress,
  isDarkMode,
  isRecording = false,
}) => {
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* History Button */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={onHistoryPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="time-outline"
          size={28}
          color={isDarkMode ? "#fff" : "#333"}
        />
      </TouchableOpacity>

      {/* Record Button */}
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPress={onRecordPress}
        activeOpacity={0.8}
      >
        <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="#fff" />
      </TouchableOpacity>

      {/* Settings Button */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={onSettingsPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="settings-outline"
          size={28}
          color={isDarkMode ? "#fff" : "#333"}
        />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    navButton: {
      padding: 12,
      borderRadius: 12,
    },
    recordButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#FF6B35",
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
    },
    recordingButton: {
      backgroundColor: "#e74c3c",
    },
  });
