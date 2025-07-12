import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text testID="success">No error</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByTestId('success')).toBeTruthy();
  });

  it('should render error UI when child component throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
  });

  it('should log error to console', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should reset error state when children change', () => {
    const { getByTestId, getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error
    expect(getByText('Something went wrong')).toBeTruthy();

    // Re-render with non-throwing component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show success again (error boundary resets)
    expect(getByTestId('success')).toBeTruthy();
  });

  it('should handle different error types', () => {
    const ThrowStringError = () => {
      throw 'String error';
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowStringError />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('String error')).toBeTruthy();
  });

  it('should handle errors without message', () => {
    const ThrowEmptyError = () => {
      const error = new Error();
      error.message = '';
      throw error;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('An unexpected error occurred')).toBeTruthy();
  });

  it('should handle nested error boundaries', () => {
    const InnerErrorBoundary = ({ children }: { children: React.ReactNode }) => (
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    );

    const { getByText } = render(
      <ErrorBoundary>
        <InnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </InnerErrorBoundary>
      </ErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should maintain component tree structure in error state', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = getByTestId('error-boundary');
    expect(errorContainer).toBeTruthy();
    expect(errorContainer.props.style).toEqual({
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#f8f9fa',
    });
  });
});