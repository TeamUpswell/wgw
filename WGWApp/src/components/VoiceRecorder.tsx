import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Haptics from "expo-haptics";

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
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recordingTime, setRecordingTime] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);

  // 🕐 Max duration: 1 minute
  const maxDuration = 60;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout>();

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
      if (permissionResponse?.status !== "granted") {
        console.log("Requesting permission..");
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0); // Reset timer
      startPulseAnimation();

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert(
        "Error",
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  // Update the stopRecording function to use real audio:

  const stopRecording = async () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    console.log("🛑 Stopping recording...");
    setIsRecording(false);
    stopPulseAnimation();

    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }

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
        console.log("📤 Calling onTranscriptionComplete with URI:", uri);
        onTranscriptionComplete(uri); // This should call the parent function
      } else {
        console.error("❌ No URI returned from recording");
      }

      setRecording(undefined);
      setRecordingTime(0);
    } catch (error) {
      console.error("❌ Error stopping recording:", error);
      Alert.alert("Error", "Failed to stop recording");
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
