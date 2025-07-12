import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { validatePassword, PasswordStrength } from '../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  isDarkMode?: boolean;
  showRequirements?: boolean;
  onStrengthChange?: (strength: PasswordStrength) => void;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  isDarkMode = false,
  showRequirements = true,
  onStrengthChange,
}) => {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [barWidth] = useState(new Animated.Value(0));

  useEffect(() => {
    if (password) {
      const newStrength = validatePassword(password);
      setStrength(newStrength);
      onStrengthChange?.(newStrength);

      // Animate the strength bar
      Animated.timing(barWidth, {
        toValue: (newStrength.score / 4) * 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      setStrength(null);
      Animated.timing(barWidth, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [password]);

  const styles = getStyles(isDarkMode);

  if (!password || !strength) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.strengthSection}>
        <View style={styles.barContainer}>
          <Animated.View
            style={[
              styles.bar,
              {
                width: barWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: strength.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.strengthLabel, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>

      {/* Requirements List */}
      {showRequirements && (
        <View style={styles.requirementsSection}>
          {strength.requirements.map((req, index) => (
            <View key={index} style={styles.requirement}>
              <Ionicons
                name={req.met ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={req.met ? '#34C759' : (req.optional ? '#FF9500' : '#FF3B30')}
              />
              <Text
                style={[
                  styles.requirementText,
                  req.met && styles.requirementMet,
                  req.optional && styles.requirementOptional,
                ]}
              >
                {req.label}
                {req.optional && ' (recommended)'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <View style={styles.feedbackSection}>
          {strength.feedback.map((feedback, index) => (
            <Text key={index} style={styles.feedbackText}>
              • {feedback}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    strengthSection: {
      marginBottom: 12,
    },
    barContainer: {
      height: 4,
      backgroundColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 6,
    },
    bar: {
      height: '100%',
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'right',
    },
    requirementsSection: {
      gap: 6,
    },
    requirement: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    requirementText: {
      fontSize: 13,
      color: isDarkMode ? '#ccc' : '#666',
      flex: 1,
    },
    requirementMet: {
      color: isDarkMode ? '#34C759' : '#00C851',
      textDecorationLine: 'line-through',
    },
    requirementOptional: {
      fontStyle: 'italic',
    },
    feedbackSection: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    },
    feedbackText: {
      fontSize: 13,
      color: isDarkMode ? '#FF9500' : '#FF6B35',
      marginBottom: 4,
    },
  });