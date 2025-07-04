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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface DailyProgressViewProps {
  todaysEntry: {
    category: string;
    transcription: string;
    timestamp: Date;
  } | null;
  weeklyStreak: number;
  totalEntries: number;
  isDarkMode: boolean;
  onShareSuccess?: () => void;
}

const { width: screenWidth } = Dimensions.get("window");

export const DailyProgressView: React.FC<DailyProgressViewProps> = ({
  todaysEntry,
  weeklyStreak,
  totalEntries,
  isDarkMode,
  onShareSuccess,
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
        const testDate = new Date(todaysEntry.timestamp);
        console.log(
          "📊 Parsed date:",
          testDate,
          "Valid:",
          !isNaN(testDate.getTime())
        );
        if (isNaN(testDate.getTime())) {
          console.error(
            "Invalid timestamp in DailyProgressView:",
            todaysEntry.timestamp
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

  const shareMessage = async (method: "text" | "share") => {
    const message = `Hey! I've been using this app called "What's Going Well" to practice gratitude daily. Today I reflected on ${
      todaysEntry?.category || "life"
    }. 

What's going well in your life today? 🌟`;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (method === "text") {
      // Open SMS app with pre-filled message
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

      {/* Share Section */}
      <View style={styles.shareSection}>
        <Text style={styles.shareTitle}>Spread the Positivity</Text>
        <Text style={styles.shareSubtitle}>
          Invite a friend to reflect on what's going well
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
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
      fontStyle: "italic",
      marginLeft: 12,
    },
  });
