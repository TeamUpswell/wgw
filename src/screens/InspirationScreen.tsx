import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Share,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AIService } from "../services/ai";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InspirationScreenProps {
  user: any;
  isDarkMode: boolean;
  onBack: () => void;
  onCreateEntry?: () => void;
}

interface GratitudePrompt {
  id: string;
  text: string;
  category: string;
  icon: string;
}

interface ReflectionExercise {
  id: string;
  title: string;
  description: string;
  steps: string[];
  duration: string;
  icon: string;
}

export const InspirationScreen: React.FC<InspirationScreenProps> = ({
  user,
  isDarkMode,
  onBack,
  onCreateEntry,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyQuote, setDailyQuote] = useState("");
  const [gratitudePrompts, setGratitudePrompts] = useState<GratitudePrompt[]>([]);
  const [reflectionExercises, setReflectionExercises] = useState<ReflectionExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ReflectionExercise | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const promptAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInspirationContent();
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadInspirationContent = async () => {
    try {
      setIsLoading(true);
      
      // Load daily quote
      const quote = AIService.getDailyQuote();
      setDailyQuote(quote);
      
      // Load gratitude prompts
      const prompts = getGratitudePrompts();
      setGratitudePrompts(prompts);
      
      // Load reflection exercises
      const exercises = getReflectionExercises();
      setReflectionExercises(exercises);
      
    } catch (error) {
      console.error("Error loading inspiration content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGratitudePrompts = (): GratitudePrompt[] => {
    return [
      {
        id: "1",
        text: "What made you smile today, even for just a moment?",
        category: "Simple Pleasures",
        icon: "happy-outline"
      },
      {
        id: "2", 
        text: "Think of someone who supported you recently. How did they help?",
        category: "Relationships",
        icon: "people-outline"
      },
      {
        id: "3",
        text: "What's one thing your body did well for you today?",
        category: "Health & Wellness",
        icon: "fitness-outline"
      },
      {
        id: "4",
        text: "What skill or strength did you use today that you're proud of?",
        category: "Personal Growth",
        icon: "trending-up-outline"
      },
      {
        id: "5",
        text: "What's something in your environment right now that brings you peace?",
        category: "Simple Pleasures",
        icon: "leaf-outline"
      },
      {
        id: "6",
        text: "What's a recent accomplishment, no matter how small?",
        category: "Achievements",
        icon: "trophy-outline"
      },
      {
        id: "7",
        text: "What's something you learned recently that excited you?",
        category: "Learning",
        icon: "bulb-outline"
      },
      {
        id: "8",
        text: "What's a comfort or convenience you often take for granted?",
        category: "Simple Pleasures",
        icon: "home-outline"
      }
    ];
  };

  const getReflectionExercises = (): ReflectionExercise[] => {
    return [
      {
        id: "1",
        title: "Three Good Things",
        description: "A classic gratitude practice that rewires your brain for positivity",
        steps: [
          "Think of three things that went well today",
          "Write them down or speak them aloud",
          "For each one, reflect on why it was meaningful",
          "Consider your role in making it happen"
        ],
        duration: "5 minutes",
        icon: "list-outline"
      },
      {
        id: "2",
        title: "Gratitude Letter",
        description: "Express appreciation to someone who has impacted your life",
        steps: [
          "Think of someone who has helped or supported you",
          "Write down specific ways they've made a difference",
          "Describe how their actions affected you",
          "Consider sharing this with them"
        ],
        duration: "10 minutes",
        icon: "mail-outline"
      },
      {
        id: "3",
        title: "Present Moment Appreciation", 
        description: "Find gratitude in what's happening right now",
        steps: [
          "Take three deep breaths and center yourself",
          "Notice five things you can see around you",
          "Find something to appreciate about each one",
          "Feel the abundance in this moment"
        ],
        duration: "3 minutes",
        icon: "eye-outline"
      },
      {
        id: "4",
        title: "Growth Reflection",
        description: "Celebrate how you've grown and evolved",
        steps: [
          "Think back to yourself one year ago",
          "Identify three ways you've grown or improved",
          "Acknowledge the challenges you've overcome",
          "Appreciate your resilience and progress"
        ],
        duration: "8 minutes", 
        icon: "trending-up-outline"
      },
      {
        id: "5",
        title: "Sensory Gratitude",
        description: "Use your senses to find appreciation",
        steps: [
          "Focus on something you can see that's beautiful",
          "Listen for a sound that brings you peace",
          "Notice a pleasant smell or taste",
          "Feel grateful for your ability to experience these"
        ],
        duration: "4 minutes",
        icon: "radio-outline"
      }
    ];
  };

  const shareQuote = async () => {
    try {
      await Share.share({
        message: `${dailyQuote}\n\nShared from my "What's Going Well" journey 🌟`,
        title: "Daily Inspiration",
      });
    } catch (error) {
      console.error("Error sharing quote:", error);
    }
  };

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * gratitudePrompts.length);
    setCurrentPromptIndex(randomIndex);
    
    // Animate prompt change
    Animated.sequence([
      Animated.timing(promptAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(promptAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInspirationContent();
    setRefreshing(false);
  };

  const openExercise = (exercise: ReflectionExercise) => {
    setSelectedExercise(exercise);
  };

  const closeExercise = () => {
    setSelectedExercise(null);
  };

  const styles = getStyles(isDarkMode);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>
          Loading inspiration...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Inspiration</Text>
        <TouchableOpacity onPress={shareQuote} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Quote Section */}
        <Animated.View
          style={[
            styles.quoteSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.quoteHeader}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.sectionTitle}>Today's Inspiration</Text>
          </View>
          <Text style={styles.quote}>{dailyQuote}</Text>
          <TouchableOpacity onPress={shareQuote} style={styles.shareQuoteButton}>
            <Ionicons name="share-outline" size={16} color="#FF6B35" />
            <Text style={styles.shareQuoteText}>Share this wisdom</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Gratitude Prompt */}
        <Animated.View
          style={[
            styles.promptSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.promptHeader}>
            <Ionicons name="heart" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Gratitude Prompt</Text>
            <TouchableOpacity onPress={getRandomPrompt} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
          
          <Animated.View
            style={[
              styles.promptCard,
              {
                opacity: promptAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    scale: promptAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.promptIconContainer}>
              <Ionicons 
                name={gratitudePrompts[currentPromptIndex]?.icon as any} 
                size={28} 
                color="#FF6B35" 
              />
            </View>
            <Text style={styles.promptText}>
              {gratitudePrompts[currentPromptIndex]?.text}
            </Text>
            <Text style={styles.promptCategory}>
              {gratitudePrompts[currentPromptIndex]?.category}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Reflection Exercises */}
        <Animated.View
          style={[
            styles.exercisesSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.exercisesHeader}>
            <Ionicons name="bulb" size={24} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Reflection Exercises</Text>
          </View>
          
          {reflectionExercises.map((exercise, index) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() => openExercise(exercise)}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIconContainer}>
                  <Ionicons name={exercise.icon as any} size={24} color="#4A90E2" />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#999" : "#666"} />
              </View>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Positive Reminders */}
        <Animated.View
          style={[
            styles.remindersSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.remindersHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#7ED321" />
            <Text style={styles.sectionTitle}>Remember This</Text>
          </View>
          
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>
              🌱 Every moment of gratitude you practice is strengthening your resilience and creating more joy in your life.
            </Text>
          </View>
          
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>
              ✨ You have the power to shift your perspective and find something good in any situation.
            </Text>
          </View>
          
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>
              🌟 Your gratitude practice is not just changing your day - it's changing your life.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      {onCreateEntry && (
        <TouchableOpacity
          style={styles.floatingActionButton}
          onPress={onCreateEntry}
          activeOpacity={0.8}
        >
          <View style={styles.fabInner}>
            <Ionicons name="add" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <View style={styles.modalOverlay}>
          <View style={styles.exerciseModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name={selectedExercise.icon as any} size={28} color="#4A90E2" />
              </View>
              <Text style={styles.modalTitle}>{selectedExercise.title}</Text>
              <TouchableOpacity onPress={closeExercise} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={isDarkMode ? "#999" : "#666"} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalDescription}>{selectedExercise.description}</Text>
              
              <View style={styles.modalDuration}>
                <Ionicons name="time-outline" size={16} color="#FF6B35" />
                <Text style={styles.modalDurationText}>Takes about {selectedExercise.duration}</Text>
              </View>
              
              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>How to practice:</Text>
                {selectedExercise.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity style={styles.startButton} onPress={closeExercise}>
                <Text style={styles.startButtonText}>Start Practicing</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
    },
    centerContent: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      color: isDarkMode ? "#ccc" : "#666",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
    },
    shareButton: {
      padding: 8,
    },
    scrollView: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginLeft: 8,
    },
    
    // Quote Section
    quoteSection: {
      margin: 16,
      padding: 20,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: "#FFD700",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    quoteHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    quote: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#e0e0e0" : "#333",
      fontStyle: "italic",
      marginBottom: 16,
    },
    shareQuoteButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-end",
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: isDarkMode ? "rgba(255, 107, 53, 0.1)" : "rgba(255, 107, 53, 0.1)",
      borderRadius: 20,
    },
    shareQuoteText: {
      fontSize: 14,
      color: "#FF6B35",
      marginLeft: 4,
      fontWeight: "500",
    },
    
    // Prompt Section
    promptSection: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    promptHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      justifyContent: "space-between",
    },
    refreshButton: {
      padding: 8,
    },
    promptCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    promptIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDarkMode ? "rgba(255, 107, 53, 0.1)" : "rgba(255, 107, 53, 0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    promptText: {
      fontSize: 18,
      lineHeight: 26,
      color: isDarkMode ? "#e0e0e0" : "#333",
      textAlign: "center",
      marginBottom: 12,
      fontWeight: "500",
    },
    promptCategory: {
      fontSize: 14,
      color: "#FF6B35",
      fontWeight: "600",
      backgroundColor: isDarkMode ? "rgba(255, 107, 53, 0.1)" : "rgba(255, 107, 53, 0.1)",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    
    // Exercises Section
    exercisesSection: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    exercisesHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    exerciseCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    exerciseHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    exerciseIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? "rgba(74, 144, 226, 0.1)" : "rgba(74, 144, 226, 0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 2,
    },
    exerciseDuration: {
      fontSize: 12,
      color: isDarkMode ? "#999" : "#666",
    },
    exerciseDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: isDarkMode ? "#ccc" : "#666",
    },
    
    // Reminders Section
    remindersSection: {
      marginHorizontal: 16,
      marginBottom: 32,
    },
    remindersHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    reminderCard: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#7ED321",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    reminderText: {
      fontSize: 15,
      lineHeight: 22,
      color: isDarkMode ? "#e0e0e0" : "#333",
    },
    
    // Modal Styles
    modalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    exerciseModal: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 16,
      maxHeight: "80%",
      width: "100%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    },
    modalIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? "rgba(74, 144, 226, 0.1)" : "rgba(74, 144, 226, 0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    modalTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
    },
    closeButton: {
      padding: 4,
    },
    modalContent: {
      padding: 20,
    },
    modalDescription: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#ccc" : "#666",
      marginBottom: 16,
    },
    modalDuration: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      padding: 12,
      backgroundColor: isDarkMode ? "rgba(255, 107, 53, 0.1)" : "rgba(255, 107, 53, 0.1)",
      borderRadius: 8,
    },
    modalDurationText: {
      fontSize: 14,
      color: "#FF6B35",
      marginLeft: 6,
      fontWeight: "500",
    },
    stepsContainer: {
      marginBottom: 20,
    },
    stepsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 12,
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#4A90E2",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      marginTop: 2,
    },
    stepNumberText: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#fff",
    },
    stepText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: isDarkMode ? "#e0e0e0" : "#333",
    },
    startButton: {
      backgroundColor: "#4A90E2",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
    },
    
    // Floating Action Button
    floatingActionButton: {
      position: "absolute",
      bottom: 100, // Position above bottom navigation
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#FF6B35",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 1000,
    },
    fabInner: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 30,
    },
  });