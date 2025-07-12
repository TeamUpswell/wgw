import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { useThemedStyles, getThemedColors, getCommonStyles, useCommonStyles } from '../useThemedStyles';

// Test component that uses useThemedStyles
const TestComponent = ({ dependencies = [] }: { dependencies?: any[] }) => {
  const styles = useThemedStyles(
    (isDarkMode) => StyleSheet.create({
      container: {
        backgroundColor: isDarkMode ? '#000' : '#fff',
      },
      text: {
        color: isDarkMode ? '#fff' : '#000',
      },
    }),
    dependencies
  );

  return (
    <View style={styles.container} testID="themed-container">
      <Text style={styles.text} testID="themed-text">
        Test Text
      </Text>
    </View>
  );
};

// Test component that uses useCommonStyles
const TestCommonComponent = () => {
  const styles = useCommonStyles();

  return (
    <View style={styles.container} testID="common-container">
      <Text style={styles.text} testID="common-text">
        Common Text
      </Text>
    </View>
  );
};

describe('useThemedStyles', () => {
  it('should create styles based on dark mode', () => {
    const { getByTestId } = render(
      <ThemeProvider initialIsDarkMode={true}>
        <TestComponent />
      </ThemeProvider>
    );

    const container = getByTestId('themed-container');
    expect(container.props.style.backgroundColor).toBe('#000');
  });

  it('should create styles based on light mode', () => {
    const { getByTestId } = render(
      <ThemeProvider initialIsDarkMode={false}>
        <TestComponent />
      </ThemeProvider>
    );

    const container = getByTestId('themed-container');
    expect(container.props.style.backgroundColor).toBe('#fff');
  });

  it('should memoize styles correctly', () => {
    let renderCount = 0;
    const styleFactory = jest.fn((isDarkMode) => {
      renderCount++;
      return StyleSheet.create({
        container: {
          backgroundColor: isDarkMode ? '#000' : '#fff',
        },
      });
    });

    const TestMemoComponent = () => {
      const styles = useThemedStyles(styleFactory);
      return <View style={styles.container} testID="memo-container" />;
    };

    const { rerender } = render(
      <ThemeProvider initialIsDarkMode={true}>
        <TestMemoComponent />
      </ThemeProvider>
    );

    expect(styleFactory).toHaveBeenCalledTimes(1);

    // Re-render without changing theme
    rerender(
      <ThemeProvider initialIsDarkMode={true}>
        <TestMemoComponent />
      </ThemeProvider>
    );

    // Style factory should not be called again
    expect(styleFactory).toHaveBeenCalledTimes(1);
  });

  it('should re-create styles when dependencies change', () => {
    const styleFactory = jest.fn((isDarkMode) => 
      StyleSheet.create({
        container: {
          backgroundColor: isDarkMode ? '#000' : '#fff',
        },
      })
    );

    const TestDependencyComponent = ({ dep }: { dep: number }) => {
      const styles = useThemedStyles(styleFactory, [dep]);
      return <View style={styles.container} testID="dep-container" />;
    };

    const { rerender } = render(
      <ThemeProvider initialIsDarkMode={true}>
        <TestDependencyComponent dep={1} />
      </ThemeProvider>
    );

    expect(styleFactory).toHaveBeenCalledTimes(1);

    // Change dependency
    rerender(
      <ThemeProvider initialIsDarkMode={true}>
        <TestDependencyComponent dep={2} />
      </ThemeProvider>
    );

    // Style factory should be called again
    expect(styleFactory).toHaveBeenCalledTimes(2);
  });
});

describe('getThemedColors', () => {
  it('should return dark theme colors', () => {
    const colors = getThemedColors(true);
    
    expect(colors.background).toBe('#1a1a1a');
    expect(colors.text).toBe('#fff');
    expect(colors.primary).toBe('#FF6B35');
  });

  it('should return light theme colors', () => {
    const colors = getThemedColors(false);
    
    expect(colors.background).toBe('#fff');
    expect(colors.text).toBe('#333');
    expect(colors.primary).toBe('#FF6B35');
  });

  it('should have consistent primary colors across themes', () => {
    const darkColors = getThemedColors(true);
    const lightColors = getThemedColors(false);
    
    expect(darkColors.primary).toBe(lightColors.primary);
    expect(darkColors.success).toBe(lightColors.success);
    expect(darkColors.error).toBe(lightColors.error);
  });
});

describe('getCommonStyles', () => {
  it('should create common styles for dark theme', () => {
    const styles = getCommonStyles(true);
    
    expect(styles.container.backgroundColor).toBe('#1a1a1a');
    expect(styles.text.color).toBe('#fff');
  });

  it('should create common styles for light theme', () => {
    const styles = getCommonStyles(false);
    
    expect(styles.container.backgroundColor).toBe('#fff');
    expect(styles.text.color).toBe('#333');
  });

  it('should include all expected common style properties', () => {
    const styles = getCommonStyles(true);
    
    expect(styles).toHaveProperty('container');
    expect(styles).toHaveProperty('card');
    expect(styles).toHaveProperty('input');
    expect(styles).toHaveProperty('button');
    expect(styles).toHaveProperty('title');
    expect(styles).toHaveProperty('modal');
  });
});

describe('useCommonStyles', () => {
  it('should provide common styles that update with theme', () => {
    const { getByTestId } = render(
      <ThemeProvider initialIsDarkMode={true}>
        <TestCommonComponent />
      </ThemeProvider>
    );

    const container = getByTestId('common-container');
    expect(container.props.style.backgroundColor).toBe('#1a1a1a');
  });

  it('should update common styles when theme changes', () => {
    const TestToggleComponent = () => {
      const styles = useCommonStyles();
      const [isDark, setIsDark] = React.useState(true);

      return (
        <ThemeProvider initialIsDarkMode={isDark}>
          <View style={styles.container} testID="toggle-container">
            <Text onPress={() => setIsDark(!isDark)}>Toggle</Text>
          </View>
        </ThemeProvider>
      );
    };

    const { getByTestId } = render(<TestToggleComponent />);

    const container = getByTestId('toggle-container');
    expect(container.props.style.backgroundColor).toBe('#1a1a1a');
  });
});