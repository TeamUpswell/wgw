import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface CategorySpinnerProps {
  categories: string[];
  selectedCategory: string;
  recommendedCategory: string;
  hasWeeklyEntry: (category: string) => boolean;
  onCategorySelect: (category: string) => void;
  isDarkMode: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

export const CategorySpinner: React.FC<CategorySpinnerProps> = ({
  categories,
  selectedCategory,
  recommendedCategory,
  hasWeeklyEntry,
  onCategorySelect,
  isDarkMode,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedCategory, setDisplayedCategory] = useState(
    selectedCategory || "Spin for Category"
  );
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Filter available categories
    const availableCategories = categories.filter(
      (cat) => !hasWeeklyEntry(cat)
    );
    const categoriesToUse =
      availableCategories.length > 0 ? availableCategories : categories;

    // Find the next category in the list (cycling)
    let nextIndex = categoriesToUse.indexOf(displayedCategory);
    if (nextIndex === -1) nextIndex = 0;
    else nextIndex = (nextIndex + 1) % categoriesToUse.length;
    const finalCategory = categoriesToUse[nextIndex];

    let currentIndex = nextIndex;
    let cycleCount = 0;
    const totalCycles = 15 + Math.floor(Math.random() * 10); // 15-25 cycles

    // Start cycling animation
    const cycleInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnimation, {
          toValue: 0.3,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      currentIndex = (currentIndex + 1) % categoriesToUse.length;
      setDisplayedCategory(categoriesToUse[currentIndex]);

      if (cycleCount < totalCycles - 5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      cycleCount++;

      if (cycleCount >= totalCycles) {
        clearInterval(cycleInterval);
        setDisplayedCategory(finalCategory);
        onCategorySelect(finalCategory);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.15,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsSpinning(false);
        });
      }
    }, 100 + cycleCount * 3);
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
        onPress={spin}
        disabled={isSpinning}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.categoryDisplay,
            {
              transform: [{ scale: scaleAnimation }],
              opacity: fadeAnimation,
            },
          ]}
        >
          <Text style={styles.categoryText}>{displayedCategory}</Text>
        </Animated.View>

        {!isSpinning && displayedCategory !== "Spin for Category" && (
          <View style={styles.spinAgainHint}>
            <Ionicons
              name="refresh"
              size={16}
              color={isDarkMode ? "#888" : "#666"}
            />
            <Text style={styles.spinAgainText}>Tap to spin again</Text>
          </View>
        )}
      </TouchableOpacity>

      {isSpinning && (
        <Text style={styles.spinningText}>Finding your focus...</Text>
      )}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: 8, // reduced from 20
    },
    spinButton: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 22, // reduced from 30
      paddingHorizontal: 18, // reduced from 40
      paddingVertical: 10, // reduced from 25
      minWidth: 120, // reduced from 260
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 }, // reduced shadow
      shadowOpacity: 0.1, // lighter shadow
      shadowRadius: 4, // reduced
      elevation: 2, // reduced
      borderWidth: 2, // reduced from 3
      borderColor: "#FF6B35",
    },
    spinButtonDisabled: {
      borderColor: isDarkMode ? "#444" : "#ddd",
    },
    categoryDisplay: {
      alignItems: "center",
      justifyContent: "center",
    },
    categoryText: {
      fontSize: 15, // reduced from 22
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
    },
    spinAgainHint: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6, // reduced from 10
      gap: 3, // reduced from 5
    },
    spinAgainText: {
      fontSize: 10, // reduced from 12
      color: isDarkMode ? "#888" : "#666",
      fontStyle: "italic",
    },
    spinningText: {
      fontSize: 11, // reduced from 14
      color: isDarkMode ? "#aaa" : "#666",
      marginTop: 6, // reduced from 10
      fontStyle: "italic",
    },
  });
