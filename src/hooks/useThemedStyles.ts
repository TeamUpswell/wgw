import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { StyleSheet } from 'react-native';

/**
 * Hook for creating themed styles that automatically update with theme changes
 * @param styleFactory A function that takes isDarkMode and returns styles
 * @param dependencies Additional dependencies for the style factory
 * @returns Memoized styles that update when theme changes
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (isDarkMode: boolean) => T,
  dependencies: any[] = []
): T {
  const { isDarkMode } = useTheme();
  
  return useMemo(
    () => styleFactory(isDarkMode),
    [isDarkMode, ...dependencies]
  );
}

// Common themed colors and values
export const getThemedColors = (isDarkMode: boolean) => ({
  background: isDarkMode ? '#1a1a1a' : '#fff',
  secondaryBackground: isDarkMode ? '#2a2a2a' : '#f8f9fa',
  tertiaryBackground: isDarkMode ? '#3a3a3a' : '#f0f0f0',
  text: isDarkMode ? '#fff' : '#333',
  secondaryText: isDarkMode ? '#aaa' : '#666',
  tertiaryText: isDarkMode ? '#888' : '#999',
  border: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  lightBorder: isDarkMode ? '#444' : '#f0f0f0',
  primary: '#FF6B35',
  primaryLight: '#FFB199',
  success: '#8BC34A',
  error: '#e74c3c',
  warning: '#FFD700',
  info: '#2196F3',
  
  // Component specific colors
  cardBackground: isDarkMode ? '#2a2a2a' : '#ffffff',
  cardBorder: isDarkMode ? '#3a3a3a' : '#f0f0f0',
  inputBackground: isDarkMode ? '#333' : '#f8f8f8',
  inputBorder: isDarkMode ? '#444' : '#e0e0e0',
  buttonBackground: isDarkMode ? '#333' : '#f0f0f0',
  buttonText: isDarkMode ? '#fff' : '#333',
  modalBackground: isDarkMode ? '#2a2a2a' : '#fff',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  
  // Shadow colors
  shadowColor: '#000',
  lightShadow: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
});

// Common themed styles
export const getCommonStyles = (isDarkMode: boolean) => {
  const colors = getThemedColors(isDarkMode);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: colors.buttonBackground,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '500',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    text: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    secondaryText: {
      fontSize: 14,
      color: colors.secondaryText,
      lineHeight: 20,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    shadow: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modal: {
      backgroundColor: colors.modalBackground,
      borderRadius: 16,
      padding: 20,
      maxWidth: '90%',
      maxHeight: '80%',
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

// Export a hook for common styles
export function useCommonStyles() {
  return useThemedStyles(getCommonStyles);
}