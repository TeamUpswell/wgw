// Components/CategorySlider.tsx
import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CategorySliderProps {
  categories: string[];
  selectedCategory: string;
  todaysCategory: string;
  hasWeeklyEntry: (category: string) => boolean;
  onCategorySelect: (category: string, index: number) => void;
  onScrollEnd: (event: any) => void;
  scrollViewRef: React.RefObject<ScrollView>;
  isDarkMode: boolean;
  isInRecorder?: boolean;
}

export const CategorySlider: React.FC<CategorySliderProps> = ({
  categories,
  selectedCategory,
  todaysCategory,
  hasWeeklyEntry,
  onCategorySelect,
  onScrollEnd,
  scrollViewRef,
  isDarkMode,
  isInRecorder = false,
}) => {
  const styles = getStyles(isDarkMode, isInRecorder);

  return (
    <View style={styles.categorySliderContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
        style={styles.categoryScrollView}
        snapToInterval={110}
        snapToAlignment="center"
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
      >
        {categories.map((category, index) => {
          const hasEntryThisWeek = hasWeeklyEntry(category);
          const isSelected = selectedCategory === category;
          const isRecommended = category === todaysCategory;

          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
                hasEntryThisWeek && !isSelected && styles.categoryChipCompleted,
                isRecommended && !isSelected && styles.categoryChipRecommended,
              ]}
              onPress={() => onCategorySelect(category, index)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextSelected,
                  hasEntryThisWeek &&
                    !isSelected &&
                    styles.categoryChipTextCompleted,
                  isRecommended &&
                    !isSelected &&
                    styles.categoryChipTextRecommended,
                ]}
              >
                {category}
              </Text>
              {hasEntryThisWeek && (
                <View style={styles.completionIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#8BC34A" />
                </View>
              )}
              {isRecommended && !isSelected && (
                <View style={styles.recommendedIndicator}>
                  <Text style={styles.recommendedBadge}>Today</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode: boolean, isInRecorder: boolean) =>
  StyleSheet.create({
    categorySliderContainer: {
      marginTop: isInRecorder ? 20 : 10,
      marginBottom: isInRecorder ? 10 : 20,
      paddingHorizontal: 10,
      width: "100%",
    },
    categoryScrollContent: {
      paddingHorizontal: 30,
      alignItems: "center",
    },
    categoryScrollView: {
      paddingVertical: 10,
    },
    categoryChip: {
      backgroundColor: isDarkMode ? "#333" : "#fff",
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginHorizontal: 5,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    categoryChipSelected: {
      backgroundColor: isDarkMode ? "#555" : "#007bff",
    },
    categoryChipCompleted: {
      backgroundColor: isDarkMode ? "#444" : "#e0e0e0",
    },
    categoryChipRecommended: {
      borderColor: "#8BC34A",
      borderWidth: 1,
    },
    categoryChipText: {
      color: isDarkMode ? "#fff" : "#000",
      fontWeight: "500",
    },
    categoryChipTextSelected: {
      color: "#fff",
    },
    categoryChipTextCompleted: {
      color: isDarkMode ? "#ccc" : "#666",
    },
    categoryChipTextRecommended: {
      color: "#8BC34A",
    },
    completionIndicator: {
      marginLeft: 5,
    },
    recommendedIndicator: {
      marginLeft: 5,
      backgroundColor: "#8BC34A",
      borderRadius: 10,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    recommendedBadge: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
  });
