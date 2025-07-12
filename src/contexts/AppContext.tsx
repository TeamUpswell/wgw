import React, { createContext, useContext, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ErrorProvider } from './ErrorContext';
import { ThemeProvider } from './ThemeContext';
import { LoadingProvider } from './LoadingContext';

interface AppContextType {
  user: any | null;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// Combine all providers into one
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const value: AppContextType = {
    user,
    isAuthenticated,
  };

  return (
    <ErrorProvider>
      <ThemeProvider>
        <LoadingProvider>
          <AppContext.Provider value={value}>
            {children}
          </AppContext.Provider>
        </LoadingProvider>
      </ThemeProvider>
    </ErrorProvider>
  );
};

// Export all context hooks for convenience
export { useError } from './ErrorContext';
export { useTheme, useThemedStyles } from './ThemeContext';
export { useLoading, useAsyncAction } from './LoadingContext';