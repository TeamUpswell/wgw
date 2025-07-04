// Components/RecorderSection.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { ProcessingAnimation } from "./ProcessingAnimation";
import { CompletionCountdown } from "./CompletionCountdown";

const RECORDING_LIMIT_SECONDS = 30;

interface RecorderSectionProps {
  selectedCategory: string;
  onRecordingComplete: (
    audioUri: string,
    transcription: string,
    category: string
  ) => void;
  isProcessing: boolean;
  isDarkMode: boolean;
  categories: string[]; // Add categories prop
  onCategorySelect: (category: string) => void; // Add category select handler
  compact?: boolean; // Add compact prop
  showCompletion?: boolean; // Add this prop
  nextEntryTime?: Date; // Add this prop
}

export const RecorderSection: React.FC<RecorderSectionProps> = ({
  selectedCategory,
  onRecordingComplete,
  isProcessing,
  isDarkMode,
  categories,
  onCategorySelect,
  compact = false, // Default to false
  showCompletion = false,
  nextEntryTime = new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 24 hours later
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showCompletionState, setShowCompletion] = useState(showCompletion);
  const [nextEntryTimeState, setNextEntryTime] = useState<Date | null>(
    nextEntryTime
  );
  const recording = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const [scrolling, setScrolling] = useState(false);

  const styles = getStyles(isDarkMode, compact);

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow microphone access to record audio."
        );
        return;
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Auto-stop after 30 seconds
      recordingTimer.current = setTimeout(() => {
        stopRecording();
        Alert.alert(
          "Recording Complete",
          `Maximum recording time of ${RECORDING_LIMIT_SECONDS} seconds reached.`
        );
      }, RECORDING_LIMIT_SECONDS * 1000);

      console.log("🎤 Recording started");
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording.current || !isRecording) return;

      // Clear timers
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
        recordingTimer.current = null;
      }

      // Stop recording
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();

      setIsRecording(false);
      setRecordingDuration(0);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      console.log("✅ Recording stopped, URI:", uri);

      if (uri) {
        onRecordingComplete(uri, "", selectedCategory);
      }

      recording.current = null;
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording. Please try again.");
    }
  };

  const formatDuration = (seconds: number) => {
    const remainingSeconds = RECORDING_LIMIT_SECONDS - seconds;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getRemainingTime = () => {
    return RECORDING_LIMIT_SECONDS - recordingDuration;
  };

  const getProgressPercentage = () => {
    return (recordingDuration / RECORDING_LIMIT_SECONDS) * 100;
  };

  // Replace your handleCategoryPress function with this simplified version:
  const handleCategoryPress = (category: string) => {
    onCategorySelect(category);

    const categoryIndex = categories.indexOf(category);
    if (categoryIndex !== -1 && categoryScrollRef.current) {
      // Simplified centering - just center the button directly
      const scrollToX =
        categoryIndex * itemWidth - screenWidth / 2 + itemWidth / 2;

      console.log("🎯 SIMPLIFIED CENTERING:", {
        category,
        categoryIndex,
        itemWidth,
        screenWidth,
        scrollToX: Math.max(0, scrollToX),
      });

      categoryScrollRef.current.scrollTo({
        x: Math.max(0, scrollToX),
        animated: true,
      });
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle scroll begin
  const handleScrollBegin = () => {
    setScrolling(true);
  };

  // Handle scroll end with haptic feedback
  const handleScrollEnd = () => {
    setScrolling(false);
    // Gentle feedback when scrolling stops
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Update handleMomentumScrollEnd to just provide feedback, not change selection:
  const handleMomentumScrollEnd = (event: any) => {
    setScrolling(false);
    // Just gentle feedback when momentum scroll ends - no auto-selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Auto-center the selected category on mount and when it changes
  /*
  useEffect(() => {
    if (
      selectedCategory &&
      categories.length > 0 &&
      categoryScrollRef.current
    ) {
      const categoryIndex = categories.indexOf(selectedCategory);
      if (categoryIndex !== -1) {
        const scrollOffset = 20; // paddingHorizontal of scroll container

        // Fix: Add the scroll offset to the button center calculation
        const buttonCenterPosition =
          scrollOffset + categoryIndex * itemWidth + buttonWidth / 2;
        const screenCenter = screenWidth / 2;
        const scrollToPosition = buttonCenterPosition - screenCenter;

        console.log("🎯 AUTO-CENTER CORRECTED:", {
          selectedCategory,
          categoryIndex,
          buttonCenterPosition,
          scrollToPosition: Math.max(0, scrollToPosition),
        });

        setTimeout(() => {
          categoryScrollRef.current?.scrollTo({
            x: Math.max(0, scrollToPosition),
            animated: true,
          });
        }, 100);
      }
    }
  }, [selectedCategory, categories]);
  */

  return (
    <View style={styles.recorderContainer}>
      {/* Show countdown if completed today */}
      {showCompletionState ? (
        <CompletionCountdown
          nextEntryTime={nextEntryTimeState || new Date()}
          isDarkMode={isDarkMode}
        />
      ) : (
        <>
          <View style={styles.recorderHeader}>
            <Text style={styles.recorderTitle}>What's Going Well?</Text>
            <Text style={styles.recorderSubtitle}>
              The question that changes everything
            </Text>
          </View>

          {/* Category Slider with Auto-Selection */}
          <View style={styles.categoryContainer}>
            {/* Category Selection */}
            <View
              style={{
                height: 60, // Increased from 50
                overflow: "hidden",
                marginBottom: 25, // Increased from 20
              }}
            >
              <ScrollView
                ref={categoryScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                  height: 60, // Match container height
                }}
                contentContainerStyle={{
                  paddingHorizontal: 10,
                  alignItems: "center",
                  minHeight: 60, // Match new height
                  maxHeight: 60, // Match new height
                }}
                scrollEnabled={true}
                bounces={false}
                directionalLockEnabled={true} // iOS: Lock to horizontal direction
                disableIntervalMomentum={true} // Android: Prevent vertical momentum
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.selectedCategoryButton,
                    ]}
                    onPress={() => handleCategoryPress(category)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category && styles.selectedCategoryText,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.categoryLabel}>Scroll to choose your focus</Text>
          </View>

          {/* Recording Button */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingButton,
              isProcessing && styles.disabledButton,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={70} color="#fff" />
          </TouchableOpacity>

          {/* Recording Status */}
          {isRecording && (
            <View style={styles.recordingStatus}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${getProgressPercentage()}%` },
                  ]}
                />
              </View>

              {/* Timer Display */}
              <View style={styles.timerContainer}>
                <View style={styles.recordingIndicator} />
                <Text style={styles.timerText}>
                  {formatDuration(recordingDuration)} remaining
                </Text>
              </View>

              {/* Warning when approaching limit */}
              {getRemainingTime() <= 10 && (
                <Text style={styles.warningText}>
                  {getRemainingTime()} seconds left!
                </Text>
              )}
            </View>
          )}

          {/* Instructions */}
          <Text style={styles.instructionText}>
            {isRecording
              ? "Tap to stop recording"
              : `Tap to record (max ${RECORDING_LIMIT_SECONDS}s)`}
          </Text>
        </>
      )}

      {/* Processing overlay */}
      <ProcessingAnimation
        isProcessing={isProcessing}
        message="Saving your reflection..."
        subMessage="Generating insights"
      />
    </View>
  );
};

const { width: screenWidth } = Dimensions.get("window");
const buttonWidth = 120;
const buttonMargin = 16;
const itemWidth = buttonWidth + buttonMargin;

const parentHorizontalReduction = 0;
const availableWidth = screenWidth - parentHorizontalReduction;
const centerPadding = (availableWidth - itemWidth) / 2;

// More detailed debug
console.log("🎯 DETAILED CENTERING DEBUG:", {
  screenWidth,
  buttonWidth,
  buttonMargin,
  itemWidth,
  parentHorizontalReduction,
  availableWidth,
  centerPadding,
  "Expected button center": itemWidth / 2,
  "Screen center": screenWidth / 2,
});

const getStyles = (isDarkMode: boolean, compact: boolean) =>
  StyleSheet.create({
    container: {
      padding: 20,
      alignItems: "center",
    },
    tapToRecordText: {
      fontSize: 18,
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
      marginBottom: 20,
      fontWeight: "500",
    },
    recorderContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 20,
      padding: compact ? 15 : 20, // Increased from 10 : 15
      marginBottom: 10,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
      position: "relative", // Important for absolute positioned children
      overflow: "hidden", // Clean edges for animations
    },
    recorderHeader: {
      alignItems: "center",
      marginBottom: 15, // Increased from 8
    },
    recorderTitle: {
      fontSize: compact ? 20 : 22, // Increased from 18 : 20
      fontWeight: "800",
      color: isDarkMode ? "#fff" : "#2c3e50",
      textAlign: "center",
      marginBottom: 6, // Increased from 4
    },
    recorderSubtitle: {
      fontSize: compact ? 13 : 15, // Increased from 12 : 14
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
      fontStyle: "italic",
      marginBottom: 8, // Increased from 3
    },
    categoryContainer: {
      width: "90%",
      marginBottom: 15, // Increased from 10
      height: compact ? 70 : 90, // Increased from 60 : 80
      justifyContent: "center",
      paddingTop: 20,
    },
    categoryLabel: {
      fontSize: 14, // Reduced from 16 for better proportion
      color: isDarkMode ? "#ccc" : "#666",
      marginBottom: 15, // Increased from 10
      textAlign: "center",
      marginTop: -10, // Adjusted from -15
    },
    categoryScroll: {
      flexGrow: 0,
      height: 60,
      overflow: "visible",
    },
    categoryScrollContainer: {
      paddingHorizontal: 0, // ← Remove all padding
      paddingVertical: 0,
      alignItems: "center",
      height: 60,
      justifyContent: "flex-start",
      flexDirection: "row",
    },
    categoryButton: {
      backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      marginHorizontal: 8,
      borderWidth: 2, // Always have a border
      borderColor: isDarkMode ? "#333" : "#f0f0f0", // Make border same color as background when not selected
      minWidth: 120,
      height: 45, // Fixed height
      alignItems: "center",
      justifyContent: "center",
    },
    selectedCategoryButton: {
      backgroundColor: "#FF6B35",
      borderColor: "#FF6B35", // Only change colors, not dimensions
      // Remove ALL other properties - only color changes
    },
    recommendedCategoryButton: {
      borderColor: "#FFD700",
      borderWidth: 2,
      elevation: 6,
      shadowColor: "#FFD700",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    recommendedBadge: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: "#FFD700",
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
      elevation: 5,
      borderWidth: 1, // ← Add border for better visibility
      borderColor: "#FFA500", // ← Slightly darker gold border
    },
    recommendedBadgeText: {
      fontSize: 14,
      color: "#333",
    },
    categoryText: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 16, // ← Add line height for better text centering
    },
    selectedCategoryText: {
      color: "#fff",
      fontWeight: "600",
    },
    recordButton: {
      width: 100, // Increased from 90
      height: 100, // Increased from 90
      borderRadius: 50,
      backgroundColor: "#FF6B35",
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      marginTop: 10, // Increased from 5
    },
    recordingButton: {
      backgroundColor: "#e74c3c",
      shadowColor: "#e74c3c",
    },
    disabledButton: {
      backgroundColor: "#ccc",
      shadowColor: "#ccc",
    },
    recordingStatus: {
      alignItems: "center",
      marginTop: 20,
      width: "100%",
    },
    progressContainer: {
      width: "80%",
      height: 4,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
      borderRadius: 2,
      marginBottom: 12,
      fontWeight: "700",
      color: "#e74c3c",
      marginTop: 4,
    },
    progressBar: {
      height: 4,
      backgroundColor: "#e74c3c",
      borderRadius: 2,
    },
    timerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    recordingIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#e74c3c",
      marginRight: 8,
    },
    timerText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#e74c3c",
    },
    warningText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#e74c3c",
      marginTop: 4,
    },
    instructionText: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
      marginTop: 20, // Increased from 16
    },
    processingContainer: {
      marginTop: 15,
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
  });
