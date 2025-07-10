import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Share,
  Alert,
  Animated,
  Linking,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { supabase } from "../config/supabase";
import { ShareTemplateModal } from "./ShareTemplateModal";

interface DailyProgressViewProps {
  todaysEntry: {
    category: string;
    transcription: string;
    created_at: string; // <-- use string, not Date
    favorite?: boolean;
  } | null;
  weeklyStreak: number;
  totalEntries: number;
  isDarkMode: boolean;
  onShareSuccess?: () => void;
  onEdit?: () => void;
  onToggleFavorite?: () => void;
  onSaveEdit?: (newText: string) => Promise<void>;
}

const { width: screenWidth } = Dimensions.get("window");

export const DailyProgressView: React.FC<DailyProgressViewProps> = ({
  todaysEntry,
  weeklyStreak,
  totalEntries,
  isDarkMode,
  onShareSuccess,
  onEdit,
  onToggleFavorite,
  onSaveEdit, // <-- Add this
}) => {
  console.log("📊 DailyProgressView received props:", {
    todaysEntry,
    weeklyStreak,
    totalEntries,
    isDarkMode,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Add safety check for the timestamp
  useEffect(() => {
    console.log("📊 DailyProgressView timestamp check:", {
      hasEntry: !!todaysEntry,
      hasTimestamp: !!todaysEntry?.timestamp,
      timestamp: todaysEntry?.timestamp,
      type: typeof todaysEntry?.timestamp,
    });

    if (todaysEntry?.timestamp) {
      try {
        // Verify the timestamp is valid
        const testDate = new Date(todaysEntry.created_at);
        console.log(
          "📊 Parsed date:",
          testDate,
          "Valid:",
          !isNaN(testDate.getTime())
        );
        if (isNaN(testDate.getTime())) {
          console.error(
            "Invalid timestamp in DailyProgressView:",
            todaysEntry.created_at
          );
        }
      } catch (error) {
        console.error("Error checking timestamp:", error);
      }
    }
  }, [todaysEntry]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shareMessage = async (method: "text" | "share", templateIdx = 0) => {
    const message = shareTemplates[templateIdx](todaysEntry);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (method === "text") {
      const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(smsUrl);

      if (supported) {
        await Linking.openURL(smsUrl);
        onShareSuccess?.();
      } else {
        Alert.alert("Cannot open Messages", "Unable to open the Messages app");
      }
    } else {
      try {
        const result = await Share.share({
          message,
          title: "What's Going Well?",
        });
        if (result.action === Share.sharedAction) {
          onShareSuccess?.();
        }
      } catch (error) {
        Alert.alert("Error", "Failed to share");
      }
    }
  };

  const styles = getStyles(isDarkMode);

  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    todaysEntry?.transcription || ""
  );
  const [saving, setSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  useEffect(() => {
    setEditedText(todaysEntry?.transcription || "");
    setEditing(false);
  }, [todaysEntry?.transcription]);

  const handleSaveEditTodaysEntry = async (newText: string) => {
    if (!todaysEntry) return;
    await supabase
      .from("daily_entries")
      .update({ transcription: newText })
      .eq("id", todaysEntry.id);
    await new Promise((res) => setTimeout(res, 300)); // Add a short delay
    await refreshEntries();
  };

  if (!todaysEntry) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Success Message */}
      <View style={styles.successSection}>
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={60} color="#8BC34A" />
        </View>
        <Text style={styles.successTitle}>Today's Reflection Complete!</Text>
        <Text style={styles.successSubtitle}>
          You focused on: {todaysEntry.category}
        </Text>
      </View>

      {/* Progress Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{weeklyStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
          <View style={styles.streakDots}>
            {[...Array(7)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  i < weeklyStreak && styles.streakDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalEntries}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
          <Text style={styles.statEmoji}>🎯</Text>
        </View>
      </View>

      {/* What you said */}
      <View
        style={{
          backgroundColor: isDarkMode ? "#222" : "#f4f4f4",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            color: isDarkMode ? "#fff" : "#333",
            marginBottom: 6,
          }}
        >
          This is going well:
        </Text>
        {editing ? (
          <>
            <TextInput
              style={{
                color: isDarkMode ? "#fff" : "#333",
                fontSize: 16,
                backgroundColor: isDarkMode ? "#333" : "#fff",
                borderRadius: 6,
                padding: 8,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#ccc",
              }}
              value={editedText}
              onChangeText={setEditedText}
              multiline
              editable={!saving}
            />
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              <TouchableOpacity
                onPress={async () => {
                  if (onSaveEdit) {
                    setSaving(true);
                    try {
                      await onSaveEdit(editedText);
                      setEditing(false);
                    } catch (e) {
                      console.error("Save error:", e); // <-- Add this line
                      Alert.alert("Error", "Could not save changes.");
                    } finally {
                      setSaving(false);
                    }
                  }
                }}
                style={{ marginRight: 16 }}
                disabled={saving}
              >
                <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditing(false);
                  setEditedText(todaysEntry?.transcription || "");
                }}
              >
                <Text style={{ color: "#aaa" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={{ color: isDarkMode ? "#fff" : "#333", fontSize: 16 }}>
            {todaysEntry.transcription}
          </Text>
        )}
        {/* Action Buttons */}
        <View style={{ flexDirection: "row", marginTop: 12 }}>
          {!editing && onEdit && (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={{ marginRight: 24 }}
            >
              <Ionicons name="create-outline" size={22} color="#007AFF" />
            </TouchableOpacity>
          )}
          {onToggleFavorite && (
            <TouchableOpacity
              onPress={onToggleFavorite}
              style={{ marginRight: 24 }}
              accessibilityLabel={
                todaysEntry.favorite
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              accessibilityRole="button"
            >
              <Ionicons
                name={todaysEntry.favorite ? "star" : "star-outline"}
                size={22}
                color={todaysEntry.favorite ? "#FFD700" : "#aaa"}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowShareModal(true)}>
            <Ionicons name="share-social" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Share Section */}
      <View style={styles.shareSection}>
        <Text style={styles.shareTitle}>What's going well for others?</Text>
        <Text style={styles.shareSubtitle}>
          Ask a friend what's going well
        </Text>

        <View style={styles.shareButtons}>
          <TouchableOpacity
            style={[styles.shareButton, styles.textButton]}
            onPress={() => shareMessage("text")}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Send Text</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, styles.otherButton]}
            onPress={() => shareMessage("share")}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Quote or Tip */}
      <View style={styles.tipSection}>
        <Ionicons name="bulb" size={20} color="#FFD700" />
        <Text style={styles.tipText}>
          Sharing gratitude multiplies its positive effects!
        </Text>
      </View>

      {/* Share Templates Modal */}
      {showShareModal && (
        <ShareTemplateModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShare={async () => {
            await shareMessage("share", selectedTemplate);
            setShowShareModal(false);
          }}
          templates={shareTemplates}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          entry={todaysEntry}
          isDarkMode={isDarkMode}
        />
      )}
    </Animated.View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    successSection: {
      alignItems: "center",
      marginBottom: 30,
    },
    checkmarkContainer: {
      marginBottom: 15,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 8,
    },
    successSubtitle: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#666",
    },
    statsContainer: {
      flexDirection: "row",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
      borderRadius: 16,
      padding: 20,
      marginBottom: 25,
      alignItems: "center",
      justifyContent: "space-around",
    },
    statBox: {
      alignItems: "center",
      flex: 1,
    },
    statNumber: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#FF6B35",
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      marginBottom: 10,
    },
    statEmoji: {
      fontSize: 24,
    },
    streakDots: {
      flexDirection: "row",
      marginTop: 5,
    },
    streakDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDarkMode ? "#444" : "#ddd",
      marginHorizontal: 2,
    },
    streakDotActive: {
      backgroundColor: "#8BC34A",
    },
    statDivider: {
      width: 1,
      height: 50,
      backgroundColor: isDarkMode ? "#444" : "#ddd",
      marginHorizontal: 20,
    },
    shareSection: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
    },
    shareTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 8,
      textAlign: "center",
    },
    shareSubtitle: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      marginBottom: 20,
      textAlign: "center",
    },
    shareButtons: {
      flexDirection: "row",
      justifyContent: "center",
    },
    shareButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 6,
    },
    textButton: {
      backgroundColor: "#25D366",
    },
    otherButton: {
      backgroundColor: "#FF6B35",
    },
    shareButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    tipSection: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#FFF9E6",
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      fontStyle: "italic",
      marginLeft: 12,
    },
  });

const shareTemplates = [
  // Just the question
  (entry: any) =>
    `What's going well for you today?`,

  // Simple and warm - universally approachable
  (entry: any) =>
    `${entry.transcription}\n\nWhat's been good in your corner of the world?`,

  // Lead with them - casual and conversational
  (entry: any) =>
    `What's going well for you today? For me, it's:\n"${entry.transcription}"`,

  // Personal connection - makes it meaningful
  (entry: any) =>
    `I thought of you as I reflected on what's going well today:\n"${entry.transcription}"\n\nHope you're finding good moments too.`,

  // Simple and warm - universally approachable
  (entry: any) =>
    `Something brightened my day today:\n"${entry.transcription}"\n\nWhat's been good in your corner of the world?`,

];
