import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  isLoading: (key?: string) => boolean;
  setLoading: (key: string, isLoading: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  withLoading: <T>(key: string, asyncFn: () => Promise<T>) => Promise<T>;
  loadingStates: LoadingState;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const isLoading = useCallback((key?: string) => {
    if (!key) {
      // Check if any loading state is true
      return Object.values(loadingStates).some(state => state);
    }
    return loadingStates[key] || false;
  }, [loadingStates]);

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const withLoading = useCallback(async <T,>(
    key: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    try {
      startLoading(key);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const value: LoadingContextType = {
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    withLoading,
    loadingStates,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

// Helper hooks for common loading patterns
export const useAsyncAction = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options?: {
    loadingKey?: string;
    onError?: (error: any) => void;
    onSuccess?: (result: R) => void;
  }
) => {
  const { withLoading } = useLoading();
  const [error, setError] = useState<any>(null);

  const execute = useCallback(async (...args: T): Promise<R | undefined> => {
    try {
      setError(null);
      const result = await withLoading(
        options?.loadingKey || 'async-action',
        () => asyncFn(...args)
      );
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      options?.onError?.(err);
      return undefined;
    }
  }, [asyncFn, withLoading, options]);

  return { execute, error };
};