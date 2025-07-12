import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface BottomNavigationRefactoredProps {
  onHomePress: () => void;
  onAddAnotherPress: () => void;
  onJournalPress: () => void;
  onGroupsPress: () => void;
  onInspirePress: () => void;
  addAnotherActive: boolean; // true = orange/active, false = gray/disabled
  currentTab?: 'home' | 'journal' | 'groups' | 'inspire';
}

export const BottomNavigationRefactored: React.FC<BottomNavigationRefactoredProps> = ({
  onHomePress,
  onAddAnotherPress,
  onJournalPress,
  onGroupsPress,
  onInspirePress,
  addAnotherActive,
  currentTab,
}) => {
  // Use theme context instead of prop
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  console.log("[BottomNavigationRefactored] render", {
    currentTab,
    addAnotherActive,
  });

  return (
    <View style={styles.container}>
      {/* Home Button */}
      <TouchableOpacity
        style={[
          styles.navButton,
          currentTab === 'home' && styles.activeNavButton
        ]}
        onPress={onHomePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={currentTab === 'home' ? "home" : "home-outline"}
          size={28}
          color={currentTab === 'home' ? "#FF6B35" : (isDarkMode ? "#fff" : "#333")}
        />
      </TouchableOpacity>

      {/* Journal Button */}
      <TouchableOpacity
        style={[
          styles.navButton,
          currentTab === 'journal' && styles.activeNavButton
        ]}
        onPress={onJournalPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={currentTab === 'journal' ? "book" : "book-outline"}
          size={28}
          color={currentTab === 'journal' ? "#FF6B35" : (isDarkMode ? "#fff" : "#333")}
        />
      </TouchableOpacity>

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
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Groups Button */}
      <TouchableOpacity
        style={[
          styles.navButton,
          currentTab === 'groups' && styles.activeNavButton
        ]}
        onPress={onGroupsPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={currentTab === 'groups' ? "people" : "people-outline"}
          size={28}
          color={currentTab === 'groups' ? "#FF6B35" : (isDarkMode ? "#fff" : "#333")}
        />
      </TouchableOpacity>

      {/* Inspire Button */}
      <TouchableOpacity
        style={[
          styles.navButton,
          currentTab === 'inspire' && styles.activeNavButton
        ]}
        onPress={onInspirePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={currentTab === 'inspire' ? "sparkles" : "sparkles-outline"}
          size={28}
          color={currentTab === 'inspire' ? "#FF6B35" : (isDarkMode ? "#fff" : "#333")}
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
    activeNavButton: {
      backgroundColor: isDarkMode ? "rgba(255, 107, 53, 0.1)" : "rgba(255, 107, 53, 0.1)",
    },
    addAnotherButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
  });