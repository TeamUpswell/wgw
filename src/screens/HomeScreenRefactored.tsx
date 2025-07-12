// This is an example of how to refactor HomeScreen to use the new context system
import React, { useState, useRef } from "react";
import { View, Modal, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

// Context hooks
import { useApp, useTheme, useError, useLoading } from "../contexts/AppContext";
import { useHomeScreen } from "../hooks/useHomeScreen";

// Components
import { WelcomeScreen } from "../components/WelcomeScreen";
import { SocialFeedScreen } from "./SocialFeedScreen";
import { BottomNavigation } from "../components/BottomNavigation";
import { TopNavigationBar } from "../components/TopNavigationBar";
import { CelebrationView } from "../components/CelebrationView";
import { NotificationModal } from "../components/NotificationModal";
import { SimpleProcessingOverlay } from "../components/SimpleProcessingOverlay";
import { ImageDescriptionModal } from "../components/ImageDescriptionModal";
import { CameraScreen } from "../components/CameraScreen";

// Import other screens
import { SettingsScreen } from "./SettingsScreen";
import { EnhancedProfileScreen } from "./EnhancedProfileScreen";
import { GroupsScreen } from "./GroupsScreen";
import { EnhancedJournalScreen } from "./EnhancedJournalScreen";
import { InspirationScreen } from "./InspirationScreen";
import { NotificationManagementScreen } from "./NotificationManagementScreen";

// Utils
import { resizeImage, DEFAULT_IMAGE_OPTIONS } from "../utils/imageUtils";
import { analyzeEntryWithImageAndText } from "../hooks/useHomeScreen";
import { supabase } from "../config/supabase";

interface HomeScreenRefactoredProps {
  onLogout: () => void;
}

export const HomeScreenRefactored: React.FC<HomeScreenRefactoredProps> = ({ onLogout }) => {
  // Use contexts instead of props
  const { user } = useApp();
  const { isDarkMode, toggleTheme } = useTheme();
  const { handleError } = useError();
  const { withLoading, isLoading } = useLoading();

  // Local state
  const [todaysEntry, setTodaysEntry] = useState<any>(null);
  const [isAddingAdditionalEntry, setIsAddingAdditionalEntry] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showInspiration, setShowInspiration] = useState(false);
  const [showNotificationManagement, setShowNotificationManagement] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'journal' | 'groups' | 'inspire'>('home');
  const [privacyState, setPrivacyState] = useState(false);

  // Use the homeScreen hook with error handling
  const {
    categories,
    setCategories,
    selectedCategory,
    showSettings,
    setShowSettings,
    showCelebration,
    setShowCelebration,
    entries,
    todaysEntries,
    streak,
    handleRecordingComplete,
    handleCategorySelect,
    showNotification,
    setShowNotification,
    notificationData,
    setNotificationData,
    processingStage,
    refreshEntries,
  } = useHomeScreen(user, isDarkMode);

  // Calculate user stats
  const userStats = React.useMemo(() => ({
    totalEntries: entries?.length || 0,
    currentStreak: calculateWeeklyStreak(entries),
  }), [entries]);

  // Wrap async operations with error handling
  const onRecordingComplete = async (audioUri: string, transcription: string, category: string) => {
    try {
      await withLoading('recording', async () => {
        const newEntry = await handleRecordingComplete(audioUri, transcription, category);
        if (newEntry) {
          setTodaysEntry(newEntry);
          await refreshEntries();
        }
      });
    } catch (error) {
      handleError(error, 'Recording');
    }
  };

  const handleAddImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets?.[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowImageModal(true);
      }
    } catch (error) {
      handleError(error, 'Image Selection');
    }
  };

  const handleImageSubmit = async (data: any) => {
    await withLoading('imageSubmit', async () => {
      try {
        // Image processing logic here (simplified)
        const newEntry = await createImageEntry(data);
        setTodaysEntry(newEntry);
        await refreshEntries();
        
        setNotificationData({
          transcription: data.description,
          aiResponse: newEntry.ai_response,
          category: data.category,
        });
        setShowNotification(true);
        setShowImageModal(false);
        setSelectedImage(null);
        setIsAddingAdditionalEntry(false);
        
        if (Platform.OS === "ios") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        handleError(error, 'Image Submission');
        throw error;
      }
    });
  };

  // Simplified render without theme prop drilling
  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }}>
      <TopNavigationBar
        user={user}
        title="Home"
        onProfilePress={() => setShowProfile(true)}
        // isDarkMode is accessed via context in TopNavigationBar
      />

      <View style={{ flex: 1 }}>
        {renderMainContent()}
      </View>

      <BottomNavigation
        onHomePress={() => {
          setCurrentTab('home');
          setIsAddingAdditionalEntry(false);
          refreshEntries();
        }}
        onAddAnotherPress={() => setIsAddingAdditionalEntry(true)}
        onJournalPress={() => {
          setCurrentTab('journal');
          setShowJournal(true);
        }}
        onGroupsPress={() => {
          setCurrentTab('groups');
          setShowGroups(true);
        }}
        onInspirePress={() => {
          setCurrentTab('inspire');
          setShowInspiration(true);
        }}
        addAnotherActive={!!todaysEntry && !isAddingAdditionalEntry}
        currentTab={currentTab}
      />

      {/* Modals and overlays */}
      {renderModals()}
    </View>
  );

  // Helper functions
  function calculateWeeklyStreak(entries: any[]): number {
    // Implementation here
    return 0;
  }

  function createImageEntry(data: any): Promise<any> {
    // Implementation here
    return Promise.resolve({});
  }

  function renderMainContent() {
    if (isAddingAdditionalEntry || !todaysEntry) {
      return (
        <WelcomeScreen
          user={user}
          categories={categories || []}
          selectedCategory={selectedCategory || categories?.[0] || "Personal Growth"}
          onCategorySelect={handleCategorySelect}
          onRecordingComplete={onRecordingComplete}
          onAddImagePress={handleAddImage}
          onCameraPress={() => setShowCamera(true)}
          isProcessing={isLoading('recording')}
          isFirstTime={userStats.totalEntries === 0}
          isAddingAdditionalEntry={isAddingAdditionalEntry}
          totalEntries={userStats.totalEntries}
          currentStreak={userStats.currentStreak}
          onPrivacyChange={setPrivacyState}
          initialPrivacy={privacyState}
        />
      );
    }

    return <SocialFeedScreen user={user} />;
  }

  function renderModals() {
    return (
      <>
        {isLoading('recording') && (
          <SimpleProcessingOverlay stage={processingStage} />
        )}

        {/* Other modals... */}
      </>
    );
  }
};