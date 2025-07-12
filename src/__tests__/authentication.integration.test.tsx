import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { renderWithProviders, createMockUser, mockSuccessResponse, mockErrorResponse } from '../test-utils/helpers';
import { AuthScreen } from '../screens/AuthScreen';
import { supabase } from '../config/supabase';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock the supabase client
jest.mock('../config/supabase');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sign Up Flow', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = createMockUser();
      
      mockSupabase.auth.signUp.mockResolvedValue(
        mockSuccessResponse({
          user: mockUser,
          session: { user: mockUser, access_token: 'mock-token' }
        })
      );

      const { getByTestId, getByText } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      // Switch to signup
      fireEvent.press(getByText('Create Account'));

      // Fill in signup form
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const signupButton = getByTestId('signup-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'StrongPassword123!');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'StrongPassword123!',
        });
      });
    });

    it('should handle signup errors gracefully', async () => {
      mockSupabase.auth.signUp.mockResolvedValue(
        mockErrorResponse('Email already registered')
      );

      const { getByTestId, getByText } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      // Switch to signup
      fireEvent.press(getByText('Create Account'));

      // Fill in signup form
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const signupButton = getByTestId('signup-button');

      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Sign Up Error',
          'Email already registered'
        );
      });
    });

    it('should validate password strength during signup', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      // Switch to signup
      fireEvent.press(getByText('Create Account'));

      const passwordInput = getByTestId('password-input');
      const signupButton = getByTestId('signup-button');

      // Enter weak password
      fireEvent.changeText(passwordInput, '123');

      // Button should be disabled or show validation error
      const strengthIndicator = getByTestId('password-strength');
      expect(strengthIndicator).toBeTruthy();
    });
  });

  describe('Sign In Flow', () => {
    it('should successfully sign in an existing user', async () => {
      const mockUser = createMockUser();
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue(
        mockSuccessResponse({
          user: mockUser,
          session: { user: mockUser, access_token: 'mock-token' }
        })
      );

      const { getByTestId } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      // Fill in login form (default view is login)
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue(
        mockErrorResponse('Invalid login credentials')
      );

      const { getByTestId } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'wrong@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Login Error',
          'Invalid login credentials'
        );
      });
    });

    it('should validate required fields', async () => {
      const { getByTestId } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      const loginButton = getByTestId('login-button');

      // Try to login without filling fields
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'Please fill in all fields'
        );
      });

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const { getByTestId } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'invalidemail');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'Please enter a valid email address'
        );
      });

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('Form Switching', () => {
    it('should switch between login and signup forms', () => {
      const { getByText, queryByTestId } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      // Initially should show login form
      expect(queryByTestId('login-button')).toBeTruthy();

      // Switch to signup
      fireEvent.press(getByText('Create Account'));
      expect(queryByTestId('signup-button')).toBeTruthy();

      // Switch back to login
      fireEvent.press(getByText('Back to Login'));
      expect(queryByTestId('login-button')).toBeTruthy();
    });

    it('should clear form when switching modes', () => {
      const { getByTestId, getByText } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');

      // Fill in login form
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Switch to signup
      fireEvent.press(getByText('Create Account'));

      // Form should be cleared
      expect(emailInput.props.value).toBe('');
      expect(passwordInput.props.value).toBe('');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication', async () => {
      let resolveAuth: (value: any) => void;
      const authPromise = new Promise(resolve => {
        resolveAuth = resolve;
      });

      mockSupabase.auth.signInWithPassword.mockReturnValue(authPromise as any);

      const { getByTestId } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Should show loading state
      await waitFor(() => {
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });

      // Resolve the auth
      resolveAuth!(mockSuccessResponse({ user: createMockUser(), session: null }));

      // Loading should disappear
      await waitFor(() => {
        expect(() => getByTestId('loading-indicator')).toThrow();
      });
    });

    it('should disable form during loading', async () => {
      let resolveAuth: (value: any) => void;
      const authPromise = new Promise(resolve => {
        resolveAuth = resolve;
      });

      mockSupabase.auth.signInWithPassword.mockReturnValue(authPromise as any);

      const { getByTestId } = renderWithProviders(
        <AuthScreen isDarkMode={false} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Form should be disabled
      await waitFor(() => {
        expect(loginButton.props.disabled).toBe(true);
      });

      resolveAuth!(mockSuccessResponse({ user: createMockUser(), session: null }));
    });
  });
});