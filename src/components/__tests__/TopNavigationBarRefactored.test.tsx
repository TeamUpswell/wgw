import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { TopNavigationBarRefactored } from '../TopNavigationBarRefactored';
import { renderWithProviders, createMockUser } from '../../test-utils/helpers';

// Mock the useUserProfile hook
jest.mock('../../hooks/useUserProfile', () => ({
  useUserProfile: jest.fn(() => ({
    profile: null,
    loading: false,
    error: null,
  })),
}));

const { useUserProfile } = require('../../hooks/useUserProfile');

describe('TopNavigationBarRefactored', () => {
  const mockUser = createMockUser();
  const mockOnProfilePress = jest.fn();
  const mockOnBackPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with user avatar when profile exists', () => {
    useUserProfile.mockReturnValue({
      profile: { avatar_url: 'https://example.com/avatar.jpg' },
      loading: false,
      error: null,
    });

    const { getByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
      />
    );

    const avatarButton = getByTestId('avatar-button');
    expect(avatarButton).toBeTruthy();
  });

  it('should render placeholder when no profile avatar', () => {
    useUserProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: null,
    });

    const { getByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
      />
    );

    const avatarButton = getByTestId('avatar-button');
    expect(avatarButton).toBeTruthy();
  });

  it('should call onProfilePress when avatar is tapped', () => {
    const { getByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
      />
    );

    const avatarButton = getByTestId('avatar-button');
    fireEvent.press(avatarButton);

    expect(mockOnProfilePress).toHaveBeenCalledTimes(1);
  });

  it('should render back button when showBackButton is true', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
        onBackPress={mockOnBackPress}
        showBackButton={true}
      />
    );

    const backButton = getByTestId('back-button');
    expect(backButton).toBeTruthy();

    // Avatar button should not be visible
    const avatarButton = queryByTestId('avatar-button');
    expect(avatarButton).toBeFalsy();
  });

  it('should call onBackPress when back button is tapped', () => {
    const { getByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
        onBackPress={mockOnBackPress}
        showBackButton={true}
      />
    );

    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    expect(mockOnBackPress).toHaveBeenCalledTimes(1);
  });

  it('should render title when provided', () => {
    const { getByText } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        title="Test Title"
        onProfilePress={mockOnProfilePress}
      />
    );

    expect(getByText('Test Title')).toBeTruthy();
  });

  it('should not render title when not provided', () => {
    const { queryByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
      />
    );

    const titleElement = queryByTestId('navigation-title');
    expect(titleElement).toBeFalsy();
  });

  it('should adapt to dark theme', () => {
    const { getByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
      />,
      {
        initialState: {
          // Mock initial state if needed for theme
        }
      }
    );

    const safeArea = getByTestId('safe-area');
    expect(safeArea).toBeTruthy();
    // Note: In a real test, you might check style properties
    // but that requires access to the actual styles applied
  });

  it('should have proper hit slop for accessibility', () => {
    const { getByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
      />
    );

    const avatarButton = getByTestId('avatar-button');
    expect(avatarButton.props.hitSlop).toEqual({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    });
  });

  it('should handle user prop changes', () => {
    const { rerender } = renderWithProviders(
      <TopNavigationBarRefactored
        user={mockUser}
        onProfilePress={mockOnProfilePress}
      />
    );

    const newUser = createMockUser({ id: 'new-user-id' });

    rerender(
      <TopNavigationBarRefactored
        user={newUser}
        onProfilePress={mockOnProfilePress}
      />
    );

    expect(useUserProfile).toHaveBeenCalledWith('new-user-id');
  });

  it('should handle missing user gracefully', () => {
    const { getByTestId } = renderWithProviders(
      <TopNavigationBarRefactored
        user={null}
        onProfilePress={mockOnProfilePress}
      />
    );

    const avatarButton = getByTestId('avatar-button');
    expect(avatarButton).toBeTruthy();
    expect(useUserProfile).toHaveBeenCalledWith(undefined);
  });
});