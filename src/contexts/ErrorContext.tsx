import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';

export interface AppError {
  id: string;
  message: string;
  code?: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  context?: string;
  details?: any;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (error: Partial<AppError>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  showError: (message: string, title?: string, severity?: AppError['severity']) => void;
  handleError: (error: any, context?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
  onError?: (error: AppError) => void;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children, onError }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback((error: Partial<AppError>) => {
    const newError: AppError = {
      id: Date.now().toString(),
      message: error.message || 'An error occurred',
      severity: error.severity || 'error',
      timestamp: new Date(),
      ...error,
    };

    setErrors(prev => [...prev, newError]);
    
    // Call optional error handler
    onError?.(newError);

    // Log error for debugging
    console.error(`[${newError.severity.toUpperCase()}] ${newError.context || 'App'}:`, newError.message, newError.details);
  }, [onError]);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const showError = useCallback((
    message: string, 
    title: string = 'Error', 
    severity: AppError['severity'] = 'error'
  ) => {
    // Add to error list
    addError({ message, severity });

    // Show alert for errors and warnings
    if (severity !== 'info') {
      Alert.alert(title, message);
    }
  }, [addError]);

  const handleError = useCallback((error: any, context?: string) => {
    let message = 'An unexpected error occurred';
    let code: string | undefined;
    let details: any;

    // Parse different error types
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
      code = error.code;
      details = error;
    }

    // Handle specific error types
    if (error?.code === 'PGRST301') {
      message = 'Database connection error. Please try again.';
    } else if (error?.code === '23505') {
      message = 'This item already exists.';
    } else if (error?.status === 401) {
      message = 'Your session has expired. Please log in again.';
    } else if (error?.status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (error?.status === 404) {
      message = 'The requested resource was not found.';
    } else if (error?.status >= 500) {
      message = 'Server error. Please try again later.';
    }

    addError({
      message,
      code,
      context,
      details,
      severity: 'error',
    });

    // Show user-friendly alert
    Alert.alert(
      context ? `${context} Error` : 'Error',
      message,
      [{ text: 'OK' }]
    );
  }, [addError]);

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    showError,
    handleError,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};