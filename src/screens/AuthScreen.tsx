import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SAMPLE_BOOK_CODES, validateBookCode } from "../utils/bookCodes";
import { supabase } from "../config/supabase";

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [bookCode, setBookCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !bookCode) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validateBookCode(bookCode)) {
      Alert.alert(
        "Invalid Book Code",
        "Please enter a valid book purchase code"
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔐 Attempting signup with:", email);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: bookCode,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        console.log("✅ User created:", authData.user.id);

        if (authData.session) {
          console.log("✅ User automatically signed in");

          const { error: dbError } = await supabase.from("users").insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              book_purchase_code: bookCode,
              subscription_tier: "free_trial",
              trial_expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          ]);

          if (dbError && dbError.code !== "23505") {
            console.warn("Database insert warning:", dbError);
          }

          Alert.alert("Success!", "Account created and signed in!");
        } else {
          Alert.alert(
            "Check Your Email",
            "Please check your email for a confirmation link before signing in."
          );
        }
      }
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !bookCode) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔐 Attempting signin with:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: bookCode,
      });

      if (error) throw error;

      console.log("✅ Signed in successfully:", data.user?.email);
      Alert.alert("Success!", "Signed in successfully!");
    } catch (error: any) {
      console.error("❌ Signin error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this temporary debug button to your AuthScreen to test login
  const testLogin = async () => {
    try {
      console.log("🔐 Testing login with sample credentials...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: "drew@pdxbernards.com", // Your test email
        password: "BOOK2024-SAMPLE-123", // Use one of your sample book codes
      });

      if (error) {
        console.error("❌ Login failed:", error);
        Alert.alert("Login Failed", error.message);
      } else {
        console.log("✅ Login successful:", data.user?.email);
        Alert.alert("Success", `Logged in as: ${data.user?.email}`);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
    }
  };

  // Add this to your AuthScreen for testing
  const createTestAccount = async () => {
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = "BOOK2024-SAMPLE-123";

      console.log("🔐 Creating test account:", testEmail);

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        console.error("❌ Signup failed:", error);
        Alert.alert("Signup Failed", error.message);
      } else {
        console.log("✅ Account created:", data.user?.email);
        Alert.alert("Success", `Account created: ${data.user?.email}`);
      }
    } catch (err) {
      console.error("❌ Signup error:", err);
    }
  };

  // Add this temporary button to your AuthScreen for testing
  const quickLogin = async () => {
    setEmail("drew@pdxbernards.com");
    setBookCode("BOOK2024-SAMPLE-123");
    await handleSignIn();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Going Well</Text>
        <Text style={styles.subtitle}>
          Enter your email and book purchase code to continue
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Book Purchase Code"
          value={bookCode}
          onChangeText={setBookCode}
          autoCapitalize="characters"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Creating Account..." : "Create New Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        {/* Add this button to your AuthScreen JSX (temporarily) */}
        <TouchableOpacity
          onPress={testLogin}
          style={[styles.button, { backgroundColor: "#FF6B35" }]}
        >
          <Text style={styles.buttonText}>🔧 Test Login</Text>
        </TouchableOpacity>

        {/* Add this button to your AuthScreen JSX (for testing account creation) */}
        <TouchableOpacity
          onPress={createTestAccount}
          style={[styles.button, { backgroundColor: "#28A745" }]}
        >
          <Text style={styles.buttonText}>✅ Create Test Account</Text>
        </TouchableOpacity>

        {/* Add this button to your AuthScreen JSX (for quick login) */}
        <TouchableOpacity
          onPress={quickLogin}
          style={[styles.button, { backgroundColor: "#007AFF" }]}
        >
          <Text style={styles.buttonText}>⚡ Quick Login</Text>
        </TouchableOpacity>

        <View style={styles.sampleCodes}>
          <Text style={styles.sampleTitle}>
            Sample Book Codes (for testing):
          </Text>
          {SAMPLE_BOOK_CODES.map((code) => (
            <TouchableOpacity
              key={code}
              onPress={() => setBookCode(code)}
              style={styles.sampleCode}
            >
              <Text style={styles.sampleCodeText}>{code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#007AFF",
  },
  sampleCodes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    color: "#666",
  },
  sampleCode: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
    marginBottom: 5,
  },
  sampleCodeText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#333",
  },
});
