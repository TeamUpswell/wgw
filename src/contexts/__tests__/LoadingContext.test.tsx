import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { LoadingProvider, useLoading } from '../LoadingContext';

// Test component that uses LoadingContext
const TestComponent = () => {
  const { isLoading, withLoading } = useLoading();

  const triggerLoading = async () => {
    await withLoading('test-action', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  };

  const triggerError = async () => {
    await withLoading('error-action', async () => {
      throw new Error('Test error');
    });
  };

  return (
    <>
      <Text testID="loading-status">
        {isLoading('test-action') ? 'Loading' : 'Not Loading'}
      </Text>
      <Text testID="error-loading-status">
        {isLoading('error-action') ? 'Error Loading' : 'Error Not Loading'}
      </Text>
      <Text testID="general-loading-status">
        {isLoading() ? 'General Loading' : 'General Not Loading'}
      </Text>
      <TouchableOpacity testID="trigger-loading" onPress={triggerLoading}>
        <Text>Trigger Loading</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="trigger-error" onPress={triggerError}>
        <Text>Trigger Error</Text>
      </TouchableOpacity>
    </>
  );
};

describe('LoadingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide loading functionality', () => {
    const { getByTestId } = render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    const loadingStatus = getByTestId('loading-status');
    expect(loadingStatus.props.children).toBe('Not Loading');
  });

  it('should track loading state during async operation', async () => {
    const { getByTestId } = render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    const loadingStatus = getByTestId('loading-status');
    const triggerButton = getByTestId('trigger-loading');

    expect(loadingStatus.props.children).toBe('Not Loading');

    fireEvent.press(triggerButton);

    // Should be loading immediately after press
    await waitFor(() => {
      expect(loadingStatus.props.children).toBe('Loading');
    });

    // Should finish loading after async operation completes
    await waitFor(() => {
      expect(loadingStatus.props.children).toBe('Not Loading');
    }, { timeout: 200 });
  });

  it('should handle errors and still clear loading state', async () => {
    const { getByTestId } = render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    const errorLoadingStatus = getByTestId('error-loading-status');
    const triggerErrorButton = getByTestId('trigger-error');

    expect(errorLoadingStatus.props.children).toBe('Error Not Loading');

    fireEvent.press(triggerErrorButton);

    // Should be loading during error operation
    await waitFor(() => {
      expect(errorLoadingStatus.props.children).toBe('Error Loading');
    });

    // Should finish loading even after error
    await waitFor(() => {
      expect(errorLoadingStatus.props.children).toBe('Error Not Loading');
    }, { timeout: 200 });
  });

  it('should track general loading state when any action is loading', async () => {
    const { getByTestId } = render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>
    );

    const generalLoadingStatus = getByTestId('general-loading-status');
    const triggerButton = getByTestId('trigger-loading');

    expect(generalLoadingStatus.props.children).toBe('General Not Loading');

    fireEvent.press(triggerButton);

    // Should show general loading when specific action is loading
    await waitFor(() => {
      expect(generalLoadingStatus.props.children).toBe('General Loading');
    });

    // Should clear general loading when all actions finish
    await waitFor(() => {
      expect(generalLoadingStatus.props.children).toBe('General Not Loading');
    }, { timeout: 200 });
  });

  it('should handle multiple concurrent loading operations', async () => {
    const TestComponentMultiple = () => {
      const { isLoading, withLoading } = useLoading();

      const triggerAction1 = async () => {
        await withLoading('action1', async () => {
          await new Promise(resolve => setTimeout(resolve, 150));
        });
      };

      const triggerAction2 = async () => {
        await withLoading('action2', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      };

      return (
        <>
          <Text testID="action1-status">
            {isLoading('action1') ? 'Action1 Loading' : 'Action1 Not Loading'}
          </Text>
          <Text testID="action2-status">
            {isLoading('action2') ? 'Action2 Loading' : 'Action2 Not Loading'}
          </Text>
          <Text testID="general-status">
            {isLoading() ? 'General Loading' : 'General Not Loading'}
          </Text>
          <TouchableOpacity testID="trigger-action1" onPress={triggerAction1}>
            <Text>Trigger Action 1</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="trigger-action2" onPress={triggerAction2}>
            <Text>Trigger Action 2</Text>
          </TouchableOpacity>
        </>
      );
    };

    const { getByTestId } = render(
      <LoadingProvider>
        <TestComponentMultiple />
      </LoadingProvider>
    );

    const action1Status = getByTestId('action1-status');
    const action2Status = getByTestId('action2-status');
    const generalStatus = getByTestId('general-status');
    const triggerAction1 = getByTestId('trigger-action1');
    const triggerAction2 = getByTestId('trigger-action2');

    // Start both actions
    fireEvent.press(triggerAction1);
    fireEvent.press(triggerAction2);

    // Both should be loading
    await waitFor(() => {
      expect(action1Status.props.children).toBe('Action1 Loading');
      expect(action2Status.props.children).toBe('Action2 Loading');
      expect(generalStatus.props.children).toBe('General Loading');
    });

    // Action2 should finish first (100ms)
    await waitFor(() => {
      expect(action2Status.props.children).toBe('Action2 Not Loading');
      expect(action1Status.props.children).toBe('Action1 Loading');
      expect(generalStatus.props.children).toBe('General Loading'); // Still loading because action1 is active
    }, { timeout: 150 });

    // Action1 should finish next (150ms)
    await waitFor(() => {
      expect(action1Status.props.children).toBe('Action1 Not Loading');
      expect(generalStatus.props.children).toBe('General Not Loading');
    }, { timeout: 100 });
  });

  it('should throw error when used outside provider', () => {
    const TestComponentOutsideProvider = () => {
      useLoading();
      return <Text>Test</Text>;
    };

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useLoading must be used within a LoadingProvider');

    console.error = originalError;
  });
});