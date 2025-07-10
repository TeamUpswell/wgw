import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Image,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { transcribeAudio } from "../services/transcriptionService";

interface ImageDescriptionModalProps {
  imageUri?: string;
  onClose: () => void;
  onSubmit: (data: { description: string; imageUri: string; audioUri?: string }) => void;
}

export const ImageDescriptionModal: React.FC<ImageDescriptionModalProps> = ({ 
  imageUri: initialImageUri, 
  onClose, 
  onSubmit 
}) => {
  const [imageUri, setImageUri] = useState(initialImageUri || null);
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pick from library
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Take a photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera permission is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Start recording
  const handleRecord = async () => {
    try {
      setIsRecording(true);

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Microphone permission is required to record audio.");
        setIsRecording(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;

      // Auto-stop after 30 seconds
      timeoutRef.current = setTimeout(async () => {
        if (isRecording) {
          await handleStop();
        }
      }, 30000);
    } catch (e) {
      setIsRecording(false);
      setIsProcessing(false);
      Alert.alert("Recording failed", (e as Error).message);
    }
  };

  // Stop recording and transcribe
  const handleStop = async () => {
    if (!recordingRef.current) return;
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setAudioUri(uri);
      setIsRecording(false);

      if (uri) {
        setIsProcessing(true);
        try {
          const text = await transcribeAudio(uri);
          setDescription((prev) => (prev ? `${prev} ${text}` : text));
        } catch (error) {
          console.error("Transcription failed:", error);
          Alert.alert("Transcription Failed", "Could not transcribe audio. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  // Submit handler
  const handleSubmit = () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please select or take a photo first.");
      return;
    }
    onSubmit({ description, imageUri, audioUri: audioUri || undefined });
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {/* Image picker buttons */}
          {!imageUri && (
            <View style={{ flexDirection: "row", marginBottom: 16 }}>
              <Button title="Take Photo" onPress={takePhoto} />
              <View style={{ width: 12 }} />
              <Button title="Pick from Library" onPress={pickImage} />
            </View>
          )}

          {/* Image preview */}
          {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

          {/* Input and mic */}
          {imageUri && (
            <View style={styles.inputRow}>
              {!isRecording && (
                <TextInput
                  style={styles.input}
                  placeholder="Tell us about this image..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              )}
              {isRecording ? (
                <View style={styles.listeningContainer}>
                  <ActivityIndicator size="small" color="#FF9500" />
                  <Text style={styles.listeningText}>Listening…</Text>
                  <TouchableOpacity
                    onPress={handleStop}
                    style={styles.stopButton}
                    accessibilityLabel="Stop recording"
                  >
                    <Ionicons name="stop" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleRecord}
                  disabled={isRecording || isProcessing}
                  style={styles.roundMicButton}
                >
                  <Ionicons name="mic" size={32} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {isProcessing && <ActivityIndicator size="small" color="#007AFF" />}
          {imageUri && (
            <>
              <Button
                title="Submit"
                onPress={handleSubmit}
                disabled={!description || isProcessing}
              />
              <Button title="Cancel" onPress={onClose} color="gray" />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0008",
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: 320,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#888",
  },
  image: { 
    width: 200, 
    height: 200, 
    borderRadius: 8, 
    marginBottom: 16 
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    minHeight: 60,
  },
  input: {
    flex: 1,
    minHeight: 60,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  roundMicButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF9500",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  listeningContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },
  listeningText: {
    marginLeft: 8,
    color: "#FF9500",
    fontWeight: "bold",
    fontSize: 16,
  },
  stopButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ImageDescriptionModal;