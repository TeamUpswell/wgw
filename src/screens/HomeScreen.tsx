// screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useHomeScreen } from "../hooks/useHomeScreen";
import { SettingsScreen } from "./SettingsScreen";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";

// Component imports
import { RecorderSection } from "../components/RecorderSection";
import { WeeklyProgress } from "../components/WeeklyProgress";
import { EncouragementMessage } from "../components/EncouragementMessage";
import { CelebrationView } from "../components/CelebrationView";
import { HistoryScreen } from "./HistoryScreen";
import { NotificationModal } from "../components/NotificationModal";
import { StreakDisplay } from "../components/StreakDisplay";
import { SimpleProcessingOverlay } from "../components/SimpleProcessingOverlay";
import { BottomNavigation } from "../components/BottomNavigation";
import { CombinedStats } from "../components/CombinedStats";
import { ImageDescriptionModal } from "../components/ImageDescriptionModal";
import { DailyProgressView } from "../components/DailyProgressView";
import { CameraScreen } from "../components/CameraScreen";
import { SocialFeedScreen } from "./SocialFeedScreen";
import { ProfileScreen } from "./ProfileScreen";

// Hooks and utilities
import { getStyles } from "../styles/homeScreenStyles";

interface HomeScreenProps {
  user: any;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  isDarkMode,
  onToggleDarkMode,
}) => {
  console.log("[HomeScreen] render");
  const styles = getStyles(isDarkMode);

  // Add this state to track today's entry
  const [todaysEntry, setTodaysEntry] = useState<any>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showSocialFeed, setShowSocialFeed] = useState(false);
  const [showProfile, setShowProfile] = useState(false); // <-- Add this state

  const {
    // State
    categories,
    setCategories,
    selectedCategory,
    isProcessing,
    showSettings,
    setShowSettings,
    showCelebration,
    setShowCelebration,
    showHistory,
    setShowHistory,
    showDrawer,
    setShowDrawer,
    entries,
    todaysEntries,
    streak,
    // Functions
    handleRecordingComplete,
    handleCategorySelect,
    handleScrollEnd,
    // Other state
    notificationData,
    showNotification,
    setShowNotification,
    processingStage,
    refreshEntries, // <-- make sure you destructure this!
  } = useHomeScreen(user, isDarkMode);

  // Debug: Log what we're getting from the hook
  useEffect(() => {
    console.log("🔍 DEBUG - From useHomeScreen:");
    console.log("- entries:", entries);
    console.log("- todaysEntries:", todaysEntries);
    console.log("- entries type:", typeof entries);
    console.log("- todaysEntries type:", typeof todaysEntries);
    console.log("- entries is Array?", Array.isArray(entries));
    console.log("- todaysEntries is Array?", Array.isArray(todaysEntries));
  }, [entries, todaysEntries]);

  // Always use the most recent entry for today
  useEffect(() => {
    if (todaysEntries && todaysEntries.length > 0) {
      const sorted = [...todaysEntries].sort(
        (a, b) =>
          new Date(b.created_at || b.createdAt).getTime() -
          new Date(a.created_at || a.createdAt).getTime()
      );
      setTodaysEntry(sorted[0]);
      console.log("Updated todaysEntry:", sorted[0]);
    } else {
      setTodaysEntry(null);
    }
  }, [todaysEntries]);

  // Debug useEffect - update this one
  useEffect(() => {
    console.log("🏠 HomeScreen - showSettings:", showSettings);
    console.log("🏠 HomeScreen - todaysEntries:", todaysEntries);
    console.log("🏠 HomeScreen - todaysEntry state:", todaysEntry);
  }, [showSettings, todaysEntries, todaysEntry]);

  // Handlers
  const onEntryPress = (entry: any) => {
    console.log("Entry pressed:", entry.id);
  };

  const [isActiveRecording, setIsActiveRecording] = useState(false);

  const handleRecordPress = () => {
    if (isActiveRecording) {
      setIsActiveRecording(false);
    } else {
      setIsActiveRecording(true);
    }
  };

  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
      setShowImageModal(true);
    }
  };

  // Update the calculateWeeklyStreak function to handle dates properly:
  const calculateWeeklyStreak = () => {
    if (!entries || entries.length === 0) return 0;

    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    let streak = 0;
    const sortedEntries = [...entries].sort((a, b) => {
      try {
        // Use created_at instead of createdAt
        const dateA = new Date(b.created_at || b.createdAt);
        const dateB = new Date(a.created_at || a.createdAt);
        return dateA.getTime() - dateB.getTime();
      } catch (e) {
        return 0;
      }
    });

    // Check consecutive days from today backwards
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = checkDate.toISOString().split("T")[0];

      const hasEntry = sortedEntries.some((entry) => {
        try {
          // Use created_at instead of createdAt
          const entryDate = new Date(entry.created_at || entry.createdAt);
          return entryDate.toISOString().split("T")[0] === dateStr;
        } catch (e) {
          return false;
        }
      });

      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        // Break streak if we miss a day (but not if it's today)
        break;
      }
    }

    return streak;
  };

  // Update your handleRecordingComplete to properly call the hook's function
  const onRecordingComplete = async (
    audioUri: string,
    transcription: string,
    category: string
  ) => {
    try {
      // Call the hook's handleRecordingComplete and get the new entry if possible
      const newEntry = await handleRecordingComplete(
        audioUri,
        transcription,
        category
      );

      // If your hook returns the new entry, use it:
      if (newEntry) {
        setTodaysEntry(newEntry); // <-- Use the full entry object!
      }
      // If not, do nothing. The useEffect on entries/todaysEntries will update todaysEntry.
    } catch (error) {
      console.error("Error in onRecordingComplete:", error);
    }
  };

  const openEntryActions = (entry) => {
    // Show ActionSheet or Modal with Edit/Delete
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", "Edit", "Delete"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 2,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) editEntry(entry);
        if (buttonIndex === 2) deleteEntry(entry);
      }
    );
  };

  const [editingEntry, setEditingEntry] = useState(null);
  const [editText, setEditText] = useState("");

  // Edit handler
  const editEntry = (entry) => {
    setEditingEntry(entry);
    setEditText(entry.transcription);
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingEntry) return;
    await supabase
      .from("daily_entries")
      .update({ transcription: editText })
      .eq("id", editingEntry.id);
    setEditingEntry(null);
    setEditText("");
    await refreshEntries(); // <-- ADD THIS LINE
  };

  // Edit handler for today's entry
  const handleEditTodaysEntry = () => {
    if (todaysEntry) {
      setEditingEntry(todaysEntry);
      setEditText(todaysEntry.transcription);
    }
  };

  // Toggle favorite handler for today's entry
  const handleToggleFavoriteTodaysEntry = async () => {
    if (!todaysEntry) return;
    const newFavorite = !todaysEntry.favorite;
    await supabase
      .from("daily_entries")
      .update({ favorite: newFavorite })
      .eq("id", todaysEntry.id);
    await refreshEntries(); // Make sure this is called!
  };

  const handleSaveEditTodaysEntry = async (newText: string) => {
    if (!todaysEntry) return;
    const { error } = await supabase
      .from("daily_entries")
      .update({ transcription: newText })
      .eq("id", todaysEntry.id);
    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
    await refreshEntries();
  };

  if (showSocialFeed) {
    return (
      <SocialFeedScreen
        user={user} // <-- pass user prop
        onClose={() => {
          console.log("[HomeScreen] setShowSocialFeed(false) called");
          setShowSocialFeed(false);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Only show the top section and divider if NOT completed */}
      {!todaysEntry && (
        <>
          <View style={styles.topBlackSection}>
            <View style={styles.recorderInBlackSection}>
              <RecorderSection
                selectedCategory={
                  selectedCategory || categories?.[0] || "Personal Growth"
                }
                onRecordingComplete={onRecordingComplete}
                isProcessing={isProcessing}
                isDarkMode={true}
                categories={categories || []}
                onCategorySelect={handleCategorySelect}
                compact={true}
                onAddImagePress={handleAddImage}
                onCameraPress={() => setShowCamera(true)} // <-- This line is key!
              />
            </View>
          </View>
          <View style={styles.sectionDivider} />
        </>
      )}

      {/* Main Content Area */}
      {todaysEntry ? (
        // When entry is complete, show DailyProgressView in full screen black container
        <ScrollView
          style={{ flex: 1, backgroundColor: "#000000" }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <DailyProgressView
            todaysEntry={todaysEntry}
            weeklyStreak={streak.current_streak}
            totalEntries={entries.length}
            isDarkMode={isDarkMode}
            onSaveEdit={handleSaveEditTodaysEntry}
            onShareSuccess={() => {
              Alert.alert("Shared!", "Thanks for spreading positivity!");
            }}
            onEdit={handleEditTodaysEntry}
            onToggleFavorite={handleToggleFavoriteTodaysEntry}
          />
        </ScrollView>
      ) : (
        // When no entry, show the normal lower section
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
        >
          <View style={styles.lowerSection}>
            {/* This Week Stats */}
            <View style={styles.cardWrapper}>
              <CombinedStats
                entries={entries || []}
                categories={categories || []}
                isDarkMode={isDarkMode}
                todaysEntryCount={todaysEntries?.length || 0}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Navigation - Also fixed */}
      <BottomNavigation
        onHistoryPress={() => setShowHistory(true)}
        onAddAnotherPress={() => setTodaysEntry(null)}
        onSettingsPress={() => setShowSettings(true)}
        isDarkMode={isDarkMode}
        addAnotherActive={!!todaysEntry}
        onSocialFeedPress={() => {
          console.log("[HomeScreen] setShowSocialFeed(true) called");
          setShowSocialFeed(true);
        }}
      />

      {/* Processing Modal */}
      {isProcessing && (
        <SimpleProcessingOverlay
          stage={processingStage}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Settings Screen */}
      {showSettings && (
        <SettingsScreen
          isVisible={showSettings}
          onClose={() => {
            console.log("⚙️ SettingsScreen onClose called");
            setShowSettings(false);
          }}
          categories={categories}
          onCategoriesUpdate={setCategories}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          user={user}
          onProfilePress={() => setShowProfile(true)} // <-- Pass handler
        />
      )}

      {/* Profile Screen Modal */}
      {showProfile && (
        <Modal visible={showProfile} animationType="slide">
          <ProfileScreen user={user} onClose={() => setShowProfile(false)} />
        </Modal>
      )}

      {/* History Screen */}
      {showHistory && (
        <HistoryScreen
          user={user}
          onBack={() => {
            console.log("📜 Closing History Screen");
            setShowHistory(false);
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Celebration View */}
      {showCelebration && (
        <CelebrationView
          isVisible={showCelebration}
          onClose={() => setShowCelebration(false)}
          streak={streak}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Notification Modal */}
      {showNotification && notificationData && (
        <NotificationModal
          visible={showNotification}
          onClose={() => setShowNotification(false)}
          title="🎉 Entry Saved!"
          transcription={notificationData.transcription}
          message={notificationData.aiResponse}
          type="success"
          isDarkMode={isDarkMode}
          favorite={notificationData.favorite}
          onToggleFavorite={async () => {
            const newFavorite = !notificationData.favorite;
            await supabase
              .from("daily_entries")
              .update({ favorite: newFavorite })
              .eq("id", notificationData.id);
            // Optionally update notificationData in state here
            await refreshEntries(); // Wait for this to finish
            setShowNotification(false); // Now close the modal
          }}
          onSaveEdit={async (newText) => {
            await supabase
              .from("daily_entries")
              .update({ transcription: newText })
              .eq("id", notificationData.id);
            // Optionally update notificationData in state here
            await refreshEntries(); // Wait for this to finish
            setShowNotification(false); // Now close the modal
          }}
        />
      )}

      {/* Image Description Modal */}
      {showImageModal && selectedImage && (
        <ImageDescriptionModal
          imageUri={selectedImage}
          onClose={() => setShowImageModal(false)}
          onSubmit={async (description) => {
            // TODO: Analyze image and description here
            setShowImageModal(false);
            setSelectedImage(null);
          }}
        />
      )}

      {/* Edit Entry Modal */}
      <Modal visible={!!editingEntry} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: isDarkMode ? "#222" : "#fff",
              padding: 20,
              borderRadius: 10,
              width: "80%",
            }}
          >
            <Text
              style={{ color: isDarkMode ? "#fff" : "#333", marginBottom: 10 }}
            >
              Edit Entry
            </Text>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={{
                minHeight: 60,
                color: isDarkMode ? "#fff" : "#333",
                backgroundColor: isDarkMode ? "#333" : "#eee",
                borderRadius: 8,
                padding: 10,
                marginBottom: 20,
              }}
            />
            <Button title="Save" onPress={saveEdit} />
            <Button
              title="Cancel"
              color="#888"
              onPress={() => setEditingEntry(null)}
            />
          </View>
        </View>
      </Modal>

      {/* Camera Screen */}
      {showCamera && (
        <Modal visible={showCamera} animationType="slide">
          <CameraScreen
            onPictureTaken={(uri) => {
              setCapturedPhoto(uri);
              setShowCamera(false);
              setSelectedImage(uri); // If you want to show the image modal after
              setShowImageModal(true);
            }}
            onClose={() => setShowCamera(false)}
          />
        </Modal>
      )}
    </View>
  );
};
