// screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Platform, ScrollView, Alert } from "react-native"; // Add Platform here
import * as Haptics from "expo-haptics";
import { useHomeScreen } from "../hooks/useHomeScreen";
import { SettingsScreen } from "./SettingsScreen";
import * as ImagePicker from "expo-image-picker";

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
import { DailyProgressView } from "../components/DailyProgressView";
import { ImageDescriptionModal } from "../components/ImageDescriptionModal";

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
  const styles = getStyles(isDarkMode);

  // Add this state to track today's entry
  const [todaysEntry, setTodaysEntry] = useState<{
    category: string;
    transcription: string;
    timestamp: Date;
  } | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

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

  // Check if we have an entry for today on mount and when entries change
  useEffect(() => {
    console.log("🏠 Checking todaysEntries:", todaysEntries);
    console.log("🏠 All entries count:", entries?.length);
    console.log("🏠 First few entries:", entries?.slice(0, 3));

    // First try todaysEntries
    if (
      todaysEntries &&
      Array.isArray(todaysEntries) &&
      todaysEntries.length > 0
    ) {
      const latestEntry = todaysEntries[0];
      console.log("🏠 Latest entry from todaysEntries:", latestEntry);

      if (latestEntry && latestEntry.category && latestEntry.createdAt) {
        try {
          // Add defensive check for valid date string
          const dateString = latestEntry.createdAt;
          if (!dateString || dateString === "Invalid Date") {
            console.error("Invalid date string:", dateString);
            return;
          }

          const timestamp = new Date(dateString);
          if (!isNaN(timestamp.getTime()) && timestamp.getFullYear() > 1900) {
            setTodaysEntry({
              category: latestEntry.category,
              transcription: latestEntry.transcription || "",
              timestamp: timestamp,
            });
            console.log("✅ Set todaysEntry successfully from todaysEntries");
          } else {
            console.error("Invalid date after parsing:", timestamp);
          }
        } catch (error) {
          console.error("Error parsing date:", error);
        }
      }
    }
    // Fallback: check all entries for today's date
    else if (entries && entries.length > 0) {
      console.log("🏠 Checking all entries for today's entry");
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      const todayStr = today.toISOString().split("T")[0];
      console.log("🏠 Looking for entries on date:", todayStr);

      const todayEntry = entries.find((entry) => {
        if (entry && entry.createdAt) {
          try {
            const entryDate = new Date(entry.createdAt);
            if (!isNaN(entryDate.getTime())) {
              const entryDateStr = entryDate.toISOString().split("T")[0];
              console.log("🏠 Comparing:", entryDateStr, "with", todayStr);
              return entryDateStr === todayStr;
            }
          } catch (e) {
            console.error("Error parsing entry date:", e);
          }
        }
        return false;
      });

      console.log("🏠 Found today's entry from all entries:", todayEntry);

      if (todayEntry && todayEntry.createdAt) {
        try {
          const timestamp = new Date(todayEntry.createdAt);
          if (!isNaN(timestamp.getTime()) && timestamp.getFullYear() > 1900) {
            setTodaysEntry({
              category: todayEntry.category,
              transcription: todayEntry.transcription || "",
              timestamp: timestamp,
            });
            console.log("✅ Set todaysEntry successfully from all entries");
          }
        } catch (error) {
          console.error("Error setting today's entry:", error);
        }
      } else {
        console.log("🏠 No entry found for today");
        setTodaysEntry(null);
      }
    } else {
      console.log("🏠 No entries found at all");
      setTodaysEntry(null);
    }
  }, [todaysEntries, entries]); // Add entries to dependencies

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
      // Call the hook's handleRecordingComplete
      await handleRecordingComplete(audioUri, transcription, category);

      // After successful save, set today's entry
      setTodaysEntry({
        category,
        transcription,
        timestamp: new Date(),
      });

      // Refresh entries to get the latest data
      if (refreshEntries) {
        await refreshEntries();
      }
    } catch (error) {
      console.error("Error in onRecordingComplete:", error);
    }
  };

  // Replace your existing useEffect with this more comprehensive version:
  useEffect(() => {
    console.log("🔍 FULL DEBUG - HomeScreen State:");
    console.log("- entries from hook:", entries);
    console.log("- todaysEntries from hook:", todaysEntries);

    if (entries && entries.length > 0) {
      const today = new Date(); // This will be July 4, 2025
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      console.log("🔍 Today range:", {
        start: todayStart.toISOString(),
        end: todayEnd.toISOString(),
        localDate: today.toLocaleDateString(),
      });

      const foundTodayEntries = entries.filter((entry) => {
        if (entry && entry.created_at) {
          try {
            const entryDate = new Date(entry.created_at);
            const isToday = entryDate >= todayStart && entryDate < todayEnd;
            return isToday;
          } catch (e) {
            console.error("Error parsing entry date:", e);
            return false;
          }
        }
        return false;
      });

      console.log("🔍 Found entries for today:", foundTodayEntries.length);

      if (foundTodayEntries.length > 0) {
        const latestTodayEntry = foundTodayEntries[0];

        setTodaysEntry({
          category: latestTodayEntry.category || "Unknown",
          transcription: latestTodayEntry.transcription || "",
          timestamp: new Date(latestTodayEntry.created_at),
        });
        console.log("✅ Set todaysEntry from entries check");
      } else {
        console.log("❌ No entries found for today");
        setTodaysEntry(null);
      }
    } else {
      console.log("❌ No entries available");
      setTodaysEntry(null);
    }
  }, [entries]);

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
                onAddImagePress={handleAddImage} // <-- Pass this prop!
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
            weeklyStreak={calculateWeeklyStreak()}
            totalEntries={entries?.length || 0}
            isDarkMode={true}
            onShareSuccess={() => {
              Alert.alert("Shared!", "Thanks for spreading positivity!");
            }}
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
        addAnotherActive={!!todaysEntry} // true on completed page, false on record screen
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
        />
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
    </View>
  );
};
