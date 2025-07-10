import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecorderSection } from './RecorderSection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WelcomeScreenProps {
  user: any;
  isDarkMode: boolean;
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  onRecordingComplete: (audioUri: string, transcription: string, category: string) => void;
  onAddImagePress: () => void;
  onCameraPress: () => void;
  isProcessing: boolean;
  isFirstTime?: boolean; // True if user has never made an entry
  totalEntries?: number; // Total entries user has made
  currentStreak?: number; // Current streak
  isAddingAdditionalEntry?: boolean; // True if adding an additional entry after daily completion
  onPrivacyChange?: (isPrivate: boolean) => void; // Add privacy callback
  initialPrivacy?: boolean; // Add initial privacy state
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  user,
  isDarkMode,
  categories,
  selectedCategory,
  onCategorySelect,
  onRecordingComplete,
  onAddImagePress,
  onCameraPress,
  isProcessing,
  isFirstTime = false,
  totalEntries = 0,
  currentStreak = 0,
  isAddingAdditionalEntry = false,
  onPrivacyChange,
  initialPrivacy = false,
}) => {
  const [showTips, setShowTips] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing animation for record button area
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const motivationalMessages = [
    {
      icon: '🌟',
      title: 'Reflect on your day',
      subtitle: 'Share what made you smile, learn, or grow today',
    },
    {
      icon: '🎯',
      title: 'Build positive habits',
      subtitle: 'Daily reflection helps you notice progress and patterns',
    },
    {
      icon: '🚀',
      title: 'Connect with others',
      subtitle: 'Share your journey and support friends in theirs',
    },
  ];

  const tips = [
    'Start with small wins - even tiny positive moments count!',
    'Use voice recording for quick, natural reflections',
    'Add photos to capture moments that made you happy',
    'Try different categories to explore all areas of your life',
    'Set a daily reminder to build the habit consistently',
  ];

  const getWelcomeMessage = () => {
    if (isAddingAdditionalEntry) {
      // Calmer messaging for additional entries after daily completion
      return {
        title: 'Share another moment',
        subtitle: '',
        cta: 'Add Another Reflection',
      };
    } else if (isFirstTime) {
      return {
        title: `Welcome to WGW, ${user?.display_name || user?.username || 'friend'}!`,
        subtitle: 'Ready to start your journey of daily reflection and growth?',
        cta: 'Record Your First Entry',
      };
    } else if (currentStreak === 0) {
      return {
        title: 'Ready for today\'s reflection?',
        subtitle: `You've shared ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'} so far. Let's keep the momentum going!`,
        cta: 'Continue Your Journey',
      };
    } else {
      return {
        title: `${currentStreak} day streak! 🔥`,
        subtitle: 'You\'re building an amazing habit. What went well today?',
        cta: 'Keep Your Streak Alive',
      };
    }
  };

  const welcomeData = getWelcomeMessage();

  const renderMotivationalCard = (item: typeof motivationalMessages[0], index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.motivationalCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 30 + index * 10],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.cardIcon}>{item.icon}</Text>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
      </View>
    </Animated.View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <Animated.View
        style={[
          styles.heroSection,
          isAddingAdditionalEntry && styles.compactHeroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.heroContent}>
          <Text style={styles.welcomeTitle}>{welcomeData.title}</Text>
          <Text style={styles.welcomeSubtitle}>{welcomeData.subtitle}</Text>
          
          {/* Quick Stats for returning users */}
          {!isFirstTime && !isAddingAdditionalEntry && (
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalEntries}</Text>
                <Text style={styles.statLabel}>Total Entries</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          )}
        </View>

        {/* Hero Illustration */}
        <View style={styles.heroIllustration}>
          <View style={styles.illustrationCircle}>
            <Ionicons name="sunny" size={40} color="#FF6B35" />
          </View>
          <Text style={styles.illustrationText}>✨</Text>
        </View>
      </Animated.View>

      {/* Recording Section */}
      <Animated.View
        style={[
          styles.recordingSection,
          isAddingAdditionalEntry && styles.compactRecordingSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.recordingHeader}>
          <Text style={styles.sectionTitle}>{welcomeData.cta}</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a category and share what made your day special
          </Text>
        </View>

        <View style={styles.recorderContainer}>
          <RecorderSection
            selectedCategory={selectedCategory || categories?.[0] || "Personal Growth"}
            onRecordingComplete={onRecordingComplete}
            isProcessing={isProcessing}
            isDarkMode={false} // Use light theme for better contrast
            categories={categories || []}
            onCategorySelect={onCategorySelect}
            compact={false}
            onAddImagePress={onAddImagePress}
            onCameraPress={onCameraPress}
            isAddingAdditionalEntry={isAddingAdditionalEntry}
            onPrivacyChange={onPrivacyChange}
            initialPrivacy={initialPrivacy}
          />
        </View>
      </Animated.View>

      {/* Motivational Cards */}
      {isFirstTime && (
        <View style={styles.motivationalSection}>
          <Text style={styles.sectionTitle}>Why daily reflection matters</Text>
          {motivationalMessages.map(renderMotivationalCard)}
        </View>
      )}

      {/* Tips Section - only show for regular entries, not additional entries */}
      {!isAddingAdditionalEntry && (
        <View style={styles.tipsSection}>
          <TouchableOpacity
            style={styles.tipsHeader}
            onPress={() => setShowTips(!showTips)}
          >
            <View style={styles.tipsHeaderContent}>
              <Ionicons name="bulb" size={24} color="#FF6B35" />
              <Text style={styles.tipsTitle}>Pro Tips</Text>
            </View>
            <Ionicons 
              name={showTips ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={isDarkMode ? "#888" : "#666"} 
            />
          </TouchableOpacity>

          {showTips && (
            <Animated.View style={styles.tipsContent}>
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipBullet}>
                    <Text style={styles.tipBulletText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </Animated.View>
          )}
        </View>
      )}

      {/* Encouragement Footer - only show for regular entries, not additional entries */}
      {!isAddingAdditionalEntry && (
        <Animated.View
          style={[
            styles.encouragementSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.encouragementText}>
            {isFirstTime 
              ? "Remember, there's no wrong way to reflect. Just be honest and kind to yourself." 
              : "Every entry is a step forward. You're building something beautiful."
            }
          </Text>
          <View style={styles.encouragementIcon}>
            <Ionicons name="heart" size={20} color="#FF6B35" />
          </View>
        </Animated.View>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
  },

  // Hero Section
  heroSection: {
    padding: 24,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  heroContent: {
    flex: 1,
    paddingRight: 16,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 8,
    lineHeight: 32,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: isDarkMode ? '#ccc' : '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#3a3a3a' : '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: isDarkMode ? '#888' : '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: isDarkMode ? '#666' : '#ddd',
    marginHorizontal: 20,
  },
  
  // Additional entry styles
  additionalEntryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2a3d2a' : '#f0f8f0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  checkIcon: {
    marginRight: 8,
  },
  additionalEntryText: {
    fontSize: 14,
    color: isDarkMode ? '#a0d0a0' : '#4a6741',
    fontWeight: '500',
    flex: 1,
  },
  heroIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  illustrationText: {
    fontSize: 24,
    position: 'absolute',
    top: -10,
    right: -10,
  },

  // Recording Section
  recordingSection: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    marginBottom: 8,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  recordingHeader: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#FF6B35',
  },
  recorderContainer: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    padding: 16,
  },

  // Sections
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },

  // Motivational Section
  motivationalSection: {
    padding: 16,
    paddingTop: 24,
  },
  motivationalCard: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
    lineHeight: 20,
  },

  // Tips Section
  tipsSection: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  tipsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8,
  },
  tipsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipBulletText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: isDarkMode ? '#ccc' : '#555',
    lineHeight: 20,
  },

  // Encouragement Section
  encouragementSection: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  },
  encouragementText: {
    fontSize: 16,
    color: isDarkMode ? '#ccc' : '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  encouragementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#3a3a3a' : '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Spacing
  bottomSpacing: {
    height: 100, // Extra space for bottom navigation
  },
  
  // Compact styles for additional entries
  compactHeroSection: {
    padding: 16,
    paddingTop: 12,
    marginBottom: 4,
  },
  compactRecordingSection: {
    marginTop: -8,
    marginBottom: 4,
  },
});