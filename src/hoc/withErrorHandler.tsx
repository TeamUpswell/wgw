import React, { ComponentType } from 'react';
import { useError } from '../contexts/ErrorContext';
import { useLoading } from '../contexts/LoadingContext';

interface WithErrorHandlerOptions {
  context?: string;
  showLoading?: boolean;
  loadingKey?: string;
}

export function withErrorHandler<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorHandlerOptions = {}
) {
  const WithErrorHandlerComponent = (props: P) => {
    const { handleError } = useError();
    const { withLoading, isLoading } = useLoading();

    // Create wrapped async handler
    const handleAsyncAction = async (
      asyncFn: () => Promise<any>,
      actionContext?: string
    ) => {
      try {
        if (options.showLoading) {
          return await withLoading(
            options.loadingKey || actionContext || 'action',
            asyncFn
          );
        } else {
          return await asyncFn();
        }
      } catch (error) {
        handleError(error, actionContext || options.context);
        throw error; // Re-throw to allow component-specific handling if needed
      }
    };

    // Inject error handling props
    const enhancedProps = {
      ...props,
      handleAsyncAction,
      handleError: (error: any) => handleError(error, options.context),
      isLoading: options.loadingKey ? isLoading(options.loadingKey) : false,
    };

    return <Component {...enhancedProps} />;
  };

  WithErrorHandlerComponent.displayName = `WithErrorHandler(${Component.displayName || Component.name})`;

  return WithErrorHandlerComponent;
}