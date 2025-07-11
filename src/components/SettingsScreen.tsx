// Components/SettingsScreen.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SettingsScreenProps {
  user: any;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onBack: () => void;
  categories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  isDarkMode,
  onToggleDarkMode,
  onBack,
  categories = [],
  onCategoriesChange,
}) => {
  const styles = getStyles(isDarkMode);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Theme Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={onToggleDarkMode}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name={isDarkMode ? "moon" : "sunny"}
                size={24}
                color={isDarkMode ? "#fff" : "#666"}
              />
              <Text style={styles.settingText}>
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </Text>
            </View>
            <View style={[styles.toggle, isDarkMode && styles.toggleActive]}>
              <View
                style={[
                  styles.toggleThumb,
                  isDarkMode && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="person-circle"
                size={24}
                color={isDarkMode ? "#fff" : "#666"}
              />
              <Text style={styles.settingText}>{user?.email || "User"}</Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Categories ({categories.length})
            </Text>
            {categories.map((category, index) => (
              <View key={category} style={styles.categoryRow}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
          </View>
        )}

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="information-circle"
                size={24}
                color={isDarkMode ? "#fff" : "#666"}
              />
              <Text style={styles.settingText}>What's Going Well v1.0</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#e0e0e0",
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#2c3e50",
    },
    placeholder: {
      width: 40,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    settingText: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginLeft: 12,
    },
    toggle: {
      width: 48,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#ccc",
      justifyContent: "center",
      paddingHorizontal: 2,
    },
    toggleActive: {
      backgroundColor: "#8BC34A",
    },
    toggleThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#fff",
      alignSelf: "flex-start",
    },
    toggleThumbActive: {
      alignSelf: "flex-end",
    },
    categoryRow: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      padding: 12,
      borderRadius: 8,
      marginBottom: 4,
    },
    categoryText: {
      fontSize: 14,
      color: isDarkMode ? "#fff" : "#2c3e50",
    },
  });
