import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ShareTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  templates: ((entry: any) => string)[];
  selectedTemplate: number;
  setSelectedTemplate: (idx: number) => void;
  entry: any;
  isDarkMode: boolean;
}

export const ShareTemplateModal: React.FC<ShareTemplateModalProps> = ({
  visible,
  onClose,
  onShare,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  entry,
  isDarkMode,
}) => {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDarkMode ? "#222" : "#fff",
              maxHeight: "70%",
            },
          ]}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 16,
              color: isDarkMode ? "#fff" : "#333",
            }}
          >
            Choose a message to share:
          </Text>
          <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {templates.map((template, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  backgroundColor:
                    idx === selectedTemplate
                      ? "#FF6B35"
                      : isDarkMode
                      ? "#333"
                      : "#eee",
                  borderRadius: 8,
                }}
                onPress={() => setSelectedTemplate(idx)}
              >
                <Text
                  style={{
                    color:
                      idx === selectedTemplate
                        ? "#fff"
                        : isDarkMode
                        ? "#fff"
                        : "#333",
                  }}
                >
                  {template(entry)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 10,
            }}
          >
            <TouchableOpacity onPress={onClose} style={{ marginRight: 16 }}>
              <Text style={{ color: "#aaa" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onShare}>
              <Text style={{ color: "#007AFF", fontWeight: "bold" }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
    width: "85%",
  },
});