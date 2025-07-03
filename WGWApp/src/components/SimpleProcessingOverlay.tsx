import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";

export const SimpleProcessingOverlay: React.FC<{
  visible: boolean;
  stage: string;
  isDarkMode: boolean;
}> = ({ visible, stage, isDarkMode }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation
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
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getStageContent = () => {
    switch (stage) {
      case "transcribing":
        return {
          emoji: "🎤",
          title: "Listening to your voice...",
          subtitle: "Converting speech to text",
        };
      case "analyzing":
        return {
          emoji: "🧠",
          title: "Understanding your thoughts...",
          subtitle: "Analyzing your reflection",
        };
      case "generating":
        return {
          emoji: "✨",
          title: "Creating your response...",
          subtitle: "Generating personalized insights",
        };
      case "complete":
        return {
          emoji: "🎉",
          title: "Almost ready!",
          subtitle: "Finalizing your entry",
        };
      default:
        return {
          emoji: "⏳",
          title: "Processing...",
          subtitle: "Please wait",
        };
    }
  };

  const content = getStageContent();

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          backgroundColor: isDarkMode
            ? "rgba(0,0,0,0.85)"
            : "rgba(255,255,255,0.95)",
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
            borderColor: isDarkMode ? "#3a3a3a" : "#f0f0f0",
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.emoji,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {content.emoji}
        </Animated.Text>

        <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#333" }]}>
          {content.title}
        </Text>

        <Text
          style={[styles.subtitle, { color: isDarkMode ? "#aaa" : "#666" }]}
        >
          {content.subtitle}
        </Text>

        {/* Animated dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: "#8BC34A",
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    alignItems: "center",
    padding: 40,
    borderRadius: 20,
    marginHorizontal: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
