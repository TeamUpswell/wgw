import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Share,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";

interface HistoryScreenProps {
  user: any;
  onBack: () => void;
  isDarkMode?: boolean;
}

interface DailyEntry {
  id: number;
  created_at: string;
  category: string;
  transcription: string;
  ai_response?: string;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  user,
  onBack,
  isDarkMode = false,
}) => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadEntries();
    }
  }, [user?.id]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (entry: DailyEntry) => {
    try {
      const shareMessage = `${entry.category}\n\n"${entry.transcription}"\n\n${
        entry.ai_response || ""
      }\n\nShared from Going Well`;

      await Share.share({
        message: shareMessage,
        title: "Going Well Entry",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleOptions = (entry: DailyEntry) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Edit", "Delete"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEdit(entry);
          } else if (buttonIndex === 2) {
            handleDelete(entry);
          }
        }
      );
    } else {
      // For Android, use Alert
      Alert.alert(
        "Options",
        "",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Edit", onPress: () => handleEdit(entry) },
          {
            text: "Delete",
            onPress: () => handleDelete(entry),
            style: "destructive",
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleEdit = (entry: DailyEntry) => {
    Alert.alert("Edit Entry", "Edit functionality coming soon!");
  };

  const handleDelete = (entry: DailyEntry) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("daily_entries")
                .delete()
                .eq("id", entry.id);

              if (error) throw error;

              // Refresh entries
              loadEntries();
            } catch (error) {
              console.error("Error deleting entry:", error);
              Alert.alert("Error", "Failed to delete entry");
            }
          },
        },
      ]
    );
  };

  const styles = getStyles(isDarkMode);

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onBack}
    >
      <SafeAreaView style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              console.log("🔙 Back button pressed");
              onBack();
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? "#fff" : "#333"}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading entries...</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="time-outline"
                size={64}
                color={isDarkMode ? "#666" : "#ccc"}
              />
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>
                Start recording to see your history
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryHeaderLeft}>
                    <Text style={styles.entryCategory}>{entry.category}</Text>
                    <Text style={styles.entryDate}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleShare(entry)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="share-outline"
                        size={20}
                        color={isDarkMode ? "#aaa" : "#666"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleOptions(entry)}
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
                <Text style={styles.entryTranscription}>
                  {entry.transcription}
                </Text>
                {entry.ai_response && (
                  <Text style={styles.entryResponse}>{entry.ai_response}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#333",
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    loadingText: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#666",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#aaa" : "#666",
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: isDarkMode ? "#888" : "#999",
      marginTop: 8,
    },
    entryCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    entryHeaderLeft: {
      flex: 1,
    },
    entryActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    },
    entryCategory: {
      fontSize: 14,
      fontWeight: "600",
      color: "#8BC34A",
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0fff0",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    entryDate: {
      fontSize: 12,
      color: isDarkMode ? "#888" : "#666",
    },
    entryTranscription: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      lineHeight: 22,
      marginBottom: 8,
    },
    entryResponse: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#555",
      lineHeight: 20,
      fontStyle: "italic",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
  });
