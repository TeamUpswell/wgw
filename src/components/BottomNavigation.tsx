import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BottomNavigationProps {
  onHomePress: () => void;
  onAddAnotherPress: () => void;
  onGroupsPress: () => void;
  onYouPress: () => void;
  isDarkMode: boolean;
  addAnotherActive: boolean; // true = orange/active, false = gray/disabled
  currentTab?: 'home' | 'groups' | 'you';
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onHomePress,
  onAddAnotherPress,
  onGroupsPress,
  onYouPress,
  isDarkMode,
  addAnotherActive,
  currentTab,
}: BottomNavigationProps) => {
  console.log("[BottomNavigation] render", {
    currentTab,
    addAnotherActive,
  });
  const styles = getStyles(isDarkMode);

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

      {/* You Button */}
      <TouchableOpacity
        style={[
          styles.navButton,
          currentTab === 'you' && styles.activeNavButton
        ]}
        onPress={onYouPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={currentTab === 'you' ? "person" : "person-outline"}
          size={28}
          color={currentTab === 'you' ? "#FF6B35" : (isDarkMode ? "#fff" : "#333")}
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
