import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Platform,
  Linking,
} from "react-native";
import * as FileSystem from "expo-file-system";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

// Update the interface to match what HomeScreen is passing:

interface VoiceRecorderProps {
  onTranscriptionComplete: (audioUri: string) => void;
  selectedCategory: string;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
  isDarkMode?: boolean;
  isLocked?: boolean; // Add this
  recordingRef?: React.RefObject<any>; // Add this
  onStopRecording?: () => void; // Add this
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  selectedCategory,
  isProcessing,
  onProcessingChange,
  isDarkMode = false,
  isLocked,
  recordingRef,
  onStopRecording,
}) => {
  const [recording, setRecording] = useState<Audio.Recording>();
  const [isRecording, setIsRecording] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recordingTime, setRecordingTime] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);

  // 🕐 Max duration: 1 minute
  const maxDuration = 60;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fix the formatTime function to handle the timer display properly
  const formatTime = (milliseconds: number): string => {
    if (!milliseconds || isNaN(milliseconds) || milliseconds < 0) {
      return "0:00";
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Update the timer effect to automatically stop at 1 minute
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => {
          const newTime = prevTime + 1000;

          // 🛑 AUTO-STOP: Stop recording when reaching max duration
          if (newTime >= maxDuration * 1000) {
            stopRecording();
            return maxDuration * 1000;
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const startRecording = async () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("Requesting permissions..");
      
      // Check and request permissions
      if (permissionResponse?.status !== "granted") {
        console.log("Requesting permission..");
        const { status } = await requestPermission();
        
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Microphone access is required to record audio. Please enable it in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log("Starting recording..");
      
      // Create recording with error handling
      const { recording, status } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      if (status?.canRecord === false) {
        throw new Error("Unable to record - check microphone availability");
      }

      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0); // Reset timer
      startPulseAnimation();

      // Duration tracking is already handled by recordingTime state in useEffect

      console.log("✅ Recording started successfully");
      
      // Notify parent about recording start
      onProcessingChange(true);
      
    } catch (err: any) {
      console.error("Failed to start recording", err);
      onProcessingChange(false);
      
      // Provide more specific error messages
      let errorMessage = "Failed to start recording.";
      
      if (err.message?.includes("permission")) {
        errorMessage = "Microphone permission denied. Please enable it in settings.";
      } else if (err.message?.includes("microphone")) {
        errorMessage = "Microphone is not available. Please check if another app is using it.";
      } else if (err.code === "E_AUDIO_RECORDING_FAILED") {
        errorMessage = "Recording failed. Please try again.";
      }
      
      Alert.alert("Recording Error", errorMessage);
    }
  };

  // Update the stopRecording function to use real audio:

  const stopRecording = async () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    console.log("🛑 Stopping recording...");
    setIsRecording(false);
    stopPulseAnimation();

    // Timer cleanup is handled by useEffect

    if (!recording) {
      console.log("❌ No recording to stop");
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log("✅ Recording stopped and stored at:", uri);

      if (uri) {
        // Verify the file exists before processing
        const fileInfo = await FileSystem.getInfoAsync(uri);
        
        if (!fileInfo.exists) {
          throw new Error("Recording file not found");
        }
        
        // Check file size
        if (fileInfo.size === 0) {
          throw new Error("Recording file is empty");
        }
        
        console.log("📤 Calling onTranscriptionComplete with URI:", uri, "Size:", fileInfo.size);
        onTranscriptionComplete(uri); // This should call the parent function
      } else {
        throw new Error("No recording URI available");
      }

      setRecording(undefined);
      setRecordingTime(0);
      
      // Notify parent that processing can continue
      onProcessingChange(false);
      
    } catch (error: any) {
      console.error("❌ Error stopping recording:", error);
      onProcessingChange(false);
      
      // Provide specific error messages
      let errorMessage = "Failed to stop recording.";
      
      if (error.message?.includes("file not found")) {
        errorMessage = "Recording was not saved properly. Please try again.";
      } else if (error.message?.includes("empty")) {
        errorMessage = "Recording is too short. Please record for at least 1 second.";
      } else if (error.message?.includes("URI")) {
        errorMessage = "Failed to save recording. Please check storage permissions.";
      }
      
      Alert.alert("Recording Error", errorMessage);
      
      // Clean up state
      setRecording(undefined);
      setRecordingTime(0);
    }
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.recordingArea}>
        {/* Recording Button */}
        <Animated.View
          style={[
            styles.recordButtonContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
              recordingTime >= maxDuration * 1000 &&
                styles.recordButtonDisabled,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={recordingTime >= maxDuration * 1000 && !isRecording}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={50}
              color="#fff"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Duration Display */}
        <Text style={styles.durationText}>
          {formatTime(recordingTime)} / {formatTime(maxDuration * 1000)}
        </Text>

        {/* Time Remaining Indicator */}
        {isRecording && (
          <Text style={styles.timeRemainingText}>
            {Math.max(0, maxDuration - Math.floor(recordingTime / 1000))}{" "}
            seconds remaining
          </Text>
        )}

        {/* Recording Status */}
        <Text style={styles.statusText}>
          {isRecording
            ? "Recording... Tap to stop"
            : recordingTime >= maxDuration * 1000
            ? "Maximum recording time reached"
            : "Tap to start recording (1 min max)"}
        </Text>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}

        {/* Progress Bar */}
        {isRecording && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${(recordingTime / (maxDuration * 1000)) * 100}%`,
                  backgroundColor:
                    recordingTime >= maxDuration * 1000 * 0.9
                      ? "#FF5722"
                      : "#8BC34A",
                },
              ]}
            />
          </View>
        )}
      </View>
    </View>
  );
};

// Update styles - remove all settings-related styles:
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      marginBottom: 30,
    },
    recordingArea: {
      alignItems: "center",
      marginBottom: 30,
    },
    recordButtonContainer: {
      marginBottom: 25,
      alignItems: "center",
    },
    recordButton: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#8BC34A",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 4,
      borderColor: "#fff",
    },
    recordButtonActive: {
      backgroundColor: "#FF5722",
      shadowColor: "#FF5722",
      shadowOpacity: 0.4,
      borderColor: "#FFE0DB",
      transform: [{ scale: 1.05 }],
    },
    recordButtonDisabled: {
      backgroundColor: "#ccc",
      opacity: 0.6,
    },
    durationText: {
      fontSize: 18,
      fontWeight: "600",
      color: "#8BC34A",
      marginBottom: 10,
      fontFamily: "monospace",
    },
    timeRemainingText: {
      fontSize: 14,
      color: "#FF5722",
      fontWeight: "600",
      marginBottom: 5,
    },
    statusText: {
      fontSize: 16,
      color: isDarkMode ? "#aaa" : "#666",
      textAlign: "center",
      marginBottom: 15,
      fontWeight: "500",
    },
    recordingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF5722",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 15,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#fff",
      marginRight: 8,
    },
    recordingText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
    },
    progressContainer: {
      width: "100%",
      height: 4,
      backgroundColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
      borderRadius: 2,
      marginTop: 15,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#8BC34A",
      borderRadius: 2,
    },
  });
