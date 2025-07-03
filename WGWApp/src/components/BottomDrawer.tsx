import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.6;

interface BottomDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onViewHistory: () => void;
  onSettings: () => void;
  onAddEntry: () => void;
  isDarkMode?: boolean;
  streak?: any;
  todaysEntryCount: number;
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  isVisible,
  onClose,
  onViewHistory,
  onSettings,
  onAddEntry,
  isDarkMode = false,
  streak,
  todaysEntryCount,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DRAWER_HEIGHT, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  const styles = getStyles(isDarkMode);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View style={[styles.drawer, { transform: [{ translateY }] }]}>
          <TouchableOpacity onPress={onClose} style={styles.handleContainer}>
            <View style={styles.handle} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Quick Actions</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDarkMode ? "#fff" : "#666"}
                />
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {streak?.current_streak || 0}
                </Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{todaysEntryCount}</Text>
                <Text style={styles.statLabel}>Today's Entries</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {streak?.longest_streak || 0}
                </Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {/* Primary Action - Add Entry with Mic Icon */}
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={onAddEntry}
              >
                <Ionicons
                  name="mic"
                  size={28}
                  color="#fff"
                  style={styles.actionIcon}
                />
                <Text style={styles.primaryActionText}>Add Entry</Text>
              </TouchableOpacity>

              {/* Secondary Actions */}
              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={onViewHistory}
                >
                  <Ionicons name="time" size={24} color="#8BC34A" />
                  <Text style={styles.secondaryActionText}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={onSettings}
                >
                  <Ionicons name="settings" size={24} color="#8BC34A" />
                  <Text style={styles.secondaryActionText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quote */}
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>
                "What you appreciate, appreciates"
              </Text>
              <Text style={styles.quoteAuthor}>- Lynne Twist</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Updated styles without recordEntry styles
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#000",
    },
    drawer: {
      height: DRAWER_HEIGHT,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 40,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 20,
    },
    handleContainer: {
      paddingVertical: 15,
      alignItems: "center",
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: isDarkMode ? "#555" : "#ddd",
      borderRadius: 2,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: isDarkMode ? "#fff" : "#2c3e50",
    },
    closeButton: {
      padding: 10,
      borderRadius: 20,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 25,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      padding: 15,
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0f8f0",
      borderRadius: 16,
      marginHorizontal: 4,
      borderWidth: 2,
      borderColor: "#8BC34A",
    },
    statNumber: {
      fontSize: 26,
      fontWeight: "900",
      color: "#8BC34A",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDarkMode ? "#aaa" : "#666",
      fontWeight: "600",
      textAlign: "center",
    },
    actions: {
      marginBottom: 25,
    },
    primaryAction: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#8BC34A",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      shadowColor: "#8BC34A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    actionIcon: {
      marginRight: 10,
    },
    primaryActionText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
    },
    secondaryActions: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    secondaryAction: {
      alignItems: "center",
      padding: 16,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f9fa",
      borderRadius: 16,
      minWidth: 120,
      borderWidth: 2,
      borderColor: isDarkMode ? "#4a4a4a" : "#e8e8e8",
    },
    secondaryActionText: {
      color: "#8BC34A",
      fontSize: 14,
      fontWeight: "700",
      marginTop: 8,
    },
    quoteContainer: {
      alignItems: "center",
      padding: 16,
      backgroundColor: isDarkMode ? "#1a3a1a" : "#f0f8f0",
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#8BC34A",
      marginBottom: 20,
    },
    quoteText: {
      fontSize: 15,
      fontStyle: "italic",
      color: "#8BC34A",
      textAlign: "center",
      marginBottom: 6,
      fontWeight: "600",
    },
    quoteAuthor: {
      fontSize: 12,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
      fontWeight: "500",
    },
  });
