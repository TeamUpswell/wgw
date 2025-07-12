import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#FF6B35',
    secondary: '#FF8A65',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#FF6B35',
    secondary: '#FF8A65',
    background: '#1a1a1a',
    surface: '#2a2a2a',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    border: '#3a3a3a',
    error: '#FF453A',
    success: '#30D158',
    warning: '#FFD60A',
    info: '#0A84FF',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  initialDarkMode?: boolean;
}

const THEME_STORAGE_KEY = '@WGW:theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialDarkMode = true 
}) => {
  const [isDarkMode, setIsDarkModeState] = useState(initialDarkMode);

  // Load theme preference on mount
  React.useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkModeState(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setDarkMode = useCallback((isDark: boolean) => {
    setIsDarkModeState(isDark);
    saveThemePreference(isDark);
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = !isDarkMode;
    setDarkMode(newMode);
  }, [isDarkMode, setDarkMode]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Helper hook for common style patterns
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme, isDarkMode: boolean) => T
): T => {
  const { theme, isDarkMode } = useTheme();
  return React.useMemo(() => styleFactory(theme, isDarkMode), [theme, isDarkMode, styleFactory]);
};