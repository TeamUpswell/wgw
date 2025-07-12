import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setUser, setLoading as setAuthLoading } from "../store/authSlice";
// Use pure React Native View instead of LinearGradient for better compatibility
const GradientView = ({ children, style, colors, ...props }: any) => {
  const backgroundColor = colors && colors[0] ? colors[0] : '#FF6B35';
  return (
    <View style={[style, { backgroundColor }]} {...props}>
      {children}
    </View>
  );
};
import { supabase } from "../config/supabase";
import { manualSignup } from "../utils/manualAuth";
import { testSupabaseConnection } from "../utils/testConnection";
import { verifyConnection } from "../utils/verifyConnection";
import { ensureUserProfile } from "../services/userProfileService";

const { width, height } = Dimensions.get('window');

interface AuthScreenProps {
  isDarkMode?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isDarkMode = false }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const styles = getStyles(isDarkMode);

  // Basic password validation
  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  };

  const validateForm = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert("Error", passwordError);
      return false;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    // Additional password strength check for signup
    if (passwordStrength && passwordStrength.score < 2) {
      Alert.alert(
        "Weak Password",
        "Please choose a stronger password. Your password should have a mix of uppercase, lowercase, numbers, and be at least 8 characters long.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔐 Verifying which database we're connected to...");
      await verifyConnection();
      
      console.log("🔐 Testing connection first...");
      const connectionWorks = await testSupabaseConnection();
      
      if (!connectionWorks) {
        Alert.alert("Connection Error", "Cannot connect to database. Please check your internet connection.");
        return;
      }
      
      console.log("🔐 Attempting signup with:", email);

      // Use manual signup to bypass Supabase Auth service issues
      const { data: authData, error: authError } = await manualSignup(email, password);

      if (authError) throw authError;

      if (authData.user) {
        console.log("✅ User created:", authData.user.id);

        if (authData.session) {
          console.log("✅ User automatically signed in");
          
          // Update Redux store with user data
          const mappedUser = {
            id: authData.user.id,
            email: authData.user.email || '',
            created_at: authData.user.created_at || new Date().toISOString(),
          };
          dispatch(setUser(mappedUser));
          
          // Ensure user profile exists (handles race conditions gracefully)
          await ensureUserProfile(authData.user.id, authData.user.email || '');

          Alert.alert("Welcome!", "Account created successfully!");
        } else {
          Alert.alert(
            "Check Your Email",
            "Please check your email for a confirmation link to complete your signup."
          );
        }
      }
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      Alert.alert("Signup Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log("🔐 Attempting signin with:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("✅ Signed in successfully:", data.user?.email);
      
      // Update Redux store with user data
      if (data.user) {
        const mappedUser = {
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString(),
        };
        dispatch(setUser(mappedUser));
        
        // Ensure user profile exists (in case trigger failed)
        await ensureUserProfile(data.user.id, data.user.email || '');
      }
      // No need for success alert - user will see the app
    } catch (error: any) {
      console.error("❌ Signin error:", error);
      Alert.alert("Sign In Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <GradientView
        colors={isDarkMode 
          ? ['#1a1a1a', '#2a2a2a', '#1a1a1a'] 
          : ['#FF6B35', '#FF8A65', '#FFAB91']
        }
        style={styles.gradient}
      >
        {renderContent()}
      </GradientView>
    </SafeAreaView>
  );

  function renderContent() {
    return (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons 
                name="sunny" 
                size={60} 
                color={isDarkMode ? "#FF6B35" : "#fff"} 
              />
            </View>
            <Text style={styles.title}>Welcome to What is Going Well</Text>
            <Text style={styles.subtitle}>
              One Question Every Day
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Form Header */}
            <View style={styles.formHeader}>
              <TouchableOpacity
                style={[styles.tabButton, !isSignUp && styles.activeTab]}
                onPress={() => setIsSignUp(false)}
              >
                <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, isSignUp && styles.activeTab]}
                onPress={() => setIsSignUp(true)}
              >
                <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formTitle}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons 
                  name="mail" 
                  size={20} 
                  color={isDarkMode ? "#888" : "#666"} 
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons 
                    name="lock-closed" 
                    size={20} 
                    color={isDarkMode ? "#888" : "#666"} 
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (isSignUp && text.length > 0) {
                      setShowPasswordStrength(true);
                    }
                  }}
                  onBlur={() => {
                    if (isSignUp && password.length === 0) {
                      setShowPasswordStrength(false);
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={isDarkMode ? "#888" : "#666"} 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Password Strength Indicator for Sign Up */}
              {isSignUp && showPasswordStrength && (
                <PasswordStrengthIndicator
                  password={password}
                  isDarkMode={isDarkMode}
                  showRequirements={true}
                  onStrengthChange={setPasswordStrength}
                />
              )}
              
              {/* Password Suggestion Button */}
              {isSignUp && password.length === 0 && (
                <TouchableOpacity
                  style={styles.suggestionButton}
                  onPress={() => {
                    const suggestion = generatePasswordSuggestion();
                    setPassword(suggestion);
                    setShowPassword(true);
                    setShowPasswordStrength(true);
                  }}
                >
                  <Ionicons name="bulb-outline" size={16} color="#FF6B35" />
                  <Text style={styles.suggestionText}>Suggest strong password</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Confirm Password Input (Sign Up Only) */}
            {isSignUp && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons 
                    name="lock-closed" 
                    size={20} 
                    color={isDarkMode ? "#888" : "#666"} 
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            )}


            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton, 
                (isLoading || (isSignUp && passwordStrength && passwordStrength.score < 2)) && styles.buttonDisabled
              ]}
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={isLoading || (isSignUp && passwordStrength && passwordStrength.score < 2)}
            >
              <View style={styles.buttonGradient}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="refresh" size={16} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      {isSignUp ? "Creating Account..." : "Signing In..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons 
                      name={isSignUp ? "person-add" : "log-in"} 
                      size={16} 
                      color="#fff" 
                    />
                    <Text style={styles.primaryButtonText}>
                      {isSignUp 
                        ? (passwordStrength && passwordStrength.score < 2 
                            ? `Password Too ${passwordStrength.label}` 
                            : "Create Account")
                        : "Sign In"
                      }
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Switch Auth Mode */}
            <View style={styles.switchMode}>
              <Text style={styles.switchText}>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </Text>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={styles.switchLink}>
                  {isSignUp ? " Sign In" : " Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
    );
  }
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? "#1a1a1a" : "#FF6B35",
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: isDarkMode ? '#2a2a2a' : 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: isDarkMode ? "#FF6B35" : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: isDarkMode ? "#fff" : "#fff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: isDarkMode ? "#ccc" : "rgba(255, 255, 255, 0.9)",
    fontWeight: "400",
  },
  formContainer: {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
    margin: 20,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  formHeader: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? 'rgba(58, 58, 58, 0.6)' : '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDarkMode ? '#888' : '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
    color: isDarkMode ? "#fff" : "#333",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(58, 58, 58, 0.8)' : '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255, 107, 53, 0.3)' : 'rgba(0, 0, 0, 0.1)',
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: isDarkMode ? "#fff" : "#333",
    fontWeight: "400",
  },
  passwordToggle: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: isDarkMode ? '#FF6B35' : '#666',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: isDarkMode ? '#FF6B35' : '#666',
    fontSize: 16,
    fontWeight: "600",
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
  },
  switchLink: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});
