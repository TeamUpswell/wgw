import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { configureStore } from '@reduxjs/toolkit';
import { Text } from 'react-native';
import { AppProvider } from '../contexts/AppContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import authSlice from '../store/authSlice';
import entriesSlice from '../store/slices/entriesSlice';
import streakSlice from '../store/slices/streakSlice';
import offlineSlice from '../store/slices/offlineSlice';

// Create a test store
export const createTestStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      entries: entriesSlice,
      streak: streakSlice,
      offline: offlineSlice,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Mock persistor for testing
const mockPersistor = {
  persist: jest.fn(),
  flush: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  purge: jest.fn().mockResolvedValue(undefined),
  getState: jest.fn().mockReturnValue({}),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: ReturnType<typeof createTestStore>;
}

// Custom render function that includes providers
export const renderWithProviders = (
  ui: ReactElement,
  {
    initialState,
    store = createTestStore(initialState),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <PersistGate loading={<Text>Loading...</Text>} persistor={mockPersistor}>
          <ErrorBoundary>
            <AppProvider>
              {children}
            </AppProvider>
          </ErrorBoundary>
        </PersistGate>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Helper to create mock user
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Helper to create mock entry
export const createMockEntry = (overrides = {}) => ({
  id: 'test-entry-id',
  user_id: 'test-user-id',
  transcription: 'Test transcription',
  ai_response: 'Test AI response',
  category: 'Personal Growth',
  created_at: new Date().toISOString(),
  audio_file_path: 'test-audio-path',
  is_private: false,
  ...overrides,
});

// Helper to wait for async operations
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Helper to create mock error
export const createMockError = (message = 'Test error') => 
  new Error(message);

// Helper to mock successful API response
export const mockSuccessResponse = (data: any) => ({
  data,
  error: null,
});

// Helper to mock error API response
export const mockErrorResponse = (message: string) => ({
  data: null,
  error: { message },
});

// Re-export everything from testing library
export * from '@testing-library/react-native';