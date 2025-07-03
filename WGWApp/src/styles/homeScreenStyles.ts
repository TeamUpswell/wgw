import { StyleSheet, Dimensions, Platform } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const buttonWidth = 120;
const buttonMargin = 16;
const itemWidth = buttonWidth + buttonMargin;

// Only account for scrollContent padding since we removed the other margins
const parentHorizontalReduction = 0; // ← Change from 40 to 0 since paddingHorizontal is 0
// Change to account for whatever the actual padding is
const availableWidth = screenWidth - parentHorizontalReduction;
const centerPadding = (availableWidth - itemWidth) / 2;

export const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    },
    content: {
      flex: 1,
      paddingBottom: 80, // Space for bottom navigation
    },
    topSection: {
      marginTop: 40, // Reduced from 60 to move encouragement up
      marginBottom: 10, // Reduced from 20
    },
    recorderWrapper: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      marginTop: -20, // Move up slightly
    },
    bottomStatsSection: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      marginTop: 10, // Reduced from 20
    },

    // Recorder styles
    recorderHeader: {
      alignItems: "center",
      marginBottom: 15, // Space below the header text
    },
    recorderTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: isDarkMode ? "#fff" : "#2c3e50",
      textAlign: "center",
      marginBottom: 8,
    },
    recorderSubtitle: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
      fontStyle: "italic",
    },

    // Processing styles
    processingContainer: {
      marginTop: 20,
      alignItems: "center",
      padding: 15,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
      borderRadius: 12,
      width: "100%",
    },
    processingText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#8BC34A",
      marginBottom: 5,
    },
    processingSubtext: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
    },

    // Category slider styles (for in-recorder use)
    categorySliderInRecorder: {
      marginTop: 15, // Space above the category slider
      marginBottom: 10,
      paddingHorizontal: 10,
      width: "100%",
    },
    categoryScrollContentInRecorder: {
      paddingHorizontal: 30,
      alignItems: "center",
    },
    categoryScrollViewInRecorder: {
      paddingVertical: 10,
    },
    categoryChipInRecorder: {
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f8f8",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      marginHorizontal: 5,
      borderWidth: 1.5,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      minWidth: 90,
      alignItems: "center",
      position: "relative",
    },
    categoryChipTextInRecorder: {
      fontSize: 11,
      fontWeight: "600",
      color: isDarkMode ? "#ccc" : "#666",
      textAlign: "center",
    },
    categoryChipSelected: {
      backgroundColor: "#8BC34A",
      borderColor: "#7CB342",
    },
    categoryChipTextSelected: {
      color: "#fff",
      fontWeight: "700",
    },
    categoryChipCompleted: {
      backgroundColor: "#fff",
      borderColor: "#8BC34A",
      borderWidth: 2,
    },
    categoryChipTextCompleted: {
      color: "#8BC34A",
      fontWeight: "600",
    },
    categoryChipRecommended: {
      backgroundColor: "#8BC34A",
      borderColor: "#7CB342",
      borderWidth: 2,
    },
    categoryChipTextRecommended: {
      color: "#fff",
      fontWeight: "700",
    },
    completionIndicator: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: "#fff",
      borderRadius: 12,
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
      zIndex: 2,
    },
    recommendedIndicator: {
      position: "absolute",
      top: -10,
      right: -6,
      zIndex: 2,
    },
    recommendedBadge: {
      backgroundColor: "#FF6B35",
      color: "#fff",
      fontSize: 8,
      fontWeight: "700",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // Today's entries styles
    entriesContainer: {
      marginBottom: 25, // Increase from 20 to 25
      marginTop: 10, // Add top spacing
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginBottom: 15,
      marginHorizontal: 20,
      marginTop: 10, // Add consistent top spacing
    },
    entryCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 15, // Increase from 12 to 15
      marginHorizontal: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    entryCategory: {
      fontSize: 14,
      fontWeight: "600",
      color: "#8BC34A",
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0fff0",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    entryTime: {
      fontSize: 12,
      color: isDarkMode ? "#aaa" : "#666",
      fontWeight: "500",
    },
    entryTranscription: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#2c3e50",
      lineHeight: 22,
      marginBottom: 12,
      fontStyle: "italic",
    },
    entryAIResponse: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#555",
      lineHeight: 20,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: "#8BC34A",
    },

    // Weekly progress styles
    weeklyProgressContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 25, // Increase from 20 to 25
      marginHorizontal: 20,
      marginTop: 10, // Add top spacing
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

    // Encouragement message styles
    encouragementContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 30, // Increase from 20 to 30
      marginHorizontal: 20,
      marginTop: 10, // Add top spacing
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

    // Header section style
    headerSection: {
      // Remove any padding/margin since StreakDisplay has its own spacing
    },
  });
