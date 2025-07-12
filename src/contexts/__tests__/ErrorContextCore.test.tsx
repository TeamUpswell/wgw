import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { ErrorProvider, useError } from '../ErrorContext';

// Mock only Alert to avoid React Native complex mocking
const mockAlert = jest.fn();
jest.doMock('react-native', () => ({
  Alert: { alert: mockAlert },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

// Test component that uses ErrorContext
const TestComponent = () => {
  const { addError, errors, clearErrors } = useError();

  const triggerError = () => {
    addError({
      message: 'Test error',
      severity: 'error',
      context: 'Test Context',
    });
  };

  const lastError = errors[errors.length - 1];

  return (
    <>
      <TouchableOpacity testID="trigger-error" onPress={triggerError}>
        <Text>Trigger Error</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="clear-errors" onPress={clearErrors}>
        <Text>Clear Errors</Text>
      </TouchableOpacity>
      {lastError && (
        <Text testID="last-error">{lastError.message}</Text>
      )}
      <Text testID="error-count">{errors.length}</Text>
    </>
  );
};

describe('ErrorContext Core', () => {
  beforeEach(() => {
    mockAlert.mockClear();
  });

  it('should provide error handling functionality', () => {
    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-error');
    expect(triggerButton).toBeTruthy();
  });

  it('should store errors when addError is called', () => {
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

  it('should clear errors when clearErrors is called', () => {
    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-error');
    const clearButton = getByTestId('clear-errors');
    const errorCount = getByTestId('error-count');
    
    // Add an error
    fireEvent.press(triggerButton);
    expect(errorCount.props.children).toBe(1);
    
    // Clear errors
    fireEvent.press(clearButton);
    expect(errorCount.props.children).toBe(0);
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