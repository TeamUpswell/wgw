import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CompletionCountdownProps {
  nextEntryTime: Date;
  isDarkMode: boolean;
}

export const CompletionCountdown: React.FC<CompletionCountdownProps> = ({
  nextEntryTime,
  isDarkMode,
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextEntryTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Ready for next entry!");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [nextEntryTime]);

  return (
    <View style={styles.container}>
      <View style={styles.successBadge}>
        <Ionicons name="checkmark-circle" size={40} color="#8BC34A" />
      </View>
      <Text style={styles.completeText}>Entry Complete!</Text>
      <View style={styles.countdownContainer}>
        <Text style={styles.nextEntryText}>Next entry available in:</Text>
        <Animated.Text
          style={[styles.countdown, { transform: [{ scale: pulseAnim }] }]}
        >
          {timeLeft}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
  },
  successBadge: {
    marginBottom: 10,
  },
  completeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8BC34A",
    marginBottom: 20,
  },
  countdownContainer: {
    alignItems: "center",
  },
  nextEntryText: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 8,
  },
  countdown: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
  },
});
