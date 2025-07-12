import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Test component that uses ThemeContext
const TestComponent = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <>
      <Text testID="theme-status">
        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </Text>
      <TouchableOpacity testID="toggle-theme" onPress={toggleTheme}>
        <Text>Toggle Theme</Text>
      </TouchableOpacity>
    </>
  );
};

describe('ThemeContext', () => {
  it('should provide theme functionality with default dark mode', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeStatus = getByTestId('theme-status');
    expect(themeStatus.props.children).toBe('Dark Mode');
  });

  it('should toggle theme when toggleTheme is called', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeStatus = getByTestId('theme-status');
    const toggleButton = getByTestId('toggle-theme');

    // Initially dark mode
    expect(themeStatus.props.children).toBe('Dark Mode');

    // Toggle to light mode
    fireEvent.press(toggleButton);
    expect(themeStatus.props.children).toBe('Light Mode');

    // Toggle back to dark mode
    fireEvent.press(toggleButton);
    expect(themeStatus.props.children).toBe('Dark Mode');
  });

  it('should accept custom initial theme', () => {
    const { getByTestId } = render(
      <ThemeProvider initialIsDarkMode={false}>
        <TestComponent />
      </ThemeProvider>
    );

    const themeStatus = getByTestId('theme-status');
    expect(themeStatus.props.children).toBe('Light Mode');
  });

  it('should throw error when used outside provider', () => {
    const TestComponentOutsideProvider = () => {
      useTheme();
      return <Text>Test</Text>;
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    console.error = originalError;
  });

  it('should maintain theme state across re-renders', () => {
    const TestComponentWithCounter = () => {
      const { isDarkMode, toggleTheme } = useTheme();
      const [count, setCount] = React.useState(0);

      return (
        <>
          <Text testID="theme-status">
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </Text>
          <Text testID="count">{count}</Text>
          <TouchableOpacity testID="toggle-theme" onPress={toggleTheme}>
            <Text>Toggle Theme</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="increment" onPress={() => setCount(c => c + 1)}>
            <Text>Increment</Text>
          </TouchableOpacity>
        </>
      );
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponentWithCounter />
      </ThemeProvider>
    );

    const themeStatus = getByTestId('theme-status');
    const toggleButton = getByTestId('toggle-theme');
    const incrementButton = getByTestId('increment');
    const count = getByTestId('count');

    // Toggle theme
    fireEvent.press(toggleButton);
    expect(themeStatus.props.children).toBe('Light Mode');

    // Trigger re-render
    fireEvent.press(incrementButton);
    expect(count.props.children).toBe(1);

    // Theme should still be light mode
    expect(themeStatus.props.children).toBe('Light Mode');
  });
});