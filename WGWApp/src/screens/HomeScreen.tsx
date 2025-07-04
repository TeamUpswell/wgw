// screens/HomeScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, Text, Platform, ScrollView, StatusBar as RNStatusBar } from "react-native"; // Add Platform here
import * as Haptics from "expo-haptics";
import { useHomeScreen } from "../hooks/useHomeScreen";
import { SettingsScreen } from "./SettingsScreen";
import { SafeAreaView } from "react-native-safe-area-context";

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
    hasCompletedToday,
    nextEntryTime,
    // Functions
    handleRecordingComplete,
    handleCategorySelect,
    handleScrollEnd,
    hasWeeklyEntry,
    getTodaysCategory,
    refreshEntries,
    // Other state
    notificationData,
    showNotification,
    setShowNotification,
    processingStage,
  } = useHomeScreen(user, isDarkMode);

  // Debug useEffect
  useEffect(() => {
    console.log("🏠 HomeScreen - showSettings:", showSettings);
  }, [showSettings]);

  // StatusBar configuration
  useEffect(() => {
    RNStatusBar.setBarStyle("light-content", true);
    if (Platform.OS === "android") {
      RNStatusBar.setBackgroundColor("#000000");
    }
  }, []);

  // Handlers
  const onEntryPress = (entry: any) => {
    console.log("Entry pressed:", entry.id);
  };

  const onEntryDeleted = (entryId: number) => {
    console.log("Entry deleted:", entryId);
  };

  const [isActiveRecording, setIsActiveRecording] = useState(false);

  const handleRecordPress = () => {
    if (isActiveRecording) {
      setIsActiveRecording(false);
    } else {
      setIsActiveRecording(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#000000" }}
        edges={["top"]}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5" },
          ]}
        >
          {/* Fixed Top Black Section - no additional SafeAreaView needed */}
          <View style={styles.topBlackSection}>
            <View style={styles.recorderInBlackSection}>
              <RecorderSection
                selectedCategory={
                  selectedCategory || getTodaysCategory(categories)
                }
                onRecordingComplete={handleRecordingComplete}
                isProcessing={isProcessing}
                isDarkMode={true}
                categories={categories || []}
                onCategorySelect={handleCategorySelect}
                compact={true}
                showCompletion={hasCompletedToday}
                nextEntryTime={nextEntryTime}
              />
            </View>
          </View>

          {/* Full Width Divider/Break */}
          <View style={styles.sectionDivider} />

          {/* Scrollable Content Below */}
          <ScrollView
            style={[
              styles.scrollContent,
              { backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5" },
            ]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Lower White/Gray Section */}
            <View style={styles.lowerSection}>
              {/* Encouragement Message */}
              <View style={styles.cardWrapper}>
                <EncouragementMessage
                  todaysEntryCount={todaysEntries?.length || 0}
                  isDarkMode={isDarkMode}
                />
              </View>

              {/* This Week Stats */}
              <View style={styles.cardWrapper}>
                <CombinedStats
                  entries={entries || []}
                  categories={categories || []}
                  isDarkMode={isDarkMode}
                  todaysEntryCount={todaysEntries?.length || 0}
                />
              </View>

              {/* Add any other scrollable content here */}
            </View>
          </ScrollView>

          {/* Bottom Navigation - Also fixed */}
          <BottomNavigation
            onRecordPress={handleRecordPress}
            onHistoryPress={() => setShowHistory(true)}
            onSettingsPress={() => setShowSettings(true)}
            isDarkMode={isDarkMode}
            isRecording={isActiveRecording}
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
        </View>
      </SafeAreaView>
    </View>
  );
};
