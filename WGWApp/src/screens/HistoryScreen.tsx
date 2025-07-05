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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import { AIService } from "../services/ai";

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

  // Recap state
  const [recapModalVisible, setRecapModalVisible] = useState(false);
  const [recapType, setRecapType] = useState<"weekly" | "monthly" | null>(null);
  const [recapContent, setRecapContent] = useState<string | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);

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

  // Helper to filter entries for the period
  function getEntriesForPeriod(type: "weekly" | "monthly") {
    const now = new Date();
    let start: Date;
    if (type === "weekly") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return entries.filter((e) => new Date(e.created_at) >= start);
  }

  // Mock AI Recap function (replace with real AI call)
  async function getAIRecap(
    entries: DailyEntry[],
    type: "weekly" | "monthly"
  ) {
    if (!user?.id) return "No user found.";

    // Calculate period
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;
    if (type === "weekly") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Check for existing recap in DB
    const { data: existing, error } = await supabase
      .from("recaps")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type)
      .eq("period_start", periodStart.toISOString().split("T")[0])
      .eq("period_end", periodEnd.toISOString().split("T")[0])
      .single();

    if (existing && existing.content) {
      return existing.content;
    }

    // 2. Generate with AI
    const aiRecap = await AIService.generateRecap(entries, type);

    // 3. Store in DB
    await supabase.from("recaps").insert([{
      user_id: user.id,
      type,
      period_start: periodStart.toISOString().split("T")[0],
      period_end: periodEnd.toISOString().split("T")[0],
      content: aiRecap,
      analysis_data: null,
    }]);

    return aiRecap;
  }

  const handleRecap = async (type: "weekly" | "monthly") => {
    setRecapType(type);
    setRecapLoading(true);
    setRecapModalVisible(true);
    const periodEntries = getEntriesForPeriod(type);
    const recap = await getAIRecap(periodEntries, type);
    setRecapContent(recap);
    setRecapLoading(false);
  };

  const handleShareRecap = async () => {
    if (!recapContent) return;
    try {
      await Share.share({
        message: `${recapType === "weekly" ? "Weekly" : "Monthly"} Recap\n\n${recapContent}\n\nShared from Going Well`,
        title: "Going Well Recap",
      });
    } catch (error) {
      Alert.alert("Error", "Could not share recap.");
    }
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
            onPress={onBack}
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

        {/* Recap Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 16,
            marginTop: 32, // <-- Add this line for more space above
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#FF6B35",
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 20,
              marginRight: 8,
            }}
            onPress={() => handleRecap("weekly")}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Weekly Recap
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: "#FF6B35",
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 20,
            }}
            onPress={() => handleRecap("monthly")}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Monthly Recap
            </Text>
          </TouchableOpacity>
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

        {/* Recap Modal */}
        <Modal
          visible={recapModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setRecapModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: isDarkMode ? "#222" : "#fff",
                borderRadius: 20,
                padding: 24,
                width: "85%",
                maxHeight: "80%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 12,
                  color: isDarkMode ? "#fff" : "#333",
                }}
              >
                {recapType === "weekly" ? "Weekly Recap" : "Monthly Recap"}
              </Text>
              {recapLoading ? (
                <ActivityIndicator size="large" color="#FF6B35" />
              ) : (
                <ScrollView style={{ maxHeight: 300 }}>
                  <Text
                    style={{
                      color: isDarkMode ? "#fff" : "#333",
                      fontSize: 16,
                    }}
                  >
                    {recapContent}
                  </Text>
                </ScrollView>
              )}
              <View style={{ flexDirection: "row", marginTop: 20 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#FF6B35",
                    borderRadius: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    marginRight: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={handleShareRecap}
                >
                  <Ionicons
                    name="send-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Export</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#888",
                    borderRadius: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                  }}
                  onPress={() => setRecapModalVisible(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
