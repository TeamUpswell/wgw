import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface ErrorBoundaryProps {
  error?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorBoundaryProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  if (!error) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>{error}</Text>

      <View style={styles.buttonContainer}>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fee",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c0392b",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#e74c3c",
    marginBottom: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  retryButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  dismissButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  dismissButtonText: {
    color: "#e74c3c",
    fontSize: 14,
    fontWeight: "600",
  },
});
