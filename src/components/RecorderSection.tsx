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
  Switch,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CategorySpinner } from "./CategorySpinner";
import * as ImagePicker from "expo-image-picker";
import ImageDescriptionModal from "./ImageDescriptionModal"; // adjust path as needed
import { Audio } from "expo-av";

// Import supabase client
import { resizeImage, DEFAULT_IMAGE_OPTIONS } from "../utils/imageUtils";
import { createClient } from "@supabase/supabase-js";
import { transcribeAudio } from "../services/transcriptionService";

// Initialize client using environment variables
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

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
  onAddImagePress?: () => void; // Add image press handler
  onCameraPress?: () => void; // <-- Add this
  isAddingAdditionalEntry?: boolean; // Add additional entry prop for calmer experience
  onPrivacyChange?: (isPrivate: boolean) => void; // Add privacy callback
  initialPrivacy?: boolean; // Add initial privacy state
}

export const RecorderSection: React.FC<RecorderSectionProps> = ({
  selectedCategory,
  onRecordingComplete,
  isProcessing,
  isDarkMode,
  categories,
  onCategorySelect,
  compact = false,
  onAddImagePress,
  onCameraPress,
  isAddingAdditionalEntry = false,
  onPrivacyChange,
  initialPrivacy = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(initialPrivacy);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const recording = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const [scrolling, setScrolling] = useState(false);

  const styles = getStyles(isDarkMode, true); // Always use compact mode for homepage

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
        console.log("🎤 Starting transcription process...");
        try {
          // Transcribe the audio
          const transcription = await transcribeAudio(uri);
          console.log("✅ Transcription completed:", transcription.substring(0, 50) + "...");
          console.log("📞 Calling onRecordingComplete with:", { uri, transcription, category: selectedCategory });
          onRecordingComplete(uri, transcription, selectedCategory);
        } catch (transcriptionError) {
          console.error("❌ Transcription failed:", transcriptionError);
          // Fallback to a basic transcription
          console.log("📞 Using fallback transcription");
          onRecordingComplete(uri, "Voice recording (transcription failed)", selectedCategory);
        }
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

  // Get today's recommended category
  const getTodaysCategory = () => {
    const unusedCategories = categories.filter((cat) => !hasWeeklyEntry(cat));
    if (unusedCategories.length > 0) {
      return unusedCategories[0];
    }
    // Fallback to day-based selection
    const dayIndex = new Date().getDay();
    return categories[dayIndex % categories.length];
  };

  const hasWeeklyEntry = (category: string) => {
    // This should be passed from parent or implemented based on your data
    // For now, returning false for all
    return false;
  };

  // Get gentler categories for additional entries
  const getAdditionalEntryCategories = () => {
    return [
      "Gratitude",
      "Small Wins", 
      "Peaceful Moments",
      "Acts of Kindness",
      "Simple Pleasures",
      "Mindful Observations",
      "Creative Expressions",
      "Connection & Love",
      "Learning & Discovery",
      "Self-Care",
    ];
  };

  // Get all available categories for dropdown
  const getAllCategories = () => {
    const baseCategories = isAddingAdditionalEntry ? getAdditionalEntryCategories() : categories;
    // Add some additional common categories
    const allCategories = [
      ...baseCategories,
      "Family",
      "Friends", 
      "Work",
      "Health",
      "Travel",
      "Hobbies",
      "Learning",
      "Accomplishments",
      "Relationships",
      "Spirituality",
      "Nature",
      "Creativity",
      "Exercise",
      "Food",
      "Music",
      "Books",
      "Movies",
      "Games",
      "Pets",
    ];
    
    // Remove duplicates and sort
    return Array.from(new Set(allCategories)).sort();
  };

  // Handle dropdown category selection
  const handleDropdownSelect = (category: string) => {
    onCategorySelect(category);
    setShowCategoryDropdown(false);
  };

  const uploadImageToSupabase = async (uri: string, userId: string) => {
    console.log('📤 Starting image upload process...');
    
    // Resize image before upload
    const resizedImage = await resizeImage(uri, DEFAULT_IMAGE_OPTIONS);
    console.log('✅ Image resized for upload');
    
    // Convert resized image to blob
    const response = await fetch(resizedImage.uri);
    const blob = await response.blob();

    // Create a unique filename
    const fileExt = resizedImage.uri.split(".").pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    console.log('📁 Uploading resized image:', fileName, 'Size:', blob.size, 'bytes');

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("entry-images")
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (error) throw error;
    console.log('✅ Image uploaded successfully to:', data.path);
    return data.path; // or data.Key
  };

  // Pick from library
  const handlePickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
      setShowImageModal(true);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowImageModal(false);
    setSelectedImageUri(null);
  };

  // Handle submit from modal
  const handleImageSubmit = (data) => {
    // Save to history, send to AI, etc.
    handleCloseModal();
  };

  const handlePrivacyToggle = () => {
    const newPrivacy = !isPrivate;
    setIsPrivate(newPrivacy);
    onPrivacyChange?.(newPrivacy);
  };

  return (
    <View
      style={[
        styles.recorderContainer,
        {
          flex: 1,
          minHeight: 120,
          maxHeight: 300,
          justifyContent: "flex-start",
        },
      ]}
    >
      <View style={styles.recorderHeader}>
        <Text style={styles.recorderTitle}>
          {isAddingAdditionalEntry ? "What else is going well?" : "What's Going Well?"}
        </Text>
        <Text style={styles.recorderSubtitle}>
          {isAddingAdditionalEntry 
            ? "What other things are bringing you happiness today?" 
            : "The question that changes everything"}
        </Text>
      </View>
      <View style={styles.categoryContainer}>
        <CategorySpinner
          categories={isAddingAdditionalEntry ? getAdditionalEntryCategories() : categories}
          selectedCategory={selectedCategory}
          recommendedCategory={isAddingAdditionalEntry ? null : getTodaysCategory()}
          hasWeeklyEntry={hasWeeklyEntry}
          onCategorySelect={onCategorySelect}
          isDarkMode={isDarkMode}
        />
        
        {/* Category Dropdown Button */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowCategoryDropdown(true)}
        >
          <Ionicons name="chevron-down" size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>
      
      {/* Category Dropdown Modal */}
      {showCategoryDropdown && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}
        >
          <View style={styles.dropdownContent}>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {getAllCategories().map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === category && styles.selectedDropdownItem
                  ]}
                  onPress={() => handleDropdownSelect(category)}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedCategory === category && styles.selectedDropdownItemText
                  ]}>
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <Ionicons name="checkmark" size={16} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 10, // Reduce spacing
        }}
      >
        <TouchableOpacity
          style={[
            styles.recordButton,
            { width: 70, height: 70 }, // Smaller button
            isProcessing && { opacity: 0.4 },
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={40}
            color={isProcessing ? "#bbb" : "#fff"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.recordButton,
            {
              marginLeft: 12,
              backgroundColor: "#FF6B35",
              width: 70,
              height: 50,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 8,
            },
            isProcessing && { opacity: 0.4 },
          ]}
          onPress={onCameraPress ? onCameraPress : handlePickFromLibrary}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Ionicons
            name="camera"
            size={20}
            color={isProcessing ? "#bbb" : "#fff"}
            style={{ marginRight: 4 }}
          />
          <Text
            style={{
              color: isProcessing ? "#bbb" : "#fff",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            Photo
          </Text>
        </TouchableOpacity>
        {/* Privacy toggle */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: 16,
          }}
        >
          <Switch
            value={isPrivate}
            onValueChange={handlePrivacyToggle}
            thumbColor={isPrivate ? "#FF6B35" : isDarkMode ? "#444" : "#ccc"}
            trackColor={{
              false: isDarkMode ? "#555" : "#eee",
              true: "#FFB199",
            }}
          />
          <Text
            style={{
              marginLeft: 6,
              color: isDarkMode ? "#fff" : "#333",
              fontSize: 12,
            }}
          >
            Private
          </Text>
        </View>
      </View>
      {isRecording && (
        <View style={styles.recordingStatus}>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${getProgressPercentage()}%` },
              ]}
            />
          </View>
          <View style={styles.timerContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.timerText}>
              {formatDuration(recordingDuration)} remaining
            </Text>
          </View>
          {getRemainingTime() <= 10 && (
            <Text style={styles.warningText}>
              {getRemainingTime()} seconds left!
            </Text>
          )}
        </View>
      )}
      <Text style={styles.instructionText}>
        {isRecording
          ? "Tap to stop recording"
          : `Tap to record (max ${RECORDING_LIMIT_SECONDS}s)`}
      </Text>
      {isProcessing && (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing your entry...</Text>
          <Text style={styles.processingSubtext}>
            Our AI is reflecting on what's going well for you
          </Text>
        </View>
      )}
      {showImageModal && (
        <ImageDescriptionModal
          imageUri={selectedImageUri}
          onClose={handleCloseModal}
          onSubmit={handleImageSubmit}
        />
      )}
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
      width: "95%", // Increased from 90%
      marginBottom: 15, // Increased from 10
      height: compact ? 85 : 110, // Increased from 70 : 90
      justifyContent: "center",
      paddingTop: 20,
      flexDirection: "row",
      alignItems: "center",
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
      height: 70, // Increased from 60
      overflow: "visible",
    },
    categoryScrollContainer: {
      paddingHorizontal: 0, // ← Remove all padding
      paddingVertical: 0,
      alignItems: "center",
      height: 70, // Increased from 60
      justifyContent: "flex-start",
      flexDirection: "row",
    },
    categoryButton: {
      backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
      paddingHorizontal: 24, // Increased from 20
      paddingVertical: 14, // Increased from 12
      borderRadius: 25,
      marginHorizontal: 8,
      borderWidth: 2, // Always have a border
      borderColor: isDarkMode ? "#333" : "#f0f0f0", // Make border same color as background when not selected
      minWidth: 160, // Increased from 140
      height: 56, // Increased from 50
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
    micButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#8BC34A",
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
    dropdownButton: {
      marginLeft: 12,
      padding: 8,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f8f8",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FF6B35",
      justifyContent: "center",
      alignItems: "center",
    },
    dropdownOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    dropdownContent: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      width: "80%",
      maxHeight: "60%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    dropdownScroll: {
      maxHeight: 300,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
    },
    selectedDropdownItem: {
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f8f8",
    },
    dropdownItemText: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      flex: 1,
    },
    selectedDropdownItemText: {
      color: "#FF6B35",
      fontWeight: "600",
    },
  });
