// screens/HomeScreen.tsx
import React, { useEffect, useState, useRef } from "react";
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
import { NotificationModal } from "../components/NotificationModal";
import { StreakDisplay } from "../components/StreakDisplay";
import { SimpleProcessingOverlay } from "../components/SimpleProcessingOverlay";
import { BottomNavigation } from "../components/BottomNavigation";
import { TopNavigationBar } from "../components/TopNavigationBar";
import { CombinedStats } from "../components/CombinedStats";
import { ImageDescriptionModal } from "../components/ImageDescriptionModal";
import { DailyProgressView } from "../components/DailyProgressView";
import { CameraScreen } from "../components/CameraScreen";
import { SocialFeedScreen } from "./SocialFeedScreen";
import { ProfileScreen } from "./ProfileScreen";
import { EnhancedProfileScreen } from "./EnhancedProfileScreen";
import { GroupsScreen } from "./GroupsScreen";
import { EnhancedJournalScreen } from "./EnhancedJournalScreen";
import { InspirationScreen } from "./InspirationScreen";
import { NotificationManagementScreen } from "./NotificationManagementScreen";

// Hooks and utilities
import { getStyles } from "../styles/homeScreenStyles";
import { resizeImage, DEFAULT_IMAGE_OPTIONS } from "../utils/imageUtils";
import { analyzeEntryWithImageAndText } from "../hooks/useHomeScreen";

interface HomeScreenProps {
  user: any;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  console.log("[HomeScreen] render");
  const styles = getStyles(isDarkMode);

  // Add this state to track today's entry
  const [todaysEntry, setTodaysEntry] = useState<any>(null);
  const [isAddingAdditionalEntry, setIsAddingAdditionalEntry] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false); // <-- Add this state
  const [showGroups, setShowGroups] = useState(false);
  const [showJournal, setShowJournal] = useState(false); // <-- Add journal state
  const [showInspiration, setShowInspiration] = useState(false); // <-- Add inspiration state
  const [showNotificationManagement, setShowNotificationManagement] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'journal' | 'groups' | 'inspire'>('home');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [privacyState, setPrivacyState] = useState(false); // Track privacy setting from RecorderSection
  const [userStats, setUserStats] = useState({ totalEntries: 0, currentStreak: 0 });
  const socialFeedRef = useRef<any>(null); // Add ref for social feed
  const [showSocialFeed, setShowSocialFeed] = useState(false); // Optional: control feed modal

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
    showNotification,
    setShowNotification,
    notificationData, // <-- Add this missing destructure!
    setNotificationData,
    processingStage,
    refreshEntries, // <-- make sure you destructure this!
  } = useHomeScreen(user, isDarkMode);

  // Debug: Log what we're getting from the hook
  useEffect(() => {
    console.log("🔍 DEBUG - From useHomeScreen:");
    console.log("- entries:", entries);
    console.log("- todaysEntries:", todaysEntries);
    console.log("- isProcessing:", isProcessing);
    console.log("- showNotification:", showNotification);
    console.log("- notificationData:", notificationData);
    console.log("- processingStage:", processingStage);
  }, [entries, todaysEntries, isProcessing, showNotification, notificationData, processingStage]);

  // Debug notification modal state
  useEffect(() => {
    console.log("🔔 Notification state changed:", {
      showNotification,
      hasNotificationData: !!notificationData,
      notificationDataPreview: notificationData ? {
        hasTranscription: !!notificationData.transcription,
        transcriptionPreview: notificationData.transcription?.substring(0, 50),
        hasAiResponse: !!notificationData.aiResponse,
        aiResponsePreview: notificationData.aiResponse?.substring(0, 50),
        hasId: !!notificationData.id
      } : null
    });
    
    // Check if modal should be rendered
    if (showNotification && notificationData) {
      console.log("🎉 NotificationModal should be rendered with:", {
        transcription: notificationData.transcription,
        aiResponse: notificationData.aiResponse
      });
    }
  }, [showNotification, notificationData]);

  // Always use the most recent entry for today
  useEffect(() => {
    console.log("🔍 todaysEntries changed:", {
      count: todaysEntries?.length || 0,
      entries: todaysEntries,
      isAddingAdditional: isAddingAdditionalEntry
    });
    
    if (todaysEntries && todaysEntries.length > 0 && !isAddingAdditionalEntry) {
      const sorted = [...todaysEntries].sort(
        (a, b) =>
          new Date(b.created_at || b.createdAt).getTime() -
          new Date(a.created_at || a.createdAt).getTime()
      );
      setTodaysEntry(sorted[0]);
      console.log("✅ Updated todaysEntry:", sorted[0]?.id, "- Should show social feed");
    } else if (!isAddingAdditionalEntry) {
      setTodaysEntry(null);
      console.log("❌ No today's entries found - Should show welcome screen");
    }
  }, [todaysEntries, isAddingAdditionalEntry]);

  // Debug useEffect - update this one
  useEffect(() => {
    console.log("🏠 HomeScreen - showSettings:", showSettings);
    console.log("🏠 HomeScreen - todaysEntries:", todaysEntries);
    console.log("🏠 HomeScreen - todaysEntry state:", todaysEntry);
  }, [showSettings, todaysEntries, todaysEntry]);

  // Calculate user stats and first-time status
  useEffect(() => {
    if (entries && Array.isArray(entries)) {
      const totalEntries = entries.length;
      const currentStreak = calculateWeeklyStreak();
      const firstTime = totalEntries === 0;
      
      setUserStats({ totalEntries, currentStreak });
      setIsFirstTime(firstTime);
      
      console.log("📊 User stats updated:", { totalEntries, currentStreak, firstTime });
    }
  }, [entries]);

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
      console.log("🎤 Recording complete, processing...");
      
      // Call the hook's handleRecordingComplete and get the new entry if possible
      const newEntry = await handleRecordingComplete(
        audioUri,
        transcription,
        category
      );

      // If your hook returns the new entry, use it:
      if (newEntry) {
        console.log("✅ New entry received, updating todaysEntry:", newEntry);
        setTodaysEntry(newEntry); // <-- Use the full entry object!
        
        // Also ensure we refresh entries to get the latest state
        if (refreshEntries) {
          console.log("🔄 Refreshing entries list...");
          await refreshEntries();
        }
      } else {
        console.log("⚠️ No entry returned, waiting for useEffect to update");
      }
      // If not, do nothing. The useEffect on entries/todaysEntries will update todaysEntry.
    } catch (error) {
      console.error("Error in onRecordingComplete:", error);
      Alert.alert("Error", "Failed to save your entry. Please try again.");
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

  // Enhanced image submission handler with social feed refresh
  const handleImageSubmit = async (data: {
    description: string;
    imageUri: string;
    audioUri?: string;
    isPrivate?: boolean;
    category?: string;
  }) => {
    try {
      console.log("📷 Processing image submission:", {
        description: data.description.slice(0, 50) + '...',
        imageUri: data.imageUri,
        hasAudio: !!data.audioUri,
        isPrivate: data.isPrivate
      });
      let imageUrl = data.imageUri;
      if (data.imageUri.startsWith("file://")) {
        console.log('🖼️ Processing image for upload...');
        
        // Resize image before upload to reduce file size
        console.log('📏 Resizing image to reduce file size...');
        const resizedImage = await resizeImage(data.imageUri, DEFAULT_IMAGE_OPTIONS);
        console.log('✅ Image resized from', data.imageUri, 'to', resizedImage.uri);
        
        // Upload the resized image using ArrayBuffer
        console.log('🔄 Reading resized image as ArrayBuffer...');
        const response = await fetch(resizedImage.uri);
        console.log('📥 Fetch response status:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('❌ Failed to fetch image:', response.status);
          Alert.alert("Error", `Failed to read image: ${response.status}`);
          return;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const fileName = `image_${Date.now()}.jpg`;
        
        console.log('📁 Resized image details:', {
          fileName,
          size: arrayBuffer.byteLength,
          sizeKB: Math.round(arrayBuffer.byteLength / 1024),
          resizedUri: resizedImage.uri
        });
        
        if (arrayBuffer.byteLength === 0) {
          console.error('❌ Image data is empty!');
          Alert.alert("Error", "Image file is empty");
          return;
        }
        
        console.log('📤 Starting Supabase upload with ArrayBuffer...');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("entry-images")
          .upload(fileName, arrayBuffer, { 
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: false 
          });
        if (uploadError) {
          console.error("❌ Upload failed:", uploadError);
          Alert.alert(
            "Upload Error",
            `Failed to upload image: ${uploadError.message}`
          );
          return;
        }
        
        console.log('✅ File uploaded successfully:', uploadData?.path);
        
        const { data: urlData } = supabase.storage
          .from("entry-images")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
        
        console.log('✅ Public URL generated:', imageUrl);
      }
      let finalDescription = data.description;
      if (data.audioUri) {
        try {
          // Optionally handle audio transcription here
          console.log("Audio URI available:", data.audioUri);
        } catch (error) {
          console.error("Audio processing error:", error);
        }
      }
      
      console.log('🤖 Generating AI analysis for image and text...');
      
      // Generate AI response analyzing both the image and text
      const categoryToUse = data.category || selectedCategory || "Personal Growth";
      const aiResponse = await analyzeEntryWithImageAndText(
        finalDescription,
        imageUrl,
        categoryToUse
      );
      
      console.log('✅ AI analysis complete:', aiResponse.substring(0, 100) + '...');
      
      console.log('💾 Creating database entry with:', {
        user_id: user.id,
        transcription: finalDescription,
        category: categoryToUse,
        image_url: imageUrl,
        ai_response: aiResponse,
      });
      
      const { data: newEntry, error } = await supabase
        .from("daily_entries")
        .insert({
          user_id: user.id,
          transcription: finalDescription,
          category: categoryToUse,
          image_url: imageUrl,
          ai_response: aiResponse,
          is_private: data.isPrivate || false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        console.error("❌ Entry creation failed:", error);
        Alert.alert("Error", `Failed to save entry: ${error.message}`);
        return;
      }
      console.log("✅ Entry created successfully:", newEntry);
      
      // Update todaysEntry immediately with the new entry
      setTodaysEntry(newEntry);
      
      // Then refresh all entries
      await refreshEntries();
      
      // Refresh social feed if visible
      if (showSocialFeed && socialFeedRef.current?.refresh) {
        socialFeedRef.current.refresh();
      }
      console.log('📢 Setting notification data:', {
        transcription: finalDescription.slice(0, 50) + '...',
        aiResponse: aiResponse.slice(0, 100) + '...',
        category: categoryToUse,
      });
      
      setNotificationData({
        transcription: finalDescription,
        aiResponse: aiResponse,
        category: categoryToUse,
      });
      setShowNotification(true);
      setShowImageModal(false);
      setSelectedImage(null);
      
      // Reset isAddingAdditionalEntry so user goes to social feed after notification
      setIsAddingAdditionalEntry(false);
      if (Platform.OS === "ios") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
      // Don't show alert since we have the notification modal
      // Alert.alert("Success!", "Your photo and description have been shared!");
    } catch (error) {
      console.error("Image submission error:", error);
      Alert.alert("Error", "Something went wrong with processing your image. Please try again.");
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  // Enhanced camera photo handler
  const handleCameraPhoto = async (photoUri: string) => {
    try {
      setCapturedPhoto(photoUri);
      setShowCamera(false);
      setSelectedImage(photoUri);
      setShowImageModal(true);
    } catch (error) {
      console.error("Camera photo error:", error);
      Alert.alert("Error", "Failed to process photo. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <TopNavigationBar
        user={user}
        title="Home"
        onProfilePress={() => setShowProfile(true)}
        isDarkMode={isDarkMode}
      />

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {isAddingAdditionalEntry ? (
          /* Show only recording interface when adding additional entry */
          <View style={{ 
            flex: 1,
            backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
            justifyContent: 'center',
            paddingHorizontal: 20
          }}>
            <RecorderSection
              selectedCategory={selectedCategory || categories?.[0] || "Personal Growth"}
              onRecordingComplete={(audioUri, transcription, category) => {
                onRecordingComplete(audioUri, transcription, category);
                setIsAddingAdditionalEntry(false); // Reset after recording
              }}
              isProcessing={isProcessing}
              isDarkMode={isDarkMode}
              categories={categories || []}
              onCategorySelect={handleCategorySelect}
              compact={false} // Use full size for better visibility
              onAddImagePress={handleAddImage}
              onCameraPress={() => setShowCamera(true)}
              isAddingAdditionalEntry={isAddingAdditionalEntry}
              onPrivacyChange={setPrivacyState}
              initialPrivacy={privacyState}
            />
          </View>
        ) : (
          /* Normal view: Social feed with optional recording section at top */
          <>
            {/* Recording Section - Show when no entry today */}
            {!todaysEntry && (
              <View style={{ 
                backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? '#333' : '#e0e0e0'
              }}>
                <RecorderSection
                  selectedCategory={selectedCategory || categories?.[0] || "Personal Growth"}
                  onRecordingComplete={(audioUri, transcription, category) => {
                    onRecordingComplete(audioUri, transcription, category);
                  }}
                  isProcessing={isProcessing}
                  isDarkMode={isDarkMode}
                  categories={categories || []}
                  onCategorySelect={handleCategorySelect}
                  compact={true}
                  onAddImagePress={handleAddImage}
                  onCameraPress={() => setShowCamera(true)}
                  isAddingAdditionalEntry={false}
                  onPrivacyChange={setPrivacyState}
                  initialPrivacy={privacyState}
                />
              </View>
            )}
            
            {/* Social Feed - Takes remaining space */}
            <View style={{ flex: 1 }}>
              <SocialFeedScreen user={user} />
            </View>
          </>
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        onHomePress={() => {
          setCurrentTab('home');
          setIsAddingAdditionalEntry(false);
          
          // Force refresh entries to get latest data
          refreshEntries();
        }}
        onAddAnotherPress={() => {
          setIsAddingAdditionalEntry(true);
        }}
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
        isDarkMode={isDarkMode}
        addAnotherActive={!!todaysEntry && !isAddingAdditionalEntry}
        currentTab={currentTab}
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
          onClose={() => setShowSettings(false)}
          categories={categories}
          onCategoriesUpdate={setCategories}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          user={user}
          onProfilePress={() => setShowProfile(true)}
          onJournalPress={() => setShowJournal(true)}
        />
      )}

      {/* Profile Screen Modal */}
      {showProfile && (
        <Modal visible={showProfile} animationType="slide">
          <EnhancedProfileScreen 
            user={user} 
            onClose={() => {
              setShowProfile(false);
              setCurrentTab('home');
            }}
            isDarkMode={isDarkMode}
            isOwnProfile={true}
            onNavigateToHistory={(entryId?: string) => {
              setShowProfile(false);
              setCurrentTab('journal');
              // Small delay to ensure modal closes before opening journal
              setTimeout(() => {
                setShowJournal(true);
              }, 300);
            }}
            onNavigateToNotificationManagement={() => {
              setShowProfile(false);
              setShowNotificationManagement(true);
            }}
            onLogout={() => {
              setShowProfile(false);
              onLogout();
            }}
          />
        </Modal>
      )}

      {/* Groups Screen Modal */}
      {showGroups && (
        <Modal visible={showGroups} animationType="slide">
          <GroupsScreen 
            user={user} 
            isDarkMode={isDarkMode}
            onBack={() => {
              setShowGroups(false);
              setCurrentTab('home');
            }} 
          />
        </Modal>
      )}

      {/* Enhanced Journal Screen Modal */}
      {showJournal && (
        <Modal visible={showJournal} animationType="slide">
          <EnhancedJournalScreen 
            user={user} 
            isDarkMode={isDarkMode}
            onBack={() => {
              setShowJournal(false);
              setCurrentTab('home');
            }}
            onCreateEntry={() => {
              setShowJournal(false);
              setCurrentTab('home');
              setTodaysEntry(null);
              setIsAddingAdditionalEntry(true);
            }}
          />
        </Modal>
      )}

      {/* Inspiration Screen Modal */}
      {showInspiration && (
        <Modal visible={showInspiration} animationType="slide">
          <InspirationScreen 
            user={user} 
            isDarkMode={isDarkMode}
            onBack={() => {
              setShowInspiration(false);
              setCurrentTab('home');
            }}
            onCreateEntry={() => {
              setShowInspiration(false);
              setCurrentTab('home');
              setTodaysEntry(null);
              setIsAddingAdditionalEntry(true);
            }}
          />
        </Modal>
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
          onClose={() => {
            console.log("🔔 Closing notification modal");
            setShowNotification(false);
          }}
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
            await refreshEntries();
            setShowNotification(false);
          }}
          onSaveEdit={async (newText) => {
            await supabase
              .from("daily_entries")
              .update({ transcription: newText })
              .eq("id", notificationData.id);
            await refreshEntries();
            setShowNotification(false);
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
        <Modal
          visible={showCamera}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <CameraScreen
            onPictureTaken={handleCameraPhoto}
            onClose={() => setShowCamera(false)}
          />
        </Modal>
      )}

      {/* Image Description Modal */}
      {showImageModal && selectedImage && (
        <ImageDescriptionModal
          imageUri={selectedImage}
          onClose={() => {
            setShowImageModal(false);
            setSelectedImage(null);
          }}
          onSubmit={handleImageSubmit}
          isDarkMode={isDarkMode}
          initialPrivacy={privacyState}
          categories={categories}
          selectedCategory={selectedCategory}
        />
      )}

      {/* Notification Management Screen Modal */}
      {showNotificationManagement && (
        <Modal visible={showNotificationManagement} animationType="slide">
          <NotificationManagementScreen
            user={user}
            isDarkMode={isDarkMode}
            onBack={() => setShowNotificationManagement(false)}
          />
        </Modal>
      )}
    </View>
  );
};
