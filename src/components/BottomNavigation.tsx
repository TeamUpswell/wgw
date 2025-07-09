import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BottomNavigationProps {
  onHistoryPress: () => void;
  onAddAnotherPress: () => void;
  onSettingsPress: () => void;
  isDarkMode: boolean;
  addAnotherActive: boolean; // true = orange/active, false = gray/disabled
  onSocialFeedPress?: () => void; // Add this prop
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onHistoryPress,
  onAddAnotherPress,
  onSettingsPress,
  isDarkMode,
  addAnotherActive,
  onSocialFeedPress, // Add this prop
}) => {
  console.log("[BottomNavigation] render", {
    onSocialFeedPressExists: !!onSocialFeedPress,
  });
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

      {/* Social Feed Button */}
      {onSocialFeedPress && (
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            console.log("[BottomNavigation] Social Feed button pressed");
            onSocialFeedPress();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="people-outline"
            size={28}
            color={isDarkMode ? "#8BC34A" : "#4CAF50"}
          />
        </TouchableOpacity>
      )}

      {/* Add Another (center) Button */}
      <TouchableOpacity
        style={[
          styles.addAnotherButton,
          { backgroundColor: addAnotherActive ? "#FF6B35" : "#ccc" },
        ]}
        onPress={addAnotherActive ? onAddAnotherPress : undefined}
        activeOpacity={addAnotherActive ? 0.8 : 1}
        disabled={!addAnotherActive}
      >
        <Ionicons name="add-circle" size={54} color="#fff" />
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
    addAnotherButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
    },
  });
