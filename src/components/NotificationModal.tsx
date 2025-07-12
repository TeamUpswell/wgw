import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  transcription?: string;
  message: string;
  type: "success" | "error" | "warning";
  isDarkMode: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  onSaveEdit?: (newText: string) => void; // <-- Add this
  favorite?: boolean; // renamed for clarity
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
  onEdit,
  onShare,
  onToggleFavorite,
  onSaveEdit,
  favorite,
}) => {
  console.log("🎉 NotificationModal received props:", {
    visible,
    title,
    hasTranscription: !!transcription,
    transcriptionLength: transcription?.length || 0,
    transcriptionPreview: transcription?.substring(0, 50) || "No transcription",
    hasMessage: !!message,
    messageLength: message?.length || 0,
    messagePreview: message?.substring(0, 50) || "No message"
  });
  
  const styles = getStyles(isDarkMode);

  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription || "");

  const handleEditPress = () => {
    setEditing(true);
    setEditedText(transcription || "");
    if (onEdit) onEdit();
  };

  const handleSaveEdit = () => {
    setEditing(false);
    if (onSaveEdit) onSaveEdit(editedText);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditedText(transcription || "");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {transcription && transcription.trim() ? (
              <View style={styles.transcriptionContainer}>
                <Text style={styles.transcriptionLabel}>What you said:</Text>
                {editing ? (
                  <>
                    <TextInput
                      style={[
                        styles.transcriptionText,
                        {
                          backgroundColor: isDarkMode ? "#222" : "#fff",
                          borderRadius: 6,
                          padding: 8,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: "#ccc",
                        },
                      ]}
                      value={editedText}
                      onChangeText={setEditedText}
                      multiline
                    />
                    <View style={{ flexDirection: "row", marginBottom: 8 }}>
                      <TouchableOpacity
                        onPress={handleSaveEdit}
                        style={{ marginRight: 16 }}
                      >
                        <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
                          Save
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit}>
                        <Text style={{ color: "#aaa" }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <Text style={styles.transcriptionText}>{transcription}</Text>
                )}
                {/* Action Buttons */}
                <View style={{ flexDirection: "row", marginTop: 12 }}>
                  {onEdit && !editing && (
                    <TouchableOpacity
                      onPress={handleEditPress}
                      style={{ marginRight: 24 }}
                    >
                      <Ionicons name="create-outline" size={22} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                  {onShare && (
                    <TouchableOpacity onPress={onShare} style={{ marginRight: 24 }}>
                      <Ionicons name="share-social" size={22} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                  {onToggleFavorite && (
                    <TouchableOpacity
                      onPress={onToggleFavorite}
                      style={{ marginRight: 0, marginLeft: 0, padding: 4 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={favorite ? "star" : "star-outline"}
                        size={28}
                        color={favorite ? "#FFD700" : "#aaa"}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : null}

            {/* AI Response */}
            {message && message.trim() ? (
              <View>
                <Text style={styles.responseLabel}>AI Reflection:</Text>
                <Text style={styles.message}>{message}</Text>
              </View>
            ) : (
              <Text style={styles.message}>No AI response available</Text>
            )}
          </ScrollView>

          {/* Fixed Continue Button */}
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
      backgroundColor:
        isDarkMode ? "rgba(26,26,26,0.85)" : "rgba(255,255,255,0.85)",
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      width: width * 0.9,
      maxHeight: height * 0.8, // Limit modal height to 80% of screen
      borderRadius: 12,
      backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      overflow: "hidden", // Prevent content overflow
    },
    scrollContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    scrollContentContainer: {
      paddingBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 16,
      paddingHorizontal: 20,
      paddingTop: 20,
      textAlign: "center",
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
    responseLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 8,
      marginTop: 16,
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
      marginHorizontal: 20,
      marginVertical: 20,
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
  });