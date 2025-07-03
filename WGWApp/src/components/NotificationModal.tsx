import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  transcription?: string; // Add this prop
  message: string;
  type: "success" | "error" | "warning"; // Updated type
  isDarkMode: boolean;
}

const { width, height } = Dimensions.get("window");

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  title,
  transcription,
  message,
  type,
  isDarkMode,
}) => {
  const styles = getStyles(isDarkMode);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>

          {/* Show transcription if available */}
          {transcription && (
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionLabel}>What you said:</Text>
              <Text style={styles.transcriptionText}>{transcription}</Text>
            </View>
          )}

          {/* AI Response */}
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
    },
    modal: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      margin: 20,
      backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
      borderRadius: 12,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 16,
    },
    transcriptionContainer: {
      marginBottom: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#f8f9fa",
      borderLeftWidth: 4,
      borderLeftColor: "#007AFF",
    },
    transcriptionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 8,
    },
    transcriptionText: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#e0e0e0" : "#333",
    },
    message: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#e0e0e0" : "#333",
      marginBottom: 24,
    },
    button: {
      backgroundColor: "#FF6B35",
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      width: "100%",
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
  });
