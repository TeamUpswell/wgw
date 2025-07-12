// Components/TodaysEntries.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DailyEntry } from "../types";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

interface TodaysEntriesProps {
  entries: DailyEntry[];
  isDarkMode: boolean;
  onEntryPress?: (entry: DailyEntry) => void;
  onEntryDeleted?: (entryId: string) => void;
}

export const TodaysEntries: React.FC<TodaysEntriesProps> = ({
  entries,
  isDarkMode,
  onEntryPress,
  onEntryDeleted,
}) => {
  const styles = getStyles(isDarkMode);

  const handleShare = async (entry: DailyEntry) => {
    try {
      // Add haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const shareContent = `🌟 What's Going Well Today

"${entry.transcription}"

💭 ${entry.ai_response}

#GoingWell #Gratitude #Mindfulness`;

      const result = await Share.share({
        message: shareContent,
        title: "My Daily Reflection",
      });

      if (result.action === Share.sharedAction) {
        console.log("✅ Entry shared successfully");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("❌ Error sharing entry:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Unable to share entry. Please try again.");
    }
  };

  const handleShareWithOptions = async (entry: DailyEntry) => {
    Alert.alert("Share Entry", "How would you like to share this reflection?", [
      {
        text: "Share Text Only",
        onPress: () => shareText(entry),
      },
      {
        text: "Share with Insight",
        onPress: () => shareWithInsight(entry),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const shareText = async (entry: DailyEntry) => {
    const shareContent = `🌟 "${entry.transcription}"\n\n#GoingWell #Gratitude`;
    await Share.share({ message: shareContent });
  };

  const shareWithInsight = async (entry: DailyEntry) => {
    const shareContent = `🌟 What's Going Well Today\n\n"${entry.transcription}"\n\n💭 ${entry.ai_response}\n\n#GoingWell #Gratitude`;
    await Share.share({ message: shareContent });
  };

  // Replace MenuView with Alert-based menu
  const handleEntryOptions = (entry: DailyEntry) => {
    Alert.alert(
      "Entry Options",
      "What would you like to do with this reflection?",
      [
        {
          text: "📝 Edit Entry",
          onPress: () => editEntry(entry),
        },
        {
          text: "📋 Copy Text",
          onPress: () => copyEntryText(entry),
        },
        {
          text: "❤️ Add to Favorites",
          onPress: () => toggleFavorite(entry),
        },
        {
          text: "🗑️ Delete Entry",
          onPress: () => confirmDelete(entry),
          style: "destructive",
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const editEntry = (entry: DailyEntry) => {
    console.log("Edit entry:", entry.id);
    // TODO: Navigate to edit screen or show edit modal
    Alert.alert("Edit Entry", "Edit functionality coming soon!");
  };

  const copyEntryText = async (entry: DailyEntry) => {
    try {
      const textToCopy = `${entry.transcription}\n\n${entry.ai_response}`;
      await Clipboard.setStringAsync(textToCopy);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Copied!", "Entry text copied to clipboard");
    } catch (error) {
      console.error("Error copying text:", error);
      Alert.alert("Error", "Failed to copy text. Please try again.");
    }
  };

  const toggleFavorite = async (entry: DailyEntry) => {
    try {
      // TODO: Add to favorites logic when supabase is available
      console.log("Toggle favorite for entry:", entry.id);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert("Favorited!", "Entry added to favorites");
    } catch (error) {
      console.error("Error favoriting entry:", error);
      Alert.alert("Error", "Failed to favorite entry. Please try again.");
    }
  };

  const confirmDelete = (entry: DailyEntry) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this reflection? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteEntry(entry),
        },
      ]
    );
  };

  const deleteEntry = async (entry: DailyEntry) => {
    try {
      // TODO: Add actual delete logic when supabase is available
      console.log("Delete entry:", entry.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onEntryDeleted?.(entry.id);
      Alert.alert("Deleted", "Entry has been deleted successfully");
    } catch (error) {
      console.error("Error deleting entry:", error);
      Alert.alert("Error", "Failed to delete entry. Please try again.");
    }
  };

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sunny-outline" size={48} color="#8BC34A" />
        <Text style={styles.emptyText}>No entries today yet</Text>
        <Text style={styles.emptySubtext}>Tap the mic to get started!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Reflections</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {entries.map((entry, index) => (
          <View key={entry.id || index} style={styles.entryCard}>
            {/* Entry Header */}
            <View style={styles.entryHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{entry.category}</Text>
              </View>

              <View style={styles.entryActions}>
                {/* Share Button */}
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShareWithOptions(entry)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-outline" size={20} color="#8BC34A" />
                </TouchableOpacity>

                {/* More Options Button - Replace MenuView with TouchableOpacity */}
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => handleEntryOptions(entry)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={isDarkMode ? "#aaa" : "#666"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Entry Content */}
            <TouchableOpacity
              style={styles.entryContent}
              onPress={() => onEntryPress?.(entry)}
              activeOpacity={0.8}
            >
              {/* Transcription */}
              <View style={styles.transcriptionContainer}>
                <Text style={styles.transcription}>
                  "{entry.transcription}"
                </Text>
              </View>

              {/* AI Response */}
              {entry.ai_response && (
                <View style={styles.aiResponseContainer}>
                  <View style={styles.aiResponseHeader}>
                    <Ionicons name="sparkles" size={16} color="#8BC34A" />
                    <Text style={styles.aiResponseLabel}>Insight</Text>
                  </View>
                  <Text style={styles.aiResponse}>{entry.ai_response}</Text>
                </View>
              )}

              {/* Timestamp */}
              <Text style={styles.timestamp}>
                {new Date(entry.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginBottom: 16,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    entryCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingBottom: 12,
    },
    categoryBadge: {
      backgroundColor: "#8BC34A",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    categoryText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    entryActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    shareButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0f8f0",
      borderWidth: 1,
      borderColor: "#8BC34A",
    },
    moreButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f9fa",
    },
    entryContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    transcriptionContainer: {
      marginBottom: 12,
    },
    transcription: {
      fontSize: 16,
      lineHeight: 22,
      color: isDarkMode ? "#fff" : "#2c3e50",
      fontStyle: "italic",
    },
    aiResponseContainer: {
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0f8f0",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#8BC34A",
    },
    aiResponseHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    aiResponseLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#8BC34A",
      marginLeft: 4,
    },
    aiResponse: {
      fontSize: 14,
      lineHeight: 20,
      color: isDarkMode ? "#ccc" : "#555",
    },
    timestamp: {
      fontSize: 12,
      color: isDarkMode ? "#aaa" : "#888",
      textAlign: "right",
      fontWeight: "500",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#2c3e50",
      marginTop: 16,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      marginTop: 8,
      textAlign: "center",
    },
  });
