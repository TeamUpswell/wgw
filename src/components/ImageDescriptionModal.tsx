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
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { AIService } from "../services/ai";

const aiService = new AIService();

interface ImageDescriptionModalProps {
  imageUri?: string;
  onClose: () => void;
  onSubmit: (data: { description: string; imageUri: string; audioUri?: string; isPrivate?: boolean; category?: string }) => void;
  isDarkMode?: boolean;
  initialPrivacy?: boolean;
  categories?: string[];
  selectedCategory?: string;
}

export const ImageDescriptionModal: React.FC<ImageDescriptionModalProps> = ({ 
  imageUri: initialImageUri, 
  onClose, 
  onSubmit,
  isDarkMode = false,
  initialPrivacy = false,
  categories = ['Personal Growth', 'Exercise', 'Relationships', 'Work', 'Learning', 'Health', 'Creativity'],
  selectedCategory: initialSelectedCategory = 'Personal Growth'
}) => {
  const [imageUri, setImageUri] = useState(initialImageUri || null);
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(initialPrivacy);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState(initialSelectedCategory);
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
          const text = await aiService.transcribeAudio(uri);
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
  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please select or take a photo first.");
      return;
    }
    
    if (!description.trim()) {
      Alert.alert("Description Required", "Please add a description for your photo.");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate processing stages for better UX
    const stages = [
      { text: "Uploading your photo...", duration: 2000 },
      { text: "Analyzing image content...", duration: 3000 },
      { text: "Generating personalized feedback...", duration: 4000 },
      { text: "Finalizing your entry...", duration: 1000 }
    ];
    
    let currentStage = 0;
    setProcessingStage(stages[0].text);
    
    // Update stages during processing
    const stageTimer = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        setProcessingStage(stages[currentStage].text);
      } else {
        clearInterval(stageTimer);
      }
    }, 2500);
    
    try {
      await onSubmit({ description, imageUri, audioUri: audioUri || undefined, isPrivate, category: selectedCategory });
      clearInterval(stageTimer);
    } catch (error) {
      clearInterval(stageTimer);
      console.error('Submit error:', error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setProcessingStage('');
    }
  };

  return (
    <Modal visible transparent animationType="slide">
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >
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

          {/* Category Selector */}
          {imageUri && (
            <View style={styles.categoryContainer}>
              <Text style={[styles.categoryLabel, { color: isDarkMode ? '#fff' : '#333' }]}>
                Category
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category && styles.categoryChipSelected,
                      { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                      selectedCategory === category && { backgroundColor: '#FF6B35' }
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isDarkMode ? '#fff' : '#333' },
                        selectedCategory === category && { color: '#fff' }
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

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
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  blurOnSubmit={true}
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

          {/* Privacy Toggle */}
          {imageUri && !isSubmitting && (
            <View style={[styles.privacyContainer, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa' }]}>
              <View style={styles.privacyToggle}>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  thumbColor={isPrivate ? "#FF6B35" : isDarkMode ? "#444" : "#ccc"}
                  trackColor={{
                    false: isDarkMode ? "#555" : "#eee",
                    true: "#FFB199",
                  }}
                />
                <View style={styles.privacyInfo}>
                  <Text style={[styles.privacyLabel, { color: isDarkMode ? '#fff' : '#333' }]}>
                    {isPrivate ? 'Private' : 'Public'}
                  </Text>
                  <Text style={[styles.privacyDescription, { color: isDarkMode ? '#ccc' : '#666' }]}>
                    {isPrivate 
                      ? 'Only visible to you'
                      : 'Shared with your community'
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Processing State */}
          {isSubmitting && (
            <View style={styles.processingContainer}>
              <View style={styles.processingAnimation}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <View style={styles.processingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
              <Text style={[styles.processingTitle, { color: isDarkMode ? '#fff' : '#333' }]}>
                Creating Your Moment
              </Text>
              <Text style={[styles.processingStage, { color: isDarkMode ? '#ccc' : '#666' }]}>
                {processingStage}
              </Text>
              <Text style={[styles.processingSubtitle, { color: isDarkMode ? '#999' : '#888' }]}>
                This may take a few seconds...
              </Text>
            </View>
          )}

          {/* Audio Recording Processing */}
          {isProcessing && (
            <View style={styles.audioProcessingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={[styles.audioProcessingText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                Processing audio...
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {imageUri && !isSubmitting && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!description.trim() || isProcessing) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!description.trim() || isProcessing}
              >
                <Text style={[
                  styles.submitButtonText,
                  (!description.trim() || isProcessing) && styles.submitButtonTextDisabled
                ]}>
                  Share Your Moment
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0008",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: 320,
    alignItems: "center",
    position: "relative",
  },
  privacyContainer: {
    width: '100%',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    minHeight: 200,
    justifyContent: 'center',
  },
  processingAnimation: {
    alignItems: 'center',
    marginBottom: 24,
  },
  processingDots: {
    flexDirection: 'row',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  dot1: {
    // Animation handled by CSS-like behavior
  },
  dot2: {
    // Animation handled by CSS-like behavior  
  },
  dot3: {
    // Animation handled by CSS-like behavior
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  processingStage: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
    minHeight: 20,
  },
  processingSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  audioProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  audioProcessingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtons: {
    width: '100%',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
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
    maxHeight: 120,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
    textAlignVertical: 'top',
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
  categoryContainer: {
    width: '100%',
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  categoryScrollView: {
    maxHeight: 50,
  },
  categoryScrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryChipSelected: {
    backgroundColor: '#FF6B35',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ImageDescriptionModal;