import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface ProcessingModalProps {
  visible: boolean;
  stage: "transcribing" | "analyzing" | "generating" | "complete";
  isDarkMode: boolean;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  visible,
  stage,
  isDarkMode,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    [...Array(6)].map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible) {
      startAnimations();
    }
  }, [visible, stage]);

  const startAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Particle animations
    particleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500 + index * 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ).start();
    });
  };

  const getStageContent = () => {
    switch (stage) {
      case "transcribing":
        return {
          emoji: "🎤",
          title: "Listening to your reflection...",
          subtitle: "Converting your voice to text",
          color: "#3B82F6",
        };
      case "analyzing":
        return {
          emoji: "🧠",
          title: "Understanding your thoughts...",
          subtitle: "Analyzing the meaning behind your words",
          color: "#8B5CF6",
        };
      case "generating":
        return {
          emoji: "✨",
          title: "Crafting your personalized response...",
          subtitle: "Creating meaningful insights just for you",
          color: "#10B981",
        };
      case "complete":
        return {
          emoji: "🎉",
          title: "Ready!",
          subtitle: "Your reflection has been processed",
          color: "#F59E0B",
        };
    }
  };

  const stageContent = getStageContent();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDarkMode
              ? "rgba(0,0,0,0.9)"
              : "rgba(255,255,255,0.95)",
          },
        ]}
      >
        <View style={styles.container}>
          {/* Animated Background Particles */}
          {particleAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  backgroundColor: stageContent.color,
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, index % 2 === 0 ? 50 : -50],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, index % 3 === 0 ? -30 : 30],
                      }),
                    },
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1, 0],
                      }),
                    },
                  ],
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.8, 0],
                  }),
                },
              ]}
            />
          ))}

          {/* Main Content */}
          <Animated.View
            style={[
              styles.contentContainer,
              {
                transform: [
                  { scale: pulseAnim },
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Animated Emoji */}
            <Animated.Text
              style={[
                styles.emoji,
                {
                  transform: [
                    {
                      rotate: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              {stageContent.emoji}
            </Animated.Text>

            {/* Progress Wave */}
            <View style={styles.waveContainer}>
              {[...Array(5)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveDot,
                    {
                      backgroundColor: stageContent.color,
                      transform: [
                        {
                          scaleY: waveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1.5],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>

            {/* Text Content */}
            <Text
              style={[styles.title, { color: isDarkMode ? "#fff" : "#1a1a1a" }]}
            >
              {stageContent.title}
            </Text>
            <Text
              style={[styles.subtitle, { color: isDarkMode ? "#aaa" : "#666" }]}
            >
              {stageContent.subtitle}
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    transform: [
                      {
                        scaleX: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0.9],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </Animated.View>
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
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contentContainer: {
    alignItems: "center",
    padding: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 30,
  },
  waveContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    height: 40,
  },
  waveDot: {
    width: 4,
    height: 20,
    marginHorizontal: 3,
    borderRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  progressContainer: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
});
