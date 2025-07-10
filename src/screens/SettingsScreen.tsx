import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { supabase } from "../config/supabase";
import type { User } from "@supabase/supabase-js";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { resizeImage, AVATAR_OPTIONS } from "../utils/imageUtils";

interface SettingsScreenProps {
  user: User;
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
  isVisible: boolean;
  onClose: () => void;
  categories: string[]; // Add this
  onCategoriesUpdate: (categories: string[]) => void; // Add this
  onProfilePress?: () => void; // <-- Add this prop
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  isVisible,
  onClose,
  user,
  isDarkMode,
  onToggleDarkMode,
  categories: propCategories,
  onCategoriesUpdate,
  onProfilePress, // <-- Add this prop
}) => {
  if (!isVisible) return null;

  const [categories, setCategories] = useState<string[]>(propCategories || []);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streak, setStreak] = useState({
    current_streak: 0,
    longest_streak: 0,
  });
  const [streakLoading, setStreakLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState((user as any).avatar_url || "");

  useEffect(() => {
    loadUserCategories();
    loadUserStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserCategories = async () => {
    try {
      console.log("📂 Loading categories for user:", user.id);
      const { data, error } = await supabase
        .from("user_categories")
        .select("categories")
        .eq("user_id", user.id);

      if (error) throw error;

      let userCategories = data?.[0]?.categories || [];

      if (userCategories.length > 0) {
        console.log("✅ Categories loaded:", userCategories);
        setCategories(userCategories);
        onCategoriesUpdate(userCategories);
      } else {
        // No categories found, insert defaults
        console.log("📂 No categories found, inserting defaults");
        const defaultCategories = [
          "Health & Fitness",
          "Career & Work",
          "Family & Friends",
          "Personal Growth",
          "Hobbies & Interests",
          "Financial Goals",
          "Community & Service",
        ];
        // Insert into DB
        await supabase.from("user_categories").upsert({
          user_id: user.id,
          categories: defaultCategories,
        });
        setCategories(defaultCategories);
        onCategoriesUpdate(defaultCategories);
      }
    } catch (error) {
      console.error("❌ Error loading categories:", error);
      // Use defaults on error
      const defaultCategories = [
        "Health & Fitness",
        "Career & Work",
        "Family & Friends",
        "Personal Growth",
        "Hobbies & Interests",
        "Financial Goals",
        "Community & Service",
      ];
      setCategories(defaultCategories);
      onCategoriesUpdate(defaultCategories);
    }
  };

  const loadUserStreak = async () => {
    if (!user?.id) return;

    try {
      setStreakLoading(true);
      const { data: userStreak, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setStreak(userStreak || { current_streak: 0, longest_streak: 0 });
    } catch (error) {
      console.warn("Streak loading failed, using defaults:", error);
      setStreak({ current_streak: 0, longest_streak: 0 });
    } finally {
      setStreakLoading(false);
    }
  };

  const saveCategories = async (newCategories: string[]) => {
    try {
      const { error } = await supabase.from("user_categories").upsert({
        user_id: user.id,
        categories: newCategories,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error saving categories:", error);
      Alert.alert("Error", "Failed to save categories");
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }
    if (categories.includes(newCategoryName.trim())) {
      Alert.alert("Error", "This category already exists");
      return;
    }
    const updatedCategories = [...categories, newCategoryName.trim()];
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);
    setNewCategoryName("");
    setIsAddingCategory(false);
    onCategoriesUpdate(updatedCategories);
  };

  const removeCategory = async (categoryToRemove: string) => {
    Alert.alert(
      "Remove Category",
      `Are you sure you want to remove "${categoryToRemove}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const updatedCategories = categories.filter(
              (cat) => cat !== categoryToRemove
            );
            setCategories(updatedCategories);
            await saveCategories(updatedCategories);
            onCategoriesUpdate(updatedCategories);
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await supabase.auth.signOut();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const defaultCategories = [
    "Health & Fitness",
    "Career & Work",
    "Family & Friends",
    "Personal Growth",
    "Hobbies & Interests",
    "Financial Goals",
    "Community & Service",
  ];

  const resetCategoriesToDefault = async () => {
    Alert.alert(
      "Reset Categories",
      "Are you sure you want to reset your categories to the default list? This will remove any custom categories.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setCategories(defaultCategories);
            await saveCategories(defaultCategories);
            onCategoriesUpdate(defaultCategories);
          },
        },
      ]
    );
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('📱 Processing avatar image...');
      let uri = result.assets[0].uri;
      
      // Resize and optimize the avatar image
      const resizedImage = await resizeImage(uri, AVATAR_OPTIONS);
      console.log('✅ Avatar resized for upload');
      
      // Upload to Supabase Storage
      const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
      const response = await fetch(resizedImage.uri);
      const blob = await response.blob();
      
      console.log('📁 Uploading avatar:', fileName, 'Size:', blob.size, 'bytes');
      
      const { data, error } = await supabase.storage
        .from("entry-images")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) {
        Alert.alert("Upload Error", error.message);
        return;
      }
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("entry-images")
        .getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl;
      
      console.log('✅ Avatar uploaded successfully:', publicUrl);
      
      setAvatarUrl(publicUrl);
      await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
    }
  };

  const styles = getStyles(isDarkMode);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }} // Add extra space for bottom buttons
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
            <View style={styles.placeholder} />
          </View>

          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.userInfo}>
              {/* Avatar */}
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    marginBottom: 8,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#eee",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color="#bbb"
                  />
                </View>
              )}
              <TouchableOpacity
                onPress={handlePickAvatar}
                style={{ marginBottom: 8 }}
              >
                <Text
                  style={{
                    color: "#007AFF",
                    fontWeight: "bold",
                  }}
                >
                  {avatarUrl ? "Change Photo" : "Add Photo"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userId}>
                User ID: {user.id.slice(0, 8)}...
              </Text>
            </View>
            {/* Profile Button */}
            {onProfilePress && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  backgroundColor: "#007AFF",
                  padding: 10,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={() => {
                  onClose(); // Close settings first
                  setTimeout(onProfilePress, 300); // Open profile after closing
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  View/Edit Profile
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Appearance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch
                value={isDarkMode}
                onValueChange={onToggleDarkMode}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Categories</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setIsAddingCategory(true)}
                  style={styles.addButton}
                >
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={resetCategoriesToDefault}
                  style={[
                    styles.addButton,
                    { marginLeft: 10, backgroundColor: "#FF9500" },
                  ]}
                >
                  <Text style={styles.addButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {categories.map((category, index) => (
              <View key={index} style={styles.categoryRow}>
                <Text style={styles.categoryName}>{category}</Text>
                <TouchableOpacity
                  onPress={() => removeCategory(category)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>
            <Text style={styles.appInfo}>Going Well v1.0.0</Text>
            <Text style={styles.appInfo}>Based on Greg Bell's methodology</Text>
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={isLoading}
          >
            <Text style={styles.signOutButtonText}>
              {isLoading ? "Signing Out..." : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Add Category Modal */}
        <Modal
          visible={isAddingCategory}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddingCategory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => setIsAddingCategory(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isDarkMode ? "#fff" : "#333"}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Category name"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={addCategory}
                >
                  <Text style={styles.modalAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#eee",
    },
    backButton: {
      padding: 10,
    },
    backButtonText: {
      color: "#007AFF",
      fontSize: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
    },
    placeholder: {
      width: 50,
    },
    section: {
      margin: 20,
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 15,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    userInfo: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
      padding: 15,
      borderRadius: 10,
    },
    userEmail: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 5,
    },
    userId: {
      fontSize: 12,
      color: isDarkMode ? "#aaa" : "#666",
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
      padding: 15,
      borderRadius: 10,
    },
    settingLabel: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
    },
    addButton: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 5,
    },
    addButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    categoryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
    },
    categoryName: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      flex: 1,
    },
    removeButton: {
      backgroundColor: "#FF3B30",
      width: 25,
      height: 25,
      borderRadius: 12.5,
      justifyContent: "center",
      alignItems: "center",
    },
    removeButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    appInfo: {
      fontSize: 14,
      color: isDarkMode ? "#aaa" : "#666",
      marginBottom: 5,
    },
    signOutButton: {
      margin: 20,
      padding: 15,
      backgroundColor: "#FF3B30",
      borderRadius: 10,
      alignItems: "center",
    },
    signOutButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      padding: 20,
      borderRadius: 15,
      width: "80%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 15,
      textAlign: "center",
    },
    modalInput: {
      borderWidth: 1,
      borderColor: isDarkMode ? "#555" : "#ddd",
      padding: 15,
      borderRadius: 10,
      fontSize: 16,
      marginBottom: 20,
      color: isDarkMode ? "#fff" : "#333",
      backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    modalCancelButton: {
      flex: 1,
      padding: 15,
      borderRadius: 10,
      marginRight: 10,
      backgroundColor: isDarkMode ? "#555" : "#eee",
      alignItems: "center",
    },
    modalCancelText: {
      color: isDarkMode ? "#fff" : "#333",
      fontSize: 16,
    },
    modalAddButton: {
      flex: 1,
      padding: 15,
      borderRadius: 10,
      marginLeft: 10,
      backgroundColor: "#007AFF",
      alignItems: "center",
    },
    modalAddText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    closeButton: {
      position: "absolute",
      top: 15,
      right: 15,
      padding: 10,
    },
  });
