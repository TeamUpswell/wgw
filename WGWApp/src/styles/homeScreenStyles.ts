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
    // ===== MAIN CONTAINER STYLES =====
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    },
    
    // ===== FIXED TOP BLACK SECTION =====
    topBlackSection: {
      backgroundColor: "#000000",
      paddingTop: 20, // Remove the large padding since SafeAreaView handles it
      paddingBottom: 20,
      position: 'relative',
      zIndex: 10,
    },
    
    recorderInBlackSection: {
      paddingHorizontal: 20, // Add padding only to the recorder content
    },
    
    // ===== SECTION DIVIDER =====
    sectionDivider: {
      height: 2, // Thickness of the divider
      backgroundColor: "#333", // Dark gray line
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 9, // Below the top section
    },
    
    // ===== SCROLLABLE CONTENT =====
    scrollContent: {
      flex: 1, // Take remaining space
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    },
    
    scrollContentContainer: {
      flexGrow: 1, // Allow content to grow
      paddingBottom: 10, // Space at bottom
      paddingTop: 10, // Add this to reduce top spacing
    },
    
    // ===== LOWER SECTION =====
    lowerSection: {
      paddingTop: 20, // Reduce this from 20 to something smaller
      paddingBottom: -10, // Space at bottom
    },
    
    // ===== WRAPPER STYLES =====
    cardWrapper: {
      paddingHorizontal: 20,
      marginBottom: 10, // Reduce this if needed
    },
    topSection: {
      marginTop: 60, // Increase from 30 to 60 for more space from TOP of screen
      marginBottom: 10, // Space BELOW this section
      // Note: Currently unused - use cardWrapper instead
    },
    recorderWrapper: {
      // Note: Currently unused - use cardWrapper instead
    },
    bottomStatsSection: {
      // Note: Currently unused - use cardWrapper instead
    },

    // ===== RECORDER SECTION STYLES =====
    recorderHeader: {
      alignItems: "center",
      marginBottom: 15, // Space BELOW header text before recorder content
    },
    recorderTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: isDarkMode ? "#fff" : "#2c3e50",
      textAlign: "center",
      marginBottom: 8, // Space BELOW title before subtitle
    },
    recorderSubtitle: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
      fontStyle: "italic",
    },

    // ===== PROCESSING OVERLAY STYLES =====
    processingContainer: {
      marginTop: 30, // Space ABOVE processing container
      alignItems: "center",
      padding: 15, // Internal padding INSIDE the processing box
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
      borderRadius: 12,
      width: "100%",
    },
    processingText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#8BC34A",
      marginBottom: 5, // Space BELOW main processing text
    },
    processingSubtext: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
    },

    // ===== CATEGORY SLIDER STYLES (Inside Recorder) =====
    categorySliderInRecorder: {
      marginTop: 30, // Space ABOVE the category slider
      marginBottom: 10, // Space BELOW the category slider
      paddingHorizontal: 10, // Left/right padding for the slider container
      width: "100%",
    },
    categoryScrollContentInRecorder: {
      paddingHorizontal: 10, // Extra padding at start/end of scroll content
      alignItems: "center",
    },
    categoryScrollViewInRecorder: {
      paddingVertical: 10, // Top/bottom padding inside scroll view
    },
    categoryChipInRecorder: {
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f8f8",
      paddingHorizontal: 10, // Left/right padding INSIDE each chip
      paddingVertical: 10, // Top/bottom padding INSIDE each chip
      borderRadius: 18,
      marginHorizontal: 20, // Space BETWEEN chips horizontally
      borderWidth: 1.5,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      minWidth: 90, // Minimum width for each category chip
      alignItems: "center",
      position: "relative",
    },
    categoryChipTextInRecorder: {
      fontSize: 11,
      fontWeight: "600",
      color: isDarkMode ? "#ccc" : "#666",
      textAlign: "center",
    },
    // Selected state styles
    categoryChipSelected: {
      backgroundColor: "#8BC34A",
      borderColor: "#7CB342",
    },
    categoryChipTextSelected: {
      color: "#fff",
      fontWeight: "700",
    },
    // Completed state styles
    categoryChipCompleted: {
      backgroundColor: "#fff",
      borderColor: "#8BC34A",
      borderWidth: 2,
    },
    categoryChipTextCompleted: {
      color: "#8BC34A",
      fontWeight: "600",
    },
    // Recommended state styles
    categoryChipRecommended: {
      backgroundColor: "#8BC34A",
      borderColor: "#7CB342",
      borderWidth: 2,
    },
    categoryChipTextRecommended: {
      color: "#fff",
      fontWeight: "700",
    },
    // Completion indicator (checkmark circle)
    completionIndicator: {
      position: "absolute",
      top: -8, // Position ABOVE the chip
      right: -8, // Position to the RIGHT of the chip
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
    // Recommended badge positioning
    recommendedIndicator: {
      position: "absolute",
      top: -10, // Position ABOVE the chip
      right: -6, // Position to the RIGHT of the chip
      zIndex: 2,
    },
    recommendedBadge: {
      backgroundColor: "#FF6B35",
      color: "#fff",
      fontSize: 8,
      fontWeight: "700",
      paddingHorizontal: 6, // Left/right padding INSIDE badge
      paddingVertical: 2, // Top/bottom padding INSIDE badge
      borderRadius: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // ===== TODAY'S ENTRIES SECTION =====
    entriesContainer: {
      marginBottom: 25, // Space BELOW the entries container
      marginTop: 20, // Space ABOVE the entries container
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginBottom: 15, // Space BELOW section title
      marginHorizontal: 20, // Left/right margin for title
      marginTop: 10, // Space ABOVE section title
    },
    entryCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 16,
      padding: 20, // Internal padding INSIDE each entry card
      marginBottom: 15, // Space BETWEEN entry cards
      marginHorizontal: 20, // Left/right margin (controls card width)
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
      marginBottom: 12, // Space BELOW header (category & time)
    },
    entryCategory: {
      fontSize: 14,
      fontWeight: "600",
      color: "#8BC34A",
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0fff0",
      paddingHorizontal: 12, // Left/right padding INSIDE category badge
      paddingVertical: 6, // Top/bottom padding INSIDE category badge
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
      lineHeight: 22, // Line spacing for multi-line text
      marginBottom: 12, // Space BELOW transcription text
      fontStyle: "italic",
    },
    entryAIResponse: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#555",
      lineHeight: 20, // Line spacing for multi-line text
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
      padding: 12, // Internal padding INSIDE AI response box
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: "#8BC34A",
    },

    // ===== WEEKLY PROGRESS SECTION =====
    weeklyProgressContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 16,
      padding: 20, // Internal padding INSIDE the weekly progress box
      marginBottom: 25, // Space BELOW the weekly progress box
      marginHorizontal: 20, // Left/right margin (controls box width)
      marginTop: 10, // Space ABOVE the weekly progress box
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
      marginBottom: 16, // Space BELOW the title
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

    // ===== ENCOURAGEMENT MESSAGE STYLES =====
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

    // ===== HEADER SECTION STYLE =====
    headerSection: {
      // Remove any padding/margin since StreakDisplay has its own spacing
    },
  });
