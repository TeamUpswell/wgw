import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../config/supabase";
import * as ImagePicker from "expo-image-picker";

export const ProfileScreen = ({
  user,
  onClose,
}: {
  user: any;
  onClose?: () => void;
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log("[ProfileScreen] user:", user);
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) {
      console.warn("[ProfileScreen] No user ID found, cannot fetch profile.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) Alert.alert("Error", "Could not load profile");
    setProfile(data);
    setForm(data || {});
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update(form)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      Alert.alert("Error", "Could not save profile");
    } else {
      setEditing(false);
      fetchProfile();
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm({ ...form, avatar_url: result.assets[0].uri });
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No user found. Please sign in again.</Text>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Your Profile</Text>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeTouchable}
            accessibilityLabel="Close Profile"
          >
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.avatarSection}>
        {form.avatar_url ? (
          <Image source={{ uri: form.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={{ fontSize: 32, color: "#bbb" }}>🙂</Text>
          </View>
        )}
        {editing && (
          <TouchableOpacity
            onPress={handlePickAvatar}
            style={styles.avatarEditBtn}
          >
            <Text style={{ color: "#007AFF" }}>Change Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.formSection}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={form.username || ""}
          editable={editing}
          onChangeText={(v) => setForm({ ...form, username: v })}
        />
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={form.display_name || ""}
          editable={editing}
          onChangeText={(v) => setForm({ ...form, display_name: v })}
        />
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          value={form.bio || ""}
          editable={editing}
          multiline
          onChangeText={(v) => setForm({ ...form, bio: v })}
        />
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={form.location || ""}
          editable={editing}
          onChangeText={(v) => setForm({ ...form, location: v })}
        />
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={form.website || ""}
          editable={editing}
          onChangeText={(v) => setForm({ ...form, website: v })}
        />
        <Text style={styles.label}>Pronouns</Text>
        <TextInput
          style={styles.input}
          value={form.pronouns || ""}
          editable={editing}
          onChangeText={(v) => setForm({ ...form, pronouns: v })}
        />
      </View>
      <View style={styles.buttonRow}>
        {editing ? (
          <>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditing(false);
                setForm(profile);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff", flexGrow: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  header: { fontSize: 24, fontWeight: "bold", color: "#333" },
  closeButton: { fontSize: 28, color: "#888", padding: 8, marginLeft: 12 },
  closeTouchable: { padding: 4, marginLeft: 8 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarEditBtn: { marginTop: 4 },
  formSection: { marginBottom: 24 },
  label: { color: "#888", fontSize: 13, marginBottom: 2, marginTop: 12 },
  input: {
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  buttonRow: { flexDirection: "row", justifyContent: "center", gap: 16 },
  editBtn: {
    backgroundColor: "#8BC34A",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  editBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  saveBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginRight: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: {
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelBtnText: { color: "#888", fontWeight: "bold", fontSize: 16 },
});
