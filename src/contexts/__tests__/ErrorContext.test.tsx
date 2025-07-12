import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity, Alert } from 'react-native';
import { ErrorProvider, useError } from '../ErrorContext';

// Get the mocked Alert
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

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
    </>
  );
};

describe('ErrorContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should handle errors and show alerts', async () => {
    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-error');
    fireEvent.press(triggerButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Test Context Error',
        'Test error',
        [{ text: 'OK' }]
      );
    });
  });

  it('should store the last error', async () => {
    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-error');
    fireEvent.press(triggerButton);

    await waitFor(() => {
      const lastErrorText = getByTestId('last-error');
      expect(lastErrorText.props.children).toBe('Test error');
    });
  });

  it('should handle string errors', async () => {
    const TestComponentWithStringError = () => {
      const { handleError } = useError();

      const triggerStringError = () => {
        handleError('String error message', 'String Test');
      };

      return (
        <TouchableOpacity testID="trigger-string-error" onPress={triggerStringError}>
          <Text>Trigger String Error</Text>
        </TouchableOpacity>
      );
    };

    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponentWithStringError />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-string-error');
    fireEvent.press(triggerButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Error in String Test',
        'String error message',
        [{ text: 'OK' }]
      );
    });
  });

  it('should use default context when none provided', async () => {
    const TestComponentNoContext = () => {
      const { handleError } = useError();

      const triggerError = () => {
        handleError(new Error('No context error'));
      };

      return (
        <TouchableOpacity testID="trigger-no-context" onPress={triggerError}>
          <Text>Trigger No Context Error</Text>
        </TouchableOpacity>
      );
    };

    const { getByTestId } = render(
      <ErrorProvider>
        <TestComponentNoContext />
      </ErrorProvider>
    );

    const triggerButton = getByTestId('trigger-no-context');
    fireEvent.press(triggerButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'No context error',
        [{ text: 'OK' }]
      );
    });
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