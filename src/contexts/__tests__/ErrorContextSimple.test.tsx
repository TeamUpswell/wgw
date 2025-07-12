import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity, Alert } from 'react-native';
import { ErrorProvider, useError } from '../ErrorContext';

// Mock Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

// Test component that uses ErrorContext
const TestComponent = () => {
  const { handleError, errors } = useError();

  const triggerError = () => {
    handleError(new Error('Test error'), 'Test Context');
  };

  const lastError = errors[errors.length - 1];

  return (
    <>
      <TouchableOpacity testID="trigger-error" onPress={triggerError}>
        <Text>Trigger Error</Text>
      </TouchableOpacity>
      {lastError && (
        <Text testID="last-error">{lastError.message}</Text>
      )}
      <Text testID="error-count">{errors.length}</Text>
    </>
  );
};

describe('ErrorContext Simple', () => {
  it('should provide error handling functionality', () => {
    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-error');
    expect(triggerButton).toBeTruthy();
  });

  it('should store errors when handleError is called', () => {
    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-error');
    const errorCount = getByTestId('error-count');
    
    expect(errorCount.props.children).toBe(0);
    
    fireEvent.press(triggerButton);
    
    expect(errorCount.props.children).toBe(1);
  });

  it('should store the error message', () => {
    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-error');
    fireEvent.press(triggerButton);
    
    const lastErrorText = getByTestId('last-error');
    expect(lastErrorText.props.children).toBe('Test error');
  });

  it('should throw error when used outside provider', () => {
    const TestComponentOutsideProvider = () => {
      useError();
      return <Text>Test</Text>;
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useError must be used within ErrorProvider');

    console.error = originalError;
  });
});