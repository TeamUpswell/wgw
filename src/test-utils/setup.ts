// Setup global environment before other imports
import 'react-native-gesture-handler/jestSetup';

// Mock Expo modules
jest.mock('expo-audio', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Recording: {
      createAsync: jest.fn().mockResolvedValue({
        recording: {
          stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
          getURI: jest.fn().mockReturnValue('mock-uri'),
        },
      }),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'mock-image-uri' }],
  }),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'mock-document-directory/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('mock-content'),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock React Native AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

// Mock React Native NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    type: 'wifi',
  }),
  addEventListener: jest.fn().mockReturnValue(() => {}),
}));

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'mock-public-url' },
        }),
      })),
    },
  },
}));

// Mock AI Services
jest.mock('../services/ai', () => ({
  AIService: jest.fn().mockImplementation(() => ({
    transcribeAudio: jest.fn().mockResolvedValue('Mock transcription'),
    generateResponse: jest.fn().mockResolvedValue('Mock AI response'),
  })),
}));

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  AntDesign: 'AntDesign',
  Entypo: 'Entypo',
}));

// Mock React Navigation (if needed)
// jest.mock('@react-navigation/native', () => ({ ... }));

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};